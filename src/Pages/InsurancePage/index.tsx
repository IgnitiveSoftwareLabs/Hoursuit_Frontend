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
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  useCreateInsuranceMutation,
  useDeleteInsuranceMutation,
  useGetInsurancesQuery,
  useUpdateInsuranceMutation,
} from '../../RTK/services/insuranceApi';
import ConfirmationDialog from '../../components/Dialog/ConfirmationDialog';
import DynamicTable from '../../components/Tables/index';
import Layout from '../../components/Layout';
import { usePermissions } from '../../Hooks/usePermissions';

interface InsuranceType {
  id?: number;
  insurance_company_name: string;
  amount_for_insurance: number;
  start_date?: string;
  end_date?: string;
}

const InsuranceComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  // Check read permission
  if (!canRead('insurance')) {
    return (
      <Layout>
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
          <Typography variant="h4" sx={{ textAlign: 'center', mt: 4, color: 'error.main' }}>
            Access Denied: Insufficient permissions to view insurance
          </Typography>
        </Box>
      </Layout>
    );
  }

  function formatDate(dateInput: any): string {
        if (!dateInput) return 'N/A';
      
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return 'Invalid Date';
      
        return new Intl.DateTimeFormat('en-IN', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        }).format(date); // Example: "25 Jul 2025"
      }
  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editInsuranceId, setEditInsuranceId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInsuranceId, setDeleteInsuranceId] = useState<number | null>(null);

  const { data: insurances } = useGetInsurancesQuery();
  const [createInsurance] = useCreateInsuranceMutation();
  const [updateInsurance] = useUpdateInsuranceMutation();
  const [deleteInsurance] = useDeleteInsuranceMutation();

  const formik = useFormik<InsuranceType>({
    initialValues: {
      insurance_company_name: '',
      amount_for_insurance: 0,
      start_date: '',
      end_date: '',
    },
    validationSchema: Yup.object({
      insurance_company_name: Yup.string().required('Company name is required'),
      amount_for_insurance: Yup.number()
        .min(0, 'Amount must be positive')
        .required('Amount is required'),
      start_date: Yup.date().nullable(),
      end_date: Yup.date().nullable(),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit && editInsuranceId !== null) {
          if (!canUpdate('insurance')) {
            toast.error('Access denied: Insufficient permissions to update insurance');
            return;
          }
          const response = await updateInsurance({
            id: editInsuranceId,
            payload: values,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate('insurance')) {
            toast.error('Access denied: Insufficient permissions to create insurance');
            return;
          }
          const response = await createInsurance(values).unwrap();
          toast.success(response.message);
        }
        setOpen(false);
        formik.resetForm();
        setIsEdit(false);
      } catch (error: any) {
        toast.error(error?.data?.message || 'Something went wrong');
      }
    },
  });

  const handleEdit = (id: number) => {
    if (!canUpdate('insurance')) {
      toast.error('Access denied: Insufficient permissions to edit insurance');
      return;
    }

    const insuranceToEdit = insurances?.result?.find((item: any) => item.id === id);
    if (insuranceToEdit) {
      formik.setValues({
        insurance_company_name: insuranceToEdit.insurance_company_name,
        amount_for_insurance: parseFloat(insuranceToEdit.amount_for_insurance),
        start_date: insuranceToEdit.start_date?.slice(0, 10) || '',
        end_date: insuranceToEdit.end_date?.slice(0, 10) || '',
      });
      setEditInsuranceId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete('insurance')) {
      toast.error('Access denied: Insufficient permissions to delete insurance');
      return;
    }

    try {
      const response = await deleteInsurance(id).unwrap();
      toast.success(response.message);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error('Unable to delete: Associated records exist');
    }
  };

  const columns = [
    { key: 'insurance_company_name', label: 'Insurance Company' },
    { key: 'amount_for_insurance', label: 'Amount' },
    {
        key: 'start_date',
        label: 'Start Date',
        render: (row: any) => formatDate(row.start_date),
      },
      {
        key: 'end_date',
        label: 'End Date',
        render: (row: any) => formatDate(row.end_date),
      },
  ];

  return (
    <Layout>
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Insurances
        </Typography>
        {canCreate('insurance') && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (!canCreate('insurance')) {
                toast.error('Access denied: Insufficient permissions to create insurance');
                return;
              }
              formik.resetForm();
              setOpen(true);
              setIsEdit(false);
            }}
            sx={{ textTransform: 'none' }}
          >
            <Add sx={{ mr: 1 }} />
            Add Insurance
          </Button>
        )}
      </Box>

      {/* Form Dialog */}
      <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Insurance' : 'Add Insurance'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl>
              <FormLabel htmlFor="insurance_company_name">Insurance Company Name</FormLabel>
              <TextField
                id="insurance_company_name"
                {...formik.getFieldProps('insurance_company_name')}
                placeholder="Company Name"
                variant="outlined"
                fullWidth
                error={formik.touched.insurance_company_name && !!formik.errors.insurance_company_name}
                helperText={formik.touched.insurance_company_name && formik.errors.insurance_company_name}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="amount_for_insurance">Amount</FormLabel>
              <TextField
                id="amount_for_insurance"
                type="number"
                {...formik.getFieldProps('amount_for_insurance')}
                placeholder="Amount"
                fullWidth
                variant="outlined"
                error={formik.touched.amount_for_insurance && !!formik.errors.amount_for_insurance}
                helperText={formik.touched.amount_for_insurance && formik.errors.amount_for_insurance}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="start_date">Start Date</FormLabel>
              <TextField
                id="start_date"
                type="date"
                {...formik.getFieldProps('start_date')}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="end_date">End Date</FormLabel>
              <TextField
                id="end_date"
                type="date"
                {...formik.getFieldProps('end_date')}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </FormControl>

            <Button type="submit" variant="contained" color="primary" fullWidth>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => deleteInsuranceId !== null && handleDelete(deleteInsuranceId)}
        variant="delete"
        title="Delete Insurance"
        message="Are you sure you want to delete this insurance? This action cannot be undone."
      />

      {/* Table Display */}
      <DynamicTable
        columns={columns}
        data={insurances?.result || []}
        getRowId={(row) => row.id}
        onEdit={canUpdate('insurance') ? (id) => handleEdit(Number(id)) : undefined}
        onDelete={canDelete('insurance') ? (id) => {
          setDeleteInsuranceId(Number(id));
          setDeleteDialogOpen(true);
        } : undefined}
      />
    </Box>
    </Layout>
  );
};

export default InsuranceComp;
