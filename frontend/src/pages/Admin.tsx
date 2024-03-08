import AdminLogin from "../components/AdminLogin";
import AdmiPanel from "../components/AdmiPanel";
import { useState } from "react";

const Admin = () => {

  const [auth, setAuth] = useState(false);
  return (
    auth ? <AdmiPanel/> : <AdminLogin setAuth={setAuth}/>

  )
}

export default Admin