import React,{useState} from 'react';
import "../auth.form.scss";
import { useNavigate,Link,Navigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import Lottie from "react-lottie-player"
const Login = () => {

    const {loading, handleLogin, user} = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const result = await handleLogin({email,password});
        if (result?.success) {
            navigate('/');
        } else {
            setError(result?.message || "Invalid email or password");
        }
    };

    if(loading){
        return(

        <main className='loading-screen'>
                <Lottie
                    loop
                    play
                    path="/animation/ai.json"
                    className='loading-animation'
                />
        </main>
        
    )}
    if(user){
        return <Navigate to="/" replace />
    }
  return (
    <main>
        <div className="sparkles"></div>
        <div className="form-container">
            <div className="sparkles"></div>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor='email'>Email </label>
                    <input 
                        onChange={(e) => {setEmail(e.target.value)}}
                        type='email' id='email' name='email' placeholder='enter your email address'/>
                </div>
                <div className="input-group">
                    <label htmlFor='password'>Password </label>
                    <input 
                        onChange={(e) => {setPassword(e.target.value)}}
                        type='password' id='password' name='password' placeholder='enter your password'/>
                </div>
                {error && <p style={{ color: "red", marginTop: "10px", fontWeight:"bold" }}>{error}</p>}
                <button className='button primary-button'>Login</button>
            </form>
            <p>Don't have an account? <Link to={"/register"}>Sign In</Link></p>
        </div>
    </main>
  )
}

export default Login;