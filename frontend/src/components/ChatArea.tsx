import  { useState } from 'react';
type ChatAreaProps = {
    chats: string[],
    sendMessage: (message:string) => void,
    handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void,
    username: string,
    agent:boolean
}

const ChatArea = ({chats,sendMessage, handleKeyPress, username, agent}: ChatAreaProps) => {

  const [message, setMessage] = useState<string>("");

  return (
    <section className="">
        <div>
            
        </div>
        <div className="text-left border-[2px] border-gray-300 w-full h-[600px] rounded-md">
          {
            chats.map((chat, index) => {
              return <p key={index} className={`p-2 ${index%2===0 ? 'bg-gray-100' : 'bg-gray-200'}`}>{chat}</p>
            })
          }
          {username && 
          <p className="p-2  italic">{ `${agent?"Agent":"User"} is Typing`}</p>
        }
        </div>

        <div className="flex w-full mt-4 gap-4 items-center">
            <input type="text" value={message} onKeyDown={handleKeyPress} onChange={(e)=> setMessage(e.target.value)} placeholder="Type here" className="input input-lg input-bordered w-full " />
            <button className="btn btn-outline  px-8 " onClick={()=> { if(message.length>0) sendMessage(message); setMessage("");}}>Send</button>
        </div>
    </section>
  )
}

export default ChatArea