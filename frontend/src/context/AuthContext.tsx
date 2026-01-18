import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
}

interface Profile {
  user_id: string;
  profession?: string;
  income_range?: string;
  gender?: string;
  nationality?: string;
  age?: number;
  preferred_areas: string[];
  lifestyle_tags: Record<string, any>;
  bio?: string;
  profile_complete: boolean;
}

interface Subscription {
  subscription_id: string;
  plan_id: string;
  plan_type: string;
  status: string;
  end_date: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSubscription: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  updateRole: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const getStoredToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('session_token');
  }
  return await SecureStore.getItemAsync('session_token');
};

const storeToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem('session_token', token);
  } else {
    await SecureStore.setItemAsync('session_token', token);
  }
};

const removeToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('session_token');
  } else {
    await SecureStore.deleteItemAsync('session_token');
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
  });

  api.interceptors.request.use(async (config) => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const fetchUserData = async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setProfile(response.data.profile);
      setSubscription(response.data.has_subscription ? response.data.subscription : null);
    } catch (error) {
      console.log('Not authenticated or error fetching user');
      await removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for session_id in URL on web
    if (Platform.OS === 'web') {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace('#', ''));
      const sessionId = params.get('session_id');
      
      if (sessionId) {
        processSessionId(sessionId);
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }
    }
    
    fetchUserData();
  }, []);

  const processSessionId = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/session`,
        {},
        { headers: { 'X-Session-ID': sessionId } }
      );

      const { user: userData, profile: profileData, session_token } = response.data;
      await storeToken(session_token);
      setUser(userData);
      setProfile(profileData);
    } catch (error) {
      console.error('Error processing session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    const redirectUrl = Platform.OS === 'web'
      ? `${BACKEND_URL}/`
      : Linking.createURL('/');

    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

    if (Platform.OS === 'web') {
      window.location.href = authUrl;
    } else {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const sessionId = url.hash.split('session_id=')[1] || url.searchParams.get('session_id');
        
        if (sessionId) {
          await processSessionId(sessionId);
        }
      }
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await removeToken();
      setUser(null);
      setProfile(null);
      setSubscription(null);
    }
  };

  const refreshUser = async () => {
    await fetchUserData();
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      const response = await api.put('/profile', data);
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const updateRole = async (role: string) => {
    try {
      await api.put('/user/role', { role });
      if (user) {
        setUser({ ...user, role });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        subscription,
        isLoading,
        isAuthenticated: !!user,
        hasSubscription: !!subscription,
        login,
        logout,
        refreshUser,
        updateProfile,
        updateRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
