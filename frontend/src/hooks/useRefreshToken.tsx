import axios from 'axios';
import { useAdmin, useUser,  } from '../context/AuthContext';

const useRefreshToken = () => {
    const {  setAdmin } = useAdmin(); 
    const {  setUser } = useUser();
    
    const refresh = async (type:string) => {
        const response:any = await axios.post('http://localhost:5003/api/refresh-token',
        {
            type
        }
        ,
        {
            withCredentials: true
        });
        
        // Assuming AuthData has a field named accessToken
        if (response?.data?.accessToken) {
            const updatedAuth: any = { ...response.data};
            console.log("Updated Auth: ", updatedAuth);
            type === 'user' ? setUser(updatedAuth) : setAdmin(updatedAuth);
        return response.data.accessToken;
        }
    }
    return refresh;
};

export default useRefreshToken;