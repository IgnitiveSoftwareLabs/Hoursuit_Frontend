import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search, Visibility, Refresh, FileDownload } from '@mui/icons-material';
import Layout from '../../components/Layout';
import DynamicTable from '../../components/Tables';
import { useAppDispatch, useAppSelector } from '../../Hooks/Reduxhook/hooks';
import {
  setLoading,
  setError,
  setCustomerBalances,
  setPagination,
  clearError,
} from '../../Redux/LedgerSlice';
import { getAllCustomersSummaryApi } from '../../Services/Admin/LedgerApiService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../Hooks/usePermissions';

const CustomerBalanceSummary: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { canRead } = usePermissions();

  // Check read permission for ledger
  if (!canRead('ledger')) {
    return (
      <Layout>
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
          <Typography variant="h4" sx={{ textAlign: 'center', mt: 4, color: 'error.main' }}>
            Access Denied: Insufficient permissions to view customer balance summary
          </Typography>
        </Box>
      </Layout>
    );
  }

  const { customerBalances, isLoading, error, pagination } = useAppSelector((state) => state.ledger);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch customer balances
  const fetchCustomerBalances = async (page: number = 1, search: string = '') => {
    if (!canRead('ledger')) {
      toast.error('Access denied: Insufficient permissions to fetch customer balances');
      return;
    }

    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const params = {
        page,
        limit: 10,
        search: search.trim(),
      };

      const response = await getAllCustomersSummaryApi(params);

      if (response.success) {
        dispatch(setCustomerBalances(response.result));
        dispatch(setPagination(response.pagination));
      } else {
        throw new Error(response.message || 'Failed to fetch customer balances');
      }
    } catch (error: any) {
      console.error('Error fetching customer balances:', error);
      dispatch(setError(error.message || 'Failed to fetch customer balances'));
      toast.error(error.message || 'Failed to fetch customer balances');
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Initial load
  useEffect(() => {
    fetchCustomerBalances();
  }, []);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchCustomerBalances(1, searchTerm);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchCustomerBalances(currentPage, searchTerm);
  };

  // Navigate to customer ledger
  const handleViewLedger = (customer: any) => {
    if (!canRead('ledger')) {
      toast.error('Access denied: Insufficient permissions to view customer ledger');
      return;
    }

    navigate('/ledger/customer', {
      state: { selectedCustomer: customer },
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Table columns
  const columns = [
    { key: 'name', label: 'Customer Name' },
    { key: 'contact', label: 'Contact' },
    { key: 'email', label: 'Email' },
    {
      key: 'current_balance',
      label: 'Current Balance',
      render: (row: any) => (
        <Chip
          label={formatCurrency(row.current_balance)}
          color={row.current_balance >= 0 ? 'success' : 'error'}
          variant="filled"
          size="small"
        />
      ),
    },
    {
      key: 'last_transaction_date',
      label: 'Last Transaction',
      render: (row: any) => {
        if (!row.last_transaction_date) return 'No transactions';
        return new Date(row.last_transaction_date).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleViewLedger(row)}
          title="View Ledger"
        >
          <Visibility fontSize="small" />
        </IconButton>
      ),
    },
  ];

  // Calculate totals
  const totalBalance = customerBalances.reduce((sum, customer) => sum + customer.current_balance, 0);
  const positiveBalances = customerBalances.filter(c => c.current_balance > 0);
  const negativeBalances = customerBalances.filter(c => c.current_balance < 0);

  return (
    <Layout>
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
        <Typography variant="h3" gutterBottom>
          Customer Balance Summary
        </Typography>

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total Customers
              </Typography>
              <Typography variant="h5" color="primary">
                {pagination.total}
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total Balance
              </Typography>
              <Typography variant="h5" color={totalBalance >= 0 ? 'success.main' : 'error.main'}>
                {formatCurrency(totalBalance)}
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Positive Balances
              </Typography>
              <Typography variant="h5" color="success.main">
                {positiveBalances.length}
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Negative Balances
              </Typography>
              <Typography variant="h5" color="error.main">
                {negativeBalances.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Search and Actions */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1, minWidth: 300 }}
              />
              
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <Search />}
              >
                Search
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleRefresh}
                disabled={isLoading}
                startIcon={<Refresh />}
              >
                Refresh
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={() => {
                  // Implement export functionality
                  toast('Export functionality coming soon');
                }}
              >
                Export
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Data Table */}
        <DynamicTable
          columns={columns}
          data={customerBalances}
          getRowId={(row) => row.id}
        />

        {/* No Data Message */}
        {!isLoading && customerBalances.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No customers found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No customer data available.'}
            </Typography>
          </Paper>
        )}
      </Box>
    </Layout>
  );
};

export default CustomerBalanceSummary;
