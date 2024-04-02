import { Request, Response } from "express";
import mongo from "../db/index";
import asyncHandler from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ApiError } from "../utils/ApiError";

const generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
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
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
  }
  
  const generateHashedPassword = async (password:string): Promise<string> => {
      return await bcrypt.hash(password,10);
  }
  
  const isPasswordCorrect = async (password:string, dbPassword:string): Promise<boolean> => {
      return await bcrypt.compare(password, dbPassword);
  }
  
  // cookie settings
  const options = {
      httpOnly: true,
      expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      // secure:true,
      // maxAge: 24 * 60 * 60 * 1000 
  }
  
  const register = asyncHandler( async (req: Request, res: Response) => {
  
          const { name, email, password } = req.body;
          
          if ([name, email, password].some(field => field.trim() === "")) {
              throw new ApiError(400, "All fields are required");
          }
  
          if(!(name.length > 2 && name.length<25) ) throw new ApiError(400,"Username must be between 3-25 characters")
          
          
          // Validate UserName
        //   const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
        //   if(!USER_REGEX.test(name)) throw new ApiError(400,"Invalid Username")
  
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
              throw new ApiError(400, "Invalid email format");
          }
  
        //   const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%])/;
        //   if( !passRegex.test(password)){
        //       throw new ApiError(400,"Password must contain at least one uppercase letter, one lowercase letter, one number and one special character");
        //   }
          // Validate password length
          if (password.length < 8) {
              throw new ApiError(400,"Password must be at least 8 characters long");
          }
  

  
          const {Users} =  mongo;

          
          const existedUser = await Users.findOne({ $or: [{ name:name}, {email}] });
          if (existedUser) throw new ApiError(409,"User already exists");
  
          const hashPassword = await generateHashedPassword(password);
          const result = await Users.insertOne({ name:name, email, password:hashPassword});
  
          if(!result) throw new ApiError(500,"Something went wrong while registering the user");
  
          res.status(201).json(result);
  
  })
  
  
  const loginUser = asyncHandler(async (req:Request, res:Response)=>{
    
    const {email, password} = req.body;
    
  
    if(!email || !password) throw new ApiError(400,"All fields are required")
  
      // Validate UserName
    //   const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
    //   if(!USER_REGEX.test(username)) throw new ApiError(400,"Invalid Username")
  
  
    // Validate password length
    if (password.length < 8) {
        throw new ApiError(400,"Password must be at least 8 characters long");
    }
  
    const {Users} =  mongo;
    
    const user = await Users.findOne({email})
    if(!user) throw new ApiError(404,"User doesn't exist")
  
  
    if(!(await isPasswordCorrect(password, user.password))) throw new ApiError(401,"Invalid User Credentials")
   
    const accessToken = await generateAccessToken.call(user);
    const refreshToken =await generateRefreshToken.call(user);
    
  
    // Exclude password field from user object
    const { password: _,_id:id, refreshToken:rfsh, ...userWithoutPassword } = user;
    // Update user information, for example, last login timestamp
    await Users.updateOne(
      { email },
      { $set: { refreshToken } }
    );
  
    res.status(200).cookie("refreshToken", refreshToken, options).json({ ...userWithoutPassword, accessToken });
  
  });
  
  
  const logoutUser = asyncHandler(async(req, res) => {
    
    const cookies = req.cookies;
  
      if (!cookies?.refreshToken) {
         res.status(204).json("User already logged out");
        }
  
    const refreshToken = req.cookies.refreshToken;
  
    const { Users } = mongo;
  
    const foundUser = await Users.findOneAndUpdate(
      { refreshToken},
      { $set: { refreshToken: '' } }
      );
  
    if (!foundUser) {
      res.status(204)
      .clearCookie("refreshToken", options)
      .json("User already logged Out");
    }
  
    // await collection.updateOne(
    //   { refreshToken:"" },
    //   { $set: { refreshToken: '' } }
    // );
  
  
    console.log("logout validation completed")
     res
    .status(200)
    .clearCookie("refreshToken", options)
    .json("User logged Out")
  })
  
  export { register, loginUser, logoutUser }