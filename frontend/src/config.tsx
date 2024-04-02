import { BsChatRightText } from "react-icons/bs";
import { MdOutlineChat } from "react-icons/md";

export const logo = () =>  <BsChatRightText size={30}/>
export const chatIcon = (size:number) => <MdOutlineChat size={size}/>
export const chatTitle = 'AlegraLabs';
export const title = 'Realtime Chat App'
export const fileTypes ="image/jpeg, image/png, image/jpg, image/gif, .pdf, .docx, .ppt, .mp3, .mp4, .mov "
export const fileSize =  20 * 1024 * 1024; // 20MB
export const send_Transcript = false; 