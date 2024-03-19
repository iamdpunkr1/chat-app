import UserLogin from "../components/UserLogin"
import { useState } from "react";
import UserPanel from "../components/UserPanel";

type UserType = {
  emailId: string
}

const User = () => {
  const [auth, setAuth] = useState<UserType | null>(null);


  return (
    <>
     {auth? 
    <UserPanel emailId={auth?.emailId} setAuth={setAuth} /> : <UserLogin setAuth={setAuth}/> }
    </>
  )
}

export default User