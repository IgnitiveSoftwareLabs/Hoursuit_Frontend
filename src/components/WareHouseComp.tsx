import React, { useMemo, useState } from 'react';
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
  Grid
} from '@mui/material';
import { Add } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useCreateWarehouseMutation, useDeleteWarehouseMutation, useFetchWarehousesQuery, useUpdateWarehouseMutation } from '../RTK/services/warehouseApi';
import { usePermissions } from '../Hooks/usePermissions';

import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import ConfirmationDialog from './Dialog/ConfirmationDialog';
import DynamicTable from './Tables';
import CustomFileUpload from '../Common/CustomFileUpload';
interface WarehouseType {
  id?: number;
  name: string;
  location: string;
  licenseNumber: string;
  CompanyId?: number;
  License_Number_validTill?: string;
  Utility_Certificate_validTill?: string;
  Fssai_Certificate_validTill?: string;
  License_Number: {
    Attachment: File | null;
    damp_proof: File | null;
    proof_of_weight: File | null;
  };
  Utility_Certificate: {
    Attachment: File | null;
    damp_proof: File | null;
    proof_of_weight: File | null;
  }
  Fssai_Certificate: {
    Attachment: File | null;
    damp_proof: File | null;
    proof_of_weight: File | null;
  }
}
const initialValues: WarehouseType = {
  name: '',
  location: '',
  licenseNumber: '',
  License_Number_validTill: '',
  Utility_Certificate_validTill: '',
  Fssai_Certificate_validTill: '',
  License_Number: null,
  Utility_Certificate: null,
  Fssai_Certificate: null
};

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  location: Yup.string().required('Location is required'),
  licenseNumber: Yup.string().required('License Number is required'),
});

