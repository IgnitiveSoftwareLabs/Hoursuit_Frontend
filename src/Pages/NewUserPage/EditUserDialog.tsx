import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  OutlinedInput,
  type SelectChangeEvent,
  CircularProgress,
  Checkbox,
  ListItemText,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useGetpermissionQuery } from "../../RTK/services/permissionApi";
import { updateNewUserApi } from "../../Services/UserApiSerice";
import toast from "react-hot-toast";

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onSuccess: (updatedUser: any) => void;
}

interface Permission {
  id: number;
  name: string;
  module: string;
  action: string;
  description: string;
}

const validationSchema = Yup.object({
  FirstName: Yup.string().required("First Name is required"),
  LastName: Yup.string().required("Last Name is required"),
  Email: Yup.string().email("Invalid email format").required("Email is required"),
  Phone: Yup.string().required("Phone is required"),
  Type: Yup.string().required("Type is required"),
  permissionIds: Yup.array().min(1, "At least one permission is required"),
  isActive: Yup.string().required("Status is required"),
});

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  onClose,
  user,
  onSuccess,
}) => {
  const { data: permissionsData, isLoading: permissionsLoading } = useGetpermissionQuery();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      FirstName: "",
      LastName: "",
      Email: "",
      Phone: "",
      Type: "",
      permissionIds: [] as number[],
      isActive: "true",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        const payload = {
          ...values,
          isActive: values.isActive === "true",
        };
        const response = await updateNewUserApi(user.id, payload);
        
        if (response.success) {
          toast.success("User updated successfully");
          onSuccess(response.result);
          onClose();
        } else {
          toast.error(response.message || "Failed to update user");
        }
      } catch (error: any) {
        console.error("Error updating user:", error);
        toast.error(error?.response?.data?.message || "Failed to update user");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Update form values when user prop changes
  useEffect(() => {
    if (user && open) {
      formik.setValues({
        FirstName: user.FirstName || "",
        LastName: user.LastName || "",
        Email: user.Email || "",
        Phone: user.Phone || "",
        Type: user.Type || "",
        permissionIds: user.permissions?.map((p: any) => p.id) || [],
        isActive: user.isActive !== undefined ? (user.isActive ? "true" : "false") : "true",
      });
    }
  }, [user, open]);

  const handlePermissionChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value as number[];
    formik.setFieldValue("permissionIds", value);
  };

  const getPermissionLabel = (permissionId: number) => {
    let permissions = [];
    if (Array.isArray(permissionsData)) {
      permissions = permissionsData;
    } else if (permissionsData && (permissionsData as any).result) {
      permissions = (permissionsData as any).result;
    }
    const permission = permissions?.find((p: Permission) => p.id === permissionId);
    return permission ? `${permission.module} - ${permission.action}` : permissionId;
  };

  const userTypes = [
    { value: "manager", label: "Manager" },
    { value: "operator", label: "Operator" },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 2,
            mt: 2,
            "& > .full-width": { gridColumn: "1 / -1" },
          }}
        >
          {/* First Name */}
          <FormControl>
            <FormLabel htmlFor="FirstName">First Name *</FormLabel>
            <TextField
              id="FirstName"
              name="FirstName"
              value={formik.values.FirstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.FirstName && Boolean(formik.errors.FirstName)}
              helperText={formik.touched.FirstName && formik.errors.FirstName}
              variant="outlined"
              fullWidth
            />
          </FormControl>

          {/* Last Name */}
          <FormControl>
            <FormLabel htmlFor="LastName">Last Name *</FormLabel>
            <TextField
              id="LastName"
              name="LastName"
              value={formik.values.LastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.LastName && Boolean(formik.errors.LastName)}
              helperText={formik.touched.LastName && formik.errors.LastName}
              variant="outlined"
              fullWidth
            />
          </FormControl>

          {/* Email */}
          <FormControl>
            <FormLabel htmlFor="Email">Email *</FormLabel>
            <TextField
              id="Email"
              name="Email"
              type="email"
              value={formik.values.Email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.Email && Boolean(formik.errors.Email)}
              helperText={formik.touched.Email && formik.errors.Email}
              variant="outlined"
              fullWidth
            />
          </FormControl>

          {/* Phone */}
          <FormControl>
            <FormLabel htmlFor="Phone">Phone *</FormLabel>
            <TextField
              id="Phone"
              name="Phone"
              value={formik.values.Phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.Phone && Boolean(formik.errors.Phone)}
              helperText={formik.touched.Phone && formik.errors.Phone}
              variant="outlined"
              fullWidth
            />
          </FormControl>

          {/* Type */}
          <FormControl>
            <FormLabel htmlFor="Type">Type *</FormLabel>
            <Select
              id="Type"
              name="Type"
              value={formik.values.Type}
              onChange={formik.handleChange}
              error={formik.touched.Type && Boolean(formik.errors.Type)}
              fullWidth
            >
              {userTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.Type && formik.errors.Type && (
              <Box sx={{ color: "error.main", fontSize: "0.75rem", mt: 0.5 }}>
                {formik.errors.Type}
              </Box>
            )}
          </FormControl>

          {/* Status */}
          <FormControl>
            <FormLabel htmlFor="isActive">Status *</FormLabel>
            <Select
              id="isActive"
              name="isActive"
              value={formik.values.isActive}
              onChange={formik.handleChange}
              error={formik.touched.isActive && Boolean(formik.errors.isActive)}
              fullWidth
            >
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
            {formik.touched.isActive && formik.errors.isActive && (
              <Box sx={{ color: "error.main", fontSize: "0.75rem", mt: 0.5 }}>
                {formik.errors.isActive}
              </Box>
            )}
          </FormControl>

          {/* Permissions */}
          <FormControl className="full-width">
            <FormLabel htmlFor="permissionIds">Permissions *</FormLabel>
            {permissionsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Select<number[]>
                id="permissionIds"
                multiple
                value={formik.values.permissionIds}
                onChange={handlePermissionChange}
                input={<OutlinedInput />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, height: 'auto' }}>
                    {(selected as number[]).map((value) => (
                      <Chip key={value} label={getPermissionLabel(value)} size="small" />
                    ))}
                  </Box>
                )}
                error={formik.touched.permissionIds && Boolean(formik.errors.permissionIds)}
                fullWidth
                sx={{height: 'auto'}}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      width: 350,
                    },
                  },
                }}
              >
                {(() => {
                  let permissions = [];
                  if (Array.isArray(permissionsData)) {
                    permissions = permissionsData;
                  } else if (permissionsData && (permissionsData as any).result) {
                    permissions = (permissionsData as any).result;
                  }
                  return permissions?.map((permission: Permission) => (
                  <MenuItem key={permission.id} value={permission.id}>
                    <Checkbox 
                      checked={formik.values.permissionIds.includes(permission.id)}
                      size="small"
                    />
                    <ListItemText
                      primary={
                        <Box>
                          <Box sx={{ fontWeight: "medium", fontSize: "0.875rem" }}>
                            {permission.module} - {permission.action}
                          </Box>
                          <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                            {permission.description}
                          </Box>
                        </Box>
                      }
                    />
                  </MenuItem>
                ));
                })()}
              </Select>
            )}
            {formik.touched.permissionIds && formik.errors.permissionIds && (
              <Box sx={{ color: "error.main", fontSize: "0.75rem", mt: 0.5 }}>
                {formik.errors.permissionIds}
              </Box>
            )}
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={() => formik.handleSubmit()}
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          sx={{ textTransform: "none" }}
        >
          {isSubmitting ? <CircularProgress size={20} /> : "Update User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserDialog;
