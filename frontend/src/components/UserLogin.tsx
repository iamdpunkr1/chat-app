import { Link } from "react-router-dom"

type UserLoginProps = {
    setAuth: (auth: boolean) => void
    }

const UserLogin = ({setAuth}:UserLoginProps) => {

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuth(true)

  }
  return (
    <div className='mx-auto w-[420px] card bg-base-200 p-5'>
              <h2 className='text-center font-bold text-2xl pt-3'>User Login</h2>
              
              <div >
                <form className="card-body" onSubmit={handleSubmit}>
                <label className="label  pb-0">
                  <span className="label-text">Email</span>
                </label>
                <input placeholder="Enter a valid email" type='email' className="input input-bordered" />
                <button type="submit" className="btn btn-primary mb-3" >Login</button>
                <p className='text-center font-semibold text-sm'>
                  Looking for admin login? 
                  <Link className='text-indigo-700' to="/admin">click here</Link>
                </p>
               </form> 
              </div>
             
        </div>
  )
}

export default UserLogin