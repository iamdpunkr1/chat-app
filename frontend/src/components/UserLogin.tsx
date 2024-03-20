import { useState, useEffect, useRef } from 'react'; // Import useState hook
import { Link } from 'react-router-dom';

type UserLoginProps = {
    setAuth: (auth: {emailId:string, chatHistory:string}) => void
}

const UserLogin = ({ setAuth }: UserLoginProps) => {
    const [email, setEmail] = useState<string>(''); // State to store email value
    const [password, setPassword] = useState<string>("");
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
        if (validateEmail(email)) {
            const response = await fetch('http://localhost:5001/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            console.log(data);
            if (response.ok) {
                setAuth({ emailId: email, chatHistory: data.chatHistory });
            } else {
                setError('Invalid credentials.');
            }
            
        } else {
            setError('Please enter a valid email address.');
        }
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
        <div className='mx-auto w-[420px] card bg-base-200 p-5'>
            <h2 className='text-center font-bold text-2xl pt-3'>User Login</h2>
            <div>
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
                      <span className="label-text">Password</span>
                    </label>
                    <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="******"
                    type="password"
                    className="mb-3 input input-bordered"
                    required
                    />

                      {error && <p className="text-red-600">{error}</p>}
{/* Display email error message */}
                    <button type="submit" className="btn btn-primary mb-3" >Login</button>
                    <p className='text-center font-semibold text-sm'>
                        Looking for admin login?
                        <Link className='text-indigo-700 hover:underline' to="/admin"> click here</Link>
                    </p>
                </form>
            </div>
        </div>
    )
}

export default UserLogin;
