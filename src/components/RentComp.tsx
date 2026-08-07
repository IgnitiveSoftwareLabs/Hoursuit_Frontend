import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
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
  Select,
  MenuItem,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  useCreateRentMutation,
  useDeleteRentMutation,
  useGetRentsQuery,
  useUpdateRentMutation,
} from '../RTK/services/rentApi';
import ConfirmationDialog from './Dialog/ConfirmationDialog';
import DynamicTable from './Tables';
import { usePermissions } from '../Hooks/usePermissions';


interface RentType {
  rent_id?: number;
  name: string;
  rent_type: 'Daily' | 'Fortnight' | 'Monthly';
  rent_basis: 'Kg' | 'Quintal' | 'Sqft' | 'Flat';
  description: string;

}

const rentTypeOptions = ['Daily', 'Fortnight', 'Monthly'];
const rentBasisOptions = ['Kg', 'Quintal', 'Sqft', 'Flat'];

const RentComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editRentId, setEditRentId] = useState<number | null>(null);
  const [deleteRentId, setDeleteRentId] = useState<number | null>(null);

  const { data: rents } = useGetRentsQuery();
  const [createRent] = useCreateRentMutation();
  const [updateRent] = useUpdateRentMutation();
  const [deleteRent] = useDeleteRentMutation();

  const formik = useFormik<RentType>({
    initialValues: {
      name: '',
      rent_type: 'Monthly',
      rent_basis: 'Flat',
      description: '',
    
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      rent_type: Yup.string().oneOf(rentTypeOptions).required('Rent type is required'),
      rent_basis: Yup.string().oneOf(rentBasisOptions).required('Rent basis is required'),
      description: Yup.string().nullable()
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit && editRentId) {
          if (!canUpdate('rent')) {
            toast.error('You do not have permission to update rents');
            return;
          }
          const payload = { id: editRentId, payload: values };
          const response: any = await updateRent(payload).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate('rent')) {
            toast.error('You do not have permission to create rents');
            return;
          }
          const response: any = await createRent(values).unwrap();
          toast.success(response.message);
        }
        setOpen(false);
        setIsEdit(false);
        formik.resetForm();
      } catch (error: any) {
        toast.error(error?.data?.message || 'Something went wrong');
      }
    },
  });

  const handleDelete = async (id: number) => {
    if (!canDelete('rent')) {
      toast.error('You do not have permission to delete rents');
      return;
    }
    
    try {
      const response: any = await deleteRent(id).unwrap();
      if (response.success) {
        toast.success(response.message);
        setDeleteDialogOpen(false);
        setDeleteRentId(null);
      }
    } catch {
      toast.error('Some records are associated with this rent');
    }
  };

  const handleEdit = (rent_id: number) => {
    if (!canUpdate('rent')) {
      toast.error('You do not have permission to edit rents');
      return;
    }
    
    const rentToEdit = rents?.result?.find((r: any) => r.rent_id === rent_id);
    if (rentToEdit) {
      formik.setValues({
        name: rentToEdit.name,
        rent_type: rentToEdit.rent_type,
        rent_basis: rentToEdit.rent_basis,
        description: rentToEdit.description,
       
      });
      setEditRentId(rent_id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleAddRent = () => {
    if (!canCreate('rent')) {
      toast.error('You do not have permission to create rents');
      return;
    }
    
    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'rent_type', label: 'Type' },
    { key: 'rent_basis', label: 'Basis' },
    { key: 'rate_unit', label: 'Rate Unit' },
    { key: 'description', label: 'Description' },
    
  ];

  if (!canRead('rent')) {
    return (
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view rents.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3">Rents</Typography>
        {canCreate('rent') && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddRent}
          >
            <Add sx={{ mr: 1 }} />
            Add Rent
          </Button>
        )}
      </Box>

      <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Rent' : 'Add Rent'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <FormLabel>Name</FormLabel>
            <TextField
              {...formik.getFieldProps('name')}
              error={formik.touched.name && !!formik.errors.name}
              helperText={formik.touched.name && formik.errors.name}
              fullWidth
            />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel>Rent Basis</FormLabel>
              <Select {...formik.getFieldProps('rent_basis')} fullWidth>
                {rentBasisOptions.map((basis) => (
                  <MenuItem key={basis} value={basis}>{basis}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <FormLabel>Rent Type</FormLabel>
              <Select {...formik.getFieldProps('rent_type')} fullWidth>
                {rentTypeOptions.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>

            
            <FormControl fullWidth>
            <FormLabel>Description</FormLabel>

            <TextField
             
              {...formik.getFieldProps('description')}
              error={formik.touched.description && !!formik.errors.description}
              helperText={formik.touched.description && formik.errors.description}
              fullWidth
              
              rows={3}
            />
            </FormControl>
           

            <Button type="submit" variant="contained" color="primary" fullWidth disabled={formik.isSubmitting}>
              {isEdit ? 'Update' : 'Submit'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteRentId(null);
        }}
        onConfirm={() => deleteRentId !== null && handleDelete(deleteRentId)}
        variant="delete"
        title="Delete Rent"
        message="Are you sure you want to delete this rent? This action cannot be undone."
      />

      <DynamicTable
        columns={columns}
        data={rents?.result || []}
        getRowId={(row) => row.rent_id}
        onEdit={canUpdate('rent') ? (id) => handleEdit(Number(id)) : undefined}
        onDelete={canDelete('rent') ? (id) => {
          setDeleteRentId(Number(id));
          setDeleteDialogOpen(true);
        } : undefined}
      />
    </Box>
  );
};

export default RentComp;
