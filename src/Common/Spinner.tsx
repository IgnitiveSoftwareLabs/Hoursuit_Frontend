// Spinner.tsx
import React from 'react';
import { CircularProgress, Box } from '@mui/material';

export interface SpinnerProps {
  size?: number;
  color?: 'primary' | 'secondary' | 'inherit' | 'success' | 'error' | 'info' | 'warning';
  thickness?: number;
  centered?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 40,
  color = 'primary',
  thickness = 4,
  centered = false,
}) => {
  const spinner = (
    <CircularProgress size={size} color={color} thickness={thickness} />
  );

  return centered ? (
    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
      {spinner}
    </Box>
  ) : (
    spinner
  );
};

export default Spinner;
