import axios from 'axios';
import { useAdmin } from '../context/AuthContext';

const useRefreshToken = () => {
    const {  setAdmin } = useAdmin();

    const refresh = async () => {
        const response:any = await axios.get('http://localhost:5003/api/refresh-token', {
            withCredentials: true
        });
        
        // Assuming AuthData has a field named accessToken
        if (response?.data?.accessToken) {
            const updatedAuth: any = { ...response.data};
            console.log("Updated Auth: ", updatedAuth);
            setAdmin(updatedAuth);
        return response.data.accessToken;
        }
    }
    return refresh;
};

export default useRefreshToken;