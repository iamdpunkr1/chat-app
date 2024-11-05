import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import mysql from "../db/index";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";

declare global {
    namespace Express {
        interface Request {
            user?: any; // Adjust the type according to your user object structure
        }
    }
}

export const verifyJWT = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            throw new ApiError(403, "Unauthorized request");
        }

        const decodedToken: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        const user = await mysql.findOne(
            'Users',
            'id = ?',
            [decodedToken?._id]
        );

        if (!user) {
            throw new ApiError(403, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(403, "Invalid Access Token");
    }
});
