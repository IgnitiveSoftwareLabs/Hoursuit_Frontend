import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";

import React, { useState, useEffect } from "react";
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
  FormHelperText,
  Grid,
  Chip,
} from "@mui/material";
import {
  Add,
  Business,
  Person,
  Email,
  Phone,
  LocationOn,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

import {
  useCreateVendorMutation,
  useDeleteVendorMutation,
  useGetVendorsQuery,
  useUpdateVendorMutation,
} from "../RTK/services/vendorApi";

import { useGetStatesQuery } from "../RTK/services/stateApi";

import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import DynamicTable from "../components/Tables";
import { usePermissions } from "../Hooks/usePermissions";

interface VendorType {
  id?: number;
  vendor_name: string;
  gstin: string;
  address: string;
  city_id: number | string;
  state_code_id: number | string;
  subsidiary_id?: number | string | null;
  FirstName: string;
  LastName: string;
  Email: string;
  Password?: string;
  Phone: string;
  isActive?: boolean;
}

const VendorComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editVendorId, setEditVendorId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteVendorId, setDeleteVendorId] = useState<number | null>(null);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const { data: vendorsData } = useGetVendorsQuery({page: 1, option: true});
  console.log("filteredCities", vendorsData);
  const { data: statesData } = useGetStatesQuery();
  const { data: citiesData } = useGetCitiesQuery();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();
  const [createVendor] = useCreateVendorMutation();
  const [updateVendor] = useUpdateVendorMutation();
  const [deleteVendor] = useDeleteVendorMutation();

  const formik = useFormik<VendorType>({
    initialValues: {
      vendor_name: "",
      gstin: "",
      address: "",
      city_id: "",
      subsidiary_id: "",
      state_code_id: "",
      FirstName: "",
      LastName: "",
      Email: "",
      Password: "",
      Phone: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      vendor_name: Yup.string()
        .min(2, "Vendor name must be at least 2 characters")
        .max(200, "Vendor name must be at most 200 characters")
        .required("Vendor name is required"),
      gstin: Yup.string()
        .matches(
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
          "Invalid GSTIN format"
        ).notRequired(),
        // .required("GSTIN is required"),
      address: Yup.string()
        .min(10, "Address must be at least 10 characters")
        .max(500, "Address must be at most 500 characters")
        .required("Address is required"),
      state_code_id: Yup.number()
        .positive("Please select a valid state")
        .required("State is required"),
      city_id: Yup.number()
        .positive("Please select a valid city")
        .required("City is required"),
      subsidiary_id: Yup.mixed()
        .optional().nullable(),
        //.required("Subsidiary is required"),
      FirstName: Yup.string()
        .min(2, "First name must be at least 2 characters")
        .max(50, "First name must be at most 50 characters")
        .required("First name is required"),
      LastName: Yup.string()
        .min(2, "Last name must be at least 2 characters")
        .max(50, "Last name must be at most 50 characters")
        .required("Last name is required"),
      Email: Yup.string()
        .email("Invalid email format")
        .required("Email is required"),
      Password: isEdit
        ? Yup.string().min(6, "Password must be at least 6 characters")
        : Yup.string()
            .min(6, "Password must be at least 6 characters")
            .required("Password is required"),
      Phone: Yup.string()
        .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
        .required("Phone number is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,
          city_id: Number(values.city_id),
          state_code_id: Number(values.state_code_id),
          subsidiary_id: values.subsidiary_id
            ? Number(values.subsidiary_id)
            : null,
        };

        // Remove password if editing and password is empty
        if (isEdit && !values.Password) {
          delete payload.Password;
        }

        if (isEdit && editVendorId) {
          if (!canUpdate("vendor")) {
            toast.error("You do not have permission to update vendors");
            return;
          }
          const response = await updateVendor({
            id: editVendorId,
            payload,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate("vendor")) {
            toast.error("You do not have permission to create vendors");
            return;
          }
          const response = await createVendor(payload).unwrap();
          toast.success(response.message);
        }

        formik.resetForm();
        setOpen(false);
        setIsEdit(false);
      } catch (error: any) {
        console.log("error", error);
        toast.error(error?.message || "Something went wrong");
        setOpen(false);
      }
    },
  });

  // Filter cities based on selected state
  useEffect(() => {
    console.log("formik state", formik.values.state_code_id, citiesData);
    if (formik.values.state_code_id && citiesData?.result) {
      const filtered = citiesData.result.filter(
        (city: any) => city.state_code_id == Number(formik.values.state_code_id)
      );
      console.log("filtered", filtered);
      setFilteredCities(filtered);

      // Clear city selection if current city doesn't belong to selected state
      const currentCityValid = filtered.some(
        (city: any) => city.id === Number(formik.values.city_id)
      );
      if (!currentCityValid) {
        formik.setFieldValue("city_id", "");
      }
    } else {
      setFilteredCities([]);
      console.log("else");
    }
  }, [formik.values.state_code_id, citiesData]);

  const handleEdit = (id: number) => {
    if (!canUpdate("vendor")) {
      toast.error("You do not have permission to edit vendors");
      return;
    }

    const vendor = vendorsData?.result?.find((item: any) => item.id === id);
    if (vendor) {
      formik.setValues({
        vendor_name: vendor.vendor_name,
        gstin: vendor.gstin,
        address: vendor.address,
        city_id: vendor.city_id,
        subsidiary_id: vendor.subsidiary_id ?? vendor.subsidiary?.id ?? "",
        state_code_id: vendor.state_code_id,
        FirstName: vendor.user?.FirstName || "",
        LastName: vendor.user?.LastName || "",
        Email: vendor.user?.Email || "",
        Password: "", // Don't populate password for security
        Phone: vendor.user?.Phone || "",
        isActive: vendor.isActive ?? true,
      });
      setEditVendorId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("vendor")) {
      toast.error("You do not have permission to delete vendors");
      return;
    }

    try {
      const response = await deleteVendor(id).unwrap();
      toast.success(response.message);
      setDeleteVendorId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete vendor");
    }
  };

  const handleAddVendor = () => {
    if (!canCreate("vendor")) {
      toast.error("You do not have permission to create vendors");
      return;
    }

    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
    setFilteredCities([]);
  };

  const columns = [
    {
      key: "vendor_name",
      label: "Vendor Name",
      render: (row: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Business sx={{ color: "#666", fontSize: "1.2rem" }} />
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {row.vendor_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              GSTIN: {row.gstin}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: "contact_person",
      label: "Contact Person",
      render: (row: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Person sx={{ color: "#666", fontSize: "1.2rem" }} />
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {row.user?.FirstName} {row.user?.LastName}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Email sx={{ fontSize: "0.8rem", color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {row.user?.Email}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Phone sx={{ fontSize: "0.8rem", color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {row.user?.Phone}
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (row: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LocationOn sx={{ color: "#666", fontSize: "1.2rem" }} />
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {row.city?.city_name || "N/A"}
            </Typography>
            {row.state && (
              <Typography variant="caption" color="text.secondary">
                {row.state.state_name} ({row.state.state_code})
              </Typography>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {row.address?.substring(0, 50)}
              {row.address?.length > 50 ? "..." : ""}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (row: any) => (
        <Chip
          label={row.isActive ? "Active" : "Inactive"}
          color={row.isActive ? "success" : "error"}
          size="small"
          variant="filled"
        />
      ),
    },
    {
      key: "subsidiary.subsidiary_name",
      label: "Subsidiary",
      render: (row: any) => (
        <Typography variant="body2">
          {row.subsidiary?.subsidiary_name || "N/A"}
        </Typography>
      ),
    },
    {
      key: "createdAt",
      label: "Created Date",
      render: (row: any) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A",
    },
  ];

  // If user cannot read vendors, allow create-only users to open the create dialog.
  if (!canRead("vendor")) {
    return (
        <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="h6" color="error">
              Access Denied: You do not have permission to view vendors.
            </Typography>
            {canCreate("vendor") && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={() => {
                  setOpen(true);
                  setIsEdit(false);
                  formik.resetForm();
                  setFilteredCities([]);
                }}
              >
                Add Vendor
              </Button>
            )}
          </Box>

          {/* Keep the dialog and confirmation rendered so create-only users can use the create flow */}
          <Dialog
            open={isOpen}
            onClose={() => setOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>{isEdit ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
            <DialogContent>
              <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{ mt: 2 }}
              >
                {/* Company Information */}
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ mt: 2, mb: 1, color: "primary.main" }}
                >
                  Company Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="vendor_name">Vendor Name</FormLabel>
                      <TextField
                        id="vendor_name"
                        fullWidth
                        variant="outlined"
                        placeholder="Enter vendor company name"
                        {...formik.getFieldProps("vendor_name")}
                        error={
                          formik.touched.vendor_name &&
                          !!formik.errors.vendor_name
                        }
                        helperText={
                          formik.touched.vendor_name &&
                          formik.errors.vendor_name
                        }
                      />
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="gstin">GSTIN</FormLabel>
                      <TextField
                        id="gstin"
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., 29ABCDE1234F1Z5"
                        {...formik.getFieldProps("gstin")}
                        error={formik.touched.gstin && !!formik.errors.gstin}
                        helperText={formik.touched.gstin && formik.errors.gstin}
                      />
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl
                      fullWidth
                      error={
                        formik.touched.state_code_id &&
                        !!formik.errors.state_code_id
                      }
                    >
                      <FormLabel htmlFor="state_code_id">State</FormLabel>
                      <Select
                        id="state_code_id"
                        name="state_code_id"
                        value={formik.values.state_code_id}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Select a state</em>
                        </MenuItem>
                        {statesData?.result?.map((state: any) => (
                          <MenuItem key={state.id} value={state.id}>
                            {state.state_name} ({state.state_code})
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.state_code_id &&
                        formik.errors.state_code_id && (
                          <FormHelperText error>
                            {formik.errors.state_code_id}
                          </FormHelperText>
                        )}
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl
                      fullWidth
                      error={formik.touched.city_id && !!formik.errors.city_id}
                    >
                      <FormLabel htmlFor="city_id">City</FormLabel>
                      <Select
                        id="city_id"
                        name="city_id"
                        value={formik.values.city_id}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        displayEmpty
                        disabled={!formik.values.state_code_id}
                      >
                        <MenuItem value="">
                          <em>Select a city</em>
                        </MenuItem>
                        {filteredCities.map((city: any) => (
                          <MenuItem key={city.id} value={city.id}>
                            {city.city_name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.city_id && formik.errors.city_id && (
                        <FormHelperText error>
                          {formik.errors.city_id}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl
                      fullWidth
                      error={
                        formik.touched.subsidiary_id &&
                        !!formik.errors.subsidiary_id
                      }
                    >
                      <FormLabel htmlFor="subsidiary_id">Subsidiary</FormLabel>
                      <Select
                        id="subsidiary_id"
                        name="subsidiary_id"
                        value={formik.values.subsidiary_id ?? ""}
                        onChange={(e) =>
                          formik.setFieldValue("subsidiary_id", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Select a subsidiary</em>
                        </MenuItem>
                        {subsidiariesData?.result?.map((s: any) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.subsidiary_name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.subsidiary_id &&
                        formik.errors.subsidiary_id && (
                          <FormHelperText error>
                            {formik.errors.subsidiary_id}
                          </FormHelperText>
                        )}
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="address">Address</FormLabel>
                      <TextField
                        id="address"
                        fullWidth
                        rows={3}
                        variant="outlined"
                        placeholder="Enter complete address"
                        {...formik.getFieldProps("address")}
                        error={
                          formik.touched.address && !!formik.errors.address
                        }
                        helperText={
                          formik.touched.address && formik.errors.address
                        }
                      />
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Contact Person Information */}
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ mt: 3, mb: 1, color: "primary.main" }}
                >
                  Contact Person Details
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="FirstName">First Name</FormLabel>
                      <TextField
                        id="FirstName"
                        fullWidth
                        variant="outlined"
                        placeholder="Enter first name"
                        {...formik.getFieldProps("FirstName")}
                        error={
                          formik.touched.FirstName && !!formik.errors.FirstName
                        }
                        helperText={
                          formik.touched.FirstName && formik.errors.FirstName
                        }
                      />
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="LastName">Last Name</FormLabel>
                      <TextField
                        id="LastName"
                        fullWidth
                        variant="outlined"
                        placeholder="Enter last name"
                        {...formik.getFieldProps("LastName")}
                        error={
                          formik.touched.LastName && !!formik.errors.LastName
                        }
                        helperText={
                          formik.touched.LastName && formik.errors.LastName
                        }
                      />
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="Email">Email</FormLabel>
                      <TextField
                        id="Email"
                        type="email"
                        fullWidth
                        variant="outlined"
                        placeholder="Enter email address"
                        {...formik.getFieldProps("Email")}
                        error={formik.touched.Email && !!formik.errors.Email}
                        helperText={formik.touched.Email && formik.errors.Email}
                      />
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="Phone">Phone Number</FormLabel>
                      <TextField
                        id="Phone"
                        fullWidth
                        variant="outlined"
                        placeholder="Enter 10-digit phone number"
                        {...formik.getFieldProps("Phone")}
                        error={formik.touched.Phone && !!formik.errors.Phone}
                        helperText={formik.touched.Phone && formik.errors.Phone}
                      />
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <FormControl fullWidth>
                      <FormLabel htmlFor="Password">
                        {isEdit
                          ? "Password (leave blank to keep current)"
                          : "Password"}
                      </FormLabel>
                      <TextField
                        id="Password"
                        type="password"
                        fullWidth
                        variant="outlined"
                        placeholder={
                          isEdit
                            ? "Enter new password or leave blank"
                            : "Enter password"
                        }
                        {...formik.getFieldProps("Password")}
                        error={
                          formik.touched.Password && !!formik.errors.Password
                        }
                        helperText={
                          formik.touched.Password && formik.errors.Password
                        }
                      />
                    </FormControl>
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={formik.isSubmitting}
                  sx={{ mt: 3 }}
                >
                  {isEdit ? "Update Vendor" : "Create Vendor"}
                </Button>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)} color="inherit">
                Cancel
              </Button>
            </DialogActions>
          </Dialog>

          <ConfirmationDialog
            open={isDeleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setDeleteVendorId(null);
            }}
            onConfirm={() =>
              deleteVendorId !== null && handleDelete(deleteVendorId)
            }
            variant="delete"
            title="Delete Vendor"
            message="Are you sure you want to delete this vendor? This action cannot be undone and will also remove the associated user account."
          />
        </Box>
    );
  }

  return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h3">Vendor Management</Typography>
          {canCreate("vendor") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddVendor}
            >
              Add Vendor
            </Button>
          )}
        </Box>

        <Dialog
          open={isOpen}
          onClose={() => setOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{isEdit ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              {/* Company Information */}
              <Typography
                variant="h6"
                gutterBottom
                sx={{ mt: 2, mb: 1, color: "primary.main" }}
              >
                Company Information
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="vendor_name">Vendor Name</FormLabel>
                    <TextField
                      id="vendor_name"
                      fullWidth
                      variant="outlined"
                      placeholder="Enter vendor company name"
                      {...formik.getFieldProps("vendor_name")}
                      error={
                        formik.touched.vendor_name &&
                        !!formik.errors.vendor_name
                      }
                      helperText={
                        formik.touched.vendor_name && formik.errors.vendor_name
                      }
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="gstin">GSTIN</FormLabel>
                    <TextField
                      id="gstin"
                      fullWidth
                      variant="outlined"
                      placeholder="e.g., 29ABCDE1234F1Z5"
                      {...formik.getFieldProps("gstin")}
                      error={formik.touched.gstin && !!formik.errors.gstin}
                      helperText={formik.touched.gstin && formik.errors.gstin}
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl
                    fullWidth
                    error={
                      formik.touched.state_code_id &&
                      !!formik.errors.state_code_id
                    }
                  >
                    <FormLabel htmlFor="state_code_id">State</FormLabel>
                    <Select
                      id="state_code_id"
                      name="state_code_id"
                      value={formik.values.state_code_id}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Select a state</em>
                      </MenuItem>
                      {statesData?.result?.map((state: any) => (
                        <MenuItem key={state.id} value={state.id}>
                          {state.state_name} ({state.state_code})
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.state_code_id &&
                      formik.errors.state_code_id && (
                        <FormHelperText error>
                          {formik.errors.state_code_id}
                        </FormHelperText>
                      )}
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl
                    fullWidth
                    error={formik.touched.city_id && !!formik.errors.city_id}
                  >
                    <FormLabel htmlFor="city_id">City</FormLabel>
                    <Select
                      id="city_id"
                      name="city_id"
                      value={formik.values.city_id}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      displayEmpty
                      disabled={!formik.values.state_code_id}
                    >
                      <MenuItem value="">
                        <em>Select a city</em>
                      </MenuItem>
                      {filteredCities.map((city: any) => (
                        <MenuItem key={city.id} value={city.id}>
                          {city.city_name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.city_id && formik.errors.city_id && (
                      <FormHelperText error>
                        {formik.errors.city_id}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl
                    fullWidth
                    error={
                      formik.touched.subsidiary_id &&
                      !!formik.errors.subsidiary_id
                    }
                  >
                    <FormLabel htmlFor="subsidiary_id">Subsidiary</FormLabel>
                    <Select
                      id="subsidiary_id"
                      name="subsidiary_id"
                      value={formik.values.subsidiary_id}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Select a subsidiary</em>
                      </MenuItem>
                      {subsidiariesData?.result?.map((s: any) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.subsidiary_name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.subsidiary_id &&
                      formik.errors.subsidiary_id && (
                        <FormHelperText error>
                          {formik.errors.subsidiary_id}
                        </FormHelperText>
                      )}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="address">Address</FormLabel>
                    <TextField
                      id="address"
                      fullWidth
                      rows={3}
                      variant="outlined"
                      placeholder="Enter complete address"
                      {...formik.getFieldProps("address")}
                      error={formik.touched.address && !!formik.errors.address}
                      helperText={
                        formik.touched.address && formik.errors.address
                      }
                    />
                  </FormControl>
                </Grid>
              </Grid>

              {/* Contact Person Information */}
              <Typography
                variant="h6"
                gutterBottom
                sx={{ mt: 3, mb: 1, color: "primary.main" }}
              >
                Contact Person Details
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="FirstName">First Name</FormLabel>
                    <TextField
                      id="FirstName"
                      fullWidth
                      variant="outlined"
                      placeholder="Enter first name"
                      {...formik.getFieldProps("FirstName")}
                      error={
                        formik.touched.FirstName && !!formik.errors.FirstName
                      }
                      helperText={
                        formik.touched.FirstName && formik.errors.FirstName
                      }
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="LastName">Last Name</FormLabel>
                    <TextField
                      id="LastName"
                      fullWidth
                      variant="outlined"
                      placeholder="Enter last name"
                      {...formik.getFieldProps("LastName")}
                      error={
                        formik.touched.LastName && !!formik.errors.LastName
                      }
                      helperText={
                        formik.touched.LastName && formik.errors.LastName
                      }
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="Email">Email</FormLabel>
                    <TextField
                      id="Email"
                      type="email"
                      fullWidth
                      variant="outlined"
                      placeholder="Enter email address"
                      {...formik.getFieldProps("Email")}
                      error={formik.touched.Email && !!formik.errors.Email}
                      helperText={formik.touched.Email && formik.errors.Email}
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="Phone">Phone Number</FormLabel>
                    <TextField
                      id="Phone"
                      fullWidth
                      variant="outlined"
                      placeholder="Enter 10-digit phone number"
                      {...formik.getFieldProps("Phone")}
                      error={formik.touched.Phone && !!formik.errors.Phone}
                      helperText={formik.touched.Phone && formik.errors.Phone}
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="Password">
                      {isEdit
                        ? "Password (leave blank to keep current)"
                        : "Password"}
                    </FormLabel>
                    <TextField
                      id="Password"
                      type="password"
                      fullWidth
                      variant="outlined"
                      placeholder={
                        isEdit
                          ? "Enter new password or leave blank"
                          : "Enter password"
                      }
                      {...formik.getFieldProps("Password")}
                      error={
                        formik.touched.Password && !!formik.errors.Password
                      }
                      helperText={
                        formik.touched.Password && formik.errors.Password
                      }
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={formik.isSubmitting}
                sx={{ mt: 3 }}
              >
                {isEdit ? "Update Vendor" : "Create Vendor"}
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setDeleteVendorId(null);
          }}
          onConfirm={() =>
            deleteVendorId !== null && handleDelete(deleteVendorId)
          }
          variant="delete"
          title="Delete Vendor"
          message="Are you sure you want to delete this vendor? This action cannot be undone and will also remove the associated user account."
        />

        <DynamicTable
          columns={columns}
          data={vendorsData?.result || []}
          getRowId={(row) => row.id}
          onEdit={
            canUpdate("vendor") ? (id) => handleEdit(Number(id)) : undefined
          }
          onDelete={
            canDelete("vendor")
              ? (id) => {
                  setDeleteVendorId(Number(id));
                  setDeleteDialogOpen(true);
                }
              : undefined
          }
        />
      </Box>
  );
};

export default VendorComp;