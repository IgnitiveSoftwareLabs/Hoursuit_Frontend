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
  Typography,
  MenuItem,
  TextField,
  Select,
  CircularProgress,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useCreateCommodityMutation, useDeleteCommodityMutation, useGetCommoditiesQuery, useUpdateCommodityMutation } from '../RTK/services/commodityApi';
import ConfirmationDialog from './Dialog/ConfirmationDialog';
import DynamicTable from './Tables';
import { usePermissions } from '../Hooks/usePermissions';

interface CommodityType {
  commodity_id?: number;
  name: string;
  description: string;
  unit_type: string;
  gain_loss_threshold: number;
  units?: string; // Optional field for units, if needed
  
}

const CommodityComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isOpen, setOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [editCommodityId, setEditCommodityId] = useState<number | null>(null);
  const [deleteCommodityId, setDeleteCommodityId] = useState<number | null>(null);
  
  const { data: commodities, isLoading } = useGetCommoditiesQuery() as { data: { result: CommodityType[] } | undefined, isLoading: boolean };
  const [createCommodity] = useCreateCommodityMutation();
const [updateCommodity] = useUpdateCommodityMutation();
const [deleteCommodity] = useDeleteCommodityMutation();
  
  const formik = useFormik<CommodityType>({
    initialValues: {
      name: '',
      description: '',
      unit_type: '',
      gain_loss_threshold: 0,
      units: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      description: Yup.string().required('Description is required'),
      unit_type: Yup.string().required('Unit type is required'),
      gain_loss_threshold: Yup.number()
        .min(0, 'Threshold must be non-negative')
        .required('Threshold is required'),
      units: Yup.string().optional(), // Optional field for units
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit && editCommodityId) {
          if (!canUpdate('commodity')) {
            toast.error('You do not have permission to update commodities');
            return;
          }
          const payload = { id: editCommodityId, payload: values };
          const response: any = await updateCommodity(payload).unwrap();
          toast.success(response.message);
          setOpen(false);
          setIsEdit(false);
        } else {
          if (!canCreate('commodity')) {
            toast.error('You do not have permission to create commodities');
            return;
          }
          const response: any = await createCommodity(values).unwrap();
          toast.success(response.message);
          setOpen(false);
        }
        formik.resetForm();
      } catch (error: any) {
        toast.error(error?.data?.message || 'Something went wrong');
       
      }
    },
  });

  

   

  const handleDelete = async (id: any) => {
    if (!canDelete('commodity')) {
      toast.error('You do not have permission to delete commodities');
      return;
    }
    
    try {
      const response: any = await deleteCommodity(id).unwrap();
      
      if (response.success) {
        toast.success(response.message);
        
        setDeleteDialogOpen(false);
        setDeleteCommodityId(null);
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error?.data?.message || 'Failed to delete commodity');
    }
  };

  const handleEdit = (id: number) => {
    if (!canUpdate('commodity')) {
      toast.error('You do not have permission to edit commodities');
      return;
    }
    
    const commodityToEdit = commodities?.result?.find((item: any) => item.commodity_id === id);
    if (commodityToEdit) {
      formik.setValues({
        name: commodityToEdit.name,
        description: commodityToEdit.description,
        unit_type: commodityToEdit.unit_type,
        gain_loss_threshold: commodityToEdit.gain_loss_threshold,
        units: commodityToEdit.units || '', // Optional field for units
      });
      setEditCommodityId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleAddCommodity = () => {
    if (!canCreate('commodity')) {
      toast.error('You do not have permission to create commodities');
      return;
    }
    
    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
    },
    { key: 'description', label: 'Description' },
    { key: 'unit_type', label: 'Type' },
    { key: 'units', label: 'Unit' },
    { key: 'gain_loss_threshold', label: 'Gain/Loss (%)' },
   
  ];
   if (isLoading) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (!canRead('commodity')) {
      return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <Typography variant="h6" color="error">
              Access Denied: You do not have permission to view commodities.
            </Typography>
          </Box>
        </Box>
      );
    }
  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h3" sx={{ mb: 2 }}>
                  Commodities
                    </Typography>
                    {canCreate('commodity') && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddCommodity}
                        sx={{ textTransform: 'none' }}
                      >
                        <Add sx={{mr:1}}/> Add Commodity
                      </Button>
                    )}
                  </Box>
         

      <Dialog
        open={isOpen}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isEdit ? 'Edit Commodity' : 'Add Commodity'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl>
              <FormLabel htmlFor="name">Commodity Name</FormLabel>
              <TextField
                id="name"
                {...formik.getFieldProps('name')}
                placeholder="Commodity Name"
                fullWidth
                variant="outlined"
                error={formik.touched.name && !!formik.errors.name}
                helperText={formik.touched.name && formik.errors.name}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="description">Description</FormLabel>
              <TextField
                id="description"
                {...formik.getFieldProps('description')}
                placeholder="Description"
                fullWidth
                variant="outlined"
                rows={3}
                error={formik.touched.description && !!formik.errors.description}
                helperText={formik.touched.description && formik.errors.description}
              />
            </FormControl>
            <FormControl>
  <FormLabel htmlFor="unit_type">Type</FormLabel>
  <Select
    id="unit_type"
    {...formik.getFieldProps('unit_type')}
    fullWidth
    variant="outlined"
    error={formik.touched.unit_type && !!formik.errors.unit_type}
    displayEmpty
  >
    <MenuItem value="" disabled>
      Select Type
    </MenuItem>
    <MenuItem value="Gain">Gain</MenuItem>
    <MenuItem value="Loss">Loss</MenuItem>
    <MenuItem value="Exact">Exact</MenuItem>
  </Select>
  {formik.touched.unit_type && formik.errors.unit_type && (
    <Typography variant="caption" color="error">
      {formik.errors.unit_type}
    </Typography>
  )}
