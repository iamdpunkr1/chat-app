import React, { useRef, useEffect } from 'react';

type ChatAreaProps = {
    message: string,
    setMessage: (message: string) => void,
    chats: string[],
    sendMessage: (message: string) => void,
    handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void,
    username: string,
    agent: boolean
}

const ChatArea = ({ message, setMessage, chats, sendMessage, handleKeyPress, username, agent }: ChatAreaProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the end of the chat area when chats change
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    console.log("Chat Area: ", chats)
  }, [chats]);

  return (
    <section className="">
      <div></div>
      <div className="overflow-y-auto flex flex-col border-[2px] border-gray-300 w-full h-[600px] rounded-md">
        {
          chats.map((chat, index) => {
            if (chat.includes("has joined the chat") || chat.includes("has left the chat")) {
              return <p key={index} className="p-4 text-gray-500 rounded-lg m-2 bg-gray-100 self-center text-center">{chat}</p>
            } else if (chat.includes("You")) {
              return <p key={index} className="p-4 text-gray-700 rounded-lg m-2 bg-green-100 self-end">{chat}</p>
            } else {
              return <p key={index} className="p-4 text-gray-700 rounded-lg m-2 bg-gray-100 self-start">{chat}</p>
            }
          })
        }
        
        {/* Dummy element to keep the chat scrolled to the bottom */}
        <div ref={chatEndRef}></div>
      </div>
      {username &&
          <p className="p-2 font-semibold text-left  italic">{`${username} is Typing`}</p>
        }
      <div className="flex w-full mt-4 gap-4 items-center">
        <input type="text" value={message} onKeyDown={handleKeyPress} onChange={(e) => setMessage(e.target.value)} placeholder="Type here" className="input input-lg input-bordered w-full " />
        <button className="btn btn-outline  px-8 " onClick={() => { if (message.length > 0) sendMessage(message); setMessage(""); }}>Send</button>
      </div>
    </section>
  )
}

export default ChatArea;
