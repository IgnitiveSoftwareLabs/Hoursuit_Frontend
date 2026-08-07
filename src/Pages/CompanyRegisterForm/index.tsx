import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { createcompanyapicall } from '../../Services/Admin/CompanyApiService/index';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../Hooks/Reduxhook/hooks';
import { setaddcompany } from '../../Redux/CompanySlice/index';
import AppTheme from '../../shared-theme/AppTheme';
import CustomFileUpload from '../../Common/CustomFileUpload';
import {
  Box,
  Button,
  Checkbox,
  CssBaseline,
  FormControlLabel,
  FormLabel,
  FormControl,
  Typography,
  Stack,
  Card as MuiCard,
  TextField,
  Grid,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Validation schema
const validationSchema = Yup.object({
  name: Yup.string().required('Company name is required').min(2),
  gstNumber: Yup.string()
    .matches(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
      'Invalid GST number format'
    )
    .required('GST is required'),
  contactPerson: Yup.string().required().min(2),
  phone: Yup.string().matches(/^[6-9]\d{9}$/, 'Invalid phone').required(),
  address: Yup.string().min(5).required(),
  gstEnabled: Yup.boolean().required(),
});

interface CompanyFormValues {
  name: string;
  gstNumber: string;
  contactPerson: string;
  phone: string;
  address: string;
  gstEnabled: boolean;
  License_Number_validTill?: string;
  Utility_Certificate_validTill?: string;
  Fssai_Certificate_validTill?: string;
  License_Number?: File | null;
  Utility_Certificate?: File | null;
  Fssai_Certificate?: File | null;
}

// Styled Card
const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(3),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '600px',
    padding: theme.spacing(4),
  },
  [theme.breakpoints.up('md')]: {
    maxWidth: '800px',
  },
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  overflow: 'auto',
}));

// Two-column container
const CompanyContainer = styled(Stack)(({ theme }) => ({
  height: '100dvh',
  minHeight: '100%',
  overflowY: 'auto',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210,100%,97%), hsl(0,0%,100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210,100%,16%,0.5), hsl(220,30%,5%))',
    }),
  },
}));

export default function Company(props: { disableCustomTheme?: boolean }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const initialValues: CompanyFormValues = {
    name: '',
    gstNumber: '',
    contactPerson: '',
    phone: '',
    address: '',
    gstEnabled: false,
    License_Number_validTill: '',
    Utility_Certificate_validTill: '',
    Fssai_Certificate_validTill: '',
    License_Number: null,
    Utility_Certificate: null,
    Fssai_Certificate: null,
  };

  const handleSubmit = async (values: CompanyFormValues, { setSubmitting }: any) => {
    try {
      const formData = new FormData();
  
      // Append normal fields
      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, value.toString());
          }
        }
      });
  
      const response: any = await createcompanyapicall(formData);
      if (response.success) {
        toast.success(response.message);
        dispatch(setaddcompany(response.result));
        navigate('/dashboard');
      } else {
        toast.error(response.message || 'Failed to create company');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while creating the company');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <CompanyContainer direction={{ xs: 'column', md: 'row' }} justifyContent="center" alignItems="center">
        {/* LEFT: Form */}
        <Box
          sx={{
            flex: 1,
            maxWidth: { xs: '100%', md: '50%' },
            display: 'flex',
            backgroundColor: '#FFFFFF',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            px: { xs: 2, sm: 4, md: 6 },
            py: { xs: 4, md: 0 },
            height: '100dvh',
            minHeight: '100%',
          }}
        >
          <Card variant="outlined" sx={{ boxShadow: 'none', border: 'none' }}>
            <Typography component="h1" variant="h4" sx={{ width: '100%', fontSize: 'clamp(2rem,10vw,2.15rem)' }}>
              Company Registration
            </Typography>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched, handleChange, handleBlur, values, setFieldValue }) => (
                <Form>
                  <Grid container spacing={2}>
                    {/* Basic Company Fields */}
                    {(['name', 'gstNumber', 'contactPerson', 'phone', 'address'] as Array<keyof CompanyFormValues>).map((field) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={field}>
                        <FormControl fullWidth>
                          <FormLabel sx={{ textTransform: 'capitalize' }}>
                            {field.replace(/([A-Z])/g, ' $1').trim()}
                          </FormLabel>
                          <Field
                            name={field}
                            as={TextField}
                            fullWidth
                            variant="outlined"
                            value={values[field]}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={Boolean(touched[field] && errors[field])}
                            helperText={touched[field] && errors[field]}
                          />
                        </FormControl>
                      </Grid>
                    ))}
                
                    {/* GST Enabled Checkbox */}
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={<Field name="gstEnabled" as={Checkbox} color="primary" checked={values.gstEnabled} />}
                        label="GST Enabled"
                      />
                    </Grid>
                
                    {/* File Uploads with Custom Component */}
                    <Grid size={{ xs: 12, sm: 6,md:4 }}>
                      <CustomFileUpload
                        name="License_Number"
                        label="License Number"
                        accept="application/pdf,image/*"
                        maxSize={10}
                        onFileSelect={(files) => setFieldValue('License_Number', files[0] || null)}
                        value={values.License_Number}
                        showPreview
                      />
                      <TextField
                        fullWidth
                        name="License_Number_validTill"
                        label="Valid Till"
                        type="date"
                        value={values.License_Number_validTill}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2 }}
                      />
                    </Grid>
                
                    <Grid size={{ xs: 12, sm: 6,md:4 }}>
                      <CustomFileUpload
                        name="Utility_Certificate"
                        label="Utility Certificate"
                        accept="application/pdf,image/*"
                        maxSize={10}
                        onFileSelect={(files) => setFieldValue('Utility_Certificate', files[0] || null)}
                        value={values.Utility_Certificate}
                        showPreview
                      />
                      <TextField
                        fullWidth
                        name="Utility_Certificate_validTill"
                        label="Valid Till"
                        type="date"
                        value={values.Utility_Certificate_validTill}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2 }}
                      />
                    </Grid>
                
                    <Grid size={{ xs: 12, sm: 6,md:4 }}>
                      <CustomFileUpload
                        name="Fssai_Certificate"
                        label="FSSAI Certificate"
                        accept="application/pdf,image/*"
                        maxSize={10}
                        onFileSelect={(files) => setFieldValue('Fssai_Certificate', files[0] || null)}
                        value={values.Fssai_Certificate}
                        showPreview
                      />
                      <TextField
                        fullWidth
                        name="Fssai_Certificate_validTill"
                        label="Valid Till"
                        type="date"
                        value={values.Fssai_Certificate_validTill}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2 }}
                      />
                    </Grid>
                
                    {/* Submit Button */}
                    <Grid size={{ xs: 12 }}>
                      <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                      </Button>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </Card>
        </Box>

        {/* RIGHT: Illustration */}
        <Box
          sx={{
            flex: 1,
            maxWidth: { xs: '0%', md: '50%' },
            display: { xs: 'none', md: 'flex' },
            backgroundColor: '#F7F8F9',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            px: 6,
            position: 'relative',
            height: '100dvh',
            minHeight: '100%',
          }}
        >
          <Typography variant="h4" mb={4} textAlign="center">
            Set up and manage your company seamlessly 🚀
          </Typography>
          <Box sx={{ width: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <img
              src="/login-img.svg"
              alt="Illustration"
              style={{ width: '100%', maxWidth: '500px', height: 'auto' }}
            />
          </Box>
        </Box>
      </CompanyContainer>
    </AppTheme>
  );
}