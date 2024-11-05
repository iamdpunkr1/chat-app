import { Request, Response } from "express";
import mysql from "../db/index";
import asyncHandler from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ApiError } from "../utils/ApiError";
import Redis from 'ioredis';
import { getUniversalDateTime, separateDateAndTime } from "../utils/timeStamps";

const redis = new Redis();

const generateAccessToken = function(){
    return jwt.sign(
        {
            id: this.id,
            email: this.email,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

const generateRefreshToken = function(){
    return jwt.sign(
        {
            id: this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const generateHashedPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
}

const isPasswordCorrect = async (password: string, dbPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, dbPassword);
}

// cookie settings
const options = {
    httpOnly: true,
    expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    // secure:true,
    // maxAge: 24 * 60 * 60 * 1000 
}

const register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    
    if ([name, email, password].some(field => field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    if (!(name.length > 2 && name.length < 25)) throw new ApiError(400, "Username must be between 3-25 characters");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    // Validate password length
    if (password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters long");
    }

    const existedUser:any = await mysql.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existedUser.length > 0) throw new ApiError(409, "User already exists");

    const hashPassword = await generateHashedPassword(password);
    const result = await mysql.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashPassword]);

    if (!result) throw new ApiError(500, "Something went wrong while registering the user");

    res.status(201).json(result);
})


const loginAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    console.log("loginAdmin", email, password);
    if (!email || !password) throw new ApiError(400, "All fields are required");

    // Validate password length
    if (password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters long");
    }

    const user:any = await mysql.query("SELECT * FROM users WHERE email = ?", [email]);
    
    if (user.length === 0) throw new ApiError(404, "User doesn't exist");

    if (!(await isPasswordCorrect(password, user[0].password))) throw new ApiError(401, "Invalid User Credentials");

    const accessToken = await generateAccessToken.call(user[0]);
    const refreshToken = await generateRefreshToken.call(user[0]);
    // Update user information, for example, last login timestamp
    await mysql.query("UPDATE users SET refreshToken = ? WHERE email = ?", [refreshToken, email]);

    res.status(200).cookie("refreshToken", refreshToken, options).json({ ...user[0], password: undefined, refreshToken: undefined, accessToken });
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    const cookies = req.cookies;

    if (!cookies?.refreshToken) {
        return res.status(204).json("User already logged out");
    }

    const refreshToken = req.cookies.refreshToken;

    const foundUser:any = await mysql.query("UPDATE users SET refreshToken = '' WHERE refreshToken = ?", [refreshToken]);

    if (!foundUser.affectedRows) {
        return res.status(200).clearCookie("refreshToken", options).json({ message: "User logged Out" });
    }

    return res.status(200).clearCookie("refreshToken", options).json({ message: "User logged Out" });
})

const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, username } = req.body;
    console.log("loginUser", email, username);
    // Check if email and username are provided
    if (!email || !username) {
        throw new ApiError(400, "Email and username are required");
    }

    // Validate username length
    if (username.length < 3 || username.length > 25) {
        throw new ApiError(400, "Username must be between 3-25 characters");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    const universalDateTime = getUniversalDateTime();
    const { date, time } = separateDateAndTime(universalDateTime);
    const result:any = await mysql.query(
        "INSERT INTO chats (userEmail, username, agentEmailId, agentName, ip, chatHistory, userJoinedTime, agentJoinedTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [email, username, "", "", req.ip, `(${date} , ${time}.) ${username} :  ${username} joined the chat\n`, `${date} , ${time}`, null]
    );

    if (!result) {
        throw new ApiError(500, "Something went wrong while logging in");
    }

    const key = result.insertId.toString();
    console.log("USER login-key", key)
    const token = generateAccessToken.call({ id: key, email, username });
    const refreshToken = await generateRefreshToken.call({ id: key });
    const value = `${email}###${username}`;
    await redis.set(key, value, "EX", 60 * 60);
    console.log("USER: refreshToken", refreshToken)
    return res.status(200).cookie("refreshToken", refreshToken, options).json({ email, username, message: "User Logged in successfully", accessToken: token });
});

const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const { type } = req.body;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken: any = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        if (type === "admin") {
            // for admin
            const user:any = await mysql.query("SELECT * FROM users WHERE id = ?", [decodedToken.id]);

            if (user.length === 0) {
                throw new ApiError(401, "Invalid refresh token");
            }

            if (incomingRefreshToken !== user[0].refreshToken) {
                throw new ApiError(401, "Refresh token is expired or used");
            }

            const accessToken = await generateAccessToken.call(user[0]);
            const {email:emailId, ...rest} = user[0];
            return res
                .status(200)
                .cookie("refreshToken", incomingRefreshToken, options)
                .json({ ...rest, emailId, password: undefined, refreshToken: undefined, accessToken });
        } else {
            const key = decodedToken.id;
            const token = await redis.get(key);
            if (!token) {
                throw new ApiError(401, "Invalid refresh token");
            }

            const [email, username] = token.split("###");
            const accessToken = generateAccessToken.call({ id: key, email, username });
            return res.status(200).cookie("refreshToken", incomingRefreshToken, options).json({ email, username, message: "User Logged in successfully", accessToken });
        }

    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    }
});

export { register, loginAdmin, logoutUser, loginUser, refreshAccessToken }
