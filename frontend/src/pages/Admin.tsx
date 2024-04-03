import AdminLogin from "../components/AdminLogin";
import AdmiPanel from "../components/AdmiPanel";
import { useState } from "react";
import { AdminType } from "../types";

const Admin = () => {

  const [auth, setAuth] = useState<AdminType | null>(null);
  return (
    auth ? <AdmiPanel auth={auth}  setAuth={setAuth}/> : <AdminLogin setAuth={setAuth}/>

  )
}

export default Admin