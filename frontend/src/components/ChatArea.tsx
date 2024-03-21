import React, { useRef, useEffect } from 'react';

type ChatAreaProps = {
  message: string;
  setMessage: (message: string) => void;
  chats: string[];
  sendMessage: (message: string) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  username: string;
};

type ChatMessageProps = {
  message: string;
  isUser?: boolean;
};
const ChatMessage = ({ message, isUser }:ChatMessageProps) => {
  const [username, chatText] = message.split(':');

  return (
    <p
      className={`p-4 text-gray-700 rounded-lg m-2 ${
        isUser
          ? 'bg-green-100 self-end'
          : 'bg-gray-100 self-start'
      }`}
    >

          <span className="font-semibold">{username}</span>:{chatText}

    </p>
  );
};

const ChatArea = ({
  message,
  setMessage,
  chats,
  sendMessage,
  handleKeyPress,
  username,
}: ChatAreaProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the end of the chat area when chats change
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  return (
    <section className="relative">
      <div className="overflow-y-auto flex flex-col border-[2px] border-gray-300 w-full h-[600px] rounded-md">
        {chats &&
          chats.map((chat, index) => {
            if (chat.includes('joined the chat') || chat.includes('left the chat')) {
              return <p key={index} className="p-4 text-gray-500 rounded-lg m-2 bg-gray-100 self-center text-center">{chat}</p>;
            } else if (chat.includes('You')) {
              return <ChatMessage key={index} message={chat} isUser />;
            } else {
              return <ChatMessage key={index} message={chat} />;
            }
          })}

        {/* Dummy element to keep the chat scrolled to the bottom */}
        <div ref={chatEndRef} className="aboslute bottom-2" style={{ height: '40px', minHeight: '40px' }}>
          {username && (
            <p className="text-left text-gray-500 italic pl-4" style={{ height: '30px', minHeight: '30px' }}>
              {`${username} is Typing`}
            </p>
          )}
        </div>
      </div>

      <div className="flex w-full mt-4 gap-4 items-center">
        <input
          type="text"
          value={message}
          onKeyDown={handleKeyPress}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type here"
          className="input input-lg input-bordered w-full "
        />
        <button
          className="btn btn-outline px-8"
          onClick={() => {
            if (message.length > 0) sendMessage(message);
            setMessage('');
          }}
        >
          Send
        </button>
      </div>
    </section>
  );
};

export default ChatArea;