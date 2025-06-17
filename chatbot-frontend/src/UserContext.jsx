import { createContext, useEffect, useState } from "react";
import { jwtDecode } from 'jwt-decode';
// Create the UserContext
export const UserContext = createContext();

// Create the UserContextProvider component
export const UserContextProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token')); 
    const decodedToken = token ? jwtDecode(token) : "";
    console.log("Decoded Token:", decodedToken);

    const isLoggedIn = () => {
        if (token) {
            try {
                const currentTime = Date.now() / 1000; // Convert to seconds
                if (decodedToken.exp < currentTime) {
                    console.log('Token expired');
                    return false;
                }
                return true;
            } catch (error) {
                console.log(error);
                return false;
            }
        } else {
            console.log('Login first');
            return false;
        }
    };

    // Effect to synchronize local storage with token state
    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token'); // Remove token if null
        }
    }, [token]);

    

  return (
    <UserContext.Provider value={{ setToken, isLoggedIn, token, decodedToken }}>
      {children}
    </UserContext.Provider>
  );
};