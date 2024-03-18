import { Link } from "react-router-dom"

type UserLoginProps = {
    setAuth: (auth: boolean) => void
    }

const UserLogin = ({setAuth}:UserLoginProps) => {
  return (
    <div className='mx-auto w-[420px] card bg-base-200 p-5'>
              <h2 className='text-center font-bold text-2xl pt-3'>User Login</h2>
              
              <div className="card-body">
                <label className="label  pb-0">
                  <span className="label-text">Username</span>
                </label>
                <input placeholder="Enter a username" type='text' className="input input-bordered" />
                <button className="btn btn-primary mb-3" onClick={()=>setAuth(true)}>Login</button>
                <p className='text-center font-semibold text-sm'>Looking for admin login? <Link className='text-indigo-700' to="/admin/all">click here</Link></p> 
              </div>
             
        </div>
  )
}

export default UserLogin