import React, { ReactNode, createContext, useContext, useState } from "react";

// Define the type for the authentication context
interface AuthContextType {
  auth: boolean;
  setAuth: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create the context
const UserAuthContext = createContext<AuthContextType | undefined>({} as AuthContextType);

// Create the provider component
export  const UserAuthProvider = ({ children }:{children: ReactNode}) => {
  const [auth, setAuth] = useState(false);

  return (
    <UserAuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </UserAuthContext.Provider>
  );
};

// Custom hook to consume the authentication context
export const useAuth = (): AuthContextType => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


