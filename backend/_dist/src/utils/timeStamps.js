"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.separateLocalDateAndTime = exports.separateDateAndTime = exports.convertToCurrentTimeZone = exports.getUniversalDateTime = void 0;
// Function to get the universal date and time
function getUniversalDateTime() {
    const date = new Date();
    const universalDateTime = date.toISOString();
    return universalDateTime;
}
exports.getUniversalDateTime = getUniversalDateTime;
// Function to convert the universal date and time to the current time zone
function convertToCurrentTimeZone(universalDateTime) {
    const date = new Date(universalDateTime);
    const localDateTime = date.toLocaleString();
    return localDateTime;
}
exports.convertToCurrentTimeZone = convertToCurrentTimeZone;
// Function to separate date and time from a datetime string
function separateDateAndTime(dateTimeString) {
    const date = dateTimeString.split('T')[0];
    const time = dateTimeString.split('T')[1].split('.')[0];
    return { date, time };
}
exports.separateDateAndTime = separateDateAndTime;
const universalDateTime = getUniversalDateTime();
// console.log("Universal Date and Time:", universalDateTime);
const { date, time } = separateDateAndTime(universalDateTime);
// console.log("Date:", date);
// console.log("Time:", time);
const localDateTime = convertToCurrentTimeZone(universalDateTime);
// console.log("Local Date and Time:", localDateTime);
// Function to separate date and time from a local datetime string
function separateLocalDateAndTime(localDateTime) {
    const date = localDateTime.split(',')[0];
    const time = localDateTime.split(',')[1].trim();
    return { date, time };
}
exports.separateLocalDateAndTime = separateLocalDateAndTime;
//# sourceMappingURL=timeStamps.js.map