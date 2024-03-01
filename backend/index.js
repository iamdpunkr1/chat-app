import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on("connection", (socket) => {
    //auto connect
    console.log("User connected", socket.id);

    //Message to all
    socket.on("message", (msg) => {
        console.log(msg);
        io.emit("recieve-message", msg);
    });

    //Message to all except sender
    socket.on("broadcast-message", (msg) => {
        console.log(msg);
        socket.broadcast.emit("recieve-message", msg);
    });

    //meassage to specific user
    socket.on("private-message", (msg) => {
        console.log(msg);
        io.to(msg.recieverID).emit("recieve-message", msg.message);
    });



    //disconnect event
    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });
});

server.listen(5000, () => {
    console.log("Server is running on port 5000");
});
