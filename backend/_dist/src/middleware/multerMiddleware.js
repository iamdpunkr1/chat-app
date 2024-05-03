"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        const extension = path_1.default.extname(file.originalname);
        const filenameWithoutExtension = path_1.default.basename(file.originalname, extension);
        cb(null, `${filenameWithoutExtension}-${Date.now()}${extension}`);
    }
});
exports.upload = (0, multer_1.default)({
    storage,
});
//# sourceMappingURL=multerMiddleware.js.map