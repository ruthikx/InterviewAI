import { useAuth } from "../hooks/useAuth";
import React from 'react';
import { Navigate } from "react-router";
import Lottie from "react-lottie-player"

const Protected = ({children}) => {
    const {loading,user} = useAuth()
    if(loading){
        return (
        <main className='loading-screen' style={{width: 320,height: 320}}>
                <Lottie
                    loop
                    play
                    path="/animation/ai.json"
                    className='loading-animation'
                />
        </main>
        
    )
    }

    if(!user){
        return <Navigate to={'/login'}/>
    }

  return children
}

export default Protected