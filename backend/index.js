
// const session = require('express-session');
// const redis = require('redis');
// const connectRedis = require('connect-redis');

// const RedisStore =  connectRedis(session)
// //Configure redis client
// const redisClient = redis.createClient({
//     url: 'redis://127.0.0.1:6379',
//     legacyMode: true
// })

// // redisClient.connect().catch(console.error)
// //Below we have selected the DB 1 of Redis
// redisClient.select(5, function(err,res){
//    if(err)
//     console.log("Unable to select Redis DB");
// });

// redisClient.on('error', function (err) {
//     console.log('Could not establish a connection with redis. ' + err);
// });
// redisClient.on('connect', function (err) {
//     console.log('Connected to redis successfully');
// });






// const express = require('express');
// const redis = require('redis');
// const app = express();
// // const client = redis.createClient();
// // Simulated database query function
// function fetchFromDatabase() {
//   return 'Data from the database';
// }



// //using redis.createClient() method

// // let client = redis.createClient(6379);

// // Create a client and connect to Redis server
// let client = redis.createClient();

// // Handle connection errors
// client.on('error', (err) => {
//   console.log('Error occurred while connecting to Redis server:', err);
// });

// // Use the client here
// // ...

// // Close the client when you're done
// // Make sure not to use the client after this point
// client.quit((err, response) => {
//   if (err) {
//     console.log('Error occurred while closing the client:', err);
//   } else {
//     console.log('Client closed successfully:', response);
//   }
// });
// app.listen(3000, () => {
//   console.log('Server is running on port 3000');
// });
