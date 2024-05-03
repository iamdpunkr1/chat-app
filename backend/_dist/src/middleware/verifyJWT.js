"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = __importDefault(require("../db/index"));
const mongodb_1 = require("mongodb");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
exports.verifyJWT = (0, asyncHandler_1.default)(async (req, res, next) => {
    try {
        // console.log("Verify JWT", req.cookies.refreshToken)
        const token = req.header("Authorization")?.replace("Bearer ", "");
        // console.log(token)
        // console.log(req.body)
        if (!token) {
            throw new ApiError_1.ApiError(403, "Unauthorized request");
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const { Users } = index_1.default;
        const user = await Users.findOne({ _id: new mongodb_1.ObjectId(decodedToken?._id) });
        // console.log("user exist: ",user)
        if (!user) {
            throw new ApiError_1.ApiError(403, "Invalid Access Token");
        }
        req.user = user;
        next();
    }
    catch (error) {
        // console.log(error.message)
        throw new ApiError_1.ApiError(403, "Invalid Access Token");
    }
});
//# sourceMappingURL=verifyJWT.js.map