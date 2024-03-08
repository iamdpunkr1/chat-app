import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { io } from 'socket.io-client';
import User from './pages/User';
import Admin from './pages/Admin';
import { BsChatRightText } from "react-icons/bs";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  // const socket = useMemo(() => io('http://localhost:5000', {
  //   withCredentials: true,
  // }), []);


  useEffect(() => {
    // socket.on("connect", () => {
    //   console.log("Connected to server with id: ", socket.id)
    //   // setSocketID(socket?.id?.substring(0, 5) as string)
    // })

    // socket.on("recieve-message", (message: string) => {
    //   // setMessages((prevMessages) => [...prevMessages, message])
    // })

    // return () => {
    //   socket.disconnect()
    // }
  }, [])

  return (
    <main className='max-w-[1000px] mx-auto px-2'>
      <div className='flex items-center justify-center gap-4 mb-4'>
        <BsChatRightText size={30}/>
        <h1 className='text-3xl text-center font-semibold my-4'>Realtime Chat App</h1>
      </div>

      <Router>
        <Routes>
          <Route path="/" element={<User/>}/>
          <Route path="/admin" element={<Admin/>}/>
        </Routes>
      </Router>

      
    </main>
  )
}

export default App
