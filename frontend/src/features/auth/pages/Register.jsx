import React,{useState} from 'react'
import "../auth.form.scss"
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'

const Register = () => {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()

    const {loading,handleRegister} = useAuth()

    const handleSubmit = async (e) => {
            e.preventDefault()
            await handleRegister({username,email,password})
            navigate("/")
    }
  return (
    <main>
        <div className="sparkles"></div>
        <div className="form-container">
            <div className="sparkles"></div>
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor='email'>Username </label>
                    <input
                        onChange={(e)=>{setUsername(e.target.value)}}
                        type='username' id='username' name='username' placeholder='enter your username'/>
                </div>
                <div className="input-group">
                    <label htmlFor='email'>Email </label>
                    <input
                        onChange={(e)=>{setEmail(e.target.value)}}
                        type='email' id='email' name='email' placeholder='enter your email address'/>
                </div>
                <div className="input-group">
                    <label htmlFor='password'>Password </label>
                    <input
                        onChange={(e)=>{setPassword(e.target.value)}}
                        type='password' id='password' name='password' placeholder='enter your password'/>
                </div>
                <button className='button primary-button'>Sign In</button>
            </form>

            <p>Already have an account? <Link to={"/login"}>Login</Link></p>
        </div>
    </main>
  )
}

export default Register