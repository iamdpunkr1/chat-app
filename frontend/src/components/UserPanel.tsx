import { useEffect, useMemo, useState} from "react";
import { io } from 'socket.io-client';
import ChatArea from "../components/ChatArea";
import axios from 'axios';
import { messageTypes } from "../types";

type UserType = {
  emailId: string,
  chatHistory: string
}
type UserPanelProps = {
  emailId: string,
  chatHistory: string,
  setAuth: React.Dispatch<React.SetStateAction<UserType | null>>;
 
}

 // Function to get current timestamp in IST with separated date and time
 const getISTTimestamp = ():{date:string, time:string} => {
  const now = new Date();
  const ISTOffset = 330; // IST offset in minutes
  const utcTimestamp = now.getTime() + (now.getTimezoneOffset() * 60000); // Get UTC timestamp
  const ISTTimestamp = new Date(utcTimestamp + (ISTOffset * 60000)); // Adjust for IST offset
  const ISTDate = ISTTimestamp.toLocaleDateString(); // Get IST date
  const ISTTime = ISTTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Get IST time
  return { date: ISTDate, time: ISTTime };
};

const UserPanel = ({ emailId,  setAuth }: UserPanelProps) => {

    const socket = useMemo(() => io(import.meta.env.VITE_SERVER_URL, {
        withCredentials: true,
      }), []);
    
    const [name, setName] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [chatMessages, setChatMessages] = useState<messageTypes[]>([]);
    // const [socketID, setSocketID] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [roomID, setRoomID] = useState<string>("");
    const [queueStatus, setQueueStatus] = useState<string>("");
    const [connectToQueue, setConnectToQueue] = useState<boolean>(false);
    
    


    const setMessages = (data: messageTypes) => {
      const { time } = getISTTimestamp();
      const { sender, message, type } = data;
      
      setChatMessages((prevMessages) => [...prevMessages, {type, sender, message, time}])
    }
      


    // console.log("roomId from callback", roomID)
    const sendMessage = (message:string) => {
        console.log("Sending Message", roomID);
        socket.emit("room-message", {roomId: roomID, message, sender:name, type:"text"})
       
      }

    const handleKeyPress = (e:any) => {
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
        socket.emit("leave-room", {roomId:roomID, type: "User", name });
        socket.emit("save-message", {emailId, message: "You left the chat"})
        setRoomID("");
        setConnectToQueue(false);
    }


    const handleLogout = () => {
      if(connectToQueue){
          socket.emit("leave-room", {roomId:roomID, type: "User", name });
          socket.emit("save-message", {emailId, message: "You left the chat"})
        }
       socket.disconnect();
       setAuth(null);
    }

    const sendTranscript = async () => {
      console.log("Sending Transcript")
      try{
      const res = await fetch(import.meta.env.VITE_SERVER_URL+"/api/send-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({emailId, transcript:chatMessages})
      });
      const data = await res.json();
      console.log("Transcript sent: ",data);
      if(data.success){
        alert("Transcript sent successfully");
      }
    }catch(err){
      console.log("Error while sending transcript: ",err);
    }
      
    }

    
    const handleSendFileUser = async (file:File) => {
      console.log("Sending File: ", file);
      let fileType;
      if (file.type.includes("image/")) {
        fileType = "image";
      } else if (file.type.includes("video/")) {
        fileType = "video";
      } else if (file.type.includes("audio/")) {
        fileType = "audio";
      } else {
        fileType = "other";
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", fileType);
      formData.append("sender", name);
      formData.append("roomId", roomID);
      try{
        const res = await axios.post("http://localhost:5003/api/upload",formData, {
          headers:{
            "Content-Type": "multipart/form-data;",

          },
        });
        // const data = await res.data();
        console.log("File Uploaded: ", res.data);

      }catch(err){
        console.log("Error while uploading file: ", err);
      }
      
    };

    useEffect(() => {

        
        if(emailId) {
          const getname = emailId.split("@")[0];
          setName(getname);
        }

        socket.on("connect", () => {
          console.log("User Connected to server with id: ", socket.id)
        })
        
        

        socket.on("queue-status", (status: string) => {
            setQueueStatus(status);
        })

        socket.on("recieve-message", (data: messageTypes) => {
            setMessages(data);
          })
 
        socket.on("room-id", (roomID: string) => {
            console.log("Room ID: ", roomID)
            setRoomID(roomID);
        })

        socket.on("file", (url=> console.log(url)))

        
        socket.on("user-typing", (data:{room:string, username:string}) => {
            setUsername(data.username);
            const timeoutId = setTimeout(() => setUsername(""), 1500);
            // Returning a cleanup function to clear the timeout
            return () => clearTimeout(timeoutId);
        })
        

        socket.on("agent-joined", (data: messageTypes) => {
          setMessages(data);
        });

        socket.on("user-left", (data:messageTypes) => {
          setMessages(data);
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
            <button className="btn btn-outline btn-primary btn-sm" onClick={() => {
              socket.emit("user-connect", emailId, name);
              setConnectToQueue(true);
            }}>Connect to an Agent</button>
            <button className="btn btn-outline btn-sm ml-2" onClick={handleLogout}>Logout</button>
        </div>  )
  }

  return (
    <div>
            <div className="flex  justify-between w-full">
              
                <h1 className="text-2xl font-semibold mb-4 underline">User Panel: [{name}]</h1>
              
                <div className="flex gap-4">
                  <button disabled={roomID ===""} className="btn btn-outline btn-primary btn-sm" onClick={()=> {if(chatMessages.length>0) sendTranscript()}}>Send Transcript</button>
                  <button  disabled={roomID ===""}  className="btn btn-outline btn-primary btn-sm" onClick={handleDisonnect}>Disconnect</button>
                  <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
                </div>  
            </div>
            {queueStatus && <p className="text-left py-4">{queueStatus}</p>} 
            <ChatArea  message={message}
                       setMessage={setMessage}
                       chats={chatMessages}
                       sendMessage={sendMessage}
                       handleKeyPress={handleKeyPress}
                       username={username}
                       handleSendFileUser={handleSendFileUser}
                       name={name} />
    </div>
  )
}

export default UserPanel