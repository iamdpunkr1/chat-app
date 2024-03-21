import AdminLogin from "../components/AdminLogin";
import AdmiPanel from "../components/AdmiPanel";
import { useState } from "react";

export type AdminType = {
  emailId: string,
}

const Admin = () => {

  const [auth, setAuth] = useState<AdminType | null>(null);
  return (
    auth ? <AdmiPanel emailId={auth?.emailId}  setAuth={setAuth}/> : <AdminLogin setAuth={setAuth}/>

  )
}

export default Admin