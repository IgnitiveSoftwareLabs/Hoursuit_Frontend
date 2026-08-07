import * as React from 'react';
import {
  Box,
  Button,
  Checkbox,
  CssBaseline,
  FormControlLabel,
  Divider,
  FormLabel,
  FormControl,
  Link,
  TextField,
  Typography,
  Stack,
  Card as MuiCard,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useFormik } from 'formik';
import { getUserapiCall, loginapiservice } from '../../Services/UserApiSerice';
import { fetchcompanyapicall } from '../../Services/Admin/CompanyApiService/index';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ForgotPassword from '../../components/ForgotPassword';
import AppTheme from '../../shared-theme/AppTheme';
import { Link as RouterLink } from 'react-router-dom';

import GoogleSignInButton from '../../Common/GoogleButton';
import { useAppDispatch } from '../../Hooks/Reduxhook/hooks';
import { setCurrentUser } from '../../Redux/CurrentUserSlice';

interface LoginFormValues {
  Email: string;
  Password: string;
}

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(3),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
    padding: theme.spacing(4),
  },
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: '100dvh',
  minHeight: '100%',
  overflowY: 'auto',
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignIn(props: { disableCustomTheme?: boolean }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      Email: '',
      Password: '',
    },
    validate: (values) => {
      const errors: Partial<LoginFormValues> = {};
      if (!values.Email) {
        errors.Email = 'Required';
      } else if (!/\S+@\S+\.\S+/.test(values.Email)) {
        errors.Email = 'Invalid email address';
      }

      if (!values.Password) {
        errors.Password = 'Required';
      } else if (values.Password.length < 6) {
        errors.Password = 'Password must be at least 6 characters';
      }

      return errors;
    },
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const response: any = await loginapiservice(values);
        if (response.success) {
          localStorage.setItem('token', response.result);
          localStorage.setItem('refreshToken', response.refreshToken);
          // Fetch and set user data immediately after login
          try {
            const userResponse = await getUserapiCall();
            console.log("userResponse",userResponse)
            if (userResponse.success) {
              dispatch(setCurrentUser(userResponse.result));
              toast.success(response.message);
              
              // Check company registration
              const companyResponse: any = await fetchcompanyapicall();
              const hasCompany =
                companyResponse.success &&
                companyResponse.result &&
                ((Array.isArray(companyResponse.result) && companyResponse.result.length > 0) ||
                  (!Array.isArray(companyResponse.result) && Object.keys(companyResponse.result).length > 0));

              if (hasCompany) {
                navigate('/dashboard', { replace: true });
              } else {
                navigate('/companyform', { replace: true });
              }
            } else {
              throw new Error('Failed to fetch user data');
            }
          } catch (userError) {
            console.error('Error fetching user data:', userError);
            toast.error('Failed to load user data');
            // Still proceed but user will be fetched by UserContext
            navigate('/dashboard');
          }
        } else {
          toast.error('Login failed');
        }
      } catch (error: any) {
        toast.error('Invalid Email or Password');
        console.log(error?.message);
      } finally {
        setLoading(false);
      }
    },
  });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="center"
        alignItems="center"
      >
        {/* LEFT: Login Form */}
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
            <Typography
              component="h1"
              variant="h1"
              sx={{ width: '100%' }}
              fontSize={60}
            >
              Login!
            </Typography>
            <Typography variant="body2">
                Don&apos;t have an account?{' '}
                <Link
                  to="/signup"
                  component={RouterLink}
                  
                >
                  Sign up here
                </Link>
              </Typography>
            <Box
              component="form"
              onSubmit={formik.handleSubmit}
              noValidate
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: 2,
              }}
            >
              <FormControl>
                <FormLabel htmlFor="Email" sx={{ textAlign: 'left' }}>
                  Email
                </FormLabel>
                <TextField
                  id="Email"
                  name="Email"
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  autoFocus
                  required
                  fullWidth
                  variant="outlined"
                  value={formik.values.Email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.Email && Boolean(formik.errors.Email)}
                  helperText={formik.touched.Email && formik.errors.Email}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="Password" sx={{ textAlign: 'left' }}>
                  Password
                </FormLabel>
                <TextField
                  id="Password"
                  name="Password"
                  type="password"
                  placeholder="••••••"
                  autoComplete="current-password"
                  required
                  fullWidth
                  variant="outlined"
                  value={formik.values.Password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.Password && Boolean(formik.errors.Password)
                  }
                  helperText={formik.touched.Password && formik.errors.Password}
                />
              </FormControl>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mt: 1 }}
              >
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              />
              <Link
                component="button"
                type="button"
                onClick={handleClickOpen}
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                Forgot your password?
              </Link>
              </Stack>
              {/* Forgot Password Dialog */}
              <ForgotPassword open={open} handleClose={handleClose} />
              <Button
  type="submit"
  fullWidth
  variant="contained"
  disabled={loading} // Disable the button when loading
  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null} // Show spinner if loading
>
  {loading ? 'Signing in...' : 'Sign in'} {/* Change text based on loading state */}
</Button>
              
            </Box>
            <Divider>or</Divider>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <GoogleSignInButton />
              
            </Box>
          </Card>
        </Box>

        {/* RIGHT: Illustration & Info */}
        <Box
          sx={{
            flex: 1,
            maxWidth: { xs: '0%', md: '50%' },
            display: { xs: 'none', md: 'flex' }, // Hidden on mobile
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
          Manage inventory, orders, and logistics — all in one place, faster than ever!
          </Typography>
          <Box
            sx={{
              width: 500,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <img
              src="/login-img.svg"
              alt="Progress Chart"
              style={{ width: '100%', maxWidth: '500px', height: 'auto' }}
            />
            <img
              src="/Group 34713.svg"
              alt="Task Management"
              style={{
                width: '300px',
                height: 'auto',
                position: 'absolute',
                top: '10px',
                right: '0',
              }}
            />
          </Box>
        </Box>
      </SignInContainer>
    </AppTheme>
  );
}