const Warehouse: React.FC = () => {
  const { canCreate, canUpdate, canDelete, canRead } = usePermissions();

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isOpen, setOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [editWarehouseId, setEditWarehouseId] = useState<number | null>(null);
  const [deleteWarehouseId, setDeleteWarehouseId] = useState<number | null>(null);

  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // RTK Query hooks
  const { data: Warehousefetch } = useFetchWarehousesQuery(
    { page, limit, search: '' },
  );
  const [createWarehouse] = useCreateWarehouseMutation();
  const [updateWarehouse] = useUpdateWarehouseMutation();
  const [deleteWarehouse, { isLoading: deleting }] = useDeleteWarehouseMutation();


  const formik = useFormik<WarehouseType>({
    initialValues,
    validationSchema,
    onSubmit: async (value: any) => {
      const formData = new FormData();
      Object.entries(value).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      try {
        if (isEdit && editWarehouseId) {
          if (!canUpdate('warehouse')) {
            toast.error('You do not have permission to update warehouses');
            return;
          }
          const response: any = await updateWarehouse({ id: editWarehouseId, data: formData }).unwrap();
          toast.success(response.message);
          setOpen(false);
          setIsEdit(false);
        } else {
          if (!canCreate('warehouse')) {
            toast.error('You do not have permission to create warehouses');
            return;
          }
          const response: any = await createWarehouse(formData).unwrap();
          toast.success(response.message);
          setOpen(false);
        }
        formik.resetForm();

      } catch (error: any) {
        toast.error(error?.data?.message || 'Something went wrong');
        setOpen(false);
      }
    },
  });



  const handleDelete = async (id: any) => {
    if (!canDelete('warehouse')) {
      toast.error('You do not have permission to delete warehouses');
      return;
    }

    try {
      const response: any = await deleteWarehouse(id).unwrap();
      if (response.success) {
        toast.success(response.message);

        setDeleteDialogOpen(false);
        setDeleteWarehouseId(null);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete warehouse');
    }
  };

  const handleEdit = (id: number) => {
    if (!canUpdate('warehouse')) {
      toast.error('You do not have permission to update warehouses');
      return;
    }

    const WarehouseToEdit = Warehousefetch?.result?.find((item: any) => item.id === id);
    if (WarehouseToEdit) {
      formik.setValues({
        name: WarehouseToEdit.name,
        location: WarehouseToEdit.location,
        licenseNumber: WarehouseToEdit.licenseNumber || '',
        License_Number_validTill: WarehouseToEdit.License_Number_validTill || '',
        Utility_Certificate_validTill: WarehouseToEdit.Utility_Certificate_validTill || '',
        Fssai_Certificate_validTill: WarehouseToEdit.Fssai_Certificate_validTill || '',
        License_Number: WarehouseToEdit.License_Number || null,
        Utility_Certificate: WarehouseToEdit.Utility_Certificate || null,
        Fssai_Certificate: WarehouseToEdit.Fssai_Certificate || null
      });
      setEditWarehouseId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };
  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        render: (row: any) => (
          <Link to={`/warehouses/${row.id}`} state={{ item: row }} style={{ textDecoration: 'none' }}>
            {row.name}
          </Link>
        ),
      },
      { key: 'location', label: 'Location' },
      { key: 'licenseNumber', label: 'License Number' },
    ],
    [] // Dependencies array is empty because the columns are static
  );
  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Warehouses
          </Typography>
          <NavbarBreadcrumbs />
        </Box>
        {canCreate('warehouse') && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setOpen(true);
              setIsEdit(false);
              formik.resetForm();
            }}
            sx={{ textTransform: 'none' }}
          >
            <Add sx={{ mr: 1 }} />   Add Warehouse
          </Button>
        )}
      </Box>

      {/* Check read permission before showing content */}
      {!canRead('warehouse') ? (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          flexDirection: 'column',
          gap: 2
        }}>
          <Typography variant="h6" color="text.secondary">
            Access Denied
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You do not have permission to view warehouses.
          </Typography>
        </Box>
      ) : (
        <>
          <Dialog
            open={isOpen}
            onClose={() => setOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>{isEdit ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle>
            <DialogContent>
              <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <FormControl>
                  <FormLabel htmlFor="name">Warehouse Name</FormLabel>
                  <TextField
                    id="name"
                    {...formik.getFieldProps('name')}
                    placeholder="Warehouse Name"
                    fullWidth
                    variant="outlined"
                    error={formik.touched.name && !!formik.errors.name}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="location">Location</FormLabel>
                  <TextField
                    id="location"
                    {...formik.getFieldProps('location')}
                    placeholder="Location"
                    fullWidth
                    variant="outlined"
                    error={formik.touched.location && !!formik.errors.location}
                    helperText={formik.touched.location && formik.errors.location}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel htmlFor="licenseNumber">License Number</FormLabel>
                  <TextField
                    id="licenseNumber"
                    {...formik.getFieldProps('licenseNumber')}
                    placeholder="License Number"
                    fullWidth
                    variant="outlined"
                    error={formik.touched.licenseNumber && !!formik.errors.licenseNumber}
                    helperText={formik.touched.licenseNumber && formik.errors.licenseNumber}
                  />
                </FormControl>
                <FormControl>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <CustomFileUpload
                        name="License_Number"
                        label="License Number"
                        accept="application/pdf,image/*"
                        maxSize={10}
                        onFileSelect={(files) => {
                          const file = files[0] || null;
                          formik.setFieldValue('License_Number', file);
                        }}
                        value={formik.values.License_Number?.['License_Number' as keyof typeof formik.values.License_Number] || null}
                        showPreview
                      />
                      <TextField
                        fullWidth
                        name="License_Number_validTill"
                        label="Valid Till"
                        type="date"
                        value={formik.values.License_Number_validTill}
                        {...formik.getFieldProps('License_Number_validTill')}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2 }}
                        error={formik.touched.License_Number_validTill && !!formik.errors.License_Number_validTill}
                        helperText={formik.touched.License_Number_validTill && formik.errors.License_Number_validTill}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <CustomFileUpload
                        name="Utility_Certificate"
                        label="Utility Certificate"
                        accept="application/pdf,image/*"
                        maxSize={10}
                        onFileSelect={(files) => {
                          const file = files[0] || null;
                          formik.setFieldValue('Utility_Certificate', file);
                        }}
                        value={formik.values.Utility_Certificate?.['Utility_Certificate' as keyof typeof formik.values.Utility_Certificate] || null}
                        showPreview
                      />
                      <TextField
                        fullWidth
                        name="Utility_Certificate_validTill"
                        label="Valid Till"
                        type="date"
                        value={formik.values.Utility_Certificate_validTill}
                        {...formik.getFieldProps('Utility_Certificate_validTill')}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2 }}
                        error={formik.touched.Utility_Certificate_validTill && !!formik.errors.Utility_Certificate_validTill}
                        helperText={formik.touched.Utility_Certificate_validTill && formik.errors.Utility_Certificate_validTill}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <CustomFileUpload
                        name="Fssai_Certificate"
                        label="FSSAI Certificate"
                        accept="application/pdf,image/*"
                        maxSize={10}
                        onFileSelect={(files) => {
                          const file = files[0] || null;
                          formik.setFieldValue('Fssai_Certificate', file);
                        }}
                        value={formik.values.Fssai_Certificate?.['Fssai_Certificate' as keyof typeof formik.values.Fssai_Certificate] || null}
                        showPreview
                      />
                      <TextField
                        fullWidth
                        name="Fssai_Certificate_validTill"
                        label="Valid Till"
                        type="date"
                        value={formik.values.Fssai_Certificate_validTill}
                        {...formik.getFieldProps('Fssai_Certificate_validTill')}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2 }}
                        error={formik.touched.Fssai_Certificate_validTill && !!formik.errors.Fssai_Certificate_validTill}
                        helperText={formik.touched.Fssai_Certificate_validTill && formik.errors.Fssai_Certificate_validTill}
                      />
                    </Grid>
                  </Grid>
                </FormControl>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ textTransform: 'none' }}
                >
                  {isEdit ? 'Update' : 'Submit'}
                </Button>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
                Cancel
              </Button>
            </DialogActions>
          </Dialog>


          <ConfirmationDialog
            open={isDeleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setDeleteWarehouseId(null);
            }}
            onConfirm={() => {
              if (deleteWarehouseId !== null) {
                handleDelete(deleteWarehouseId);
              }
            }
            }
            variant="delete"
            title="Delete Warehouse"
            message={`Are you sure you want to delete this warehouse? This action cannot be undone.`}
            loading={deleting}
          />


          <DynamicTable
            columns={columns}
            data={Warehousefetch?.result || []}
            getRowId={(row) => row.id}
            onEdit={canUpdate('warehouse') ? (id) => handleEdit(Number(id)) : undefined}
            onDelete={canDelete('warehouse') ? (id) => 
            {
              setDeleteWarehouseId(Number(id));
              setDeleteDialogOpen(true);
            } : undefined}
            page={page}
            totalPages={Warehousefetch?.pagination?.totalPages || 1}
            onPageChange={(_event, value) => setPage(value)}
          />
        </>
      )}
    </Box>
  );
};

export default Warehouse;


