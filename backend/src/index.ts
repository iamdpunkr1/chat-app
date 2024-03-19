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

// Queue to hold users waiting to be connected with an agent
let userQueue: string[] = [];


io.on("connection", (socket: Socket) => {

    
    // Function to update queue status and inform user about their position in the queue
  const updateQueueStatus = () => {
      // Recalculate position in queue for all users
      userQueue.forEach((userID, index) => {
        const positionInQueue = index + 1;
        io.to(userID).emit("queue-status", `You are at position ${positionInQueue} in the queue. An agent will join you soon.`);
      });
    };


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
    // socket.emit("queue-status", `You are at ${rooms.length} position in queue, An agent will join you soon.`);
    
    // Add user to the queue
    userQueue.push(socket.id);
    // Update queue status for all users
    updateQueueStatus();
    socket.broadcast.emit("notifyAgent");
    socket.broadcast.emit("fetch-users", rooms);
  });

  //sending rooms to admin(if users are already connected)
  socket.emit("fetch-users", rooms);

  //sending typing event to connect user/admin 
  socket.on("typing", (data) => {
    socket.broadcast.to(data.room).emit("user-typing", data);
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
        console.log("Admin joined room", rooms);
        socket.broadcast.to(roomID).emit("queue-status", "");

         io.emit("fetch-users", rooms);
        // Remove user from the queue
        userQueue = userQueue.filter((userID) => userID !== room.userID);

        // Update queue status for all users
        updateQueueStatus();
      }else{
        socket.emit("room-full", "User is already taken by another agent");
      }
    }else{
      socket.emit("room-not-found", "User not found");
    }
  });

  

  //Agent leave room
  socket.on("leave-room", ( data:{roomID:string, type:string }) => {
    const {roomID, type} = data;
    socket.leave(roomID);
    const room = rooms.find((room) => room.roomID === roomID);
    if(room){
      if(type === "Agent"){
        room.agentID = "";
      }else{
        room.userID = "";
        rooms = rooms.filter((room) => room.roomID !== roomID);
      }
    }

    if(room.agentID === "" && room.userID === ""){
      rooms = rooms.filter((room) => room.roomID !== roomID);
    }
    console.log("Rooms: ", rooms);
    socket.broadcast.to(roomID).emit("user-left", {roomID, message: `${type} left the room`});
    io.emit("fetch-users", rooms);
  });

  //message to room
  socket.on("room-message", (msg: { roomID: string; message: string }) => {
    // console.log(msg);
    if(agentInRoom(msg.roomID) || msg.message.includes("Agent")){
      io.to(msg.roomID).emit("recieve-message",msg);
    }
  });

  //disconnect event
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    // Remove user from the queue
    userQueue = userQueue.filter((userID) => userID !== socket.id);

    // Update queue status for all users
    updateQueueStatus();
    rooms = rooms.filter((room) => room.userID !== socket.id);
    console.log("Rooms: ", rooms);
    socket.broadcast.emit("fetch-users", rooms);
  });


});



server.listen(5001, () => {
  console.log("Server is running on port 5001");
});

