import * as React from 'react';
import { useColorScheme } from '@mui/material/styles';

export default function ColorModeSelect() {
  const { setMode } = useColorScheme();

  // Ensure the mode is always set to "light"
  React.useEffect(() => {
    setMode('light');
  }, [setMode]);

  return null; // No UI needed since we are enforcing light mode
}