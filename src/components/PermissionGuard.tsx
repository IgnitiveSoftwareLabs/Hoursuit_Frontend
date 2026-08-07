import React from 'react';
import { Box, Typography } from '@mui/material';
import { Lock } from '@mui/icons-material';
import { usePermissions, PermissionParam } from '../Hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: PermissionParam;
  module?: string;
  action?: string;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  module,
  action,
  fallback,
  showFallback = true,
}) => {
  const { hasPermission } = usePermissions();

  const checkTarget: PermissionParam =
    permission || (module && action ? { module, action } : "");

  const hasAccess = checkTarget ? hasPermission(checkTarget) : true;

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    const label = typeof checkTarget === "string" ? checkTarget : `${module}.${action}`;

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Lock sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You don't have permission: {label}
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default PermissionGuard;