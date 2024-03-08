import ChatArea from "../components/ChatArea"
import UserLogin from "../components/UserLogin"
import { useState } from "react";

const User = () => {
  const [auth, setAuth] = useState(false);
  return (
    <>
     {auth? 
     <div>
            <div className="flex  justify-between w-full">
                <h1 className="text-2xl font-semibold mb-4 underline">User Panel</h1>
                <button className="btn btn-outline btn-sm">Logout</button>
            </div>
            <ChatArea/>
    </div>: <UserLogin setAuth={setAuth}/> }
    </>
  )
}

export default User