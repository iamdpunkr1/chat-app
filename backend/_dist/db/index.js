"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const dotenv_1 = require("dotenv");
// import User from '../models/User';
(0, dotenv_1.configDotenv)({
    path: "./.env"
});
console.log("mongoURI", process.env.MONGO_URI);
const uri = process.env.MONGO_URI || '';
const dbName = process.env.DB || '';
const userCollection = "users"; //process.env.USER_COLLECTION || '';
const chatCollection = "chat-details"; //process.env.CHAT_COLLECTION || '';
class MongoBot {
    constructor() {
        this.client = new mongodb_1.MongoClient(uri);
        this.db = {}; // Initialize db property to avoid TypeScript errors
        this.Users = {};
        this.Chats = {};
    }
    async init() {
        try {
            await this.client.connect();
            console.log('connected');
            this.db = this.client.db(dbName);
            this.Users = this.db.collection(userCollection);
            this.Chats = this.db.collection(chatCollection);
        }
        catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error; // Re-throw error to handle it at the caller level
        }
    }
}
exports.default = new MongoBot();
//# sourceMappingURL=index.js.map