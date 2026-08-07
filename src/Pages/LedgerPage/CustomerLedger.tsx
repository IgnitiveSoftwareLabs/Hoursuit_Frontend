import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  FormLabel,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Search, Print } from '@mui/icons-material';
import dayjs from 'dayjs';
import Layout from '../../components/Layout';
import InfiniteScrollAutocomplete from '../../Common/InfiniteScroll';
import { useAppDispatch, useAppSelector } from '../../Hooks/Reduxhook/hooks';
import {
  setLoading,
  setError,
  setCustomerLedger,
  clearCustomerLedger,
  clearError,
} from '../../Redux/LedgerSlice';
import {
  getCustomerLedgerApi,
  getCustomerBalanceApi,
} from '../../Services/Admin/LedgerApiService';
import { useLazyGetCustomersQuery } from '../../RTK/services/customerApi';
import toast from 'react-hot-toast';
import { usePermissions } from '../../Hooks/usePermissions';

const CustomerLedgerPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { canRead } = usePermissions();

  // Check read permission for ledger
  if (!canRead('ledger')) {
    return (
      <Layout>
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
          <Typography variant="h4" sx={{ textAlign: 'center', mt: 4, color: 'error.main' }}>
            Access Denied: Insufficient permissions to view customer ledger
          </Typography>
        </Box>
      </Layout>
    );
  }

  const { customerLedger, isLoading, error } = useAppSelector((state) => state.ledger);

  const [customerBalance, setCustomerBalance] = useState<number>(0);
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [customerPagination, setCustomerPagination] = useState({ page: 1, hasMore: true });

  const [getCustomers] = useLazyGetCustomersQuery();

  // Validation schema for the form
  const validationSchema = Yup.object({
    customerId: Yup.number().required('Customer is required'),
    fromDate: Yup.date().required('From date is required'),
    toDate: Yup.date().required('To date is required').min(Yup.ref('fromDate'), 'To date must be after from date'),
  });

  // Initial form values
  const initialValues = {
    customerId: null,
    fromDate: dayjs().startOf('month').toDate(),
    toDate: dayjs().endOf('month').toDate(),
  };

  const fetchCustomers = useCallback(async (page: number, _limit: number, search: string, append: boolean) => {
    try {
      const result = await getCustomers({ page, search: search || '' });
      const data = result.data;
      
      const newOptions = data?.result || [];
      
      if (append) {
        setCustomerOptions(prev => [...prev, ...newOptions]);
      } else {
        setCustomerOptions(newOptions);
      }
      
      setCustomerPagination({
        page,
        hasMore: page < (data?.pagination?.totalPages || 1),
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    }
  }, [getCustomers]);

  const handleCustomerChange = async (customerId: number) => {
    if (customerId) {
      try {
        const balanceResponse = await getCustomerBalanceApi(customerId.toString());
        if (balanceResponse.success) {
          setCustomerBalance(balanceResponse.result.current_balance || 0);
        }
      } catch (error) {
        console.error('Error fetching customer balance:', error);
      }
    } else {
      setCustomerBalance(0);
    }
  };

  const handleFormSubmit = async (values: any) => {
    if (!canRead('ledger')) {
      toast.error('Access denied: Insufficient permissions to fetch ledger data');
      return;
    }

    if (!values.customerId) {
      toast.error('Please select a customer');
      return;
    }

    if (!values.fromDate || !values.toDate) {
      toast.error('Please select both from and to dates');
      return;
    }

    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const params = {
        customer_id: values.customerId.toString(),
        from_date: dayjs(values.fromDate).format('YYYY-MM-DD'),
        to_date: dayjs(values.toDate).format('YYYY-MM-DD'),
      };

      const response = await getCustomerLedgerApi(params);

      if (response.success) {
        dispatch(setCustomerLedger(response.result));
        toast.success('Ledger data fetched successfully');
      } else {
        throw new Error(response.message || 'Failed to fetch ledger data');
      }
    } catch (error: any) {
      console.error('Error fetching ledger:', error);
      dispatch(setError(error.message || 'Failed to fetch ledger data'));
      toast.error(error.message || 'Failed to fetch ledger data');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleClearLedger = (resetForm: any) => {
    dispatch(clearCustomerLedger());
    setCustomerBalance(0);
    resetForm();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const getVoucherTypeColor = (type: string) => {
    switch (type) {
      case 'opening_balance':
        return 'info';
      case 'receipt':
        return 'success';
      case 'payment':
        return 'error';
      case 'invoice':
        return 'primary';
      case 'journal':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Layout>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
          <Typography variant="h3" gutterBottom>
            Customer Ledger
          </Typography>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleFormSubmit}
          >
            {(formik) => {
              // Effect to fetch customer balance when customer changes
              useEffect(() => {
                if (formik.values.customerId) {
                  handleCustomerChange(formik.values.customerId);
                }
              }, [formik.values.customerId]);

              return (
                <Form>
                {/* Search Form */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={3} alignItems="end">
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth>
                          <FormLabel>Customer *</FormLabel>
                          <InfiniteScrollAutocomplete
                            id="customerId"
                            label=""
                            placeholder="Select Customer"
                            options={customerOptions}
                            getOptionLabel={(option) => option?.name || ''}
                            fetchData={fetchCustomers}
                            formikField="customerId"
                            formik={formik}
                            setOptions={setCustomerOptions}
                            setPagination={setCustomerPagination}
                            pagination={customerPagination}
                          />
                        </FormControl>
                      </Grid>

                      <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth>
                          <FormLabel>From Date *</FormLabel>
                          <DatePicker
                            value={formik.values.fromDate ? dayjs(formik.values.fromDate) : null}
                            onChange={(date) => formik.setFieldValue('fromDate', date?.toDate())}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                variant: 'outlined',
                                error: formik.touched.fromDate && Boolean(formik.errors.fromDate),
                                helperText: formik.touched.fromDate && typeof formik.errors.fromDate === 'string' ? formik.errors.fromDate : '',
                              },
                            }}
                          />
                        </FormControl>
                      </Grid>

                      <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth>
                          <FormLabel>To Date *</FormLabel>
                          <DatePicker
                            value={formik.values.toDate ? dayjs(formik.values.toDate) : null}
                            onChange={(date) => formik.setFieldValue('toDate', date?.toDate())}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                variant: 'outlined',
                                error: formik.touched.toDate && Boolean(formik.errors.toDate),
                                helperText: formik.touched.toDate && typeof formik.errors.toDate === 'string' ? formik.errors.toDate : '',
                              },
                            }}
                          />
                        </FormControl>
                      </Grid>

                      <Grid size={{ xs: 12, md: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size={20} /> : <Search />}
                            fullWidth
                          >
                            Search
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => handleClearLedger(formik.resetForm)}
                            disabled={isLoading}
                            size="small"
                            fullWidth
                          >
                            Clear
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Current Balance Display */}
                    {formik.values.customerId && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Current Balance:{' '}
                          <Chip
                            label={formatCurrency(customerBalance)}
                            color={customerBalance >= 0 ? 'success' : 'error'}
                            variant="filled"
                          />
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Form>
              );
            }}
          </Formik>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Ledger Results */}
          {customerLedger && (
            <Card>
              <CardContent>
                {/* Customer Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    {customerLedger.customer.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Contact: {customerLedger.customer.contact} | Email: {customerLedger.customer.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Period: {dayjs(customerLedger.period.from_date).format('DD MMM YYYY')} to{' '}
                    {dayjs(customerLedger.period.to_date).format('DD MMM YYYY')}
                  </Typography>
                </Box>

                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Opening Balance
                      </Typography>
                      <Typography variant="h6" color={customerLedger.opening_balance >= 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(customerLedger.opening_balance)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Debit
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {formatCurrency(customerLedger.total_debit)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Credit
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(customerLedger.total_credit)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Closing Balance
                      </Typography>
                      <Typography variant="h6" color={customerLedger.closing_balance >= 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(customerLedger.closing_balance)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Action Buttons */}
                <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={() => window.print()}
                  >
                    Print
                  </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Ledger Entries Table */}
                <TableContainer component={Paper} variant="outlined">
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Particular</TableCell>
                        <TableCell>Voucher Type</TableCell>
                        <TableCell>Reference No.</TableCell>
                        <TableCell align="right">Debit</TableCell>
                        <TableCell align="right">Credit</TableCell>
                        <TableCell align="right">Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerLedger.ledger_entries.map((entry) => (
                        <TableRow key={entry.id} hover>
                          <TableCell>{dayjs(entry.transaction_date).format('DD MMM YYYY')}</TableCell>
                          <TableCell>{entry.particular}</TableCell>
                          <TableCell>
                            <Chip
                              label={entry.voucher_type.replace('_', ' ').toUpperCase()}
                              size="small"
                              color={getVoucherTypeColor(entry.voucher_type) as any}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{entry.reference_number}</TableCell>
                          <TableCell align="right">
                            {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: entry.balance >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold',
                            }}
                          >
                            {formatCurrency(entry.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {customerLedger.ledger_entries.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No ledger entries found for the selected period.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      </LocalizationProvider>
    </Layout>
  );
};

export default CustomerLedgerPage;
