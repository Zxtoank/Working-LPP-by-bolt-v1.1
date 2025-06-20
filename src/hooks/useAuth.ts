import { useState, useEffect } from 'react';

interface User {
  email: string;
  isPremium: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('locket-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock authentication - in real app, this would call your auth service
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const newUser: User = {
      email,
      isPremium: false, // Would be determined by your backend
    };

    setUser(newUser);
    localStorage.setItem('locket-user', JSON.stringify(newUser));
  };

  const signup = async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const newUser: User = {
      email,
      isPremium: false,
    };

    setUser(newUser);
    localStorage.setItem('locket-user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('locket-user');
  };

  return {
    user,
    login,
    signup,
    logout,
  };
};