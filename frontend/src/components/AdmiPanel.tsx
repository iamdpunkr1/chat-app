import ChatArea from "./ChatArea";
import { useEffect, useMemo, useState} from "react";
import { io } from 'socket.io-client';
import messageSound from "../assets/sound/ring.mp3";
import { messageTypes } from "../types";
import axios from 'axios';
// @ts-ignore
// import useSound from 'use-sound';
// console.log(useSound)
interface Room {
  roomId: string;
  userName: string;
  userEmailId: string;
  agentId: string;
  agentEmailId: string;
}



type UserMessages = {
  [userID: string]: messageTypes[];
}

type UsernameType = {
  [roomID: string]: string;
}

type AdmiPanelProps = {
  emailId: string,
  setAuth: React.Dispatch<React.SetStateAction<any>>;
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

const AdmiPanel = ({emailId, setAuth}:AdmiPanelProps) => {
  const socket = useMemo(() => io(import.meta.env.VITE_SERVER_URL, {
    withCredentials: true,
  }), []);

  const sound = new Audio(messageSound);
  // const soundRef = useRef<HTMLAudioElement>(null);
  // const [play, { stop }] = useSound(messageSound);
  const [chatMessages, setChatMessages] = useState<UserMessages>({}); //use array instead of object
  const [message, setMessage] = useState<string>("");
  const [users, setUsers] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState<UsernameType>({});
  // const [soundTimeout, setSoundTimeout] = useState<typeof setTimeout | null>(null);
  // const [socketID, setSocketID] = useState<string>("");
  const adminUserName= emailId.split("@")[0];
  

  const sendMessage = (message: string) => {
    console.log("Sending Message");
    if(message.length>0){
    socket.emit("room-message", {roomId: roomId, message, sender:adminUserName, type:"text"})
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter'){
        sendMessage(e.currentTarget.value)
        // e.currentTarget.value = ""
        setMessage("");
    }else{
       socket.emit("typing", {room: roomId, username: adminUserName})
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
    formData.append("sender", adminUserName);
    formData.append("roomId", roomId);
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

  const handleDisonnect = () => { 
    socket.emit("leave-room", {roomId, type: "Agent", name:adminUserName});
    setRoomId("");
  }



  useEffect(() => {
    console.log("Admin Panel: ", emailId)

    socket.on("connect", () => {
    console.log("Admin Connected to server with id: ", socket.id)
      // setSocketID(socket?.id as string);
    })

    socket.on("notifyAgent", () => {
      console.log("before notify")
      sound.play();
      setTimeout(() => {
        sound.pause();
        sound.currentTime = 0;
      }, 10000);
      console.log("after notify")
    })

    socket.on("agent-joined", (message: string) => {
      console.log("Agent Joined: ", message);
      sound.pause();
      sound.currentTime = 0;
    })


    //user array to store all messages instead of object
    socket.on("recieve-message", (data: { roomId: string, message: string, sender:string, type:string }) => {
      const { time } = getISTTimestamp();
      console.log("Recieved Message: ", data);
      setChatMessages(prevMessages => {
        const newMessages = { ...prevMessages };
        if (!newMessages[data.roomId]) {
          newMessages[data.roomId] = [];
        }
        
        newMessages[data.roomId] = [
          ...newMessages[data.roomId],
          { message: data.message, sender: data.sender, type: data.type, time }
        ];
        return { ...newMessages };
      });
    });

    socket.on("fetch-users", (rooms: Room[]) => {
      console.log("Users in the room: ", rooms)
      // const users:Room[] = Array.from(rooms.values());
      if(rooms.length<users.length || rooms.length === 0){
        sound.pause();
        sound.currentTime = 0;
      }
      setUsers(rooms);
      // setUsers(Array.from(users?.values()) as RoomType[]);
    })


    socket.on("user-typing", (data: { room: string, username: string }) => {
      setUsername(prevUsernames => {
        return { ...prevUsernames, [data.room]: data.username };
      });
      const timeoutId = setTimeout(() => {
        setUsername(prevUsernames => {
          const newUsername = { ...prevUsernames };
          delete newUsername[data.room];
          return newUsername;
        });
      }, 1500);
      
      return () => clearTimeout(timeoutId);
    });

    socket.on("user-left", (data:{roomId:string, message:string, sender:string, type:string }) => {
      setChatMessages(prevMessages => {
        const newMessages = { ...prevMessages };
        if (!newMessages[data.roomId]) {
          newMessages[data.roomId] = [];
        }
        newMessages[data.roomId] = [
          ...newMessages[data.roomId],
          { message: data.message, sender: data.sender, type: data.type, time: getISTTimestamp().time }
        ];
        return newMessages;
      });
      
  });

  if(roomId!=="" && emailId){
    socket.emit("join-room", {roomId:roomId, agentEmailId:emailId, name:adminUserName});
  }

    return () => {
      console.log("Admin Disconnected")
      // socket.emit("leave-room", {roomID:roomId, type: "Agent", name:emailId});
      socket.disconnect()
    }
  }, []);

  const handleJoinRoom = (roomId:string) => {
    socket.emit("join-room", {roomId, agentEmailId:emailId, name:adminUserName});
      console.log("before join room")
      stop();
      console.log("after join room")
      setRoomId(roomId);
  }

  const handleLogout = () => {
    if(roomId !==""){
      socket.emit("leave-room", {roomId, type: "Agent", name:adminUserName});
      }
     socket.disconnect();
     setAuth(null);
  }

  return (
    <>
    <div className="flex  justify-between w-full">
        <h1 className="text-2xl font-semibold mb-4 underline">Admin Panel [{adminUserName}]</h1>
        <div className="flex gap-4">
          <button disabled={roomId ===""} className="btn btn-outline btn-primary btn-sm" onClick={handleDisonnect}>Disconnect</button>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
        </div>        
    </div>
    
    <div className="flex gap-x-4">
    <div className="flex flex-col gap-4  my-4 w-3/12 ">
           {users.map((user, index) => {
              if(user.agentEmailId==="" || user.agentEmailId===emailId){
               return(
                <div key={index} className={`flex justify-between border-2 rounded-md p-2 bg-base-200 relative cursor-pointer ${roomId===user?.roomId && "border-green-500"}`}
                        onClick={()=>{if(emailId===user.agentEmailId) setRoomId(user?.roomId)}}>
                   <h2 className="text-sm ">{"User-"+1+"-"+ user?.userName}</h2>
                   <button disabled={emailId===user.agentEmailId} className="btn btn-xs btn-neutral" onClick={()=> handleJoinRoom(user?.roomId)}>{emailId===user.agentEmailId? "connected": "Take"}</button>
                </div>)
              }
            })} 

    </div>
    <div className="w-9/12">
    <ChatArea message={message}
              setMessage={setMessage}
              chats={chatMessages[roomId] || []}
              sendMessage={sendMessage}
              handleKeyPress={handleKeyPress}
              username={username[roomId] || ""}
              handleSendFileUser={handleSendFileUser}
              name={adminUserName}/>
    </div>
    </div>
    {/* <audio ref={soundRef} src={messageSound} /> */}
    </>
  )
}

export default AdmiPanel
