import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions, PermissionParam } from '../Hooks/usePermissions';
import { useUser } from '../Context/UserContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: PermissionParam;
  module?: string;
  action?: string;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  module,
  action,
  redirectTo = '/unauthorized',
}) => {
  const { hasPermission } = usePermissions();
  const { isLoading } = useUser();

  // Show loading while permissions are being checked
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          gap: 2,
        }}
      >
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          Checking permissions...
        </Typography>
      </Box>
    );
  }

  const checkTarget: PermissionParam =
    permission || (module && action ? { module, action } : "");

  if (checkTarget && !hasPermission(checkTarget)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;