import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { Add } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useGetCustomersQuery, useDeleteCustomerMutation } from '../RTK/services/customerApi';
import { Link } from 'react-router-dom';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import DynamicTable from './Tables';
import ConfirmationDialog from './Dialog/ConfirmationDialog';
import CustomerModal from '../components/Dialog/CustomerModal';
import { usePermissions } from '../Hooks/usePermissions';

const CustomerComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isOpen, setOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const { data: customers, isLoading } = useGetCustomersQuery({page});
  const [deleteCustomer] = useDeleteCustomerMutation();

  const handleDelete = async (id: any) => {
    if (!canDelete('customer')) {
      toast.error('You do not have permission to delete customers');
      return;
    }
    
    try {
      const response: any = await deleteCustomer(id).unwrap();
      toast.success(response.message);
      setDeleteDialogOpen(false);
      setDeleteCustomerId(null);
    } catch (error: any) {
      toast.error('Some records are associated with this customer');
    }
  };

  const handleEdit = (id: number) => {
    if (!canUpdate('customer')) {
      toast.error('You do not have permission to edit customers');
      return;
    }
    
    const customerToEdit = customers?.result?.find((item: any) => item.id === id);
    if (customerToEdit) {
      setEditCustomerId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleAddCustomer = () => {
    if (!canCreate('customer')) {
      toast.error('You do not have permission to create customers');
      return;
    }
    
    setEditCustomerId(null);
    setIsEdit(false);
    setOpen(true);
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row: any) => (
        <Link to={`/customer/${row.id}`} state={{ item: row }} style={{ textDecoration: 'none' }}>
          {row.name}
        </Link>
      ),
    },
    { key: 'category', label: 'Category' },
    { key: 'contact', label: 'Contact' },
    { key: 'address', label: 'Address' },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!canRead('customer')) {
    return (
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view customers.
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
            Customers
          </Typography>
          <NavbarBreadcrumbs />
        </Box>
        {canCreate('customer') && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddCustomer}
            sx={{ textTransform: 'none' }}
          >
            <Add sx={{ mr: 1 }} />
            Add Customer
          </Button>
        )}
      </Box>

      <CustomerModal
        open={isOpen}
        onClose={() => setOpen(false)}
        isEdit={isEdit}
        initialValues={isEdit ? customers?.result?.find((item: any) => item.id === editCustomerId) : undefined}
        onSuccess={() => {
          setOpen(false);
          setIsEdit(false);
          setEditCustomerId(null);
        }}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteCustomerId(null);
        }}
        onConfirm={() => deleteCustomerId !== null && handleDelete(deleteCustomerId)}
        variant="delete"
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
      />

      <DynamicTable
        columns={columns}
        data={customers?.result || []}
        getRowId={(row) => row.id}
        onEdit={canUpdate('customer') ? (id) => handleEdit(Number(id)) : undefined}
        onDelete={canDelete('customer') ? (id) => {
          setDeleteCustomerId(Number(id));
          setDeleteDialogOpen(true);
        } : undefined}
        page={page}
        totalPages={customers?.pagination?.totalPages || 1}
        onPageChange={(_event, value) => setPage(value)}
      />
    </Box>
  );
};

export default CustomerComp;