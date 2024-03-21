import { Link } from "react-router-dom";
import { AdminType } from "../pages/Admin";
import { useState, useRef, useEffect } from "react";

type AdminLoginProps = {
  setAuth: (auth: AdminType | null) => void;
};

const AdminLogin = ({ setAuth }: AdminLoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if(emailInputRef.current){
      emailInputRef.current.focus();
    }
  }, []);

  // Function to validate email using regex
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

  const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    // Replace these with your actual authentication logic
    if (validateEmail(email)) {
      const response = await fetch(import.meta.env.VITE_SERVER_URL+'/api/admin/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      console.log(data);
      if (response.ok) {
          setAuth({ emailId: email });
      } else {
          setError('Invalid credentials.');
      }
      
  } else {
      setError('Please enter a valid email address.');
  }
  };

  return (
    <div className="mx-auto w-[420px] card bg-base-200 p-5">
      <h2 className="text-center font-bold text-2xl pt-3">Admin Login</h2>

      <form className="card-body" onSubmit={handleSubmit}>
        <label className="label pb-0">
          <span className="label-text">Email</span>
        </label>
        <input
          ref={emailInputRef}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="abc@gmail.com"
          type="email"
          className="input input-bordered"
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

        <button type="submit" className="btn btn-primary mb-3">
          Login
        </button>

        <p className="text-center font-semibold text-sm">
          Looking for user login?{" "}
          <Link className="text-indigo-700" to="/">
            click here
          </Link>
        </p>
      </form>
    </div>
  );
};

export default AdminLogin;