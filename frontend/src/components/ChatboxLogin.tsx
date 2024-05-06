import { useEffect, useRef, useState } from "react";
import { useUser } from "../context/AuthContext";
import { port } from "../config";

const ChatboxLogin = () => {

    const { setUser } = useUser(); // Destructure setUser function from AuthContext

  const [email, setEmail] = useState<string>(''); // State to store email value
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<string>(''); // State to store email validation error
  const emailInputRef = useRef<HTMLInputElement>(null); // Ref to store reference of email input element

  useEffect(() => {
      // Focus on the email input element when the component mounts
      if (emailInputRef.current) {
          emailInputRef.current.focus();
      }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError('');
      console.log(email, username)
      if(validateEmail(email) && username.length > 3){
        const response = await fetch(import.meta.env.VITE_SERVER_URL+'/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, username }),
            credentials: 'include'
        });
        const data = await response.json();
        console.log(data);
        if (response.ok) {
            const { email, username, message, accessToken } = data;
            setUser({emailId:email, username:username, message:message, accessToken:accessToken});
        } else {
            setError('Error in repsonse.');
        }
        }else {
            setError('Please enter a valid email address.');
        }
    //   if (validateEmail(email)) {

          
    //   } else {
    //       setError('Please enter a valid email address.');
    //   }
  }

  // Function to validate email using regex
  const validateEmail = (email: string) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
  }

  // Function to handle changes in the email input
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      
  }

  return (
    <div className="py-8 border-b">
              
    <form className="card-body" onSubmit={handleSubmit}>
          <label className="label pb-0">
              <span className="label-text">Email</span>
          </label>
          <input
              ref={emailInputRef}
              placeholder="Enter a valid email"
              type='email'
              className="input input-bordered"
              value={email}
              onChange={handleEmailChange} // Call handleEmailChange on input change
              required
          />
           <label className="label mt-2 pb-0">
            <span className="label-text">Username</span>
          </label>
          <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          type="text"
          className="mb-3 input input-bordered"
          required
          />

            {error && <p className="text-red-600">{error}</p>}
{/* Display email error message */}
          <button type="submit" className="btn bg-blue-500 text-white hover:text-black mb-3" >Login</button>
          {/* <p className='text-center font-semibold text-sm'>
              Looking for admin login?
              <Link className='text-indigo-700 hover:underline' to="/admin"> click here</Link>
          </p> */}
    
    </form>
    
  </div>
  )
}

export default ChatboxLogin