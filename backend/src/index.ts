import express, { Application } from "express";
import cors from "cors";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
// // import { NodeSSH } from 'node-ssh';
// // require('dotenv').config();
// // import { privateKey } from "./privatekey";
// // import { createClient } from 'redis';
import Redis from 'ioredis';
// import redis from 'redis';
// import session from 'express-session';
// import connectRedis from 'connect-redis';


const redis = new Redis()



// const RedisStore =  connectRedis(session)
// //Configure redis client
// const redisClient = redis.createClient({
//     url: 'redis://127.0.0.1:6379',
//     legacyMode: true
// })
// //Selecting Redis DB depending on environment
// /* app.configure('development', function(){
//   // development options go here
//   app.set('redisdb', 5);
// });

// app.configure('production', function(){
//   // production options here
//   app.set('redisdb', 0);
// }); */


// //Below we have selected the DB 1 of Redis
// redisClient.select(5, function(err:any,res:any){
//    if(err)
//     console.log("Unable to select Redis DB");
// });

// redisClient.on('error', function (err) {
//     console.log('Could not establish a connection with redis. ' + err);
// });
// redisClient.on('connect', function (err) {
//     console.log('Connected to redis successfully');
// });




// const fn = async () => {
//     try{
//         const redisClient = await createClient({
//             url: 'redis://127.0.0.1:6379',
//             legacyMode: true
//         }).on('error', err => console.log('Redis Client Error', err))
//             .connect();
//         //     await client.set('foo', 'bar');
//         //     console.log('Redis Connected');

//         // console.log('Redis Connected')
//         await redisClient.set('foo', 'bar');
//         const result = await redisClient.get('foo');
//         console.log('Redis Connected', result);
          
//         // redisClient.select(1, function(err:any,res:any){
//         //     if(err)
//         //      console.log("Unable to select Redis DB");
//         //  });
         
//         //  redisClient.on('error', function (err) {
//         //      console.log('Could not establish a connection with redis. ' + err);
//         //  });
//         //  redisClient.on('connect', function (err) {
//         //      console.log('Connected to redis successfully');
//         //  });
    
//         } catch(err){
//             console.log(err);
//         }
//     // await redisClient.set('foo', 'bar');
//     // console.log('Redis Connected');
//     // const value = await redisClient.keys('*');
//     // console.log(value);
//     //     } catch(err){
//     //         console.log(err);
//     //     }
// }
// fn();

// // // const ssh = new NodeSSH();
// // // ssh
// // //   .connect({
// // //     host: process.env.SSH_host,
// // //     username: process.env.SSH_user,
// // //     privateKey: privateKey,
// // //     passphrase: process.env.SSH_passphrase
// // //   })
// // //   .then((e) => {
// // //     // console.log('SSH Connected');
// // //     ssh.execCommand('redis-cli get jjdas', { cwd: '/var/www' }).then((result) => {
// // //       console.log('STDOUT: ' + result.stdout);
// // //     //   console.log('STDERR: ' + result.stderr);
// // //     });
    
// // //   });



// const redisConnection = async () => {
// try{
//     // const client = new Redis({
//     //     host: process.env.SSH_host,
//     //     port: 6379,
//     //     username: process.env.SSH_user,
//     // });
    
//     const client = await createClient().on('error', err => console.log('Redis Client Error', err))
//     .connect();
//     await client.set('foo', 'bar');
//     console.log('Redis Connected');
    

// }catch(err){
//     console.log(err);
// }

// }

// redisConnection();

// // // const connectObj = {
// // //     url: "redis://alegra6:"+`${privateKey}`+"@209.182.205.2:22"
// // // }

// // // const connectToRedis = async () => {
// // //     try{
// // //         const client = await createClient(
// // //             {
// // //                 url: 'redis://127.0.0.1:6379',
// // //                 legacyMode: true
// // //             }
// // //         )
// // //         .on('error', err => console.log('Redis Client Error', err))
// // //         .connect();
// // //         } catch(err){
// // //             console.log(err);
// // //         }
// // // }



const app: Application = express();
app.use(
  cors({
    origin: "*",
    credentials: true
  })
);

app.use(express.json());

app.get("/", async (req, res) => {
   await redis.set("mykey3", "value"); // Returns a promise which resolves to "OK" when the command succeeds.

// ioredis supports the node.js callback style
    const result = await redis.get("mykey3", (err, result) => {
            if (err) {
                res.send("<h1>AN error occured</h1>");
            }
        });
    res.send(`<h1>Hello world + ${result}</h1>`);
    });

const server: HTTPServer = createServer(app);
const io: SocketIOServer = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket: Socket) => {
  //auto connect
  console.log("User connected", socket.id);

  //Message to all
  socket.on("message", (msg: string) => {
    console.log(msg);
    io.emit("recieve-message", msg);
  });

  //Message to all except sender
  socket.on("broadcast-message", (msg: string) => {
    console.log(msg);
    socket.broadcast.emit("recieve-message", msg);
  });

  //meassage to specific user
  socket.on("private-message", (msg: { recieverID: string; message: string }) => {
    console.log(msg);
    io.to(msg.recieverID).emit("recieve-message", msg.message);
  });

  //join room
  socket.on("join-room", (roomID: string) => {
    socket.join(roomID);
    console.log("User joined room", roomID);
  });

  //leave room
  socket.on("leave-room", (roomID: string) => {
    socket.leave(roomID);
    console.log("User left room", roomID);
  });

  //message to room
  socket.on("room-message", (msg: { roomID: string; message: string }) => {
    console.log(msg);
    io.to(msg.roomID).emit("recieve-message", msg.message);
  });

  //disconnect event
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

server.listen(5001, () => {
  console.log("Server is running on port 5001");
});

// // import Redis from 'ioredis';
// // import fs from 'fs';
// // import { Client, ConnectConfig } from 'ssh2';
// // import * as path from 'path'; // Import the path module


// // // Get the current directory
// // const currentDir = __dirname;

// // // Construct the path to the private key file
// // const privateKeyPath = path.join(currentDir, 'alegra6ser');

// // // SSH connection configuration
// // const sshConfig: ConnectConfig = {
// //     username: 'alegra6',
// //     host: '209.182.205.2',
// //     port: 22, // SSH port
// //     // privateKey: require('fs').readFileSync('"C:\Users\alegralabs\.ssh\alegra6ser"'),

// //     privateKey: fs.readFileSync(privateKeyPath), // Private key file path
    
// //     // If you have a passphrase for your private key, add it here:
// //     // passphrase: 'your_passphrase' // Optional, remove if not needed
// // };

// // // Redis server configuration
// // const redisConfig = {
// //     host: 'localhost', // Localhost as the tunnel will forward to the remote Redis server
// //     port: 6379 // Redis default port
// // };

// // // Create SSH tunnel
// // const sshTunnel = new Client();

// // sshTunnel.on('ready', () => {
// //     console.log('SSH tunnel established');

// //     // Create a Redis client connected to the local end of the SSH tunnel
// //     const redis = new Redis(redisConfig);

// //     // Send PING command to Redis
// //     redis.ping()
// //         .then((result) => {
// //             console.log('Redis PING:', result); // This should print 'PONG' if Redis is running
// //             // Close the Redis connection
// //             redis.disconnect();
// //             // Close the SSH tunnel
// //             sshTunnel.end();
// //         })
// //         .catch((err) => {
// //             console.error('Error:', err);
// //             // Close the SSH tunnel
// //             sshTunnel.end();
// //         });
// // });

// // sshTunnel.connect(sshConfig);
