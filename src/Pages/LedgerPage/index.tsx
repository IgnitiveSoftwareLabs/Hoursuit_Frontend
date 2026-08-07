import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Paper,
} from '@mui/material';
import {
  AccountBalance,
  Person,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../Hooks/usePermissions';

const LedgerPage: React.FC = () => {
  const navigate = useNavigate();
  const { canRead } = usePermissions();

  // Check read permission for ledger
  if (!canRead('ledger')) {
    return (
      <Layout>
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
          <Typography variant="h4" sx={{ textAlign: 'center', mt: 4, color: 'error.main' }}>
            Access Denied: Insufficient permissions to view ledger
          </Typography>
        </Box>
      </Layout>
    );
  }

  const ledgerOptions = [
    {
      title: 'Customer Ledger',
      description: 'View detailed transaction history for a specific customer',
      icon: <Person sx={{ fontSize: 48, color: 'primary.main' }} />,
      path: '/ledger/customer',
      color: 'primary',
      disabled: false,
    },
    {
      title: 'Customer Balance Summary',
      description: 'Overview of all customer balances and outstanding amounts',
      icon: <AccountBalance sx={{ fontSize: 48, color: 'success.main' }} />,
      path: '/ledger/customer-summary',
      color: 'success',
      disabled: false,
    },
  ];

  return (
    <Layout>
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
        <Typography variant="h3" gutterBottom>
          Ledger Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage customer accounts, track transactions, and generate financial reports.
        </Typography>

        <Grid container spacing={3}>
          {ledgerOptions.map((option, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 6 }} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  opacity: option.disabled ? 0.6 : 1,
                  '&:hover': {
                    transform: option.disabled ? 'none' : 'translateY(-4px)',
                    boxShadow: option.disabled ? 'none' : '0 8px 25px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    {option.icon}
                  </Box>
                  
                  <Typography variant="h5" component="h2" gutterBottom>
                    {option.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    {option.description}
                  </Typography>
                  
                  {option.disabled && (
                    <Paper 
                      sx={{ 
                        mt: 2, 
                        p: 1, 
                        bgcolor: 'grey.100',
                        display: 'inline-block'
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Coming Soon
                      </Typography>
                    </Paper>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button
                    variant="contained"
                    color={option.color as any}
                    onClick={() => {
                      if (!canRead('ledger')) {
                        return;
                      }
                      navigate(option.path);
                    }}
                    disabled={option.disabled || !canRead('ledger')}
                    sx={{ minWidth: 120 }}
                  >
                    {option.disabled ? 'Coming Soon' : !canRead('ledger') ? 'No Access' : 'Open'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Stats */}
        
      </Box>
    </Layout>
  );
};

export default LedgerPage;
