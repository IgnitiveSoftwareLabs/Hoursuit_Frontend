import { useState } from 'react';
import {
  Box, Button, Checkbox, CssBaseline, 
  FormControlLabel, FormLabel, FormControl,
  TextField, Typography, Stack, Card as MuiCard,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useFormik } from 'formik';
import { registerapiservice } from '../../Services/UserApiSerice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppTheme from '../../shared-theme/AppTheme';
import { Link as RouterLink } from 'react-router-dom';


// Shared styling with SignIn
const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex', flexDirection: 'column', alignSelf: 'center',
  width: '100%', padding: theme.spacing(3), gap: theme.spacing(2), margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px', padding: theme.spacing(4),
  },
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: '100dvh', minHeight: '100%', overflowY: 'auto',
  '&::before': {
    content: '""', display: 'block', position: 'absolute', zIndex: -1,
    inset: 0,
    backgroundImage: 'radial-gradient(ellipse at 50% 50%, hsl(210,100%,97%),hsl(0,0%,100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210,100%,16%,0.5),hsl(220,30%,5%))',
    }),
  },
}));

interface Values {
  FirstName: string; LastName: string;
  Email: string; Phone: string;
  Password: string;
  allowEmails: boolean;
}

export default function SignUp(props: { disableCustomTheme?: boolean }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const formik = useFormik<Values>({
    initialValues: {
      FirstName: '', LastName: '',
      Email: '', Phone: '',
      Password: '', allowEmails: false,
    },
    validate: vals => {
      const err: Partial<Values> = {};
      if (step === 0) {
        if (!vals.FirstName) err.FirstName = 'Required';
        if (!vals.LastName) err.LastName = 'Required';
      }
      if (step === 1) {
        if (!vals.Email) err.Email = 'Required';
        else if (!/\S+@\S+\.\S+/.test(vals.Email)) err.Email = 'Invalid email';
        if (!vals.Phone) err.Phone = 'Required';
        else if (!/^\d{10}$/.test(vals.Phone)) err.Phone = '10 digits';
      }
      if (step === 2) {
        if (!vals.Password) err.Password = 'Required';
        else if (vals.Password.length < 6) err.Password = 'Min 6 characters';
      }
      return err;
    },
    onSubmit: async values => {
      try {
        setLoading(true);
        const res: any = await registerapiservice(values);
        if (res.success) {
          toast.success(res.message);
          navigate('/login');
        } else {
          toast.error(res.message || 'Registration failed');
        }
      } catch {
        toast.error('Registration failed. Try again.');
      } finally {
        setLoading(false);
      }
    },
    validateOnBlur: true,
    validateOnChange: false,
  });

  const handleNext = async () => {
    const errs = await formik.validateForm();
    const relevant = Object.keys(errs).filter(key => {
      if (step === 0) return ['FirstName','LastName'].includes(key);
      if (step === 1) return ['Email','Phone'].includes(key);
      if (step === 2) return ['Password'].includes(key);
      return false;
    });
    if (relevant.length === 0) setStep(s => s + 1);
    else formik.setTouched(relevant.reduce((a,c)=> ({...a,[c]:true}), {}));
  };

  const handleBack = () => setStep(s => s - 1);
  const StepIndicator = ({ currentStep }: { currentStep: number }) => {
    return (
      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
        {[0, 1, 2].map((step) => (
          <Box
            key={step}
            sx={{
              width: '85px',
              height: '6px',
              borderRadius: '8px',
              background: currentStep === step ? '#6560F0' : '#E0E0E0',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </Stack>
    );
  };
  
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignUpContainer direction={{ xs:'column', md:'row' }} justifyContent="center" alignItems="center">
        
        {/* LEFT SIDE: Form */}
        <Box sx={{
          flex: 1, maxWidth: { xs:'100%', md:'50%' }, display: 'flex',
          backgroundColor: '#FFFFFF', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          px: { xs:2, sm:4, md:6 }, py: { xs:4, md:0 },
          height: '100dvh', minHeight: '100%',
        }}>
          <Card variant="outlined" sx={{ boxShadow:'none', border:'none' }}>
            <Typography component="h1" variant="h1"  fontSize={60}>Sign up!</Typography>
            <Typography variant="body2">
              Already have an account?{' '}
              <RouterLink to="/login" style={{ textDecoration:'none', color:'inherit' }}>
                Sign in here
              </RouterLink>
            </Typography>

            {/* Step indicator */}
            


            {/* Step Form */}
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt:2, display:'flex', flexDirection:'column', gap:2 }}>
              {step === 0 && (
                <>
                  <FormControl>
                    <FormLabel>First Name</FormLabel>
                    <TextField name="FirstName" value={formik.values.FirstName} onChange={formik.handleChange}
                      error={!!formik.errors.FirstName && formik.touched.FirstName}
                      helperText={formik.touched.FirstName && formik.errors.FirstName} fullWidth />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Last Name</FormLabel>
                    <TextField name="LastName" value={formik.values.LastName} onChange={formik.handleChange}
                      error={!!formik.errors.LastName && formik.touched.LastName}
                      helperText={formik.touched.LastName && formik.errors.LastName} fullWidth />
                  </FormControl>
                </>
              )}
              {step === 1 && (
                <>
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <TextField name="Email" type="email" value={formik.values.Email} onChange={formik.handleChange}
                      error={!!formik.errors.Email && formik.touched.Email}
                      helperText={formik.touched.Email && formik.errors.Email} fullWidth />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Phone</FormLabel>
                    <TextField name="Phone" value={formik.values.Phone} onChange={formik.handleChange}
                      error={!!formik.errors.Phone && formik.touched.Phone}
                      helperText={formik.touched.Phone && formik.errors.Phone} fullWidth />
                  </FormControl>
                </>
              )}
              {step === 2 && (
                <>
                  <FormControl>
                    <FormLabel>Password</FormLabel>
                    <TextField name="Password" type="password" value={formik.values.Password} onChange={formik.handleChange}
                      error={!!formik.errors.Password && formik.touched.Password}
                      helperText={formik.touched.Password && formik.errors.Password} fullWidth />
                  </FormControl>
                  <FormControlLabel
                    control={<Checkbox name="allowEmails" checked={formik.values.allowEmails} onChange={formik.handleChange} />}
                    label="I want to receive updates via email."
                  />
                </>
              )}

              {/* Navigation Buttons */}
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                {step > 0 && <Button variant="outlined" onClick={handleBack} sx={{width:'100%'}}>Back</Button>}
                {step < 2 && <Button variant="contained" onClick={handleNext} sx={{width:'100%'}}>Next</Button>}
                {step === 2 && <Button
  type="submit"
  fullWidth
  variant="contained"
  disabled={loading} // Disable the button when loading
  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null} // Show spinner if loading
>
  {loading ? 'Signing in...' : 'Sign in'} {/* Change text based on loading state */}
</Button>}
              </Stack>
            </Box>

            {/* Social / Divider */}
           <Stack alignItems="center" sx={{ mt: 6,}}>
            <StepIndicator currentStep={step} />
            </Stack>
          </Card>
        </Box>

        {/* RIGHT SIDE: Illustration */}
        <Box sx={{
          flex: 1, maxWidth: { xs:'0%', md:'50%' },
          display: { xs:'none', md:'flex' }, backgroundColor: '#F7F8F9',
          flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          px: 6, position: 'relative',
          height: '100dvh', minHeight: '100%',
        }}>
          <Typography variant="h4" mb={4} textAlign="center">
            Manage inventory, orders, and logistics — all in one place, faster than ever!
          </Typography>
          <Box sx={{ width: 500, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <img src="/login-img.svg" alt="Progress Chart" style={{ width:'100%', maxWidth:'500px', height:'auto' }} />
            <img src="/Group 34713.svg" alt="Task Management" style={{ width:'300px', height:'auto', position:'absolute', top:'10px', right:'0' }} />
          </Box>
        </Box>
      </SignUpContainer>
    </AppTheme>
  );
}
