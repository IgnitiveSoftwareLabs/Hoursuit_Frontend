
import type {} from '@mui/x-date-pickers/themeAugmentation';
import type {} from '@mui/x-charts/themeAugmentation';
import type {} from '@mui/x-data-grid-pro/themeAugmentation';
import type {} from '@mui/x-tree-view/themeAugmentation';
import Layout from '../../components/Layout/index'



import React, { useState } from 'react';
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
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';

import {
  useCreateGradeMutation,
  useDeleteGradeMutation,
  useGetGradesQuery,
  useUpdateGradeMutation,
} from '../../RTK/services/gradeApi';

import ConfirmationDialog from '../../components/Dialog/ConfirmationDialog';
import DynamicTable from '../../components/Tables';
import { usePermissions } from '../../Hooks/usePermissions';

interface GradeType {
  id?: number;
  name: string;
  companyId?: number;
}

const GradeComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  
  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editGradeId, setEditGradeId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteGradeId, setDeleteGradeId] = useState<number | null>(null);

  const { data: grades } = useGetGradesQuery();
  const [createGrade] = useCreateGradeMutation();
  const [updateGrade] = useUpdateGradeMutation();
  const [deleteGrade] = useDeleteGradeMutation();

  const formik = useFormik<GradeType>({
    initialValues: {
      name: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit && editGradeId) {
          if (!canUpdate('grade')) {
            toast.error('You do not have permission to update grades');
            return;
          }
          const response = await updateGrade({ id: editGradeId, payload: values }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate('grade')) {
            toast.error('You do not have permission to create grades');
            return;
          }
          const response = await createGrade(values).unwrap();
          toast.success(response.message);
        }

        formik.resetForm();
        setOpen(false);
        setIsEdit(false);
      } catch (error: any) {
        toast.error(error?.data?.message || 'Something went wrong');
        setOpen(false);
      }
    },
  });

  const handleEdit = (id: number) => {
    if (!canUpdate('grade')) {
      toast.error('You do not have permission to edit grades');
      return;
    }
    
    const grade = grades?.result?.find((g: any) => g.id === id);
    if (grade) {
      formik.setValues({ name: grade.name });
      setEditGradeId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete('grade')) {
      toast.error('You do not have permission to delete grades');
      return;
    }
    
    try {
      const response = await deleteGrade(id).unwrap();
      toast.success(response.message);
      setDeleteGradeId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error('Failed to delete grade');
    }
  };

  const handleAddGrade = () => {
    if (!canCreate('grade')) {
      toast.error('You do not have permission to create grades');
      return;
    }
    
    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    {
      key: 'name',
      label: 'Grade Name',
    },
  ];

  if (!canRead('grade')) {
    return (
      <Layout>
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <Typography variant="h6" color="error">
              Access Denied: You do not have permission to view grades.
            </Typography>
          </Box>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h3">Grades</Typography>
        {canCreate('grade') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleAddGrade}
          >
            Add Grade
          </Button>
        )}
      </Box>

      <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Grade' : 'Add Grade'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel htmlFor="name">Grade Name</FormLabel>
              <TextField
                id="name"
                fullWidth
                variant="outlined"
                {...formik.getFieldProps('name')}
                error={formik.touched.name && !!formik.errors.name}
                helperText={formik.touched.name && formik.errors.name}
              />
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={formik.isSubmitting}
            >
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
          setDeleteGradeId(null);
        }}
        onConfirm={() => deleteGradeId !== null && handleDelete(deleteGradeId)}
        variant="delete"
        title="Delete Grade"
        message="Are you sure you want to delete this grade? This action cannot be undone."
      />

      <DynamicTable
        columns={columns}
        data={grades?.result || []}
        getRowId={(row) => row.id}
        onEdit={canUpdate('grade') ? (id) => handleEdit(Number(id)) : undefined}
        onDelete={canDelete('grade') ? (id) => {
          setDeleteGradeId(Number(id));
          setDeleteDialogOpen(true);
        } : undefined}
        
      />
    </Box>
    </Layout>
  );
};

export default GradeComp;

