import UserLogin from "../components/UserLogin"
import { useState } from "react";
import UserPanel from "../components/UserPanel";

const User = () => {
  const [auth, setAuth] = useState(false);


  return (
    <>
     {auth? 
    <UserPanel/> : <UserLogin setAuth={setAuth}/> }
    </>
  )
}

export default User