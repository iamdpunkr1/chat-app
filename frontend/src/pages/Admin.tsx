import AdminLogin from "../components/AdminLogin";
import AdmiPanel from "../components/AdmiPanel";
import { useState } from "react";

export type AdminType = {
  adminUsername: string
}

const Admin = () => {

  const [auth, setAuth] = useState<AdminType | null>(null);
  return (
    auth ? <AdmiPanel adminUsername={auth?.adminUsername} /> : <AdminLogin setAuth={setAuth}/>

  )
}

export default Admin