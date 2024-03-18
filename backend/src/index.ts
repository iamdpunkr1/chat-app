import express, { Application } from "express";
import cors from "cors";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import Redis from 'ioredis';


// const redis = new Redis()

const app: Application = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());

// app.get("/", async (req, res) => {
//   //  await redis.set("mykey3", "value"); // Returns a promise which resolves to "OK" when the command succeeds.
//    console.log("Running NNN")
// // ioredis supports the node.js callback style
//     // const result = await redis.get("mykey3", (err, result) => {
//     //         if (err) {
//     //             res.send("<h1>AN error occured</h1>");
//     //         }
//     //     });
//     res.send(`<h1>Hello world</h1>`);
//     });
// Function to generate a random room name
function generateRandomRoomName(length:number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const server: HTTPServer = createServer(app);
const io: SocketIOServer = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

type RoomType = {
  roomID: string,
  userID: string,
  agentID: string
}

let rooms:RoomType[] = [];

const agentInRoom = (roomID: string) => {
  const room = rooms.find((room) => room.roomID === roomID);
  if(room){
    return room.agentID !== "";
  }
  return false;
}


io.on("connection", (socket: Socket) => {


  socket.on("connect", () => {
    console.log("User connected", socket.id);
  });

  //user connect event & adding user to rooms
  socket.on("user-connect", (userID: string) => {

    const roomName = generateRandomRoomName(10);
    rooms.push({roomID: roomName, userID: socket.id, agentID: ""});
    socket.join(roomName);
    
    console.log("Rooms: ", rooms);
    socket.emit("room-id", roomName);
    socket.broadcast.emit("notifyAgent");
    socket.broadcast.emit("fetch-users", rooms);
  });

  //sending rooms to admin(if users are already connected)
  socket.emit("fetch-users", rooms);

  //sending typing event to connect user/admin 
  socket.on("typing", (data) => {
    socket.broadcast.to(data.room).emit("user-typing", data.username);
  });

  //Message to all
  // socket.on("message", (msg: string) => {
  //   console.log(msg);
  //   io.emit("recieve-message", msg);
  // });

  //Message to all except sender
  // socket.on("broadcast-message", (msg: string) => {
  //   console.log(msg);
  //   socket.broadcast.emit("recieve-message", msg);
  // });

  //meassage to specific user
  // socket.on("private-message", (msg: { recieverID: string; message: string }) => {
  //   console.log(msg);
  //   io.to(msg.recieverID).emit("recieve-message", msg.message);
  // });

  //join room by admin
  socket.on("join-room", (roomID: string) => {
    const room = rooms.find((room) => room.roomID === roomID);
    if(room){
      if(room.agentID === "" || room.agentID === socket.id){
        room.agentID = socket.id;
        socket.join(roomID);
        socket.broadcast.to(roomID).emit("agent-joined", `Agent-${socket.id.substring(0,4)} joined the room`);
        console.log("Admin joined room", roomID);
      }else{
        socket.emit("room-full", "User is already taken by another agent");
      }
    }else{
      socket.emit("room-not-found", "User not found");
    }
  });

  

  //Agent leave room
  socket.on("leave-room", (roomID: string) => {
    socket.leave(roomID);
    // console.log("User left room", roomID);
    socket.broadcast.to(roomID).emit("agent-left", `Agent-${socket.id.substring(0,4)} left the room`);
    
  });

  //message to room
  socket.on("room-message", (msg: { roomID: string; message: string }) => {
    // console.log(msg);
    if(agentInRoom(msg.roomID) || msg.message.includes("Agent")){
      io.to(msg.roomID).emit("recieve-message", msg.message);
    }
  });

  //disconnect event
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);

    rooms = rooms.filter((room) => room.userID !== socket.id);
    console.log("Rooms: ", rooms);
    socket.broadcast.emit("fetch-users", rooms);
  });


});



server.listen(5001, () => {
  console.log("Server is running on port 5001");
});

