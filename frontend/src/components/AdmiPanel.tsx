import ChatArea from "./ChatArea";
import { useEffect, useMemo, useState} from "react";
import { io } from 'socket.io-client';
import messageSound from "../assets/sound/message.mp3";

type RoomType = {
  roomID: string,
  userID: string,
  agentID: string,
  userEmailId: string,
  agentEmailId: string
}

type UserMessages = {
  [userID: string]: string[];
}

type UsernameType = {
  [roomID: string]: string;
}

type AdmiPanelProps = {
  emailId: string,
  setAuth: React.Dispatch<React.SetStateAction<any>>;
}

const AdmiPanel = ({emailId, setAuth}:AdmiPanelProps) => {
  const socket = useMemo(() => io(import.meta.env.VITE_SERVER_URL, {
    withCredentials: true,
  }), []);

  const sound = new Audio(messageSound);
  const [chatMessages, setChatMessages] = useState<UserMessages>({}); //use array instead of object
  const [message, setMessage] = useState<string>("");
  const [users, setUsers] = useState<RoomType[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState<UsernameType>({});
  // const [socketID, setSocketID] = useState<string>("");
  const adminUserName= emailId.split("@")[0];
  

  const sendMessage = (message: string) => {
    console.log("Sending Message");
    if(message.length>0){
    socket.emit("room-message", {roomID: roomId, message: `${emailId}: `+message, name:adminUserName})
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

  const handleDisonnect = () => { 
    socket.emit("leave-room", {roomID:roomId, type: "Agent", name:adminUserName});
    setRoomId("");
  }

  useEffect(() => {
    console.log("Admin Panel: ", emailId)

    socket.on("connect", () => {
    console.log("Admin Connected to server with id: ", socket.id)
      // setSocketID(socket?.id as string);
    })

    socket.on("notifyAgent", () => {
      console.log("New user connected")
      sound.play();
    })

    //user array to store all messages instead of object
    socket.on("recieve-message", (data: { roomID: string, message: string, name:string }) => {
      console.log("Recieved Message: ")
      setChatMessages(prevMessages => {
        const newMessages = { ...prevMessages };
        if (!newMessages[data.roomID]) {
          newMessages[data.roomID] = [];
        }
        const newMessage = data.message.split(":");
        const senderName = newMessage[0] === emailId ? "You" : data.name || "User";
        newMessages[data.roomID] = [
          ...newMessages[data.roomID],
          `[${senderName}]: ${newMessage[1]}`
        ];
        return { ...newMessages };
      });
    });

    socket.on("fetch-users", (users: RoomType[]) => {
      console.log("Users in the room: ", users)
      setUsers(users);
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
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    });

    socket.on("user-left", (data:{roomID:string, message:string }) => {
      setChatMessages(prevMessages => {
        const newMessages = { ...prevMessages };
        if (!newMessages[data.roomID]) {
          newMessages[data.roomID] = [];
        }
        newMessages[data.roomID].push(data.message);
        return newMessages;
      });
      
  });

  if(roomId!=="" && emailId){
    socket.emit("join-room", {roomID:roomId, agentEmailId:emailId});
  }

    return () => {
      console.log("Admin Disconnected")
      // socket.emit("leave-room", {roomID:roomId, type: "Agent", name:emailId});
      socket.disconnect()
    }
  }, []);

  const handleJoinRoom = (roomID:string) => {
    socket.emit("join-room", {roomID, agentEmailId:emailId});
    setRoomId(roomID);
  }

  const handleLogout = () => {
    if(roomId !==""){
      socket.emit("leave-room", {roomID:roomId, type: "Agent", name:adminUserName});
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
                <button key={index} className={`flex justify-between border-2 rounded-md p-2 bg-base-200 relative ${roomId===user.roomID && "border-green-500"}`}
                        onClick={()=>{if(emailId===user.agentEmailId) setRoomId(user.roomID)}}>
                   <h2 className="text-sm ">{"User-"+1+"-"+ user?.userEmailId?.split("@")[0]}</h2>
                   <button disabled={emailId===user.agentEmailId} className="btn btn-xs btn-neutral" onClick={()=> handleJoinRoom(user.roomID)}>{emailId===user.agentEmailId? "connected": "Take"}</button>
                </button>)
              }
            })} 

    </div>
    <div className="w-9/12">
    <ChatArea message={message} setMessage={setMessage} chats={chatMessages[roomId] || []} sendMessage={sendMessage}  handleKeyPress={handleKeyPress} username={username[roomId] || ""}/>
    </div>
    </div>
    </>
  )
}

export default AdmiPanel