import React, { useEffect } from 'react';
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
  TableContainer,
  TableHead,
  TableCell,
  TableRow,
  Table,
  TableBody,
} from '@mui/material';
import toast from 'react-hot-toast';
import CustomFileUpload from '../../Common/CustomFileUpload';
import { useCreateRequestDepositorMutation, useUpdateRequestDepositorMutation } from '../../RTK/services/requestDepositorApi';
import { useGetGradesQuery } from '../../RTK/services/gradeApi';
import { useGetRentsQuery } from '../../RTK/services/rentApi';

interface RequestDepositorType {
  id?: number;
  clientId: number;
  clientName?: string;
  Deposit_date: string;
  warehouseId?: number;
  warehouseName?: string;
  godown_id?: number;
  godownName?: string;
  stack_id?: number;
  stackName?: string;
  CommodityId: number;
  commodityName?: string;
  stock_registr_page_number: number;
  deposit_ledger_page_number: number;
  Description_of_goods: string;
  grade_or_quality: string;
  details_of_number_of_bags_sacks: number;
  any_marks_on_bags_detail: string;
  measurment_or_weight: number;
  weightUnit: string;
  market_price: number;
  total_cost_of_goods: number;
  damp_proof: string;
  proof_of_weight: string;
  CompanyId?: number;
  attachments?: {
    Attachment: File | null;
    damp_proof: File | null;
    proof_of_weight: File | null;
  };
  rent_id?: number;
  rent_amount?: number; // New field for rent amount
  // New fields for multiple locations
  warehouses?: { id: number; name: string }[];
  godowns?: { id: number; name: string }[];
  stacks?: { id: number; name: string }[];
  gatePassDetails?: {
    id: number;
    name: string;
    warehouse: { name: string };
    godown: { name: string };
    stack: { name: string };
    bags: number;
    weight: string;
  }[];
  client?: {
    id: number;
    name: string;
    contact: string;
  };
  commodity?: {
    commodity_id: number;
    name: string;
    unit_type: string;
  };
  gatePasses?: {
    id: number;
    name: string;
    warehouse: { name: string };
    godown: { name: string };
    stack: { name: string };
    no_of_bags: number;
    weight: string;
  }[];
}

interface RequestDepositorFormProps {
  open: boolean;
  onClose: () => void;
  isEdit: boolean;
  initialValues?: RequestDepositorType;
  editId?: number | null;
  selectedGatePassIds?: number[];
  onSuccess?: () => void;
}

