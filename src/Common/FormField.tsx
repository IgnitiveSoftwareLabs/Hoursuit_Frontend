import { FormControl, FormLabel, TextField } from "@mui/material";

type FormFieldProps = {
    id: string;
    label: string;
    placeholder?: string;
    type?: string;
    formik: any;
  };
  
  const FormField: React.FC<FormFieldProps> = ({ id, label, placeholder, type = 'text', formik }) => (
    <FormControl>
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <TextField
        id={id}
        type={type}
        {...formik.getFieldProps(id)}
        placeholder={placeholder || label}
        fullWidth
        variant="outlined"
        error={formik.touched[id] && Boolean(formik.errors[id])}
        helperText={formik.touched[id] && formik.errors[id]}
      />
    </FormControl>
  );

export default FormField;