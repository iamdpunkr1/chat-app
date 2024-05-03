"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAccessToken = exports.loginUser = exports.logoutUser = exports.loginAdmin = exports.register = void 0;
const index_1 = __importDefault(require("../db/index"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ApiError_1 = require("../utils/ApiError");
const ioredis_1 = __importDefault(require("ioredis"));
const timeStamps_1 = require("../utils/timeStamps");
const mongodb_1 = require("mongodb");
const redis = new ioredis_1.default();
const generateAccessToken = function () {
    return jsonwebtoken_1.default.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
};
const generateRefreshToken = function () {
    return jsonwebtoken_1.default.sign({
        _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
};
const generateHashedPassword = async (password) => {
    return await bcryptjs_1.default.hash(password, 10);
};
const isPasswordCorrect = async (password, dbPassword) => {
    return await bcryptjs_1.default.compare(password, dbPassword);
};
// cookie settings
const options = {
    httpOnly: true,
    expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    // secure:true,
    // maxAge: 24 * 60 * 60 * 1000 
};
const register = (0, asyncHandler_1.default)(async (req, res) => {
    const { name, email, password } = req.body;
    if ([name, email, password].some(field => field.trim() === "")) {
        throw new ApiError_1.ApiError(400, "All fields are required");
    }
    if (!(name.length > 2 && name.length < 25))
        throw new ApiError_1.ApiError(400, "Username must be between 3-25 characters");
    // Validate UserName
    //   const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
    //   if(!USER_REGEX.test(name)) throw new ApiError(400,"Invalid Username")
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError_1.ApiError(400, "Invalid email format");
    }
    //   const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%])/;
    //   if( !passRegex.test(password)){
    //       throw new ApiError(400,"Password must contain at least one uppercase letter, one lowercase letter, one number and one special character");
    //   }
    // Validate password length
    if (password.length < 8) {
        throw new ApiError_1.ApiError(400, "Password must be at least 8 characters long");
    }
    const { Users } = index_1.default;
    const existedUser = await Users.findOne({ $or: [{ name: name }, { email }] });
    if (existedUser)
        throw new ApiError_1.ApiError(409, "User already exists");
    const hashPassword = await generateHashedPassword(password);
    const result = await Users.insertOne({ name: name, email, password: hashPassword });
    if (!result)
        throw new ApiError_1.ApiError(500, "Something went wrong while registering the user");
    res.status(201).json(result);
});
exports.register = register;
const loginAdmin = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    console.log("loginAdmin", email, password);
    if (!email || !password)
        throw new ApiError_1.ApiError(400, "All fields are required");
    // Validate UserName
    //   const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
    //   if(!USER_REGEX.test(username)) throw new ApiError(400,"Invalid Username")
    // Validate password length
    if (password.length < 8) {
        throw new ApiError_1.ApiError(400, "Password must be at least 8 characters long");
    }
    console.log("before mongo");
    const { Users } = index_1.default;
    console.log("after mongo");
    const user = await Users.findOne({ email: email });
    console.log("User", user);
    if (!user)
        throw new ApiError_1.ApiError(404, "User doesn't exist");
    if (!(await isPasswordCorrect(password, user.password)))
        throw new ApiError_1.ApiError(401, "Invalid User Credentials");
    const accessToken = await generateAccessToken.call(user);
    const refreshToken = await generateRefreshToken.call(user);
    // Exclude password field from user object
    const { password: _, _id: id, refreshToken: rfsh, ...userWithoutPassword } = user;
    // Update user information, for example, last login timestamp
    await Users.updateOne({ email }, { $set: { refreshToken } });
    res.status(200).cookie("refreshToken", refreshToken, options).json({ ...userWithoutPassword, accessToken });
});
exports.loginAdmin = loginAdmin;
const logoutUser = (0, asyncHandler_1.default)(async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
        return res.status(204).json("User already logged out");
    }
    const refreshToken = req.cookies.refreshToken;
    const { Users } = index_1.default;
    const foundUser = await Users.findOneAndUpdate({ refreshToken }, { $set: { refreshToken: '' } });
    if (!foundUser) {
        return res.status(200)
            .clearCookie("refreshToken", options)
            .json({ message: "User logged Out" });
    }
    // await collection.updateOne(
    //   { refreshToken:"" },
    //   { $set: { refreshToken: '' } }
    // );
    console.log("logout validation completed");
    return res.status(200).clearCookie("refreshToken", options).json({ message: "Agent logged Out" });
});
exports.logoutUser = logoutUser;
const loginUser = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, username } = req.body;
    console.log("loginUser", email, username);
    // Check if email and username are provided
    if (!email || !username) {
        throw new ApiError_1.ApiError(400, "Email and username are required");
    }
    // Validate username length
    if (username.length < 3 || username.length > 25) {
        throw new ApiError_1.ApiError(400, "Username must be between 3-25 characters");
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError_1.ApiError(400, "Invalid email format");
    }
    const { Chats } = index_1.default;
    const universalDateTime = (0, timeStamps_1.getUniversalDateTime)();
    const { date, time } = (0, timeStamps_1.separateDateAndTime)(universalDateTime);
    const chat = await Chats.insertOne({
        userEmail: email,
        username,
        agentEmailId: "",
        agentName: "",
        ip: req.ip,
        chatHistory: `(${date} , ${time}.) ${username} :  ${username} joined the chat\n`,
        userJoinedTime: `${date} , ${time}`,
        agentJoinedTime: "",
    });
    if (!chat) {
        throw new ApiError_1.ApiError(500, "Something went wrong while logging in");
    }
    console.log("Chat", chat);
    const key = chat?.insertedId.toString();
    console.log("USER login-key", key);
    const token = generateAccessToken.call({ _id: key, email, username });
    const refreshToken = await generateRefreshToken.call({ _id: key });
    const value = `${email}###${username}`;
    await redis.set(key, value, "EX", 60 * 60);
    console.log("USER: refreshTOken", refreshToken);
    return res.status(200).cookie("refreshToken", refreshToken, options).json({ email, username, message: "User Logged in successfully", accessToken: token });
});
exports.loginUser = loginUser;
const refreshAccessToken = (0, asyncHandler_1.default)(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const { type } = req.body;
    // console.log("refresh token", incomingRefreshToken)
    if (!incomingRefreshToken) {
        throw new ApiError_1.ApiError(401, "Unauthorized request");
    }
    try {
        const decodedToken = jsonwebtoken_1.default.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        if (type === "admin") {
            const { Users } = index_1.default;
            // for admin
            const user = await Users.findOne({ _id: new mongodb_1.ObjectId(decodedToken?._id) });
            if (!user) {
                throw new ApiError_1.ApiError(401, "Invalid refresh token");
            }
            if (incomingRefreshToken !== user?.refreshToken) {
                throw new ApiError_1.ApiError(401, "Refresh token is expired or used");
            }
            const accessToken = await generateAccessToken.call(user);
            const { password: _, _id: id, refreshToken: rfsh, email: emailId, ...userWithoutPassword } = user;
            return res
                .status(200)
                .cookie("refreshToken", incomingRefreshToken, options)
                .json({ emailId, ...userWithoutPassword, accessToken });
        }
        else {
            const key = decodedToken?._id;
            // console.log("key", key)
            const token = await redis.get(key);
            // console.log("token", token)
            if (!token) {
                throw new ApiError_1.ApiError(401, "Invalid refresh token");
            }
            const [email, username] = token.split("###");
            const accessToken = generateAccessToken.call({ _id: key, email, username });
            return res.status(200).cookie("refreshToken", incomingRefreshToken, options).json({ emailId: email, username, message: "User Logged in successfully", accessToken });
        }
    }
    catch (error) {
        throw new ApiError_1.ApiError(401, "Invalid refresh token");
    }
});
exports.refreshAccessToken = refreshAccessToken;
//# sourceMappingURL=userController.js.map