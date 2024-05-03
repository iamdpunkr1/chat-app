"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUser = void 0;
const users = {
    "deep@gmail.com": {
        password: "password",
    },
    "mike@gmail.com": {
        password: "password",
    },
    "dan@gmail.com": {
        password: "password",
    },
    "iamdpunkr@gmail.com": {
        password: "password",
    },
};
const admins = {
    "jay@gmail.com": {
        password: "password",
    },
    "syed@gmail.com": {
        password: "password",
    },
};
const findUser = (email, password, userType) => {
    const data = userType === 'user' ? users : admins;
    const user = data[email];
    return !!user && user.password === password;
};
exports.findUser = findUser;
//# sourceMappingURL=userdetails.js.map