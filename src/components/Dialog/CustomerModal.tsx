import React from 'react';
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
  Select,
  MenuItem,
  TextField,
  Autocomplete,
} from '@mui/material';
import toast from 'react-hot-toast';
import { useCreateCustomerMutation, useUpdateCustomerMutation } from '../../RTK/services/customerApi';
import FormField from '../../Common/FormField';
import CustomFileUpload from '../../Common/CustomFileUpload';
import indianStates from '../../internals/data/indianstates';

interface CustomerType {
  id?: number;
  name: string;
  category: string;
  contact: string;
  address?: string;
  email?: string;
  gstNumber?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhoneNumber?: string;
  state?: string;
  city?: string;
  village?: string;
  tehsil?: string;
  post?: string;
  district?: string;
  aadharNumber?: string;
  fatherName?: string;
  attachments?: { [key: string]: File | null };
}

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  isEdit?: boolean;
  initialValues?: CustomerType;
  onSuccess?: (newCustomerId?: number) => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  open,
  onClose,
  isEdit = false,
  initialValues,
  onSuccess,
}) => {
  const [createCustomer] = useCreateCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();
  const [category, setCategory] = React.useState(initialValues?.category || '');

  const getValidationSchema = (category: string) => {
    const baseSchema = {
      name: Yup.string().required('Name is required'),
      category: Yup.string().required('Category is required'),
      contact: Yup.string().required('Contact is required'),
      address: Yup.string().nullable(),
      email: Yup.string().nullable(),
      contactPersonName: Yup.string().nullable(),
      contactPersonEmail: Yup.string().email('Invalid email').nullable(),
      contactPersonPhoneNumber: Yup.string().nullable(),
      state: Yup.string().required('State is required'),
    };

    if (category === 'Farmer') {
      return Yup.object({
        ...baseSchema,
        village: Yup.string().required('Village is required'),
        tehsil: Yup.string().required('Tehsil is required'),
        post: Yup.string().required('Post is required'),
        district: Yup.string().nullable(),
        aadharNumber: Yup.string().required('Aadhar Number is required'),
        fatherName: Yup.string().required('Father Name is required'),
        gstNumber: Yup.string().nullable(),
      });
    } else {
      const gstRequiredCategories = ['Trader', 'Seed Company', 'Government Organization', 'Corporate/Service agency'];
      return Yup.object({
        ...baseSchema,
        district: Yup.string().nullable(),
        village: Yup.string().nullable(),
        tehsil: Yup.string().nullable(),
        aadharNumber: Yup.string().nullable(),
        fatherName: Yup.string().nullable(),
        gstNumber: gstRequiredCategories.includes(category)
          ? Yup.string().required('GST Number is required')
          : Yup.string().nullable(),
      });
    }
  };

  const validationSchema = React.useMemo(
    () => getValidationSchema(category),
    [category]
  );

  const getInitialValues = (category: string) => ({
    name: '',
    category: category || '',
    contact: '',
    address: '',
    email: '',
    gstNumber: '',
    contactPersonName: '',
    contactPersonEmail: '',
    contactPersonPhoneNumber: '',
    state: 'Madhya Pradesh',
    city: '',
    village: '',
    tehsil: '',
    post: '',
    district: '',
    aadharNumber: '',
    fatherName: '',
    attachments: {
      farmer_photo: null,
      rin_pustika: null,
      signature: null,
      auth_letter: null,
      sign_verification: null,
      license: null,
      gst: null,
      udhayam_aadhar: null,
      aggrement_letter: null,
    },
  });

  const formik = useFormik<CustomerType>({
    initialValues: initialValues || getInitialValues(''),
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (value) => {
      try {
        const formData = new FormData();
        Object.entries(value).forEach(([key, val]) => {
          if (key === 'attachments' && val) {
            Object.entries(val).forEach(([attachmentKey, file]) => {
              if (file) {
                formData.append(attachmentKey, file);
              }
            });
          } else if (val !== null && val !== undefined && val !== '') {
            formData.append(key, val.toString());
          }
        });

        let response: any;
        if (isEdit && initialValues?.id) {
          response = await updateCustomer({ id: initialValues.id.toString(), data: formData }).unwrap();
        } else {
          response = await createCustomer(formData).unwrap();
        }

        if (response?.success) {
          toast.success(response.message || `Customer ${isEdit ? 'updated' : 'created'} successfully`);
          formik.resetForm();
          onSuccess?.(response?.data?.id);
          onClose();
        } else {
          toast.error(response?.error?.data?.message || 'Something went wrong');
        }
      } catch (error: any) {
        console.error('Error submitting form:', error);
        toast.error(error?.data?.message || 'Unexpected error occurred');
      }
    },
  });

  const handleCategoryChange = (event: any) => {
    const newCategory = event.target.value;
    setCategory(newCategory);
    formik.setFieldValue('category', newCategory);
    if (newCategory === 'Farmer') {
      formik.setValues({
        ...formik.values,
        category: newCategory,
        city: '',
        gstNumber: '',
        district: '',
      });
    } else {
      formik.setValues({
        ...formik.values,
        category: newCategory,
        village: '',
        tehsil: '',
        post: '',
        aadharNumber: '',
        fatherName: '',
      });
    }
  };

  const renderAttachmentFields = () => {
    const category = formik.values.category;
    const attachmentFields: { [key: string]: string[] } = {
      Farmer: ['farmer_photo', 'rin_pustika', 'signature', 'auth_letter', 'sign_verification'],
      Trader: ['license', 'gst', 'udhayam_aadhar', 'sign_verification', 'auth_letter'],
      'Seed Company': ['license', 'gst', 'aggrement_letter', 'udhayam_aadhar', 'auth_letter', 'sign_verification'],
      'Government Organization': ['license', 'gst', 'udhayam_aadhar', 'sign_verification', 'auth_letter'],
      'Corporate/Service agency': ['license', 'gst', 'aggrement_letter', 'udhayam_aadhar', 'auth_letter', 'sign_verification'],
    };

    return attachmentFields[category]?.map((field) => (
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
          value={formik.values.attachments?.[field] || null}
          error={!!formik.errors.attachments?.[field as keyof typeof formik.values.attachments]}
          helperText={formik.errors.attachments?.[field as keyof typeof formik.values.attachments]}
        />
      </FormControl>
    ));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
            mt: 2,
            '& > .full-width': { gridColumn: '1 / -1' },
            '& > .button': { gridColumn: '1 / -1', mt: 2 },
            '@media (max-width: 600px)': { gridTemplateColumns: '1fr' },
          }}
        >
          <Box className="full-width">
            <FormField id="name" label="Customer Name" formik={formik} />
          </Box>
          <FormControl className="full-width">
            <FormLabel htmlFor="category">Category</FormLabel>
            <Select
              id="category"
              {...formik.getFieldProps('category')}
              onChange={handleCategoryChange}
              fullWidth
              variant="outlined"
              error={formik.touched.category && !!formik.errors.category}
              displayEmpty
            >
              <MenuItem value="" disabled>
                Select Category
              </MenuItem>
              <MenuItem value="Farmer">Farmers</MenuItem>
              <MenuItem value="Trader">Traders</MenuItem>
              <MenuItem value="Seed Company">Seed Companies</MenuItem>
              <MenuItem value="Government Organization">Government Organizations</MenuItem>
              <MenuItem value="Corporate/Service agency">Corporate/Service Agencies</MenuItem>
              <MenuItem value="Other">Others</MenuItem>
            </Select>
            {formik.touched.category && formik.errors.category && (
              <Typography variant="caption" color="error">
                {formik.errors.category}
              </Typography>
            )}
          </FormControl>
          <FormField id="contact" label="Contact" formik={formik} />
          <FormField id="address" label="Address" formik={formik} />
          <FormField id="email" label="Email" formik={formik} />
          {formik.values.category !== 'Farmer' && (
            <FormField id="gstNumber" label="GST Number" formik={formik} />
          )}
          <FormField id="contactPersonName" label="Contact Person Name" formik={formik} />
          <FormField id="contactPersonEmail" label="Contact Person Email" formik={formik} />
          <FormField id="contactPersonPhoneNumber" label="Contact Person Phone" formik={formik} />
          <FormControl>
                <FormLabel htmlFor="state">State</FormLabel>
                <Autocomplete
  id="state"
  options={indianStates}
  popupIcon={null}
  getOptionLabel={(option) => option.label}
  value={
    indianStates.find((option) => option.label === formik.values.state) || null
  }
  onChange={(_, newValue) => {
    formik.setFieldValue('state', newValue?.label || '');
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      InputProps={{
        ...params.InputProps,
        endAdornment: null, // this disables the entire adornment area
      }}
      variant="outlined"
      error={formik.touched.state && Boolean(formik.errors.state)}
      helperText={formik.touched.state && formik.errors.state}
    />
  )}
  fullWidth
/>
              </FormControl>
          {formik.values.category === 'Farmer' ? (
            <>
              <FormField id="village" label="Village" formik={formik} />
              <FormField id="tehsil" label="Tehsil" formik={formik} />
              <FormField id="post" label="Post" formik={formik} />
              <FormField id="district" label="District" formik={formik} />
              <FormField id="aadharNumber" label="Aadhar Number" formik={formik} />
              <FormField id="fatherName" label="Father Name" formik={formik} />
            </>
          ) : (
            <FormField id="city" label="City" formik={formik} />
          )}
          {formik.values.category !== 'Farmer' && (
            <FormField id="district" label="District" formik={formik} />
          )}
          {renderAttachmentFields()}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            className="button"
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

export default CustomerModal;