import * as React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import toast from 'react-hot-toast';
import { forgetpasswordapicall } from '../Services/UserApiSerice/index';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

interface ForgetFormValue {
  Email: string;
}

export default function ForgotPassword({ open, handleClose }: ForgotPasswordProps) {
  const formik = useFormik<ForgetFormValue>({
    initialValues: {
      Email: '',
    },
    validationSchema: Yup.object({
      Email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const response: any = await forgetpasswordapicall(values);
        if (response.success) {
          toast.success(response.message);
          resetForm();
          handleClose();
        }
      } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Something went wrong');
      }
    },
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            formik.handleSubmit();
          },
          sx: { backgroundImage: 'none' },
        },
      }}
    >
      <DialogTitle>Reset Password</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
          Enter your account's email address, and we'll send you a link to reset your password.
        </DialogContentText>
        <FormControl error={formik.touched.Email && !!formik.errors.Email}>
          <FormLabel htmlFor="email">Email Address</FormLabel>
          <OutlinedInput
            autoFocus
            id="email"
            {...formik.getFieldProps('Email')}
            placeholder="Email address"
            type="email"
            fullWidth
          />
          {formik.touched.Email && formik.errors.Email && (
            <FormHelperText>{formik.errors.Email}</FormHelperText>
          )}
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={formik.submitForm}
          disabled={formik.isSubmitting}
          sx={{ textTransform: 'none' }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}