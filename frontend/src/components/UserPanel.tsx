import { useEffect, useMemo, useState} from "react";
import { io } from 'socket.io-client';
import ChatArea from "../components/ChatArea";

const UserPanel = () => {

    const socket = useMemo(() => io('http://localhost:5001', {
        withCredentials: true,
      }), []);

    const [chatMessages, setChatMessages] = useState<string[]>([]);
    const [socketID, setSocketID] = useState<string>("");
    const  [username, setUsername] = useState<string>("");
    const [roomID, setRoomID] = useState<string>("");
    const [queueStatus, setQueueStatus] = useState<string>("");

    const sendMessage = (message:string) => {
        console.log("Sending Message");
        socket.emit("room-message", {roomID: roomID, message: `[User-${socket?.id?.substring(0, 2)}]: `+message})
      }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === 'Enter'){
            sendMessage(e.currentTarget.value)
            e.currentTarget.value = ""
        }else{
           socket.emit("typing", {room: roomID, username: "User"+socket?.id?.substring(0, 4)})
        }
    }

    useEffect(() => {

        socket.on("connect", () => {
          console.log("User Connected to server with id: ", socket.id)
          setSocketID(socket?.id?.substring(0, 5) as string)
        })
        
        socket.emit("user-connect", "newUser");

        socket.on("queue-status", (status: string) => {
            setQueueStatus(status);
        })

        socket.on("recieve-message", (message: string) => {
            setChatMessages((prevMessages) => [...prevMessages, message])
            // setMessages((prevMessages) => [...prevMessages, message])
          })

        socket.on("room-id", (roomID: string) => {
            console.log("Room ID: ", roomID)
            setRoomID(roomID);
        })

        
        socket.on("user-typing", (username: string) => {
            setUsername(username);
            const timeoutId = setTimeout(() => setUsername(""), 2000);
            // Returning a cleanup function to clear the timeout
            return () => clearTimeout(timeoutId);
        })
        

        socket.on("agent-joined", (msg: string) => {
            // console.log("Agent joined room: ", roomID)
            setChatMessages((prevMessages) => [...prevMessages, msg])
        });

        socket.on("agent-left", (msg: string) => {
            // console.log("Agent left room: ", roomID)
            setChatMessages((prevMessages) => [...prevMessages, msg])
        });

        return () => {
             socket.disconnect()
            }
        },[]);
    
  return (
    <div>
            <div className="flex  justify-between w-full">
                <h1 className="text-2xl font-semibold mb-4 underline">User Panel</h1>
                <button className="btn btn-outline btn-sm">Logout</button>
            </div>
            {queueStatus && <p className="text-lg font-semibold">{queueStatus}</p>} 
            <ChatArea chats={chatMessages} sendMessage={sendMessage} handleKeyPress={handleKeyPress} username={username} agent={true}/>
    </div>
  )
}

export default UserPanel