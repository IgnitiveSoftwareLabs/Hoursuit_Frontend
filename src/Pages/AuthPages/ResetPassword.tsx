import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useParams } from 'react-router-dom';
import apiInstance from '../../Services/apiservice/apiInstance';
import toast from 'react-hot-toast';
import {
  Box,
  Paper,
  Typography,
  CssBaseline,
  TextField,
  Button,
  IconButton,
  InputAdornment,
} from '@mui/material';
import AppTheme from '../../shared-theme/AppTheme';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const ResetPassword: React.FC = (props: { disableCustomTheme?: boolean }) => {
  const { resetToken } = useParams<{ resetToken: string }>();
  const [passwordVisible, setPasswordVisible] = useState(false);

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
  });

  const formik = useFormik({
    initialValues: {
      password: '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const response: any = await apiInstance.post(`/user/reset-password/${resetToken}`, values);
        if (response.status === 200) {
          toast.success(response.data.message);
          resetForm();
          window.location.href = '/login';
        }
      } catch (error: any) {
        console.error(error?.message);
        toast.error(error.response?.data?.message || 'Failed to reset password');
      }
    },
  });

  return (
    <AppTheme {...props}>
          <CssBaseline enableColorScheme />
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: '400px',
          width: '100%',
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
        component="form"
        onSubmit={formik.handleSubmit}
      >
        <Typography
          variant="h5"
          align="center"
          gutterBottom
          sx={{ fontWeight: 'bold', color: 'text.primary' }}
        >
          Reset Password
        </Typography>

        <TextField
          id="password"
          label="Password"
          type={passwordVisible ? 'text' : 'password'}
          fullWidth
          margin="normal"
          variant="outlined"
          {...formik.getFieldProps('password')}
          error={formik.touched.password && !!formik.errors.password}
          helperText={formik.touched.password && formik.errors.password}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  edge="end"
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                >
                  {passwordVisible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={formik.isSubmitting}
          sx={{ mt: 2, textTransform: 'none', py: 1.5 }}
        >
          Submit
        </Button>
      </Paper>
    </Box>
    </AppTheme>
  );
};

export default ResetPassword;