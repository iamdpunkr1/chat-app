import ChatArea from "./ChatArea";
import { useEffect, useMemo, useState} from "react";
import { io } from 'socket.io-client';
import messageSound from "../assets/sound/message.mp3";

type RoomType = {
  roomID: string,
  userID: string,
  agentID: string
}

type UserMessages = {
  [userID: string]: string[];
}

type UsernameType = {
  [roomID: string]: string;
}

const AdmiPanel = () => {
  const socket = useMemo(() => io('http://localhost:5001', {
    withCredentials: true,
  }), []);

  const sound = new Audio(messageSound);
  const [chatMessages, setChatMessages] = useState<UserMessages>({});
  const [users, setUsers] = useState<RoomType[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState<UsernameType>({});
  const [socketID, setSocketID] = useState<string>("");

  const sendMessage = (message: string) => {
    console.log("Sending Message");
    socket.emit("room-message", {roomID: roomId, message: `[agent-${socket?.id?.substring(0, 2)}]: `+message})
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter'){
        sendMessage(e.currentTarget.value)
        e.currentTarget.value = ""
    }else{
       socket.emit("typing", {room: roomId, username: "User "+socket?.id?.substring(0, 4)})
    }
  }

  const handleDisonnect = () => { 
    socket.emit("leave-room", roomId);
  }

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Admin Connected to server with id: ", socket.id)
      setSocketID(socket?.id as string);
    })

    socket.on("notifyAgent", () => {
      console.log("New user connected")
      sound.play();
    })

    socket.on("recieve-message", (data: { roomID: string, message: string }) => {
      setChatMessages(prevMessages => {
        const newMessages = { ...prevMessages };
        if (!newMessages[data.roomID]) {
          newMessages[data.roomID] = [];
        }
        newMessages[data.roomID].push(data.message);
        return newMessages;
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

    return () => {
      socket.disconnect()
    }
  }, []);

  const handleJoinRoom = (roomID:string) => {
    socket.emit("join-room", roomID);
    setRoomId(roomID);
  }

  return (
    <>
    <div className="flex  justify-between w-full">
        <h1 className="text-2xl font-semibold mb-4 underline">Admin Panel</h1>
        <div className="flex gap-4">
          <button className="btn btn-outline btn-primary btn-sm" onClick={handleDisonnect}>Disconnect</button>
          <button className="btn btn-outline btn-sm">Logout</button>
        </div>        
    </div>
    
    <div className="flex gap-x-4">
    <div className="flex flex-col gap-4  my-4 w-3/12 ">
           {users.map((user, index) => {
              if(user.agentID==="" || user.agentID===socketID){
               return(
                <button key={index} className={`flex justify-between border-2 rounded-md p-2 bg-base-200 relative ${roomId===user.roomID && "border-green-500"}`}
                        onClick={()=>{if(socketID===user.agentID) setRoomId(user.roomID)}}>
                   <h2 className="text-sm ">{"User-"+ user.userID.substring(0,4)}</h2>
                   <button disabled={socketID===user.agentID} className="btn btn-xs btn-neutral" onClick={()=> handleJoinRoom(user.roomID)}>{socketID===user.agentID? "connected": "Take"}</button>
                </button>)
              }
            })} 

    </div>
    <div className="w-9/12">
    <ChatArea chats={chatMessages[roomId] || []} sendMessage={sendMessage}  handleKeyPress={handleKeyPress} username={username[roomId] || ""} agent={false}/>
    </div>
    </div>
    </>
  )
}

export default AdmiPanel
