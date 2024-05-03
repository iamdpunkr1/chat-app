"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    }
    catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
};
exports.default = asyncHandler;
//# sourceMappingURL=asyncHandler.js.map