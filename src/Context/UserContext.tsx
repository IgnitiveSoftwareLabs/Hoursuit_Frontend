import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../Hooks/Reduxhook/hooks';
import { setCurrentUser, clearCurrentUser } from '../Redux/CurrentUserSlice';
import { getUserapiCall } from '../Services/UserApiSerice';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

interface UserContextType {
  refreshUser: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const isAuthenticated = useAppSelector((state) => state.currentUser.isAuthenticated);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasInitialized, setHasInitialized] = React.useState(false);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await getUserapiCall();
      if (response.success) {
        const newUser = response.result;
        
        // Check if permissions have changed (only if user was already set)
        if (currentUser && currentUser.permissions && hasInitialized) {
          const oldPermissionIds = currentUser.permissions.map(p => p.id).sort();
          const newPermissionIds = newUser.permissions.map((p: any) => p.id).sort();
          
          if (JSON.stringify(oldPermissionIds) !== JSON.stringify(newPermissionIds)) {
            toast('Your permissions have been updated by an administrator.');
            
            // Check if user lost critical permissions
            const lostPermissions = currentUser.permissions.filter(
              oldPerm => !newUser.permissions.some((newPerm: any) => newPerm.id === oldPerm.id)
            );
            
            if (lostPermissions.length > 0) {
              toast.error(`Some permissions have been revoked: ${lostPermissions.map(p => p.name).join(', ')}`);
            }
          }
        }
        
        dispatch(setCurrentUser(newUser));
        
        if (!hasInitialized) {
          setHasInitialized(true);
        }
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      
      // Only show error and logout if this is not the initial load
      if (hasInitialized) {
        toast.error('Session expired. Please login again.');
        logout();
      } else {
        // If initial load fails, clear the invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        dispatch(clearCurrentUser());
        
        // Only redirect to login if not already on auth pages
        const isAuthPage = ['/login', '/signup', '/resetpassword'].some(path => 
          location.pathname.startsWith(path)
        );
        if (!isAuthPage && location.pathname !== '/') {
          navigate('/login');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, hasInitialized, dispatch, navigate, location.pathname]);

  const logout = useCallback(() => {
    dispatch(clearCurrentUser());
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setHasInitialized(false);
    navigate('/login');
  }, [dispatch, navigate]);

  // Initial user fetch on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log("Initial effect - token:", !!token, "currentUser:", !!currentUser, "hasInitialized:", hasInitialized);
    
    if (token && !currentUser && !hasInitialized) {
      console.log("Fetching initial user data...");
      refreshUser();
    } else if (!token && !hasInitialized) {
      // No token, mark as initialized to prevent infinite loops
      setHasInitialized(true);
    }
  }, [refreshUser, currentUser, hasInitialized]);

  // Auto-refresh user data every 30 seconds to check for permission changes
  // Only start auto-refresh after initial load is complete
  useEffect(() => {
    if (currentUser && hasInitialized) {
      console.log("Setting up auto-refresh interval");
      const oneHourInMilliseconds = 60 * 60 * 1000;

// This is easier to read and understand
const interval = setInterval(refreshUser, oneHourInMilliseconds);
      return () => {
        console.log("Clearing auto-refresh interval");
        clearInterval(interval);
      };
    }
  }, [currentUser, hasInitialized, refreshUser]);

  return (
    <UserContext.Provider value={{ refreshUser, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};