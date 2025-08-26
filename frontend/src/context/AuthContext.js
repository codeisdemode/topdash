import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerk();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clerkLoaded) {
      if (clerkUser) {
        // Clerk user is authenticated
        const userData = {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl
        };
        setUser(userData);
        
        // Sync with backend if needed
        const syncWithBackend = async () => {
          try {
            const response = await authAPI.post('/auth/clerk-sync', userData);
            const { token } = response.data;
            localStorage.setItem('token', token);
            authAPI.defaults.headers.Authorization = `Bearer ${token}`;
          } catch (error) {
            console.error('Failed to sync with backend:', error);
          }
        };
        
        syncWithBackend();
      } else {
        // No Clerk user, check for existing local auth
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          setUser(JSON.parse(userData));
          authAPI.defaults.headers.Authorization = `Bearer ${token}`;
        }
      }
      setLoading(false);
    }
  }, [clerkUser, clerkLoaded]);

  const login = async (email, password) => {
    try {
      const response = await authAPI.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      authAPI.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.post('/auth/register', userData);
      const { token, user: newUser } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      authAPI.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      // Sign out from Clerk first
      await signOut();
    } catch (error) {
      console.error('Clerk sign out error:', error);
    }
    
    // Clear local storage and state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete authAPI.defaults.headers.Authorization;
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};