const RequestDepositorForm: React.FC<RequestDepositorFormProps> = ({
  open,
  onClose,
  isEdit,
  initialValues,
  editId,
  selectedGatePassIds = [],
  onSuccess,
}) => {

  const [createDepositor] = useCreateRequestDepositorMutation();
  const [updateDepositor] = useUpdateRequestDepositorMutation();
  const { data: grades, isLoading: gradeLoading } = useGetGradesQuery();
  const { data: rents, isLoading: isRentLoading } = useGetRentsQuery();
  const selectedGatePasses = selectedGatePassIds?.map((id) => ({
    id,
    name: `Gate Pass ${id}`, // Replace with actual data fetching logic
    warehouse: initialValues?.warehouses?.find((w) => w.id === id) || { name: 'Unknown Warehouse' },
    godown: initialValues?.godowns?.find((g) => g.id === id) || { name: 'Unknown Godown' },
    stack: initialValues?.stacks?.find((s) => s.id === id) || { name: 'Unknown Stack' },
  }));

  const renderSelectedGatePassTable = () => (
    <TableContainer  sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Gate Pass ID</TableCell>
            <TableCell>Warehouse</TableCell>
            <TableCell>Godown</TableCell>
            <TableCell>Stack</TableCell>
            <TableCell>No. of Bags</TableCell>
            <TableCell>Weight</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          { isEdit ? initialValues?.gatePasses?.map((gatePass) => (
            <TableRow key={gatePass.id}>
              <TableCell>{gatePass.id}</TableCell>
              <TableCell>{gatePass.warehouse.name}</TableCell>
              <TableCell>{gatePass.godown.name}</TableCell>
              <TableCell>{gatePass.stack.name}</TableCell>
              <TableCell>{gatePass.no_of_bags || 'N/A'}</TableCell>
              <TableCell>{gatePass.weight || 'N/A'}</TableCell>
            </TableRow>
          )) : 
            initialValues?.gatePassDetails?.map((gatePass) => (
            <TableRow key={gatePass.id}>
              <TableCell>{gatePass.id}</TableCell>
              <TableCell>{gatePass.warehouse.name}</TableCell>
              <TableCell>{gatePass.godown.name}</TableCell>
              <TableCell>{gatePass.stack.name}</TableCell>
              <TableCell>{gatePass.bags || 'N/A'}</TableCell>
              <TableCell>{gatePass.weight || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
  const formik = useFormik<RequestDepositorType>({
    initialValues: initialValues || {
      clientId: 0,
      clientName: '',
      Deposit_date: new Date().toISOString().split('T')[0],
      warehouseId: 0,
      warehouseName: '',
      godown_id: 0,
      godownName: '',
      stack_id: 0,
      stackName: '',
      CommodityId: 0,
      commodityName: '',
      stock_registr_page_number: 0,
      deposit_ledger_page_number: 0,
      Description_of_goods: '',
      grade_or_quality: '',
      details_of_number_of_bags_sacks: 0,
      any_marks_on_bags_detail: '',
      measurment_or_weight: 0,
      weightUnit: 'quintals', // Default weight unit
      market_price: 0,
      total_cost_of_goods: 0,
      damp_proof: '',
      proof_of_weight: '',
      rent_id: 0,
      rent_amount: 0, // New field for rent amount
      attachments: {
        Attachment: null,
        damp_proof: null,
        proof_of_weight: null,
      },
      warehouses: [],
      godowns: [],
      stacks: [],
      client: {
        id: 0,
        name: '',
        contact: ''
      },
      commodity: {
        commodity_id: 0, 
        name: '',
        unit_type: ''
      }
    },
    enableReinitialize: true, // Ensure form reinitializes when initialValues change
    validationSchema: Yup.object({
      clientId: Yup.number().min(1, 'Please select a customer').required('Customer is required'),
      Deposit_date: Yup.string().required('Deposit date is required'),
      warehouseId: isEdit ? Yup.number().min(1, 'Please select a warehouse').optional().nullable() : Yup.number().min(1, 'Please select a warehouse').required('Warehouse is required'),
      godown_id: isEdit ? Yup.number().min(1, 'Please select a godown').optional().nullable() : Yup.number().min(1, 'Please select a godown').required('Godown is required'),
      stack_id: isEdit ? Yup.number().min(1, 'Please select a stack').optional().nullable() : Yup.number().min(1, 'Please select a stack').required('Stack is required'),
      CommodityId: Yup.number().min(1, 'Please select a commodity').required('Commodity is required'),
      stock_registr_page_number: Yup.number().optional().nullable(),
        // .min(1, 'Stock register page number must be positive')
        // .required('Stock register page number is required'),
      deposit_ledger_page_number: Yup.number().optional().nullable(),
        // .min(1, 'Deposit ledger page number must be positive')
        // .required('Deposit ledger page number is required'),
      Description_of_goods: Yup.string().nullable(),
      grade_or_quality: Yup.string().required('Grade or quality is required'),
      details_of_number_of_bags_sacks: Yup.number()
    .min(0, 'Details of number of bags/sacks must be non-negative')
    .max(
      initialValues?.details_of_number_of_bags_sacks || Number.MAX_SAFE_INTEGER,
      `Number of bags/sacks cannot exceed initial value of ${initialValues?.details_of_number_of_bags_sacks || 'unknown'}`
    )
    .required('Details of number of bags/sacks is required'),
  any_marks_on_bags_detail: Yup.string(),
  measurment_or_weight: Yup.number()
    .min(0, 'Measurement or weight must be non-negative')
    .max(
      initialValues?.measurment_or_weight || Number.MAX_SAFE_INTEGER,
      `Measurement or weight cannot exceed initial value of ${initialValues?.measurment_or_weight || 'unknown'}`
    )
    .required('Measurement or weight is required'),
      weightUnit: Yup.string().oneOf(['kg', 'tons', 'quintals', 'liters'], 'Invalid weight unit').required('Weight unit is required'),
      market_price: Yup.number()
        .min(0, 'Market price must be non-negative')
        .required('Market price is required'),
      total_cost_of_goods: Yup.number()
        .min(0, 'Total cost must be non-negative')
        .required('Total cost is required'),
      damp_proof: Yup.string().nullable(),
      proof_of_weight: Yup.string().nullable(),
      rent_id: Yup.number().min(1, 'Please select a rent').required('Rent is required'),
      rent_amount: Yup.number()
        .min(0, 'Rent amount must be non-negative')
        .required('Rent amount is required'),
    }),
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        debugger
        const formData = new FormData();
        //append selected gate passes array to formData
        if (selectedGatePasses.length > 0) {
         
          formData.append('gate_passes', JSON.stringify(selectedGatePasses.map(gp => gp.id)));
        }
        if (values.warehouses) {
          formData.append('warehouses', JSON.stringify(values.warehouses));
        }
        if (values.godowns) {
          formData.append('godowns', JSON.stringify(values.godowns));
        }
        if (values.stacks) {
          formData.append('stacks', JSON.stringify(values.stacks));
        }
        if (values.Description_of_goods) {
          formData.append('Description_of_goods', values.Description_of_goods);
        }
        if (values.damp_proof) {
          formData.append('damp_proof', values.damp_proof);
        }
        if (values.proof_of_weight) {
          formData.append('proof_of_weight', values.proof_of_weight);
        }
        Object.entries(values).forEach(([key, val]) => {
          if (key === 'attachments' && val) {
            Object.entries(val).forEach(([attachmentKey, file]) => {
              if (file instanceof File) {
                formData.append(attachmentKey, file);
              }
            });
          } else if (
            isEdit && 
            key === "Description_of_goods" &&
            val !== initialValues.Description_of_goods) {
            formData.append(key, val.toString());
          } else if (
            isEdit && 
            key === "damp_proof" &&
            val !== initialValues.damp_proof) {
            formData.append(key, val.toString());
          } else if (
            isEdit && 
            key === "proof_of_weight" &&
            val !== initialValues.proof_of_weight) {
            formData.append(key, val.toString());
          } else if (
            val !== null &&
            val !== undefined &&
            val !== '' &&
            !['clientName', 'commodityName', 'warehouseName', 'godownName','stackName','warehouses', 'godowns', 'stacks'].includes(key)
          ) {
            formData.append(key, val.toString());
          }
        });

        if (isEdit && editId) {
          debugger
          const payload = { id: editId, payload: formData };
          const response: any = await updateDepositor(payload).unwrap();
          toast.success(response.message || 'Depositor updated successfully');
        } else {
          const response: any = await createDepositor(formData).unwrap();
          toast.success(response.message || 'Depositor created successfully');
        }
        if (onSuccess) {
          onSuccess();
        }
        onClose();
        formik.resetForm();
      } catch (error: any) {
        toast.error(error?.data?.message || 'Something went wrong');
        console.error('Error submitting form:', error);
      }
    },
  });

 


  const renderAttachmentFields = () => {
    const attachmentFields = ['Attachment', 'damp_proof', 'proof_of_weight'];
    return attachmentFields.map((field) => (
      <FormControl key={field}>
        <CustomFileUpload
          name={field}
          label={field.replace('_', ' ').toUpperCase()}
          accept="application/pdf,image/*"
          maxSize={5}
          onFileSelect={(files) => {
            const file = files[0] || null;
            formik.setFieldValue(`attachments.${field}`, file);
          }}
          value={formik.values.attachments?.[field as keyof typeof formik.values.attachments] || null}
          error={!!formik.errors.attachments?.[field as keyof typeof formik.values.attachments]}
          
        />
      </FormControl>
    ));
  };
  useEffect(() => {
    const marketPrice = formik.values.market_price || 0;
    const measurementOrWeight = formik.values.measurment_or_weight || 0;
    const totalCost = marketPrice * measurementOrWeight;
  
    // Update the total_cost_of_goods field in formik
    formik.setFieldValue('total_cost_of_goods', totalCost);
  }, [formik.values.market_price, formik.values.measurment_or_weight]);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit WHR' : 'Add WHR'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl error={formik.touched.clientId && !!formik.errors.clientId}>
              <FormLabel htmlFor="clientId">Customer</FormLabel>
              <TextField
                id="clientId"
                value={isEdit ? formik.values.client.name : formik.values.clientName || 'Unknown Customer'}
                disabled
                fullWidth
                variant="outlined"
                error={formik.touched.clientId && !!formik.errors.clientId}
                helperText={formik.touched.clientId && formik.errors.clientId}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="Deposit_date">Deposit Date</FormLabel>
              <TextField
                id="Deposit_date"
                type="date"
                {...formik.getFieldProps('Deposit_date')}
                value={formik.values.Deposit_date.split('T')[0]}
                fullWidth
                disabled
                variant="outlined"
                error={formik.touched.Deposit_date && !!formik.errors.Deposit_date}
                helperText={formik.touched.Deposit_date && formik.errors.Deposit_date}
              />
            </FormControl>
            <FormControl error={formik.touched.CommodityId && !!formik.errors.CommodityId}>
              <FormLabel htmlFor="CommodityId">Commodity</FormLabel>
              <TextField
                id="CommodityId"
                value={isEdit ? formik.values.commodity.name : formik.values.commodityName || 'Unknown Commodity'}
                disabled
                fullWidth
                variant="outlined"
                error={formik.touched.CommodityId && !!formik.errors.CommodityId}
                helperText={formik.touched.CommodityId && formik.errors.CommodityId}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="Description_of_goods">Description of Goods</FormLabel>
              <TextField
                id="Description_of_goods"
                {...formik.getFieldProps('Description_of_goods')}
                placeholder="Description of Goods"
                fullWidth
                variant="outlined"
                rows={3}
                error={formik.touched.Description_of_goods && !!formik.errors.Description_of_goods}
                helperText={formik.touched.Description_of_goods && formik.errors.Description_of_goods}
              />
            </FormControl>
            <FormControl error={formik.touched.grade_or_quality && !!formik.errors.grade_or_quality}>
              <FormLabel htmlFor="grade_or_quality">Grade</FormLabel>
              <Select
                labelId="grade-label"
                id="grade_or_quality"
                {...formik.getFieldProps('grade_or_quality')}
                label="Grade"
                disabled={gradeLoading}
              >
                <MenuItem value="" disabled>Select Grade</MenuItem>
                {grades?.result?.map((grade: any) => (
                  <MenuItem key={grade.id} value={grade.name}>{grade.name}</MenuItem>
                ))}
              </Select>
              {formik.touched.grade_or_quality && formik.errors.grade_or_quality && (
                <Typography variant="caption" color="error">{formik.errors.grade_or_quality}</Typography>
              )}
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="details_of_number_of_bags_sacks">Number of Bags/Sacks</FormLabel>
              <TextField
                id="details_of_number_of_bags_sacks"
                type="number"
                {...formik.getFieldProps('details_of_number_of_bags_sacks')}
                placeholder="Number of Bags/Sacks"
                fullWidth
                variant="outlined"
                disabled={selectedGatePassIds && selectedGatePassIds.length > 1}
                error={formik.touched.details_of_number_of_bags_sacks && !!formik.errors.details_of_number_of_bags_sacks}
                helperText={formik.touched.details_of_number_of_bags_sacks && formik.errors.details_of_number_of_bags_sacks}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="any_marks_on_bags_detail">Marks on Bags</FormLabel>
              <TextField
                id="any_marks_on_bags_detail"
                {...formik.getFieldProps('any_marks_on_bags_detail')}
                placeholder="Marks on Bags"
                fullWidth
                variant="outlined"

                error={formik.touched.any_marks_on_bags_detail && !!formik.errors.any_marks_on_bags_detail}
                helperText={formik.touched.any_marks_on_bags_detail && formik.errors.any_marks_on_bags_detail}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="measurment_or_weight">Measurement or Weight</FormLabel>
              <TextField
                id="measurment_or_weight"
                type="number"
                {...formik.getFieldProps('measurment_or_weight')}
                placeholder="Measurement or Weight"
                fullWidth
                variant="outlined"
                disabled={selectedGatePassIds && selectedGatePassIds.length > 1}
                error={formik.touched.measurment_or_weight && !!formik.errors.measurment_or_weight}
                helperText={formik.touched.measurment_or_weight && formik.errors.measurment_or_weight}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="weightUnit">Weight Unit</FormLabel>
              <TextField
                id="weightUnit"
                value={formik.values.weightUnit}
                disabled
                fullWidth
                variant="outlined"
                error={formik.touched.weightUnit && !!formik.errors.weightUnit}
                helperText={formik.touched.weightUnit && formik.errors.weightUnit}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="market_price">Market Price (₹/{formik.values.weightUnit})</FormLabel>
              <TextField
                id="market_price"
                type="number"
                {...formik.getFieldProps('market_price')}
                placeholder="Market Price"
                fullWidth
                variant="outlined"
                error={formik.touched.market_price && !!formik.errors.market_price}
                helperText={formik.touched.market_price && formik.errors.market_price}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="total_cost_of_goods">Total Cost (₹)</FormLabel>
              <TextField
                id="total_cost_of_goods"
                type="number"
                {...formik.getFieldProps('total_cost_of_goods')}
                placeholder="Total Cost"
                fullWidth
                variant="outlined"
                error={formik.touched.total_cost_of_goods && !!formik.errors.total_cost_of_goods}
                helperText={formik.touched.total_cost_of_goods && formik.errors.total_cost_of_goods}
                InputProps={{
                  readOnly: true, // Make the field read-only since it's auto-calculated
                }}
                disabled
              />
            </FormControl>
         
            
            <FormControl>
              <FormLabel htmlFor="stock_registr_page_number">Stock Register Page Number</FormLabel>
              <TextField
                id="stock_registr_page_number"
                type="number"
                {...formik.getFieldProps('stock_registr_page_number')}
                placeholder="Stock Register Page Number"
                fullWidth
                variant="outlined"
                error={formik.touched.stock_registr_page_number && !!formik.errors.stock_registr_page_number}
                helperText={formik.touched.stock_registr_page_number && formik.errors.stock_registr_page_number}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="deposit_ledger_page_number">Deposit Ledger Page Number</FormLabel>
              <TextField
                id="deposit_ledger_page_number"
                type="number"
                {...formik.getFieldProps('deposit_ledger_page_number')}
                placeholder="Deposit Ledger Page Number"
                fullWidth
                variant="outlined"
                error={formik.touched.deposit_ledger_page_number && !!formik.errors.deposit_ledger_page_number}
                helperText={formik.touched.deposit_ledger_page_number && formik.errors.deposit_ledger_page_number}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="damp_proof">Moisture</FormLabel>
              <TextField
                id="damp_proof"
                {...formik.getFieldProps('damp_proof')}
                placeholder="Moisture"
                fullWidth
                variant="outlined"
                error={formik.touched.damp_proof && !!formik.errors.damp_proof}
                helperText={formik.touched.damp_proof && formik.errors.damp_proof}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="proof_of_weight">Proof of Weight</FormLabel>
              <TextField
                id="proof_of_weight"
                {...formik.getFieldProps('proof_of_weight')}
                placeholder="Proof of Weight"
                fullWidth
                variant="outlined"
                error={formik.touched.proof_of_weight && !!formik.errors.proof_of_weight}
                helperText={formik.touched.proof_of_weight && formik.errors.proof_of_weight}
              />
            </FormControl>
            <FormControl error={formik.touched.rent_id && !!formik.errors.rent_id}>
              <FormLabel htmlFor="rent_id">Rent Type</FormLabel>
              <Select
                labelId="rent-label"
                id="rent_id"
                {...formik.getFieldProps('rent_id')}
                label="Rent Type"
                disabled={isRentLoading}
              >
                <MenuItem value={0} disabled>Select Rent</MenuItem>
                {rents?.result?.map((rent: any) => (
                  <MenuItem key={rent.rent_id} value={rent.rent_id}>{rent.name}-{rent.rate_unit}</MenuItem>
                ))}
              </Select>
              {formik.touched.rent_id && formik.errors.rent_id && (
                <Typography variant="caption" color="error">{formik.errors.rent_id}</Typography>
              )}
            </FormControl>
            <FormControl error={formik.touched.rent_amount && !!formik.errors.rent_amount}>
              <FormLabel htmlFor="rent_amount">Rent Amount</FormLabel>
              <TextField
                id="rent_amount"
                type="number"
                {...formik.getFieldProps('rent_amount')}
                placeholder="Rent Amount"
                fullWidth
                variant="outlined"
                error={formik.touched.rent_amount && !!formik.errors.rent_amount}
                helperText={formik.touched.rent_amount && formik.errors.rent_amount}
              />
            </FormControl>
            {renderAttachmentFields()}
          </Box>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Selected Gate Pass Details
          </Typography>
          {renderSelectedGatePassTable()}
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
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestDepositorForm;