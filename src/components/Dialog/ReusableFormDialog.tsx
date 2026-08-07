import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, FormControl, FormLabel, TextField, Box, Typography,
  Accordion, AccordionSummary, AccordionDetails, MenuItem, Checkbox, FormControlLabel
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { getIn } from 'formik'; // Import getIn from formik

interface FieldConfig {
  name: string;
  label: string;
  placeholder?: string;
  gridSize?: { xs?: number; sm?: number; md?: number };
  accordion?: string;
  type?: 'text' | 'select' | 'checkbox';
  options?: string[];
}

interface ReusableFormDialogProps {
  open: boolean;
  title: string;
  formik: any;
  onClose: () => void;
  onSubmit?: () => void;
  fields: FieldConfig[];
  isEdit?: boolean;
  isCreating?: boolean;
  isUpdating?: boolean;
  accordionSections?: string[];
  showAccordion?: boolean;
}

const ReusableFormDialog: React.FC<ReusableFormDialogProps> = ({
  open,
  title,
  formik,
  onClose,
  onSubmit,
  fields,
  isEdit,
  isCreating,
  isUpdating,
  accordionSections = [],
  showAccordion = false,
}) => {
  const regularFields = fields.filter(f => !f.accordion);
  const accordionFields = accordionSections.map(section => ({
    section,
    fields: fields.filter(f => f.accordion === section)
  }));

  const renderField = (field: FieldConfig) => {
    const gridProps = {
      xs: field.gridSize?.xs || 12,
      sm: field.gridSize?.sm || 6,
      md: field.gridSize?.md || 4,
    };

    if (field.type === 'checkbox') {
      if (isEdit) return null;
      return (
        <Grid key={field.name} size={gridProps}>
          <FormControl fullWidth>
            <FormControlLabel
              control={
                <Checkbox
                  id={field.name}
                  name={field.name}
                  checked={formik.values[field.name]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              }
              label={field.label}
            />
            {getIn(formik.touched, field.name) && getIn(formik.errors, field.name) && (
              <Typography color="error" variant="caption" sx={{ ml: 3 }}>
                {getIn(formik.errors, field.name)}
              </Typography>
            )}
          </FormControl>
        </Grid>
      );
    }

    // Handle text or select fields
    return (
      <Grid key={field.name} size={gridProps}>
        <FormControl fullWidth>
          <FormLabel htmlFor={field.name} sx={{ mb: 0.5 }}>
            {field.label}
          </FormLabel>
          <TextField
            id={field.name}
            {...formik.getFieldProps(field.name)}
            placeholder={field.placeholder}
            variant="outlined"
            select={field.type === 'select'}
            error={getIn(formik.touched, field.name) && Boolean(getIn(formik.errors, field.name))}
            helperText={getIn(formik.touched, field.name) && getIn(formik.errors, field.name)}
          >
            {field.type === 'select' &&
              field.options?.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
          </TextField>
        </FormControl>
      </Grid>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5">{title}</Typography>
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {regularFields.map(renderField)}
          </Grid>

          {/* Conditionally render accordions based on showAccordion */}
          {showAccordion &&
            accordionFields.map(({ section, fields }) => (
              <Accordion key={section} sx={{ mt: 3 }}>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {fields.map(renderField)}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={() => {
            onClose();
            formik.resetForm();
          }}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={onSubmit || formik.handleSubmit}
          disabled={isCreating || isUpdating}
        >
          {isEdit ? 'Update' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReusableFormDialog;