import ChatArea from "./ChatArea"
import { useEffect, useMemo, useState} from "react";
import { io } from 'socket.io-client';
import messageSound from "../assets/sound/message.mp3";
// import { useParams, useNavigate } from "react-router-dom";

type RoomType = {
  roomID: string,
  userID: string,
  agentID: string
}

const AdmiPanel = () => {
  // const  {roomIds}  = useParams();
  // const navigate = useNavigate();
  // console.log("Room ID: ", roomIds);

  const socket = useMemo(() => io('http://localhost:5001', {
    withCredentials: true,
  }), []);

  const sound = new Audio(messageSound);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [users, setUsers] = useState<RoomType[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [socketID, setSocketID] = useState<string>("");

  // const openAdminPanelInNewTab = (roomID:string) => {
  //   const newTab = window.open('', '_blank');
  //   if (newTab) {
  //       newTab.location.href = `/admin/${roomID}`;
  //       newTab.focus();
  //   } else {
  //       alert('Your browser is blocking pop-ups. Please allow pop-ups for this site to open the admin panel in a new tab.');
  //   }
  // };
  
  const handleJoinRoom = (roomID:string) => {
    //  if(roomId===""){
     socket.emit("join-room", roomID);
     setRoomId(roomID);
    //  navigate(`/admin/${roomID}`);
    // }else if(roomId!==roomID){
    //   openAdminPanelInNewTab(roomID);
    // }
  }

  const sendMessage = (message:string) => {
    console.log("Sending Message");
    socket.emit("room-message", {roomID: roomId, message: `[agent-${socket?.id?.substring(0, 2)}]: `+message})
  }


  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter'){
        sendMessage(e.currentTarget.value)
        e.currentTarget.value = ""
    }else{
       socket.emit("typing", {room: roomId, username: "User"+socket?.id?.substring(0, 4)})
    }
  }

  const handleDisonnect = () => { 
    socket.emit("leave-room", roomId);
    // setRoomId("");
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



    socket.on("recieve-message", (message: string) => {
      setChatMessages((prevMessages) => [...prevMessages, message])
      
    })

    socket.on("fetch-users", (users: RoomType[]) => {
      console.log("Users in the room: ", users)
      setUsers(users);

    })


    socket.on("user-typing", (username: string) => {
      setUsername(username);
      const timeoutId = setTimeout(() => setUsername(""), 2000);
      // Returning a cleanup function to clear the timeout
      return () => clearTimeout(timeoutId);
  })

    return () => {
      socket.disconnect()
      }
    },[]);


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
                <span key={index} className="flex justify-between border-2 rounded-md p-2 bg-base-200 relative">
                   <h2 className="text-sm ">{"User-"+ user.userID.substring(0,4)}</h2>
                   <button disabled={roomId===user.roomID} className="btn btn-xs btn-neutral" onClick={()=> handleJoinRoom(user.roomID)}>{socketID===user.agentID? "connected": "Take"}</button>
                    <span className={`absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500 ${user.roomID===roomId? "animate-ping" : "hidden"}`}> </span>
                </span>)
              }
            })} 

    </div>
    <div className="w-9/12">
    <ChatArea chats={chatMessages} sendMessage={sendMessage}  handleKeyPress={handleKeyPress} username={username} agent={false}/>
    </div>
    </div>
    </>
  )
}

export default AdmiPanel