</FormControl>
<FormControl>
  <FormLabel htmlFor="units">Unit</FormLabel>
  <Select
    id="units"
    {...formik.getFieldProps('units')}
    fullWidth
    variant="outlined"
    error={formik.touched.units && !!formik.errors.units}
    displayEmpty
  >
    <MenuItem value="" disabled>
      Select Unit
    </MenuItem>
    <MenuItem value="Per Month">Per Month</MenuItem>
    <MenuItem value="Per Year">Per Year</MenuItem>
  </Select>
  {formik.touched.units && formik.errors.units && (
    <Typography variant="caption" color="error">
      {formik.errors.units}
    </Typography>
  )}
</FormControl>
            <FormControl>
              <FormLabel htmlFor="gain_loss_threshold">Gain/Loss (%)</FormLabel>
              <TextField
                id="gain_loss_threshold"
                type="number"
                {...formik.getFieldProps('gain_loss_threshold')}
                placeholder="Threshold"
                fullWidth
                variant="outlined"
                error={formik.touched.gain_loss_threshold && !!formik.errors.gain_loss_threshold}
                helperText={formik.touched.gain_loss_threshold && formik.errors.gain_loss_threshold}
              />
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={formik.isSubmitting}
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
          setDeleteCommodityId(null);
        }}
        onConfirm={() => deleteCommodityId !== null && handleDelete(deleteCommodityId)}
        variant="delete"
        title="Delete Commodity"
        message={`Are you sure you want to delete this commodity? This action cannot be undone.`}

      />

      <DynamicTable
                  columns={columns}
                  data={commodities?.result ?? []}
                  getRowId={(row) => row.commodity_id}
                  onEdit={canUpdate('commodity') ? (id) => {
                    handleEdit(Number(id));
                  } : undefined}
                  onDelete={canDelete('commodity') ? (id => {
                    setDeleteCommodityId(Number(id));
                    setDeleteDialogOpen(true);
                  }) : undefined}
                  
                  />
    </Box>
  );
};

export default CommodityComp;