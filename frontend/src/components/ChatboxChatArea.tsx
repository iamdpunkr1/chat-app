import { messageTypes } from "../types"
import { useEffect, useMemo, useRef, useState} from "react";
import { io } from 'socket.io-client';
import axios from 'axios';
import ChatArea from "./ChatArea"
import useSendTranscript from "../hooks/useSendTranscript";
import { send_Transcript } from "../config";
import { useUser } from "../context/AuthContext";
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


const ChatboxChatArea = () => {

  const { user, setUser} = useUser();
  const { emailId, username:name, accessToken }  = user || {};
  const socket = useMemo(() => io(import.meta.env.VITE_SERVER_URL, {
    auth: {
      token: accessToken,
      code:'7811'
    }
  }), []);

  const { sendTranscript } = useSendTranscript();

const [message, setMessage] = useState<string>("");
const [chatMessages, setChatMessages] = useState<messageTypes[]>([]);
const [username, setUsername] = useState<string>("");
const [roomID, setRoomID] = useState<string>("");
const [queueStatus, setQueueStatus] = useState<string>("");
// const [connectToQueue, setConnectToQueue] = useState<boolean>(false);
const [error, setError] = useState<string>("");
// Create a ref to store the roomID
const roomIdRef = useRef<string>("");


const setMessages = (data: messageTypes) => {
  const { time } = getISTTimestamp();
  const { sender, message, type } = data;
  
  setChatMessages((prevMessages) => [...prevMessages, {type, sender, message, time}])
}
  



const sendMessage = (message:string) => {
    console.log("Sending Message", roomID);
    socket.emit("room-message", {roomId: roomID, message, sender:name, type:"text"})
   
  }

const handleKeyPress = (e: any):void => {
    if(e.key === 'Enter'){
        sendMessage(e.currentTarget.value)
        setMessage("");
    }else{
       socket.emit("typing", {room: roomID, username: name})
    }
}


// const handleDisonnect = () => {
//     console.log("Disconnecting")
//     socket.emit("leave-room", {roomId:roomID, type: "User", name });
//     socket.emit("save-message", {emailId, message: "You left the chat"})
//     setRoomID("");
//     setConnectToQueue(false);
// }


const handleLogout =async  (roomID:string) => {
  console.log("Logging out", roomID, chatMessages)
  if(send_Transcript) sendTranscript(emailId || "", chatMessages);
   socket.emit("leave-room", {roomId:roomID, type: "User", name });
   socket.disconnect();
   roomIdRef.current = "";
   try{
    const res:any = await axios.get(import.meta.env.VITE_SERVER_URL+"/api/logout",
    {
      withCredentials: true,
    });
    console.log(res.data)
    // if (!res?.data) throw new Error("Logout failed");

  }catch(err){
    console.log(err)
  }finally {
    setUser(null);
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
  formData.append("sender", name || "");
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


    socket.on("connect", () => {
      console.log("User Connected to server with id: ", socket.id)
    })
    
    console.log("emailId", emailId, name)
    if(emailId) socket.emit("user-connect", emailId, name);

    socket.on('connect_error', (error) => {
      console.log('Connection error:', error.message);
      if(error.message === "Authentication error"){
        setError("Authentication Error. Please login again");
        setTimeout(() => {
          setUser(null);
        }, 2000);
      }
    });

    socket.on('error', (error) => {
      console.log('Socket error:', error);
    });
    socket.on("queue-status", (status: string) => {
        setQueueStatus(status);
    })

    socket.on("recieve-message", (data: messageTypes) => {
        setMessages(data);
      })

    socket.on("room-id", (roomID: string) => {
        console.log("Room ID: ", roomID)
        setRoomID(roomID);
        roomIdRef.current = roomID;
    })

    // socket.on("file", (url=> console.log(url)))

    
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
      const timeoutId=setTimeout(() => {
        handleLogout(roomIdRef.current);
      }, 1000);
      return () => clearTimeout(timeoutId);
    });

   

    // if(connectToQueue) socket.emit("user-connect", emailId);

    return () => {
        //  socket.disconnect()
        handleLogout(roomIdRef.current);
        }
    },[]);


  return (
    <div>
            {error && <p className="text-left py-4 px-4 text-red-500 text-md">{error}</p>}
            {queueStatus && <p className="text-left py-4 px-4 text-gray-500 text-md">{queueStatus}</p>} 
            <ChatArea  message={message}
                       setMessage={setMessage}
                       chats={chatMessages}
                       sendMessage={sendMessage}
                       handleKeyPress={handleKeyPress}
                       username={username}
                       handleSendFileUser={handleSendFileUser}
                       name={name || ""} />
    </div>
  )
}

export default ChatboxChatArea