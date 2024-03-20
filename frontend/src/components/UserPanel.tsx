import { useEffect, useMemo, useState} from "react";
import { io } from 'socket.io-client';
import ChatArea from "../components/ChatArea";

type UserType = {
  emailId: string,
  chatHistory: string
}
type UserPanelProps = {
  emailId: string,
  chatHistory: string,
  setAuth: React.Dispatch<React.SetStateAction<UserType | null>>;

}

const UserPanel = ({ emailId, chatHistory, setAuth }: UserPanelProps) => {

    const socket = useMemo(() => io('http://localhost:5001', {
        withCredentials: true,
      }), []);
    
    const [name, setName] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [chatMessages, setChatMessages] = useState<string[]>([]);
    const [socketID, setSocketID] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [roomID, setRoomID] = useState<string>("");
    const [queueStatus, setQueueStatus] = useState<string>("");
    const [connectToQueue, setConnectToQueue] = useState<boolean>(false);

    const sendMessage = (message:string) => {
        console.log("Sending Message");
        socket.emit("room-message", {roomID: roomID, message: `${emailId}: `+message, name})
       
      }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === 'Enter'){
            sendMessage(e.currentTarget.value)
            // e.currentTarget.value = ""
            setMessage("");
        }else{
           socket.emit("typing", {room: roomID, username: name})
        }
    }


    const handleDisonnect = () => {
        console.log("Disconnecting")
        socket.emit("leave-room", {roomID, type: "User", name });
        socket.emit("save-message", {emailId, message: "You left the chat"})
        setRoomID("");
        setConnectToQueue(false);
    }


    const handleLogout = () => {
       socket.emit("leave-room", {roomID, type: "User", name });
       socket.emit("save-message", {emailId, message: "You left the chat"})
       socket.disconnect();
       setAuth(null);
    }
    useEffect(() => {

        
        if(emailId) {
          const getname = emailId.split("@")[0];
          setName(getname);
          if(chatHistory){
          setChatMessages(chatHistory.split("#\n#"))
          }
        }

        socket.on("connect", () => {
          console.log("User Connected to server with id: ", socket.id)
          setSocketID(socket?.id?.substring(0, 5) as string)
        })
        
        

        socket.on("queue-status", (status: string) => {
            setQueueStatus(status);
        })

        socket.on("recieve-message", (msg: { roomID: string; message: string, name:string }) => {
          const newMessage = msg.message.split(":");
          // console.log(newMessage[0] === socket?.id, newMessage[0], socket?.id)
          if(newMessage[0] === emailId){
            newMessage[0] = "You"
          }else{
            newMessage[0] = msg.name || "Agent"
          }

          socket.emit("save-message", {emailId, message: `[${newMessage[0]}]: ${newMessage[1]}`})  
          setChatMessages((prevMessages) => [...prevMessages, `[${newMessage[0]}]: ${newMessage[1]}`])
            // setMessages((prevMessages) => [...prevMessages, message])
          })
 
        socket.on("room-id", (roomID: string) => {
            console.log("Room ID: ", roomID)
            setRoomID(roomID);
        })

        
        socket.on("user-typing", (data:{room:string, username:string}) => {
            setUsername(data.username);
            const timeoutId = setTimeout(() => setUsername(""), 2000);
            // Returning a cleanup function to clear the timeout
            return () => clearTimeout(timeoutId);
        })
        

        socket.on("agent-joined", (msg: string) => {
            // console.log("Agent joined room: ", roomID)
            socket.emit("save-message", {emailId, message: msg})
            setChatMessages((prevMessages) => [...prevMessages, msg])
        });

        socket.on("user-left", (data:{roomID:string, message:string }) => {
            // console.log("Agent left room: ", roomID)
            socket.emit("save-message", {emailId, message: data.message})
            setChatMessages((prevMessages) => [...prevMessages, data.message])
        });

        if(connectToQueue) socket.emit("user-connect", emailId);

        return () => {
             socket.disconnect()
            }
        },[]);
    
  if(!connectToQueue){
     return (
        <div>
            <h1 className="text-2xl font-semibold mb-4 underline"> Welcome, {name}</h1>
            <p className="text-lg font-semibold pb-8">Connect to an Agent to get started</p>
            <button className="btn btn-primary" onClick={() => {
              socket.emit("user-connect", emailId);
              setConnectToQueue(true);
            }}>Connect to an Agent</button>
        </div>  )
  }

  return (
    <div>
            <div className="flex  justify-between w-full">
              
                <h1 className="text-2xl font-semibold mb-4 underline">User Panel: [{name}]</h1>
              
                <div className="flex gap-4">
                  <button className="btn btn-outline btn-primary btn-sm" onClick={handleDisonnect}>Disconnect</button>
                  <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
                </div>  
            </div>
            {queueStatus && <p className="text-left py-4">{queueStatus}</p>} 
            <ChatArea  message={message} setMessage={setMessage}  chats={chatMessages} sendMessage={sendMessage} handleKeyPress={handleKeyPress} username={username} agent={true}/>
    </div>
  )
}

export default UserPanel