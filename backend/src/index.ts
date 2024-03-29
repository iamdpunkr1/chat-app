import express, { Application } from "express";
import cors from "cors";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import Redis from 'ioredis';
import { findUser } from "./userdetails";
import { configDotenv } from 'dotenv';
import nodemailer from 'nodemailer';
import { upload } from "./middleware/multerMiddleware";
import fs from 'fs';
configDotenv({
    path: "./.env"
});



const PORT="http://localhost:5173"   //"https://www.alegralabs.com"

const redis = new Redis()

const app: Application = express();
app.use(
  cors({
    origin: PORT,
    credentials: true
  })
);

app.use(express.json());
app.use(express.static("public"))
app.get("/", (req, res) => {
  return res.status(200).json({ message: "Welcome to Chat-App server" });
});

app.post("/api/user/login",async (req, res) => {
  const { email, password } = req.body;
  if (email === "" || password === "") {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!findUser(email, password, "user")) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const chatHistory = await redis.get(email);
  
  if(chatHistory){
    return res.status(200).json({ message: "User Logged in successfully", chatHistory });
  }

  await redis.set(email, "you joined the chat");
  return res.status(200).json({ message: "User Logged in successfully", chatHistory: "" });
}
);


app.post("/api/admin/login",async (req, res) => {
  const { email, password } = req.body;
  if (email === "" || password === "") {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!findUser(email, password, "admin")) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  

  return res.status(200).json({ message: "Admin Logged in successfully" });
}
);

app.post("/api/send-transcript", async (req, res) => {
  const { emailId, transcript } = req.body;
  if (emailId === "" || transcript === "") {
    return res.status(400).json({ message: "All fields are required" });
  }


  console.log("Transcript: ", process.env.EMAIL_ID, process.env.EMAIL_PASSWORD)

     // Prepare email content
      const formattedTranscript = transcript.map((message:{sender:string, type:string, message:string, time:string}, index:number) => {
        switch(message.type){
          case "text": 
          return `(${message.time}.) ${message.sender} :  ${message.message}\n`;
          case "notify":
            return `(${message.time}.) *** ${message.message} ***\n`;
          default:
            return `(${message.time}.) ${message.sender} :  Uploaded a file ${message.message}\n`;
            
        }

      }).join('\n');

      const mailOptions = {
        from: process.env.EMAIL_ID,
        to: emailId,
        subject: 'Chat Transcript',
        text: formattedTranscript,
      };

  // Send email using a secure transport
  const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.EMAIL_ID, 
          pass: process.env.EMAIL_PASSWORD, 
      },
  });

  try {
      await transporter.sendMail(mailOptions); 
  } catch (error) {
      console.log('Error sending email: ', error);
     return res.status(500).json({ message: 'Error sending email' });
  }

  return res.status(200).json({ message: "Transcript saved successfully" });
});

app.post('/api/upload', upload.single('file'), (req, res) => {

  console.log('File uploaded:', req.file)
  try {
    // Get the file URL based on where it's stored
    const fileUrl =`${req.file.filename}`;

    console.log("File URL: ", fileUrl)
    // Emit the file URL to other users in the same room
    const {roomId, sender, type} = req.body; // Assuming roomId is sent from the client
    io.to(roomId).emit("recieve-message", { roomId,message: "http://localhost:5003/temp/"+fileUrl, type, sender });
    

    res.status(200).json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}); 

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
    origin: PORT,
    methods: ["GET", "POST"],
    credentials: true
  }
});

type RoomType = {
  roomId: string,
  userName: string,
  agentName: string,
  userEmailId: string,
  agentEmailId:string
}

const rooms = new Map();

const agentInRoom = (roomId: string) => {
  const room = rooms.get(roomId);
  if(room){
    return room.agentEmailId !== "";
  }
  return false;
}

// Queue to hold users waiting to be connected with an agent
let userQueue: string[] = [];


