import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import useRefreshToken from "../hooks/useRefreshToken";
import { useAdmin } from "../context/AuthContext";

const PersistLogin = () => {
    const [isLoading, setIsLoading] = useState(true);
    const refresh = useRefreshToken();
    const { admin } = useAdmin();
    console.log(`admin:`, admin)
    useEffect(() => {
        let isMounted = true;

        const verifyRefreshToken = async () => {
            try {
                await refresh();
            }
            catch (err) {
                console.error(err);
            }
            finally {
                isMounted && setIsLoading(false);
            }
        }

        // persist added here AFTER tutorial video
        // Avoids unwanted call to verifyRefreshToken
        
        !admin?.accessToken  ? verifyRefreshToken() : setIsLoading(false);

        return () => {isMounted = false;}
    }, [])

    useEffect(() => {
        console.log(`isLoading: ${isLoading}`)
        console.log(`accessToken: ${JSON.stringify(admin?.accessToken)}`)
    }, [isLoading])

    return (
        <>
            { isLoading
                    ? <div className="flex justify-center items-center w-full">
                        <p className="text-2xl">Loading...</p>
                    </div>
                    : <Outlet />
            }
        </>
    )
}

export default PersistLogin