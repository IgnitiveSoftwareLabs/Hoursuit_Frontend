// filepath: /home/ayush/Documents/ignitive work/WMS/Github For WMS/WMS/WMS/src/Common/PrivateRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../Hooks/Reduxhook/hooks';
import { useUser } from '../Context/UserContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isLoading } = useUser();
  const isAuthenticated = useAppSelector((state) => state.currentUser.isAuthenticated);
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const token = localStorage.getItem('token');
  console.log("all",isLoading,currentUser,token)
  // Show loading spinner while checking authentication
  if (isLoading || (token && !currentUser)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading user data...
        </Typography>
      </Box>
    );
  }

  // If no token or not authenticated, redirect to login
  if (!token || !isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;