io.on("connection", (socket: Socket) => {

    
    // Function to update queue status and inform user about their position in the queue
  const updateQueueStatus = () => {
      // Recalculate position in queue for all users
      userQueue.forEach((roomId, index) => {
        const positionInQueue = index + 1;
        io.to(roomId).emit("queue-status", `You are at position ${positionInQueue} in the queue. An agent will join you soon.`);
      });
    };


  socket.on("connect", () => {
    console.log("User connected", socket.id);
  });

  socket.on("send-file", (data:{roomId:string, file:any, name:string}) => {
    const {roomId, file, name} = data;
    fs.writeFile(`.public/temp/${file.name}`, file , (err) => {
      if(err){
        console.log("Error: ", err);
      }else{
        console.log("File saved successfully");
        io.to(roomId).emit("recieve-file", {file, name});
      }
    });
    // console.log("File: ", file);
    
  });


  socket.on("save-message", async (data:{emailId:string, message:string}) => {
    const {emailId, message} = data;
    console.log("Message: ", data)
    const chatHistory = await redis.get(emailId);
    if(chatHistory){
      await redis.set(emailId, chatHistory + "#\n#" + message);
    }else{
      await redis.set(emailId, message);
    }
  });

  //user connect event & adding user to rooms
  socket.on("user-connect", (userEmailId: string, name: string) => {
    console.log("User connected", name);
    let existingRoom: { roomId: string; userName: string; userEmailId: string; agentName: string; agentEmailId: string } | undefined;
  
    // Check if the user's email already exists in a room
    rooms.forEach((room) => {
      if (room.userEmailId === userEmailId) {
        existingRoom = room;
        
      }
    });
  
    if (existingRoom) {
      // Join the existing room
      const roomId = existingRoom.roomId;
      socket.join(roomId);
      socket.emit("room-id", roomId);
      socket.broadcast.emit("fetch-users", Array.from(rooms.values()));
    } else {
      // Create a new room
      const roomName = generateRandomRoomName(10);
      rooms.set(roomName, {
        roomId: roomName,
        userName: name,
        userEmailId,
        agentName: "",
        agentEmailId: "",
      });
      socket.join(roomName);
      socket.emit("room-id", roomName);
      console.log("Rooms: ", rooms);
  
      // Add room to the queue
      userQueue.push(roomName);
      // Update queue status for all users
      updateQueueStatus();
      socket.broadcast.emit("notifyAgent");
      socket.broadcast.emit("fetch-users", Array.from(rooms.values()));
    }
  });
  // socket.on("user-connect", (userEmailId: string, name:string) => {

  //   const roomName = generateRandomRoomName(10);
  //   rooms.set(roomName, {roomId: roomName, userName: name, userEmailId, agentName: "", agentEmailId:""});
  //   // rooms.push({roomID: roomName, userID: socket.id, userEmailId, agentID: "", agentEmailId:""});
  //   socket.join(roomName);
    
  //   console.log("Rooms: ", rooms);
                                        
  //   // Add room to the queue
  //   userQueue.push(roomName);
  //   // Update queue status for all users
  //   updateQueueStatus();
  //   socket.broadcast.emit("notifyAgent");
  //   socket.broadcast.emit("fetch-users", rooms);
  // });

  //sending rooms to admin(if users are already connected)
  socket.emit("fetch-users", Array.from(rooms.values()));

  //sending typing event to connect user/admin 
  socket.on("typing", (data) => {
    socket.broadcast.to(data.room).emit("user-typing", data);
  });

   

  //join room by admin
  socket.on("join-room", (data:{roomId:string, agentEmailId:string, name:string}) => {
    const {roomId, agentEmailId, name} = data;
    const room = rooms.get(roomId);
    if(room){
      if(room.agentName === "" || room.agentName === name || room.agentEmailId === agentEmailId || room.agentEmailId === ""){
        rooms.set(roomId, {...room, agentName: name, agentEmailId});
        socket.join(roomId);
        io.to(roomId).emit("agent-joined", {type:"notify", message:name+" has joined the chat", sender:name});
        socket.broadcast.to(roomId).emit("queue-status", "");

         io.emit("fetch-users", Array.from(rooms.values()));
        // Remove room from the queue
        userQueue = userQueue.filter((room) => roomId !== room);
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
  socket.on("leave-room", ( data:{roomId:string, type:string, name:string }) => {
    const {roomId, type, name} = data;
    socket.leave(roomId);
    const room = rooms.get(roomId);
    if(room){
      if(type === "Agent"){
        rooms.set(roomId, {...room, agentName: "", agentEmailId: ""});
      }else{
        rooms.delete(roomId);
      }
    }

    socket.broadcast.to(roomId).emit("user-left", {roomId, message: `${name} has left the chat`, sender:name, type:'notify'});
    io.emit("fetch-users", Array.from(rooms.values()));
  });



  //message to room
  socket.on("room-message", (msg: { roomId: string; message: string, sender:string, type:string }) => {
    console.log("Message: ", msg);
    if(agentInRoom(msg.roomId)){
      console.log("Message: ", msg);
      io.to(msg.roomId).emit("recieve-message",msg);
    }
  });

  //disconnect event
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);

  });


});



server.listen(5003, () => {
  console.log("Server is running on port 5001");
});

