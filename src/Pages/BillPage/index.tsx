import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  useUpdateBillMutation,
} from '../../RTK/services/billApi';
import { useCreateInvoiceMutation } from '../../RTK/services/invoiceApi';
import { useFetchCompanyQuery } from '../../RTK/services/companyApi';
import { getBillsApiCall } from '../../Services/Admin/BillsAPiservice';
import Layout from '../../components/Layout';
import DynamicTable from '../../components/Tables';
import { usePermissions } from '../../Hooks/usePermissions';


interface BillType {
  remarks: string;
  gstPercentage?: number;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
};

const BillComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  
  const [isEdit, setIsEdit] = useState(false);
  const [editBillId, setEditBillId] = useState<number | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [isInvoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedBills, setSelectedBills] = useState<number[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  // Pagination and search state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [allBills, setAllBills] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10
  });

  // Fetch bills function
  const fetchBills = useCallback(async (pageNum: number, searchTerm: string = '') => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await getBillsApiCall({
        page: pageNum,
        limit: 10,
        search: searchTerm
      });

      console.log('API Response:', {
        page: pageNum,
        billsCount: response.result?.length || 0,
        totalPages: response.pagination?.totalPages,
        total: response.pagination?.total,
        billIds: response.result?.map((bill: any) => bill.id) || []
      });

      if (response.success && response.result) {
        setPaginationInfo({
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0,
          currentPage: pageNum,
          limit: response.pagination?.limit || 10
        });

        if (pageNum === 1) {
          console.log('Setting initial bills data');
          setAllBills(response.result);
        } else {
          setAllBills(prev => {
            // Prevent duplicates by checking if the new data is already in the array
            const existingIds = new Set(prev.map(bill => bill.id));
            const newBills = response.result.filter((bill: any) => !existingIds.has(bill.id));
            console.log('Adding new bills:', {
              existingCount: prev.length,
              newCount: newBills.length,
              totalAfterAdd: prev.length + newBills.length,
              newBillIds: newBills.map((bill: any) => bill.id)
            });
            return [...prev, ...newBills];
          });
        }

        const newHasMore = pageNum < (response.pagination?.totalPages || 1);
        console.log('HasMore update:', { currentPage: pageNum, totalPages: response.pagination?.totalPages, newHasMore });
        setHasMore(newHasMore);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to fetch bills');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search !== searchInput) {
        console.log('Search changed from', search, 'to', searchInput);
        setSearch(searchInput);
        setPage(1);
        setAllBills([]);
        setHasMore(true);
        setIsLoadingMore(false);
        fetchBills(1, searchInput);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput, search, fetchBills]);

  // Initial load
  useEffect(() => {
    if (page === 1 && !search) {
      fetchBills(1, search);
    }
  }, []);

  // Fetch more bills when page changes (but not on initial load)
  useEffect(() => {
    if (page > 1) {
      fetchBills(page, search);
    }
  }, [page, fetchBills, search]);

  // Intersection Observer for infinite scroll
  const observerRef = useRef<HTMLDivElement | null>(null);

  const fetchMoreBills = useCallback(async () => {
    console.log('fetchMoreBills called:', { hasMore, isLoadingMore, isLoading, currentPage: page });
    if (!hasMore || isLoadingMore || isLoading) {
      console.log('fetchMoreBills blocked:', { hasMore, isLoadingMore, isLoading });
      return;
    }
    
    console.log('Actually fetching more bills, incrementing page from', page, 'to', page + 1);
    setPage(prev => prev + 1);
  }, [hasMore, isLoadingMore, isLoading, page]);

  useEffect(() => {
    if (!observerRef.current) {
      console.log('No observer ref');
      return;
    }
    
    if (!hasMore) {
      console.log('No more data to load');
      return;
    }
    
    if (isLoadingMore) {
      console.log('Already loading more');
      return;
    }

    console.log('Setting up intersection observer');
    const observer = new IntersectionObserver(
      (entries) => {
        console.log('Intersection observer triggered:', entries[0].isIntersecting);
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          console.log('Calling fetchMoreBills from observer');
          fetchMoreBills();
        }
      },
      { root: null, threshold: 0.1 }
    );

    const currentRef = observerRef.current;
    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [fetchMoreBills, hasMore, isLoadingMore]);

  const [updateBill] = useUpdateBillMutation();
  const [createInvoice] = useCreateInvoiceMutation();
  const { data: companyData, isLoading: isCompLoad, isError } = useFetchCompanyQuery();
  console.log("Company Data:", companyData);
  const formik = useFormik<BillType>({
    initialValues: {
      remarks: '',
      gstPercentage: companyData?.result?.gstEnabled ? 18 : undefined,
    },
    validationSchema: Yup.object({
      remarks: Yup.string().required('Remarks is required'),
      gstPercentage: companyData?.gstEnabled
        ? Yup.number()
            .required('GST Percentage is required')
            .min(0, 'GST Percentage must be non-negative')
        : Yup.number().notRequired(),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit && editBillId !== null) {
          if (!canUpdate('bill')) {
            toast.error('You do not have permission to update bills');
            return;
          }
          
          const payload = { id: editBillId, payload: { remarks: values.remarks } };
          const response: any = await updateBill(payload).unwrap();
          toast.success(response.message || 'Bill updated');
          setOpen(false);
          setIsEdit(false);
          formik.resetForm();
        } else {
          if (!canCreate('invoice')) {
            toast.error('You do not have permission to create invoices');
            return;
          }
          
          const response: any = await createInvoice({
            billIds: selectedBills,
            remarks: values.remarks,
            gstPercentage: companyData?.result?.gstEnabled ? values.gstPercentage : undefined,
          }).unwrap();
          toast.success(response.message || 'Invoice created successfully');
          setInvoiceDialogOpen(false);
          setSelectedBills([]);
          setSelectedClientId(null);
          // Reset pagination to refresh data
          setPage(1);
          setAllBills([]);
          setHasMore(true);
          fetchBills(1, search);
          formik.resetForm();
        }
      } catch (error: any) {
        toast.error(error?.data?.message || 'Something went wrong');
        setOpen(false);
        setInvoiceDialogOpen(false);
      }
    },
    enableReinitialize: true, // Reinitialize form when companyData changes
  });

  const handleEdit = (id: number) => {
    if (!canUpdate('bill')) {
      toast.error('You do not have permission to edit bills');
      return;
    }
    
    const billToEdit = allBills?.find((bill: any) => bill.id === id);
    if (billToEdit) {
      formik.setValues({ remarks: billToEdit.remarks || '' });
      setEditBillId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleSelectBill = (id: number) => {
    const bill = allBills?.find((b: any) => b.id === id);
    if (!bill) return;

    if (bill.invoice_id) {
      toast.error('Cannot select a bill that already has an invoice');
      return;
    }

    if (selectedBills.length === 0) {
      setSelectedBills([id]);
      setSelectedClientId(bill.client);
      return;
    }

    if (bill.client !== selectedClientId) {
      toast.error('Only bills from the same client can be selected');
      return;
    }

    setSelectedBills((prev) =>
      prev.includes(id) ? prev.filter((billId) => billId !== id) : [...prev, id]
    );

    if (selectedBills.length === 1 && selectedBills[0] === id) {
      setSelectedClientId(null);
    }
  };

  const handleOpenInvoiceDialog = () => {
    if (!canCreate('invoice')) {
      toast.error('You do not have permission to create invoices');
      return;
    }
    
    if (selectedBills.length === 0) {
      toast.error('Please select at least one bill');
      return;
    }
    setInvoiceDialogOpen(true);
  };

  const selectedBillsData = allBills?.filter((bill: any) =>
    selectedBills.includes(bill.id)
  ) || [];
  const subtotal = selectedBillsData.reduce((sum: number, bill: any) => sum + Number(bill.amount), 0);
  const gstAmount = companyData?.result?.gstEnabled && formik.values.gstPercentage
    ? subtotal * (formik.values.gstPercentage / 100)
    : 0;
  const totalAmount = subtotal + gstAmount;

  const columns = [
    {
      key: 'select',
      label: '',
      render: (row: any) => {
        const isSelected = selectedBills.includes(row.id);
        const hasInvoice = row.invoice_id !== null && row.invoice_id !== undefined;
        const isDifferentClient =
          selectedClientId !== null && row.client !== selectedClientId;

        const isDisabled = hasInvoice || isDifferentClient;

        return (
          <input
            type="checkbox"
            checked={isSelected}
            disabled={isDisabled}
            onChange={() => handleSelectBill(row.id)}
          />
        );
      },
    },
    { key: 'id', label: 'Bill ID' },
    { key: 'whr_no', label: 'WHR No' },
    {
      key: 'client',
      label: 'Client Name',
      render: (row: any) => row.customer?.name || 'N/A',
    },
    {
      key: 'commodity',
      label: 'Commodity',
      render: (row: any) => row.commodityDetail?.name || 'N/A',
    },
    { key: 'no_of_bags', label: 'No. of Bags' },
    {
      key: 'weight',
      label: 'Weight',
      render: (row: any) => `${row.weight} ${row.weight_unit || ''}`,
    },
    {
      key: 'from',
      label: 'From',
      render: (row: any) => formatDate(row.from),
    },
    {
      key: 'to',
      label: 'To',
      render: (row: any) => formatDate(row.to),
    },
    { key: 'amount', label: 'Amount' },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => {
        const hasInvoice = row.invoice_id !== null && row.invoice_id !== undefined;
        const status = hasInvoice ? 'Invoiced' : 'Pending';

        return (
          <Typography
            variant="body2"
            style={{
              color: hasInvoice ? 'green' : 'red',
              fontWeight: 'bold',
            }}
          >
            {status}
          </Typography>
        );
      },
    },
    { key: 'remarks', label: 'Remarks' },
  ];

  if (!canRead('bill')) {
    return (
      <Layout>
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <Typography variant="h6" color="error">
              Access Denied: You do not have permission to view bills.
            </Typography>
          </Box>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Bills
          </Typography>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search by Bill ID, WHR No, Client, Commodity..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 350 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {canCreate('invoice') && (
            <Button variant="contained" color="primary" onClick={handleOpenInvoiceDialog}>
              Create Invoice from Selected
            </Button>
          )}
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              setSelectedBills([]);
              setSelectedClientId(null);
            }}
          >
            Clear Selection
          </Button>
        </Box>

        {/* Edit Bill Dialog */}
        <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Bill Remarks</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="remarks">Remarks</FormLabel>
                <TextField
                  id="remarks"
                  {...formik.getFieldProps('remarks')}
                  rows={3}
                  error={formik.touched.remarks && !!formik.errors.remarks}
                  helperText={formik.touched.remarks && formik.errors.remarks}
                />
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={formik.isSubmitting}
              >
                Update Remarks
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Invoice Creation Dialog */}
        <Dialog open={isInvoiceDialogOpen} onClose={() => setInvoiceDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Selected Bills Summary</Typography>
              <Table sx={{ mt: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Bill ID</TableCell>
                    <TableCell>WHR No</TableCell>
                    <TableCell>Client Name</TableCell>
                    <TableCell>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedBillsData.map((bill: any) => (
                    <TableRow key={bill.id}>
                      <TableCell>{bill.id}</TableCell>
                      <TableCell>{bill.whr_no}</TableCell>
                      <TableCell>{bill.customer?.name || 'N/A'}</TableCell>
                      <TableCell>{bill.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                <Typography>Subtotal: {subtotal.toFixed(2)}</Typography>
                {companyData?.result?.gstEnabled && (
                  <>
                    <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                      <FormLabel htmlFor="gstPercentage">GST Percentage (%)</FormLabel>
                      <TextField
                        id="gstPercentage"
                        type="number"
                        {...formik.getFieldProps('gstPercentage')}
                        error={formik.touched.gstPercentage && !!formik.errors.gstPercentage}
                        helperText={formik.touched.gstPercentage && formik.errors.gstPercentage}
                      />
                    </FormControl>
                    <Typography>GST Amount: {gstAmount.toFixed(2)}</Typography>
                  </>
                )}
                <Typography variant="h6" sx={{ mt: 1 }}>
                  Total Amount: {(totalAmount).toFixed(2)}
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <FormLabel htmlFor="remarks">Remarks</FormLabel>
                  <TextField
                    id="remarks"
                    {...formik.getFieldProps('remarks')}
                    rows={3}
                    error={formik.touched.remarks && !!formik.errors.remarks}
                    helperText={formik.touched.remarks && formik.errors.remarks}
                  />
                </FormControl>
                <Box sx={{ mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={formik.isSubmitting}
                  >
                    Create Invoice
                  </Button>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInvoiceDialogOpen(false)} color="inherit">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bills Table */}
        <DynamicTable
          columns={columns}
          data={allBills || []}
          getRowId={(row) => row.id}
          onEdit={canUpdate('bill') ? (id) => handleEdit(Number(id)) : undefined}
        />
        
       

        {/* Intersection Observer for infinite scroll */}
        {hasMore && (
          <Box
            ref={observerRef}
            sx={{
              height: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: 2,
            }}
          >
            {isLoadingMore && <CircularProgress size={20} />}
          </Box>
        )}

        {/* Loading state for initial load */}
        {isLoading && page === 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
          </Box>
        )}

        {/* No data state */}
        {!isLoading && allBills.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <Typography variant="body1" color="text.secondary">
              {search ? 'No bills found matching your search.' : 'No bills available.'}
            </Typography>
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default BillComp;