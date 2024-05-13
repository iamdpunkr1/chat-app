import { messageTypes } from "../types"
import { useEffect, useMemo, useRef, useState} from "react";
import {io } from 'socket.io-client';
import axios from 'axios';
import ChatArea from "./ChatArea"
import useSendTranscript from "../hooks/useSendTranscript";
import { port, send_Transcript } from "../config";
import { useUser } from "../context/AuthContext";

// Function to get the universal date and time
function getUniversalDateTime(): string {
  const date = new Date();
  const universalDateTime: string = date.toISOString();
  return universalDateTime;
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

function convertToCurrentTimeZone(universalDateTime: string): string {
    const date = new Date(universalDateTime);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert hours to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle 0 as 12 PM

    const localTime = `${hours}:${minutes} ${ampm}`;
    return localTime;
}

const ChatboxChatArea = () => {

  const { user, setUser} = useUser();
  const { emailId, username:name, accessToken }  = user || {};
  const socket = useMemo(() => io(port, {
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
  const { time:ISTtime } = getISTTimestamp();
  const { sender, message, type, time, email } = data;
  const localTime = convertToCurrentTimeZone(time || ISTtime);
  
  setChatMessages((prevMessages) => [...prevMessages, {type, sender, message, time: localTime, email}])
}
  



const sendMessage = (message:string) => {
    console.log("Sending Message", roomID);
    const universalDateTime = getUniversalDateTime();
    socket.emit("room-message", {roomId: roomID, message, sender:name, type:"text", time:universalDateTime, email:emailId})
   
  }

const handleKeyPress = (e:  React.KeyboardEvent<HTMLTextAreaElement>) => {
    if(e.key === 'Enter'){
        sendMessage(e.currentTarget.value)
        setMessage("");
    }else{
       socket.emit("typing", {room: roomID, username: name})
    }
}




const handleLogout =async  (roomID:string) => {
  console.log("Logging out", roomID, chatMessages)
  if(send_Transcript) sendTranscript(emailId || "", chatMessages);
   socket.emit("leave-room", {roomId:roomID, type: "User", name });
   socket.disconnect();
   roomIdRef.current = "";
   try{
    const res:any = await axios.get(port+"/api/logout",
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
  if(queueStatus.length>0) {
    setError("Please wait for an agent to join the chat");
    setTimeout(() => {
      setError("");
    }, 2000);
    return;
  }
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

  const time = getUniversalDateTime();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", fileType);
  formData.append("sender", name || "");
  formData.append("roomId", roomID);
  formData.append("time", time);
  formData.append("email", emailId || "");

  try{
    const res = await axios.post(port+"/api/upload",formData, {
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

  socket.on("saved-messages", (savedMessages:string, roomId:string) => {
    // console.log("savedMessages: ", savedMessages)
    const getMessages = savedMessages.split("###");
    console.log(roomId)
    
    const finalMessages = getMessages
                            .slice(0, -1) // Remove the last element
                            .map(msg => {
                              const parsedMsg = JSON.parse(msg);
                              const localTime = convertToCurrentTimeZone(parsedMsg.time);
                              return {
                                type: parsedMsg.type,
                                sender: parsedMsg.sender,
                                message: parsedMsg.message,
                                time: localTime,
                                email: parsedMsg.email
                              }
                            } );
        // console.log("finalMessages: ", finalMessages);
        setChatMessages(finalMessages);
  })

    socket.on("connect", () => {
      console.log("User Connected to Socket with id: ", socket.id)
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
      console.log(data)
        setMessages(data);
        socket.emit("save-message", data) 
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
                      //  name={name || ""}
                       email={emailId} />
    </div>
  )
}

export default ChatboxChatArea