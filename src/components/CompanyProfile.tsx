import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  TextField,
  Avatar,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  useFetchCompanyQuery,
  useUpdateCompanyMutation,
} from "../RTK/services/companyApi";
import { Create } from "@mui/icons-material";
import CustomFileUpload from "../Common/CustomFileUpload";
import Spinner from "../Common/Spinner";

// Define interface for form values
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

// Validation schema using Yup
const validationSchema = Yup.object({
  name: Yup.string()
    .required("Company name is required")
    .min(2, "Company name must be at least 2 characters"),
  gstNumber: Yup.string()
    .matches(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST number format"
    )
    .required("GST number is required"),
  contactPerson: Yup.string()
    .required("Contact person name is required")
    .min(2, "Contact person name must be at least 2 characters"),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, "Invalid phone number")
    .required("Phone number is required"),
  address: Yup.string()
    .required("Address is required")
    .min(5, "Address must be at least 5 characters"),
  gstEnabled: Yup.boolean().required("GST enabled status is required"),
});

const CompanyProfile: React.FC = () => {
  // const companyData = useAppSelector((state: any) => state.company.values) as CompanyData | null;
  const {
    data: companyData,
    isLoading: iscompload,
    isError,
  } = useFetchCompanyQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [updateCompany, { isLoading }] = useUpdateCompanyMutation();

  const handleUpdateSubmit = async (
    values: CompanyFormValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      const formData = new FormData();

      // Append standard fields
      formData.append("name", values.name);
      formData.append("gstNumber", values.gstNumber);
      formData.append("contactPerson", values.contactPerson);
      formData.append("phone", values.phone);
      formData.append("address", values.address);
      formData.append("gstEnabled", String(values.gstEnabled));

      // Append file fields if selected
      if (values.License_Number) {
        formData.append("License_Number", values.License_Number);
        formData.append(
          "License_Number_validTill",
          values.License_Number_validTill || ""
        );
      }

      if (values.Utility_Certificate) {
        formData.append("Utility_Certificate", values.Utility_Certificate);
        formData.append(
          "Utility_Certificate_validTill",
          values.Utility_Certificate_validTill || ""
        );
      }

      if (values.Fssai_Certificate) {
        formData.append("Fssai_Certificate", values.Fssai_Certificate);
        formData.append(
          "Fssai_Certificate_validTill",
          values.Fssai_Certificate_validTill || ""
        );
      }

      // Call API
      const response: any = await updateCompany({
        id: editId?.toString() || "",
        payload: formData, // should be FormData
      }).unwrap();

      if (response.success) {
        toast.success("Company profile updated successfully");
        setIsModalOpen(false);
      } else {
        toast.error(response.message || "Failed to update company profile");
      }
    } catch (error: any) {
      console.error("Error updating company profile:", error);
      toast.error(error?.data?.message || "Failed to update company profile");
    } finally {
      setSubmitting(false);
    }
  };

  console.log("Company Data:", companyData);
  const initialFormValues = useMemo(
    () => ({
      name: companyData?.result.name || "",
      gstNumber: companyData?.result.gstNumber || "",
      contactPerson: companyData?.result.contactPerson || "",
      phone: companyData?.result.phone || "",
      address: companyData?.result.address || "",
      gstEnabled: companyData?.result.gstEnabled || false,
      License_Number_validTill: "",
      Utility_Certificate_validTill: "",
      Fssai_Certificate_validTill: "",
      License_Number: null,
      Utility_Certificate: null,
      Fssai_Certificate: null,
    }),
    [companyData]
  );
  if (iscompload || isLoading) {
    return (
      <div style={{ height: "100vh" }}>
        <Spinner centered size={60} color="secondary" />
      </div>
    );
  }
  if (!companyData?.result || Object.keys(companyData?.result).length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading company profile...
        </Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Typography variant="body1" color="error">
          Failed to load company profile.
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h3" sx={{ mb: 2 }}>
          Company Profile
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setIsModalOpen(true);
            setEditId(companyData?.result.id);
          }}
          sx={{ textTransform: "none", px: 3 }}
        >
          <Create sx={{ mr: 1 }} />
          Update Details
        </Button>
      </Box>

      <Grid
        container
        spacing={2}
        columns={12}
        sx={{ mb: (theme) => theme.spacing(2) }}
      >
        {/* Company Information */}
        <Grid size={{ xs: 12, sm: 12, lg: 12 }}>
          <Card
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              backgroundColor: (theme) => theme.palette.background.paper,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Company Details
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Name:
                  </Typography>
                  <Typography variant="body1">
                    {companyData?.result?.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    GST Number:
                  </Typography>
                  <Typography variant="body1">
                    {companyData?.result?.gstNumber}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Contact Person:
                  </Typography>
                  <Typography variant="body1">
                    {companyData?.result?.contactPerson}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Phone:
                  </Typography>
                  <Typography variant="body1">
                    {companyData?.result?.phone}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Address:
                  </Typography>
                  <Typography variant="body1">
                    {companyData?.result?.address}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    GST Enabled:
                  </Typography>
                  <Typography variant="body1">
                    {companyData?.result?.gstEnabled ? "Yes" : "No"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created At:
                  </Typography>
                  <Typography variant="body1">
                    {new Date(
                      companyData?.result?.createdAt
                    ).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 12, lg: 12 }}>
          <Card
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              backgroundColor: (theme) => theme.palette.background.paper,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attachments
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {companyData?.result?.attachments?.length > 0 ? (
                  companyData.result.attachments.map((attachment: any) => (
                    <Box
                      key={attachment.id}
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Type: {attachment.type.replace(/_/g, " ")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        File Name: {attachment.fileName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Valid Till:{" "}
                        {new Date(attachment.validTill).toLocaleDateString()}
                      </Typography>
                      <a
                        href={`http://localhost:8004/${attachment.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#1976d2", textDecoration: "none" }}
                      >
                        View/Download
                      </a>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No attachments available.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* User Information */}
        <Grid size={{ xs: 12, sm: 12, lg: 12 }}>
          <Card
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              backgroundColor: (theme) => theme.palette.background.paper,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Details
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    src={companyData?.result.user.ProfileImage}
                    alt="Profile"
                    sx={{ width: 64, height: 64 }}
                  />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Name:
                    </Typography>
                    <Typography variant="body1">
                      {companyData?.result.user.FirstName}{" "}
                      {companyData?.result.user.LastName}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email:
                  </Typography>
                  <Typography variant="body1">
                    {companyData?.result.user.Email}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Phone:
                  </Typography>
                  <Typography variant="body1">
                    {companyData?.result.user.Phone || "Not provided"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Type:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ textTransform: "capitalize" }}
                  >
                    {companyData?.result.user.Type}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Update Company Dialog */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Company Details</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={initialFormValues}
            validationSchema={validationSchema}
            onSubmit={handleUpdateSubmit}
          >
            {({
              isSubmitting,
              errors,
              touched,
              handleChange,
              handleBlur,
              values,
              setFieldValue,
            }) => (
              <Form>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mt: 2,
                  }}
                >
                  <FormControl>
                    <FormLabel htmlFor="name">Company Name</FormLabel>
                    <Field
                      name="name"
                      as={TextField}
                      id="name"
                      placeholder="Company Name"
                      fullWidth
                      variant="outlined"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.name && !!errors.name}
                      helperText={touched.name && errors.name}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel htmlFor="gstNumber">GST Number</FormLabel>
                    <Field
                      name="gstNumber"
                      as={TextField}
                      id="gstNumber"
                      placeholder="GST Number"
                      fullWidth
                      variant="outlined"
                      value={values.gstNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.gstNumber && !!errors.gstNumber}
                      helperText={touched.gstNumber && errors.gstNumber}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel htmlFor="contactPerson">
                      Contact Person
                    </FormLabel>
                    <Field
                      name="contactPerson"
                      as={TextField}
                      id="contactPerson"
                      placeholder="Contact Person"
                      fullWidth
                      variant="outlined"
                      value={values.contactPerson}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.contactPerson && !!errors.contactPerson}
                      helperText={touched.contactPerson && errors.contactPerson}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel htmlFor="phone">Phone Number</FormLabel>
                    <Field
                      name="phone"
                      as={TextField}
                      id="phone"
                      placeholder="Phone Number"
                      type="tel"
                      fullWidth
                      variant="outlined"
                      value={values.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.phone && !!errors.phone}
                      helperText={touched.phone && errors.phone}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel htmlFor="address">Address</FormLabel>
                    <Field
                      name="address"
                      as={TextField}
                      id="address"
                      placeholder="Address"
                      fullWidth
                      variant="outlined"
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.address && !!errors.address}
                      helperText={touched.address && errors.address}
                    />
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Field
                        name="gstEnabled"
                        as={Checkbox}
                        color="primary"
                        checked={values.gstEnabled} // Ensure the checkbox reflects the current value
                      />
                    }
                    label="GST Enabled"
                  />
                  {/* Add inside the <Form> element, below address & gstEnabled */}

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomFileUpload
                        name="License_Number"
                        label="License Number"
                        accept="application/pdf,image/*"
                        maxSize={10}
                        onFileSelect={(files) =>
                          setFieldValue("License_Number", files[0] || null)
                        }
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
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2 }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomFileUpload
                        name="Utility_Certificate"
                        label="Utility Certificate"
                        accept="application/pdf,image/*"
                        maxSize={10}
                        onFileSelect={(files) =>
                          setFieldValue("Utility_Certificate", files[0] || null)
                        }
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
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2 }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <CustomFileUpload
                        name="Fssai_Certificate"
                        label="FSSAI Certificate"
                        accept="application/pdf,image/*"
                        maxSize={10}
                        onFileSelect={(files) =>
                          setFieldValue("Fssai_Certificate", files[0] || null)
                        }
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
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2 }}
                      />
                    </Grid>
                  </Grid>
                </Box>
                <DialogActions>
                  <Button
                    onClick={() => setIsModalOpen(false)}
                    color="inherit"
                    sx={{ textTransform: "none" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                    sx={{ textTransform: "none" }}
                  >
                    {isSubmitting ? "Updating..." : "Update"}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CompanyProfile;
