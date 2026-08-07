import type { Components } from '@mui/material/styles';

export const tablesCustomizations: Components = {
  MuiTable: {
    styleOverrides: {
      root: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0px 10px',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        backgroundColor: '#fff', // or your theme background
        overflow: 'hidden',
        fontFamily: 'Quicksand, sans-serif',
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: '20px',
  letterSpacing: '0',
        '&:first-of-type': {
          borderTopLeftRadius: '14px',
          borderBottomLeftRadius: '14px',
        },
        '&:last-of-type': {
          borderTopRightRadius: '14px',
          borderBottomRightRadius: '14px',
        },
      },
      head: {
        backgroundColor: '#fff',
        color: '#6B7280',
        overflow: 'hidden',

        '&:first-of-type': {
          borderTopLeftRadius: '14px',
          borderBottomLeftRadius: '14px',
        },
        '&:last-of-type': {
          borderTopRightRadius: '14px',
          borderBottomRightRadius: '14px',
        },
      },
    },
  },
};
