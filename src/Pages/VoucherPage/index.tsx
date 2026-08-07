import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { 
  Add, 
  Search, 
  Visibility,
  Close,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import Layout from '../../components/Layout';
import InfiniteScrollAutocomplete from '../../Common/InfiniteScroll';
import { DataGrid } from '@mui/x-data-grid';
import { useAppDispatch, useAppSelector } from '../../Hooks/Reduxhook/hooks';
import {
  setLoading,
  setCreating,
  setError,
  setVouchers,
  addVoucher,
  setSelectedVoucher,
  setPagination,
  updateFilters,
  clearError,
} from '../../Redux/VoucherSlice';
import {
  createVoucherApi,
  getVouchersApi,
  getVoucherByIdApi,
} from '../../Services/Admin/VoucherApiservice';
import { useLazyGetCustomersQuery } from '../../RTK/services/customerApi';
import toast from 'react-hot-toast';
import { usePermissions } from '../../Hooks/usePermissions';

const VoucherPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { canCreate, canRead } = usePermissions();

  // Check read permission for vouchers
  if (!canRead('voucher')) {
    return (
      <Layout>
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
          <Typography variant="h4" sx={{ textAlign: 'center', mt: 4, color: 'error.main' }}>
            Access Denied: Insufficient permissions to view vouchers
          </Typography>
        </Box>
      </Layout>
    );
  }

  const { vouchers, isLoading, isCreating, error, pagination, filters, selectedVoucher } = useAppSelector((state) => state.voucher);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [customerPagination, setCustomerPagination] = useState({ page: 1, hasMore: true });
  
  const [getCustomers] = useLazyGetCustomersQuery();

  // Payment modes
  const paymentModes = [
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'neft', label: 'NEFT' },
    { value: 'imps', label: 'IMPS' },
    { value: 'upi', label: 'UPI' },
  ];

  // Validation schema for voucher creation
  const voucherValidationSchema = Yup.object({
    customerId: Yup.number().required('Customer is required'),
    transactionAmount: Yup.number()
      .required('Transaction amount is required')
      .positive('Amount must be greater than 0'),
    paymentMode: Yup.string().required('Payment mode is required'),
    voucherDate: Yup.date().required('Voucher date is required'),
    chequeNumber: Yup.string().when('paymentMode', {
      is: 'cheque',
      then: (schema) => schema.required('Cheque number is required for cheque payments'),
      otherwise: (schema) => schema.notRequired(),
    }),
    chequeDate: Yup.date().when('paymentMode', {
      is: 'cheque',
      then: (schema) => schema.required('Cheque date is required for cheque payments'),
      otherwise: (schema) => schema.notRequired(),
    }),
    bankName: Yup.string().when('paymentMode', {
      is: 'cheque',
      then: (schema) => schema.required('Bank name is required for cheque payments'),
      otherwise: (schema) => schema.notRequired(),
    }),
    upiId: Yup.string().when('paymentMode', {
      is: 'upi',
      then: (schema) => schema.required('UPI ID is required for UPI payments'),
      otherwise: (schema) => schema.notRequired(),
    }),
    remarks: Yup.string(),
  });

  // Filter validation schema
  const filterValidationSchema = Yup.object({
    customerId: Yup.number().nullable(),
    paymentMode: Yup.string(),
    fromDate: Yup.date().nullable(),
    toDate: Yup.date().nullable().min(Yup.ref('fromDate'), 'To date must be after from date'),
    search: Yup.string(),
  });

  // Initial values for voucher form
  const voucherInitialValues = {
    customerId: null,
    transactionAmount: '',
    paymentMode: '',
    voucherDate: dayjs().toDate(),
    chequeNumber: '',
    chequeDate: dayjs().toDate(),
    bankName: '',
    upiId: '',
    remarks: '',
  };

  // Initial values for filter form
  const filterInitialValues = {
    customerId: filters.customer_id || null,
    paymentMode: filters.payment_mode || '',
    fromDate: filters.from_date ? dayjs(filters.from_date).toDate() : null,
    toDate: filters.to_date ? dayjs(filters.to_date).toDate() : null,
    search: filters.search || '',
  };

  // Fetch customers for autocomplete
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

  // Fetch vouchers
  const fetchVouchers = useCallback(async (params: any = {}) => {
    if (!canRead('voucher')) {
      toast.error('Access denied: Insufficient permissions to fetch vouchers');
      return;
    }

    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const response = await getVouchersApi({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params,
      });

      if (response.success) {
        dispatch(setVouchers(response.result));
        dispatch(setPagination(response.pagination));
      } else {
        throw new Error(response.message || 'Failed to fetch vouchers');
      }
    } catch (error: any) {
      console.error('Error fetching vouchers:', error);
      dispatch(setError(error.message || 'Failed to fetch vouchers'));
      toast.error(error.message || 'Failed to fetch vouchers');
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, pagination.page, pagination.limit, filters, canRead]);

  // Handle voucher creation
  const handleCreateVoucher = async (values: any) => {
    if (!canCreate('voucher')) {
      toast.error('Access denied: Insufficient permissions to create vouchers');
      return;
    }

    try {
      dispatch(setCreating(true));
      dispatch(clearError());

      const voucherData = {
        customer_id: values.customerId,
        transaction_amount: Number(values.transactionAmount),
        payment_mode: values.paymentMode,
        voucher_date: dayjs(values.voucherDate).format('YYYY-MM-DD'),
        ...(values.paymentMode === 'cheque' && {
          cheque_number: values.chequeNumber,
          cheque_date: dayjs(values.chequeDate).format('YYYY-MM-DD'),
          bank_name: values.bankName,
        }),
        ...(values.paymentMode === 'upi' && {
          upi_id: values.upiId,
        }),
        ...(values.remarks && { remarks: values.remarks }),
      };

      const response = await createVoucherApi(voucherData);

      if (response.success) {
        dispatch(addVoucher(response.result));
        toast.success('Voucher created successfully');
        setShowCreateForm(false);
        // Refresh vouchers to get updated list
        await fetchVouchers();
      } else {
        throw new Error(response.message || 'Failed to create voucher');
      }
    } catch (error: any) {
      console.error('Error creating voucher:', error);
      dispatch(setError(error.message || 'Failed to create voucher'));
      toast.error(error.message || 'Failed to create voucher');
    } finally {
      dispatch(setCreating(false));
    }
  };

  // Handle filter application
  const handleApplyFilters = async (values: any) => {
    const newFilters = {
      ...(values.customerId && { customer_id: values.customerId }),
      ...(values.paymentMode && { payment_mode: values.paymentMode }),
      ...(values.fromDate && { from_date: dayjs(values.fromDate).format('YYYY-MM-DD') }),
      ...(values.toDate && { to_date: dayjs(values.toDate).format('YYYY-MM-DD') }),
      ...(values.search && { search: values.search }),
    };

    dispatch(updateFilters(newFilters));
    await fetchVouchers(newFilters);
  };

  // Handle voucher view
  const handleViewVoucher = async (voucherId: number) => {
    if (!canRead('voucher')) {
      toast.error('Access denied: Insufficient permissions to view voucher details');
      return;
    }

    try {
      const response = await getVoucherByIdApi(voucherId);
      if (response.success) {
        dispatch(setSelectedVoucher(response.result));
        setShowViewDialog(true);
      }
    } catch (error: any) {
      toast.error('Failed to fetch voucher details');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  // Get payment mode color
  const getPaymentModeColor = (mode: string) => {
    switch (mode) {
      case 'cash':
        return 'success';
      case 'cheque':
        return 'primary';
      case 'upi':
        return 'secondary';
      case 'neft':
      case 'imps':
        return 'info';
      default:
        return 'default';
    }
  };

  // DataGrid columns
  const columns = [
    {
      field: 'voucher_number',
      headerName: 'Voucher No.',
      flex: 1,
      minWidth: 150,
      sortable: true,
    },
    {
      field: 'voucher_date',
      headerName: 'Date',
      width: 120,
      renderCell: (params: any) => dayjs(params.value).format('DD MMM YYYY'),
    },
    {
      field: 'debitCustomer',
      headerName: 'Customer',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params: any) => params.value?.name || 'N/A',
    },
    {
      field: 'transaction_amount',
      headerName: 'Amount',
      width: 130,
      renderCell: (params: any) => formatCurrency(params.value),
      align: 'right' as const,
    },
    {
      field: 'payment_mode',
      headerName: 'Payment Mode',
      width: 140,
      renderCell: (params: any) => (
        <Chip
          label={params.value.toUpperCase()}
          size="small"
          color={getPaymentModeColor(params.value) as any}
          variant="outlined"
        />
      ),
    },
    {
      field: 'remarks',
      headerName: 'Remarks',
      flex: 2,
      minWidth: 200,
      renderCell: (params: any) => params.value || '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: any) => (
        canRead('voucher') ? (
          <IconButton
            size="small"
            onClick={() => handleViewVoucher(params.row.id)}
            color="primary"
          >
            <Visibility />
          </IconButton>
        ) : null
      ),
    },
  ];

  // Load vouchers on component mount
  useEffect(() => {
    fetchVouchers();
  }, []);

  return (
    <Layout>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h3">
              Payment Vouchers
            </Typography>
            {canCreate('voucher') && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  if (!canCreate('voucher')) {
                    toast.error('Access denied: Insufficient permissions to create vouchers');
                    return;
                  }
                  setShowCreateForm(true);
                }}
              >
                Create Voucher
              </Button>
            )}
          </Box>

          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filters
              </Typography>
              <Formik
                initialValues={filterInitialValues}
                validationSchema={filterValidationSchema}
                onSubmit={handleApplyFilters}
                enableReinitialize
              >
                {(formik) => (
                  <Form>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'end' }}>
                      <Box sx={{ minWidth: 300, flex: '1 1 300px' }}>
                        <FormControl fullWidth>
                          <FormLabel>Customer</FormLabel>
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
                      </Box>

                      <Box sx={{ minWidth: 150, flex: '1 1 150px' }}>
                        <FormControl fullWidth>
                          <FormLabel>Payment Mode</FormLabel>
                          <Field
                            as={TextField}
                            name="paymentMode"
                            select
                            fullWidth
                            variant="outlined"
                          >
                            <MenuItem value="">All</MenuItem>
                            {paymentModes.map((mode) => (
                              <MenuItem key={mode.value} value={mode.value}>
                                {mode.label}
                              </MenuItem>
                            ))}
                          </Field>
                        </FormControl>
                      </Box>

                      <Box sx={{ minWidth: 150, flex: '1 1 150px' }}>
                        <FormControl fullWidth>
                          <FormLabel>From Date</FormLabel>
                          <DatePicker
                            value={formik.values.fromDate ? dayjs(formik.values.fromDate) : null}
                            onChange={(date) => formik.setFieldValue('fromDate', date?.toDate())}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                variant: 'outlined',
                              },
                            }}
                          />
                        </FormControl>
                      </Box>

                      <Box sx={{ minWidth: 150, flex: '1 1 150px' }}>
                        <FormControl fullWidth>
                          <FormLabel>To Date</FormLabel>
                          <DatePicker
                            value={formik.values.toDate ? dayjs(formik.values.toDate) : null}
                            onChange={(date) => formik.setFieldValue('toDate', date?.toDate())}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                variant: 'outlined',
                              },
                            }}
                          />
                        </FormControl>
                      </Box>

                      <Box sx={{ minWidth: 200, flex: '1 1 200px' }}>
                        <FormControl fullWidth>
                          <FormLabel>Search</FormLabel>
                          <Field
                            as={TextField}
                            name="search"
                            placeholder="Voucher number, remarks..."
                            fullWidth
                            variant="outlined"
                          />
                        </FormControl>
                      </Box>

                      <Box sx={{ minWidth: 120 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={<Search />}
                          disabled={isLoading}
                          fullWidth
                        >
                          Search
                        </Button>
                      </Box>
                    </Box>
                  </Form>
                )}
              </Formik>
            </CardContent>
          </Card>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Vouchers Table */}
          <Paper sx={{ height: 600 }}>
            <DataGrid
              rows={vouchers}
              columns={columns}
              loading={isLoading}
              paginationModel={{
                page: pagination.page - 1, // MUI DataGrid uses 0-based indexing
                pageSize: pagination.limit,
              }}
              rowCount={pagination.total}
              onPaginationModelChange={(model) => {
                dispatch(setPagination({ ...pagination, page: model.page + 1, limit: model.pageSize }));
                fetchVouchers({ page: model.page + 1, limit: model.pageSize });
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              paginationMode="server"
              disableColumnResize
              density="compact"
              getRowClassName={(params) =>
                params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
              }
            />
          </Paper>

          {/* Create Voucher Dialog */}
          <Dialog
            open={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Create Payment Voucher
              <IconButton
                onClick={() => setShowCreateForm(false)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Formik
                initialValues={voucherInitialValues}
                validationSchema={voucherValidationSchema}
                onSubmit={handleCreateVoucher}
              >
                {(formik) => (
                  <Form>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1 }}>
                      <Box sx={{ minWidth: 300, flex: '1 1 45%' }}>
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
                      </Box>

                      <Box sx={{ minWidth: 200, flex: '1 1 45%' }}>
                        <FormControl fullWidth>
                          <FormLabel>Transaction Amount *</FormLabel>
                          <Field
                            as={TextField}
                            name="transactionAmount"
                            type="number"
                            placeholder="Enter amount"
                            fullWidth
                            variant="outlined"
                            error={formik.touched.transactionAmount && Boolean(formik.errors.transactionAmount)}
                            helperText={formik.touched.transactionAmount && formik.errors.transactionAmount}
                          />
                        </FormControl>
                      </Box>

                      <Box sx={{ minWidth: 200, flex: '1 1 45%' }}>
                        <FormControl fullWidth>
                          <FormLabel>Payment Mode *</FormLabel>
                          <Field
                            as={TextField}
                            name="paymentMode"
                            select
                            fullWidth
                            variant="outlined"
                            error={formik.touched.paymentMode && Boolean(formik.errors.paymentMode)}
                            helperText={formik.touched.paymentMode && formik.errors.paymentMode}
                          >
                            {paymentModes.map((mode) => (
                              <MenuItem key={mode.value} value={mode.value}>
                                {mode.label}
                              </MenuItem>
                            ))}
                          </Field>
                        </FormControl>
                      </Box>

                      <Box sx={{ minWidth: 200, flex: '1 1 45%' }}>
                        <FormControl fullWidth>
                          <FormLabel>Voucher Date *</FormLabel>
                          <DatePicker
                            value={formik.values.voucherDate ? dayjs(formik.values.voucherDate) : null}
                            onChange={(date) => formik.setFieldValue('voucherDate', date?.toDate())}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                variant: 'outlined',
                                error: formik.touched.voucherDate && Boolean(formik.errors.voucherDate),
                                helperText: formik.touched.voucherDate && typeof formik.errors.voucherDate === 'string' ? formik.errors.voucherDate : '',
                              },
                            }}
                          />
                        </FormControl>
                      </Box>

                      {/* Cheque specific fields */}
                      {formik.values.paymentMode === 'cheque' && (
                        <>
                          <Box sx={{ minWidth: 200, flex: '1 1 30%' }}>
                            <FormControl fullWidth>
                              <FormLabel>Cheque Number *</FormLabel>
                              <Field
                                as={TextField}
                                name="chequeNumber"
                                placeholder="Enter cheque number"
                                fullWidth
                                variant="outlined"
                                error={formik.touched.chequeNumber && Boolean(formik.errors.chequeNumber)}
                                helperText={formik.touched.chequeNumber && formik.errors.chequeNumber}
                              />
                            </FormControl>
                          </Box>

                          <Box sx={{ minWidth: 200, flex: '1 1 30%' }}>
                            <FormControl fullWidth>
                              <FormLabel>Cheque Date *</FormLabel>
                              <DatePicker
                                value={formik.values.chequeDate ? dayjs(formik.values.chequeDate) : null}
                                onChange={(date) => formik.setFieldValue('chequeDate', date?.toDate())}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    variant: 'outlined',
                                    error: formik.touched.chequeDate && Boolean(formik.errors.chequeDate),
                                    helperText: formik.touched.chequeDate && typeof formik.errors.chequeDate === 'string' ? formik.errors.chequeDate : '',
                                  },
                                }}
                              />
                            </FormControl>
                          </Box>

                          <Box sx={{ minWidth: 200, flex: '1 1 30%' }}>
                            <FormControl fullWidth>
                              <FormLabel>Bank Name *</FormLabel>
                              <Field
                                as={TextField}
                                name="bankName"
                                placeholder="Enter bank name"
                                fullWidth
                                variant="outlined"
                                error={formik.touched.bankName && Boolean(formik.errors.bankName)}
                                helperText={formik.touched.bankName && formik.errors.bankName}
                              />
                            </FormControl>
                          </Box>
                        </>
                      )}

                      {/* UPI specific field */}
                      {formik.values.paymentMode === 'upi' && (
                        <Box sx={{ minWidth: 300, flex: '1 1 45%' }}>
                          <FormControl fullWidth>
                            <FormLabel>UPI ID *</FormLabel>
                            <Field
                              as={TextField}
                              name="upiId"
                              placeholder="Enter UPI ID"
                              fullWidth
                              variant="outlined"
                              error={formik.touched.upiId && Boolean(formik.errors.upiId)}
                              helperText={formik.touched.upiId && formik.errors.upiId}
                            />
                          </FormControl>
                        </Box>
                      )}

                      <Box sx={{ width: '100%' }}>
                        <FormControl fullWidth>
                          <FormLabel>Remarks</FormLabel>
                          <Field
                            as={TextField}
                            name="remarks"
                            placeholder="Enter remarks (optional)"
                            fullWidth
                            variant="outlined"
                           
                            rows={3}
                          />
                        </FormControl>
                      </Box>
                    </Box>

                    <DialogActions sx={{ px: 0, pt: 3 }}>
                      <Button
                        onClick={() => setShowCreateForm(false)}
                        disabled={isCreating}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isCreating}
                        startIcon={isCreating ? <CircularProgress size={20} /> : undefined}
                      >
                        {isCreating ? 'Creating...' : 'Create Voucher'}
                      </Button>
                    </DialogActions>
                  </Form>
                )}
              </Formik>
            </DialogContent>
          </Dialog>

          {/* View Voucher Dialog */}
          <Dialog
            open={showViewDialog}
            onClose={() => setShowViewDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Voucher Details
              <IconButton
                onClick={() => setShowViewDialog(false)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {selectedVoucher && (
                <Box sx={{ mt: 2 }}>
                  <>
                    {/* Voucher Header */}
                    <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5">
                          {selectedVoucher.voucher_number}
                        </Typography>
                        <Chip
                          label={selectedVoucher.payment_mode.toUpperCase()}
                          color={getPaymentModeColor(selectedVoucher.payment_mode) as any}
                          variant="filled"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Date: {dayjs(selectedVoucher.voucher_date).format('DD MMM YYYY')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Type: {selectedVoucher.voucher_type.toUpperCase()}
                      </Typography>
                    </Paper>

                    {/* Customer Details */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Customer Information
                      </Typography>
                      <Typography variant="body1">
                        <strong>Name:</strong> {selectedVoucher.debitCustomer?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Customer ID:</strong> {selectedVoucher.debit_ledger_id}
                      </Typography>
                    </Paper>

                    {/* Transaction Details */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Transaction Details
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Amount
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {formatCurrency(selectedVoucher.transaction_amount)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Payment Mode
                          </Typography>
                          <Typography variant="body1">
                            {selectedVoucher.payment_mode.toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Payment mode specific details */}
                      {selectedVoucher.payment_mode === 'cheque' && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Cheque Details
                          </Typography>
                          <Typography variant="body2">
                            <strong>Cheque Number:</strong> {selectedVoucher.cheque_number}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Cheque Date:</strong> {selectedVoucher.cheque_date ? dayjs(selectedVoucher.cheque_date).format('DD MMM YYYY') : 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Bank Name:</strong> {selectedVoucher.bank_name}
                          </Typography>
                        </Box>
                      )}

                      {selectedVoucher.payment_mode === 'upi' && selectedVoucher.upi_id && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            UPI Details
                          </Typography>
                          <Typography variant="body2">
                            <strong>UPI ID:</strong> {selectedVoucher.upi_id}
                          </Typography>
                        </Box>
                      )}

                      {selectedVoucher.remarks && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Remarks
                          </Typography>
                          <Typography variant="body2">
                            {selectedVoucher.remarks}
                          </Typography>
                        </Box>
                      )}
                    </Paper>

                    {/* Company Details */}
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Company Information
                      </Typography>
                      <Typography variant="body1">
                        <strong>Company:</strong> {selectedVoucher.company?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created: {dayjs(selectedVoucher.createdAt).format('DD MMM YYYY HH:mm')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Updated: {dayjs(selectedVoucher.updatedAt).format('DD MMM YYYY HH:mm')}
                      </Typography>
                    </Paper>
                  </>
                </Box>
              )}
            </DialogContent>
          </Dialog>
        </Box>
      </LocalizationProvider>
    </Layout>
  );
};

export default VoucherPage;
