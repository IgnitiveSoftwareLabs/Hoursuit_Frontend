import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { Warning, Delete, Info, Help } from '@mui/icons-material';

interface ConfirmationDialogProps {
  open: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'delete' | 'warning' | 'info' | 'default';
  loading?: boolean;
  disabled?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onCancel,
  onConfirm,

  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  disabled = false,
  maxWidth = 'sm',
  showIcon = true,
}) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'delete':
        return {
          icon: <Delete color="error" />,
          title: title || 'Confirm Delete',
          confirmColor: 'error' as const,
          confirmText: confirmText || 'Delete',
        };
      case 'warning':
        return {
          icon: <Warning color="warning" />,
          title: title || 'Warning',
          confirmColor: 'warning' as const,
          confirmText: confirmText || 'Proceed',
        };
      case 'info':
        return {
          icon: <Info color="info" />,
          title: title || 'Information',
          confirmColor: 'info' as const,
          confirmText: confirmText || 'OK',
        };
      default:
        return {
          icon: <Help color="primary" />,
          title: title || 'Confirm Action',
          confirmColor: 'primary' as const,
          confirmText: confirmText || 'Confirm',
        };
    }
  };

  const config = getVariantConfig();

  const handleConfirm = () => {
    if (!disabled && !loading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!loading) {
      if (onCancel) onCancel();
      else if (onClose) onClose();
    }
  };


  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {showIcon && config.icon}
          <Typography variant="h6">{config.title}</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText>
          {message}
        </DialogContentText>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          color="inherit"
          variant="outlined"
          sx={{ textTransform: 'none' }}
          disabled={loading}
        >
          {cancelText}
        </Button>
        
        <Button
          onClick={handleConfirm}
          color={config.confirmColor}
          variant="contained"
          sx={{ textTransform: 'none' }}
          disabled={disabled || loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {loading ? 'Processing...' : config.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;