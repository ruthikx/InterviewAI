import { useContext,useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login,register,logout,getMe } from "../services/auth.api";

export const useAuth = () =>{
    const context = useContext(AuthContext)
    const {user, setUser, loading, setLoading} = context

    const handleLogin = async ({email,password}) =>{
        setLoading(true)
        try{
            const data = await login({email, password})
            setUser(data.user);
            return {success: true};
        }catch(e){
            return{
                success: false,
                message: e.message || e.error || "Invalid email or password",
            };  
        }finally{
            setLoading(false)
        }
    }

    const handleRegister = async ({username,email,password}) =>{
        setLoading(true)
        try{
            const data = await register({username,email,password})
            setUser(data.user)
        }catch(e){

        }finally{
            setLoading(false)
        }
        
    }

    const handleLogout = async ({username,email,password}) =>{
        setLoading(true)
        try{
            const data = await logout()
            setUser(null)
        }catch(e){

        }finally{
            setLoading(false)
        }
        
    }
    useEffect(()=>{
        const getAndSetUser = async() =>{
            try{
                const data = await getMe()
                setUser(data.user)
            }catch(e){

            }finally{
                setLoading(false)
            }
            
        }
        getAndSetUser()
    },[])

    return {user,loading,handleRegister,handleLogin,handleLogout};
}