export type messageTypes ={
    roomId?: string,
    type: string,
    message: string,
    sender: string,
    time?:string
}

export type UserType = {
    emailId: string,
    username: string
  }

 export type UserLoginProps = {
    setAuth: (auth: {emailId:string, username:string}) => void
}

export type UserChatBoxProps = {
    auth: UserType;
    setAuth: React.Dispatch<React.SetStateAction<UserType | null>>;
   
  }