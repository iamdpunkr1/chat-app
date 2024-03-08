type AdminLoginProps = {
  setAuth: (auth: boolean) => void
}


const AdminLogin = ({setAuth}: AdminLoginProps) => {
  return (
    <div className='mx-auto w-[420px] card bg-base-200 p-5'>
              <h2 className='text-center font-bold text-2xl pt-3'>Admin Login</h2>
              
              <div className="card-body">
                <label className="label  pb-0">
                  <span className="label-text">Email</span>
                </label>
                <input placeholder="abc@gmail.com" type='email' className="input input-bordered" />
               
                <label className="label mt-2 pb-0">
                  <span className="label-text">Password</span>
                </label>
                <input placeholder="******" type='password' className="mb-3 input input-bordered" />
                <button className="btn btn-primary mb-3" onClick={()=>setAuth(true)}>Login</button>
                
                {/* <Link to="/forgot" className='text-indigo-700 text-center font-semibold text-sm'>Forgot password?</Link>
                <p className='text-center font-semibold text-sm'>Don't have a account? <Link className='text-indigo-700' to="/signup">Sign Up</Link></p> */}
                
              </div>
        </div>
  )
}

export default AdminLogin;