import React, { useMemo, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import toast from 'react-hot-toast';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import ConfirmationDialog from './Dialog/ConfirmationDialog';
import DynamicTable from './Tables';
import ReusableFormDialog from './Dialog/ReusableFormDialog';
import { useAppDispatch, useAppSelector } from '../Hooks/Reduxhook/hooks';
import {createstackapicall, removestackdetailapicall, updatestackapicall, getstackapicall} from '../Services/Admin/StackApiService';
import { setAddStacks, setDeleteStacks, setStack, setUpdateStacks } from '../Redux/StackSlice';
import { usePermissions } from '../Hooks/usePermissions';
interface StackType {
  id?: number;
  name: string;
  capacity: string;
  capacityUnit: string; // new
  length: string;       // new
  breadth: string;      // new
  height: string;       // new
  sizeUnit: string;     // new
  position?: string;
  GodownId?: number;
}

interface WarehouseType {
  id: number;
  name: string;
  location: string;
  CompanyId?: number;
  licenseNumber?: string;
}

interface GodownType {
  id?: number;
  name: string;
  capacity: string;
  WarehouseId?: number;
  capacityUnit: string; // new
  length: string;       // new
  breadth: string;      // new
  height: string;       // new
  sizeUnit: string;     // new
  location: string;
  availableCapacity: string;
}

const Stacks: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  
  const { id } = useParams<{ id: string }>(); // godown id
  const location = useLocation();
  const godownData = location.state?.item as GodownType | undefined;
  const warehouseData = location.state?.warehouseData as WarehouseType | undefined;
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isOpen, setOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [editStackId, setEditStackId] = useState<number | null>(null);
  const [deleteStackId, setDeleteStackId] = useState<number | null>(null);
  const godownId = Number(id);
  const stacks = useAppSelector((state: any) => state.stack.value); // Assuming godown slice exists
  const dispatch = useAppDispatch();
  // const { data: stacks, isLoading } = useFetchStacksQuery({ godownId, page, limit });
 
  React.useEffect(() => {
    const fetchStacks = async () => {
      try {
        const res = await getstackapicall(godownId); // Fetch stacks and update Redux state
        if (res.success){
          dispatch(setStack(res.result)); // Dispatch action to update Redux state

        }
      } catch (error) {
        console.error('Failed to fetch stacks:', error);
        toast.error('Failed to fetch stacks');
      }
    };
  
    fetchStacks();
  }, [godownId]);
 

  const formik = useFormik<StackType>({
    initialValues: {
      name: '',
      capacity: '',
      capacityUnit: '',
      length: '',
      breadth: '',
      height: '',
      sizeUnit: '',
      position: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      capacity: Yup.string().required('Capacity is required'),
      capacityUnit: Yup.string().required('Capacity Unit is required'),
      length: Yup.string().required('Length is required'),
      breadth: Yup.string().required('Breadth is required'),
      height: Yup.string().required('Height is required'),
      sizeUnit: Yup.string().required('Size Unit is required'),
      position: Yup.string().optional(),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit && editStackId) {
          if (!canUpdate('stack')) {
            toast.error('You do not have permission to update stacks');
            return;
          }
          const res = await updatestackapicall({ id: editStackId, ...values }); // Update stack and update Redux state
          if (res.success){
            dispatch(setUpdateStacks(res.result)); // Dispatch action to update Redux state
            toast.success('Stack updated successfully');
          setOpen(false);
          setIsEdit(false);
          setEditStackId(null);
          formik.resetForm();
          }
          
        } else {
          if (!canCreate('stack')) {
            toast.error('You do not have permission to create stacks');
            return;
          }
          const res =await createstackapicall({GodownId: godownId, ...values}); // Create stack and update Redux state
          if(res.success){
            dispatch(setAddStacks(res.result)); // Dispatch action to update Redux state
            toast.success('Stack created successfully');
            setOpen(false);
          formik.resetForm();
          }
        }
        formik.resetForm();
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Something went wrong');
       
      }
    },
  });

  const handleDelete = async (id: any) => {
    if (!canDelete('stack')) {
      toast.error('You do not have permission to delete stacks');
      return;
    }
    
    try {
      const res = await removestackdetailapicall(id); // Delete stack and update Redux state
      if (res.success){
       dispatch(setDeleteStacks(id)); // Dispatch action to update Redux state
       toast.success('Stack deleted successfully');
       setDeleteDialogOpen(false);
       setDeleteStackId(null);
      }
       
     } catch (error) {
       toast.error('Failed to delete stack');
     }
  };

  const handleEdit = (id: number) => {
    if (!canUpdate('stack')) {
      toast.error('You do not have permission to edit stacks');
      return;
    }
    
    const stackToEdit = stacks?.find((item: any) => item.id === id);
    if (stackToEdit) {
      formik.setValues({
        name: stackToEdit.name,
        capacity: String(stackToEdit.capacity),
        capacityUnit: stackToEdit.capacityUnit || '',
        length: String(stackToEdit.length || ''),
        breadth: String(stackToEdit.breadth || ''),
        height: String(stackToEdit.height || ''),
        sizeUnit: stackToEdit.sizeUnit || '',
        position: stackToEdit.position || '',
      });
      setEditStackId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleAddStack = () => {
    if (!canCreate('stack')) {
      toast.error('You do not have permission to create stacks');
      return;
    }
    
    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };
  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      render: (row: any) => (
        <Typography variant="body2" color="text.primary">{row.name}</Typography>
      ),
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (row: any) => `${row.capacity} ${row.capacityUnit || ''}`,
    },
    {
      key: 'availableCapacity',
      label: 'Available Capacity',
      render: (row: any) => `${row.availableCapacity} ${row.capacityUnit || ''}`,
    },
    { key: 'length', label: 'Length' },
    { key: 'breadth', label: 'Breadth' },
    { key: 'height', label: 'Height' },
    { key: 'sizeUnit', label: 'Size Unit' },
    { key: 'position', label: 'Position' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => {
        const canEditDelete = parseFloat(row.capacity) === parseFloat(row.availableCapacity);
        
        if (!canEditDelete) {
          return null; // Hide actions if capacity != availableCapacity
        }

        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canUpdate('stack') && (
              <IconButton 
                color="primary" 
                onClick={() => handleEdit(row.id)}
                size="small"
              >
                <Edit />
              </IconButton>
            )}
            {canDelete('stack') && (
              <IconButton 
                color="error" 
                onClick={() => {
                  setDeleteStackId(row.id);
                  setDeleteDialogOpen(true);
                }}
                size="small"
              >
                <Delete />
              </IconButton>
            )}
          </Box>
        );
      },
    },
  ], [canUpdate, canDelete]);

  // Memoize fields to prevent unnecessary re-renders
  const fields = useMemo(() => [
    {
      name: 'name',
      label: 'Stack Name',
      placeholder: 'Enter stack name',
      gridSize: { xs: 12, sm: 4 },
    },
    {
      name: 'capacity',
      label: 'Capacity',
      placeholder: 'Enter capacity',
      gridSize: { xs: 12, sm: 4 },
    },
    {
      name: 'capacityUnit',
      label: 'Capacity Unit',
      placeholder: 'e.g., kg, tons',
      gridSize: { xs: 12, sm: 4 },
      type: 'select' as 'select',
      options: ['kg', 'tons', 'quintals', 'liters'],
    },
    {
      name: 'length',
      label: 'Length',
      placeholder: 'Enter length',
      gridSize: { xs: 12, sm: 4 },
    },
    {
      name: 'breadth',
      label: 'Breadth',
      placeholder: 'Enter breadth',
      gridSize: { xs: 12, sm: 4 },
    },
    {
      name: 'height',
      label: 'Height',
      placeholder: 'Enter height',
      gridSize: { xs: 12, sm: 4 },
    },
    {
      name: 'sizeUnit',
      label: 'Size Unit',
      placeholder: 'e.g., m, ft',
      gridSize: { xs: 12, sm: 4 },
      type: 'select' as 'select',
      options: ['meters', 'feet', 'inches', 'centimeters'],
    },
    {
      name: 'position',
      label: 'Position',
      placeholder: 'Enter position',
      gridSize: { xs: 12, sm: 4 },
    },
  ], []);
  
  if (!canRead('stack')) {
    return (
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view stacks.
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
            Stacks for Godown: {godownData?.name || 'Loading...'}
          </Typography>
          <NavbarBreadcrumbs />
        </Box>
        {canCreate('stack') && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddStack}
            sx={{ textTransform: 'none' }}
          >
            <Add sx={{ mr: 1 }} /> Add Stack
          </Button>
        )}
      </Box>

      {/* Warehouse Details */}
      {warehouseData && (
              <Card
                variant="outlined"
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  backgroundColor: (theme) => theme.palette.background.paper,
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Warehouse Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 5 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Name:
                      </Typography>
                      <Typography variant="body1">{warehouseData.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Location:
                      </Typography>
                      <Typography variant="body1">{warehouseData.location}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        License Number:
                      </Typography>
                      <Typography variant="body1">
                        {warehouseData.licenseNumber || 'Not provided'}
                      </Typography>
                      </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

      {/* Godown Details */}
      {godownData && (
        <Card
          variant="outlined"
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            backgroundColor: (theme) => theme.palette.background.paper,
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Godown Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Name:
                </Typography>
                <Typography variant="body1">{godownData.name}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Capacity:
                </Typography>
                <Typography variant="body1">{godownData.capacity} {godownData.capacityUnit}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Available Capacity:
                </Typography>
                <Typography variant="body1">{godownData.availableCapacity}{godownData.capacityUnit}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Location:
                </Typography>
                <Typography variant="body1">{godownData.location}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Length:
                </Typography>
                <Typography variant="body1">{godownData.length}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Breadth:
                </Typography>
                <Typography variant="body1">{godownData.breadth}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Height:
                </Typography>
                <Typography variant="body1">{godownData.height}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Unit:
                </Typography>
                <Typography variant="body1">{godownData.sizeUnit}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

     
      <ReusableFormDialog
  open={isOpen}
  title={isEdit ? 'Edit Stack' : 'Add Stack'}
  formik={formik}
  onClose={() => setOpen(false)}
  isEdit={isEdit}
  fields={fields}
/>

 
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteStackId(null);
        }
        }
        onConfirm={() => {
          if (deleteStackId !== null) {
            handleDelete(deleteStackId);
          }
        }
        }
        variant="delete"
        title="Delete Stack"
        message={`Are you sure you want to delete this stack? This action cannot be undone.`}
       
      />

  <DynamicTable
      columns={columns}
      data={stacks || []}
      getRowId={(row) => row.id}
      />
    </Box>
  );
};

export default Stacks;
