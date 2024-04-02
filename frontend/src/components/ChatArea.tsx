import React, { useRef, useEffect, useState } from 'react';
import { fileSize, fileTypes } from '../config';
import { messageTypes } from '../types';

type ChatAreaProps = {
  message: string;
  setMessage: (message: string) => void;
  chats: messageTypes[];
  sendMessage: (message: string) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  username: string;
  handleSendFileUser?: (file: File) => void;
  name:string
};

type ChatMessageProps = {
  sender:string,
  message: string,
  time:string,
  isUser?: boolean;
};


const ChatMessage = ({ sender, message, time, isUser, type }: ChatMessageProps & { type: string }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };
  return (
    <div
      className={`relative flex flex-col px-4 py-2 text-gray-700 rounded-lg my-4 mx-2 ${
        isUser ? 'bg-green-100 self-end' : 'bg-gray-100 self-start'
      }`}
    >
      <p className="font-bold text-gray-500 text-xs self-start pb-1 ">{isUser ? 'You' : sender}</p>
      {type === 'text' ? (
        <p className=" self-start pt-1 text-gray-700 text-base">{message}</p>
      ) : type === 'image' ? (
        <img
          src={message}
          alt="Sent Image"
          className={` rounded-lg self-start cursor-pointer ${isZoomed ? 'max-w-[400px] max-h-[400px]' : 'max-w-[200px] max-h-[200px]'}`}
          onClick={handleImageClick}
        />
      ) : type === 'video' ? (
        <video src={message} controls className="max-w-[200px] max-h-[200px] rounded-lg self-start" />
      ) : type === 'audio' ? (
        <audio src={message} controls className="self-start" />
      ) : (
        <a href={message} target="_blank" rel="noopener noreferrer" className="self-start pt-1 text-blue-500 underline">
          {message.split('/').pop()}
        </a>
      )}
      <p className="text-xs self-end text-gray-400 pt-2">{time}</p>
    </div>
  );
};

const ChatArea = ({
  message,
  setMessage,
  chats,
  sendMessage,
  handleKeyPress,
  username,
  handleSendFileUser,
  name
}: ChatAreaProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  // const [fileName, setFileName] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleClick = () => {
   
    if (fileRef.current) {
      fileRef.current.click();
     
    }
  }

  const handleFilePreview = (file: File) => {
    if (file.type.includes('image/') || file.type.includes('video/') || file.type.includes('audio/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(file.name);
    }
  };

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if(file){
        console.log("file", file);
        if(file.size > fileSize){
          alert("File size should be less than 5MB");
          return;
        }
        handleFilePreview(file);
        setFile(file);
        // setFileName(file?.name);
        setShowModal(true);
        console.log(showModal)
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleCancel = () => {  
    setFile(null);
    // setFileName(null);
    setFilePreview(null);
    setShowModal(false);
  };

  const handleSendFile = () => {
    if (file) {
      handleSendFileUser?.(file);
      setShowModal(false);
      setFile(null);
      // setFileName(null);
      setFilePreview(null);
    }
  };
  

  useEffect(() => {
    // Scroll to the end of the chat area when chats change
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  return (
    <section className="relative">
      <div className="overflow-y-auto  flex flex-col border-[2px] border-gray-300 w-full h-[600px] rounded-md pt-4">
        {chats &&
          chats.map((chat, index) => {
            // console.log(chat.sender, name, chat.sender === name)
            switch(chat.type){
              case "notify":
                return <p key={index} className="px-4 py-2 text-gray-500 text-sm rounded-lg m-2 bg-gray-100 self-center text-center">{chat.message}</p>;
              case "start":
                return null
              default:
                return <ChatMessage
                key={index}
                message={chat.message}
                time={chat.time as string}
                sender={chat.sender}
                isUser={chat.sender === name}
                type={chat.type}
              />
            }
            
          })}

        {/* Dummy element to keep the chat scrolled to the bottom */}
        <div ref={chatEndRef} className="aboslute bottom-2" style={{ height: '40px', minHeight: '40px' }}>
          {username && (
            <p className="text-left text-gray-500 italic pl-4 pt-2" style={{ height: '30px', minHeight: '30px' }}>
              {`${username} is Typing`}
            </p>
          )}
        </div>
      </div>

      <div className="flex w-full mt-4 gap-2 items-center">
        <div className='flex items-center w-full relative'>
        <input
          type="text"
          value={message}
          onKeyDown={handleKeyPress}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type here"
          className=" input-lg border-y-2 border-gray-200 focus:outline-y-2 outline-gray-300 w-full "
        />

        <div className='flex gap-x-2 absolute right-3'>
        <button onClick={handleClick} className=' border border-gray-500 p-3 rounded-full'>
        <svg
         
          xmlSpace="preserve"
          width={20}
          height={20}
          viewBox="0 0 511.999 511.999"
          
        >
          <path d="M466.904 68.854c-60.129-60.127-157.962-60.127-218.091 0l-213.44 213.44c-47.166 47.167-47.161 123.497 0 170.659 47.053 47.051 123.609 47.049 170.659 0l213.441-213.442c33.973-33.973 33.973-89.254 0-123.228-33.974-33.974-89.254-33.974-123.228 0L114.204 298.327c-7.833 7.833-7.833 20.532 0 28.365 7.833 7.833 20.531 7.833 28.365 0L324.61 144.65c18.333-18.336 48.164-18.334 66.497 0s18.333 48.165 0 66.498l-213.44 213.441c-31.412 31.41-82.519 31.41-113.93 0-31.487-31.487-31.484-82.445 0-113.929L277.179 97.219c44.595-44.596 116.77-44.59 161.36 0 44.596 44.595 44.59 116.77 0 161.36l-94.863 94.863c-7.833 7.833-7.833 20.532 0 28.365 7.834 7.833 20.531 7.833 28.365 0l94.863-94.863c60.127-60.127 60.127-157.963 0-218.09z" />
        </svg>
        </button>

        <button
          className="btn btn-outline px-4"
           onClick={() => {
            if (message.length > 0) sendMessage(message);
            setMessage('');
          }}
        >
          Send
        </button>
        </div>
        </div>
      </div>
      {/* <button className="btn" onClick={()=>document?.getElementById('my_modal_5')?.showModal()}>open modal</button> */}
    {/* Modal */
      showModal && (
        <div className="z-10 fixed inset-0 overflow-y-auto flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-lg p-6">
        {filePreview && (
        <div className="flex justify-center items-center w-full h-full">
        {filePreview.startsWith('data:image/') || filePreview.startsWith('data:video/') || filePreview.startsWith('data:audio/') ? (
          <>
            {filePreview.startsWith('data:image/') && <img src={filePreview} alt="File Preview" className="max-w-[400px] h-auto" />}
            {filePreview.startsWith('data:video/') && <video src={filePreview}  className="max-w-[400px] h-auto" controls />}
            {filePreview.startsWith('data:audio/') && <audio src={filePreview}  controls />}
          </>
        ) : (
          <p className="text-gray-700 truncate p-4">{filePreview}</p>
        )}
      </div>
      )}
          <div className="modal-action">
            <button className="btn" onClick={handleSendFile} >Send</button>
            <button className="btn" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      </div>
      )
    }
      
      <input type='file' id='file' ref={fileRef} onChange={handleChange} accept={fileTypes} style={{display:'none'}}/>
    </section>
  );
};

export default ChatArea;