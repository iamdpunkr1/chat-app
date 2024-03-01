import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { io } from 'socket.io-client';

function App() {
  const socket = useMemo( ()=> io('http://localhost:5000',{
    withCredentials: true,
}),[]);

  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<string[]>([]);
  const [socketID, setSocketID] = useState<string>('');
  const [recieverID, setRecieverID] = useState<string>('');

  //Message to all
  const handleClick = () => {
    socket.emit('message', socketID+": "+message);
    setMessage('');
  }

  //Message to all except sender
  const handleBroadcast = () => {
    socket.emit('broadcast-message',  socketID+": "+message);
    setMessage('');
  }

  //Message to specific user
  const handlePrivate = () => {
    socket.emit('private-message', {recieverID, message: socketID+": "+message});
    setMessage('');
    setRecieverID('');
  }


  useEffect(()=>{
    socket.on("connect", ()=>{
      console.log("Connected to server with id: ", socket.id) 
       setSocketID(socket?.id?.substring(0,5) as string)
    })

    socket.on("recieve-message", (message: string) => {

      setMessages((prevMessages) => [...prevMessages, message])
    })

    return () => {
      socket.disconnect()
    }
  },[])
  return (
    <>

      <h1>Chat App : {socketID}</h1>
      <div className="card">
        <input
          type="text"
          placeholder='Type a message...'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ height: 40, marginRight: 10, width: "100%"}}
        />
        
      </div>
      <button style={{marginRight:10}} onClick={handleClick}>
          Send to all
        </button>
      <button onClick={handleBroadcast}>
          Send to all except sender
        </button>

      <div className="card">
        <input
          type="text"
          placeholder='Reciever ID'
          value={recieverID}
          onChange={(e) => setRecieverID(e.target.value)}
          style={{ height: 40, marginRight: 10}}
        />
        <button onClick={handlePrivate}>
          Send Private
        </button>
      </div>

      {
        messages.map((message, index) => (
          <p className="read-the-docs" key={index}>
            {message}
          </p>
        ))
      }
      
    </>
  )
}

export default App
