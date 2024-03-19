import { useState, useEffect, useRef } from 'react'; // Import useState hook
import { Link } from 'react-router-dom';

type UserLoginProps = {
    setAuth: (auth: {emailId:string}) => void
}

const UserLogin = ({ setAuth }: UserLoginProps) => {
    const [email, setEmail] = useState(''); // State to store email value
    const [emailError, setEmailError] = useState(''); // State to store email validation error
    const emailInputRef = useRef<HTMLInputElement>(null); // Ref to store reference of email input element

    useEffect(() => {
        // Focus on the email input element when the component mounts
        if (emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, []);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setEmailError('');
        if (validateEmail(email)) {
            setAuth({ emailId: email });
        } else {
            setEmailError('Please enter a valid email address.');
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
                    {emailError && <p className="text-red-500">{emailError}</p>} {/* Display email error message */}
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

export default UserLogin;
