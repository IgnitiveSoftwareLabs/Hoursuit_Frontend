import React, { useState, useEffect } from 'react';
import { 
  Box,
  Card,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  TablePagination,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Edit, Delete, Print, AccountBalanceWallet as AccountBalanceWalletIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useFetchRequestDepositorsQuery, useDeleteRequestDepositorMutation } from '../RTK/services/requestDepositorApi';
import DepositReceiptPDF from '../components/Print/DepositPrint';
import ConfirmationDialog from './Dialog/ConfirmationDialog';
import RequestDepositorForm from '../components/Dialog/RequestDepositorForm';
import CreateDeliveryForm from '../components/Dialog/RequestDeliveryDialog';
import { Link } from 'react-router-dom';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { usePermissions } from '../Hooks/usePermissions';

const RequestDepositorComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isOpen, setOpen] = useState<boolean>(false);
  const [isDeliveryOpen, setDeliveryOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [editRentId, setEditRentId] = useState<number | null>(null);
  const [deleteRentId, setDeleteRentId] = useState<number | null>(null);
  const [selectedDepositId, setSelectedDepositId] = useState<number | null>(null);

  // Pagination and search state
  const [page, setPage] = useState(0); // 0-based for TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(0); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data: requests, isLoading: isDepositLoading, isError } = useFetchRequestDepositorsQuery({
    page: page + 1,
    limit: rowsPerPage,
    search,
  });
  const [deleteDepositor] = useDeleteRequestDepositorMutation();

  const handleDelete = async (id: any) => {
    if (!canDelete('deposit')) {
      toast.error('You do not have permission to delete deposits');
      return;
    }
    
    try {
      const response: any = await deleteDepositor(id).unwrap();
      if (response.success) {
        toast.success(response.message);
        setDeleteDialogOpen(false);
        setDeleteRentId(null);
      }
    } catch (error: any) {
      toast.error('Some records are associated with this request');
    }
  };

  const handleEdit = (id: number) => {
    if (!canUpdate('deposit')) {
      toast.error('You do not have permission to edit deposits');
      return;
    }
    
    const requestToEdit = requests?.result?.find((item: any) => item.id === id);
    if (requestToEdit) {
      setEditRentId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleWithdraw = (id: number) => {
    if (!canCreate('delivery')) {
      toast.error('You do not have permission to create withdrawals');
      return;
    }
    
    setSelectedDepositId(id);
    setDeliveryOpen(true);
  };

  const handleDeliveryClose = () => {
    setDeliveryOpen(false);
    setSelectedDepositId(null);
  };

  if (!canRead('deposit')) {
    return (
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view deposits.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>
            WHR
          </Typography>
          <NavbarBreadcrumbs />
        </Box>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by ID, Receipt, Customer, Mobile..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
      </Box>

      <RequestDepositorForm
        open={isOpen}
        onClose={() => setOpen(false)}
        isEdit={isEdit}
        editId={editRentId}
        initialValues={
          isEdit && editRentId
            ? requests?.result?.find((item: any) => item.id === editRentId)
            : undefined
        }
      />

      <CreateDeliveryForm
        open={isDeliveryOpen}
        onClose={handleDeliveryClose}
        isEdit={false}
        requestDeposits={requests}
        editDeliveryId={null}
        editDelivery={
          selectedDepositId
            ? {
                deposit_reference_id: selectedDepositId,
                withdrawal_date: new Date().toISOString().slice(0, 16),
                delivery_note_issue_date: new Date().toISOString().slice(0, 16),
                withdrawal_ledger_page_number: 0,
                measurment_or_weight: 0,
                weightUnit: 'kg',
                total_cost_of_goods: 0,
                details_of_number_of_bags_sacks: 0,
                delivery_note_number: 0,
              }
            : undefined
        }
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteRentId(null);
        }}
        onConfirm={() => deleteRentId !== null && handleDelete(deleteRentId)}
        variant="delete"
        title="Delete WHR"
        message={`Are you sure you want to delete this WHR? This action cannot be undone.`}
      />

      <Card variant="outlined" sx={{ boxShadow: 'none', backgroundColor: 'transparent', border: 'none' }}>
        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ textTransform: 'uppercase' }}>Sr. No.</TableCell>
                <TableCell sx={{ textTransform: 'uppercase' }}>Request ID</TableCell>
                <TableCell sx={{ textTransform: 'uppercase' }}>Customer</TableCell>
                <TableCell sx={{ textTransform: 'uppercase' }}>Deposit Date</TableCell>
                <TableCell sx={{ textTransform: 'uppercase' }}>Commodity</TableCell>
                <TableCell sx={{ textTransform: 'uppercase' }}>Goods Description</TableCell>
                <TableCell sx={{ textTransform: 'uppercase' }}>Total Cost</TableCell>
                <TableCell sx={{ textTransform: 'uppercase' }}>Remaining Weight</TableCell>
                <TableCell sx={{ textTransform: 'uppercase' }}>Remaining Bags</TableCell>
                <TableCell sx={{ textTransform: 'uppercase' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests?.result?.length > 0 ? (
                requests.result.map((item: any, index: number) => (
                  <TableRow
                    key={item.id}
                    sx={{
                      '&:nth-of-type(odd)': { backgroundColor: (theme) => theme.palette.action.hover },
                      '&:hover': { backgroundColor: (theme) => theme.palette.action.selected },
                    }}
                  >
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Link to={`/whr/${item.id}`} state={{ item: item.id }} style={{ textDecoration: 'none' }}>
                        {item?.receipt_number}
                      </Link>
                    </TableCell>
                    <TableCell>{item?.client?.name}</TableCell>
                    <TableCell>{item?.Deposit_date?.split('T')[0]}</TableCell>
                    <TableCell>{item?.commodity?.name}</TableCell>
                    <TableCell>{item.Description_of_goods}</TableCell>
                    <TableCell>{item.total_cost_of_goods}</TableCell>
                    <TableCell>{item.remaining_weight} {item.weightUnit}</TableCell>
                    <TableCell>{item.remaining_bags}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {canUpdate('deposit') && (
                          <IconButton color="primary" onClick={() => handleEdit(item.id)} sx={{ color: '#6560F0' }}>
                            <Edit />
                          </IconButton>
                        )}
                        {canDelete('deposit') && (
                          <IconButton
                            sx={{ color: '#F44336' }}
                            onClick={() => {
                              setDeleteRentId(item.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        )}
                        {item.remaining_weight > 0 && canCreate('delivery') && (
                          <IconButton
                            color="primary"
                            onClick={() => handleWithdraw(item.id)}
                            sx={{ color: '#2196F3' }}
                          >
                            <AccountBalanceWalletIcon />
                          </IconButton>
                        )}
                        <PDFDownloadLink document={<DepositReceiptPDF data={item} />} fileName={`deposit_receipt_${item.id}.pdf`}>
                          {({ loading }) => (
                            <IconButton color="primary" disabled={loading}>
                              <Print />
                            </IconButton>
                          )}
                        </PDFDownloadLink>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {isDepositLoading ? 'Loading...' : 'No records found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={requests?.pagination?.total || 0}
          page={page}
          onPageChange={(_e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>
    </Box>
  );
};

export default RequestDepositorComp;
