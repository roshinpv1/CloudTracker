import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { initializeAuth } from '../data/api';

// Define the context shape
interface AuthContextType {
  user: User | null;
  role: string | null;
  isAuthenticated: boolean;
  setAuthState: (user: User | null, token: string | null) => void;
  logout: () => void;
}

// Create a context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAuthenticated: false,
  setAuthState: () => {},
  logout: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Initialize auth from local storage on app startup
  useEffect(() => {
    const validateAndSetAuth = () => {
      try {
        initializeAuth();
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedRole = localStorage.getItem('role');
        
        if (!storedToken || !storedUser || !storedRole) {
          console.log('Missing authentication data');
          logout();
          return;
        }
        
        // Validate the token by checking its expiration
        try {
          const tokenData = JSON.parse(atob(storedToken.split('.')[1]));
          const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
          
          if (Date.now() >= expirationTime) {
            // Token expired, clear everything
            console.log('Token expired, logging out');
            logout();
            return;
          }
          
          // Valid token
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setRole(storedRole);
          setIsAuthenticated(true);
          console.log('Successfully authenticated as:', parsedUser.username, 'with role:', storedRole);
        } catch (tokenErr) {
          console.error('Error validating token:', tokenErr);
          logout();
        }
      } catch (err) {
        console.error('Error during auth initialization:', err);
        logout();
      }
    };
    
    validateAndSetAuth();
    
    // Add event listener for auth errors from API calls
    const handleAuthError = () => {
      console.log('Auth error event received, logging out');
      logout();
    };
    
    window.addEventListener('auth-error', handleAuthError);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  // Function to set authentication state
  const setAuthState = (user: User | null, token: string | null) => {
    if (user && token) {
      // Extract role from JWT token
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const role = tokenPayload.role || 'user';
        
        // Store user and auth info
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        
        setUser(user);
        setRole(role);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error parsing token:', err);
        logout();
      }
    } else {
      logout();
    }
  };

  // Function to handle logout
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  // Provide the context values
  const value = {
    user,
    role,
    isAuthenticated,
    setAuthState,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for role-based authorization
export const useAuthorization = (requiredRoles: string[]) => {
  const { role, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return false;
  }
  
  if (!role) {
    return false;
  }
  
  return requiredRoles.includes(role);
}; 