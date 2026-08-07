import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";
// import Layout from "../../components/Layout/index";

import React, { useState } from "react";
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
} from "@mui/material";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { Add, Upload } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import DynamicTable from "../components/Tables";
import {
  useCreateHSNSACMutation,
  useDeleteHSNSACMutation,
  useGetHSNSACsQuery,
  useUpdateHSNSACMutation,
} from "../RTK/services/hsnSacApi";

interface HSNSACType {
  id?: number;
  code: string;
  type: "HSN" | "SAC";
  description: string;
  taxPercentage?: number;
  subsidiary_id?: number | string | null;
}

const HSNSACComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  const navigate = useNavigate();

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editHSNSACId, setEditHSNSACId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteHSNSACId, setDeleteHSNSACId] = useState<number | null>(null);

  const { data: hsnSacData } = useGetHSNSACsQuery();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();
  const [createHSNSAC] = useCreateHSNSACMutation();
  const [updateHSNSAC] = useUpdateHSNSACMutation();
  const [deleteHSNSAC] = useDeleteHSNSACMutation();

  const subsidiaries = subsidiariesData?.result || [];

  const formik = useFormik<HSNSACType>({
    initialValues: {
      code: "",
      type: "HSN",
      description: "",
      subsidiary_id: "",
      taxPercentage: undefined,
    },
    validationSchema: Yup.object({
      code: Yup.string()
        .min(4, "Code must be at least 4 characters")
        .max(20, "Code must be at most 20 characters")
        .required("Code is required"),
      type: Yup.string()
        .oneOf(["HSN", "SAC"], "Type must be either HSN or SAC")
        .required("Type is required"),
      subsidiary_id: Yup.number()
        //.typeError("Subsidiary is required")
        .optional().nullable(),
        // .required("Subsidiary is required"),
      description: Yup.string()
        .max(500, "Description must be at most 500 characters")
        .optional(),
      taxPercentage: Yup.number()
        .min(0, "Tax percentage must be at least 0%")
        .max(100, "Tax percentage must be at most 100%")
        .optional(),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit && editHSNSACId) {
          if (!canUpdate("hsnsac")) {
            toast.error("You do not have permission to update HSN/SAC codes");
            return;
          }
          const response = await updateHSNSAC({
            id: editHSNSACId,
            payload: values,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate("hsnsac")) {
            toast.error("You do not have permission to create HSN/SAC codes");
            return;
          }
          const response = await createHSNSAC(values).unwrap();
          toast.success(response.message);
        }

        formik.resetForm();
        setOpen(false);
        setIsEdit(false);
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong");
        setOpen(false);
      }
    },
  });

  const handleEdit = (id: number) => {
    if (!canUpdate("hsnsac")) {
      toast.error("You do not have permission to edit HSN/SAC codes");
      return;
    }

    const hsnSac = hsnSacData?.result?.find((item: any) => item.id === id);
    if (hsnSac) {
      formik.setValues({
        code: hsnSac.code,
        type: hsnSac.type,
        description: hsnSac.description,
        subsidiary_id: hsnSac.subsidiary?.id || hsnSac.subsidiary_id || "",
        taxPercentage: hsnSac.taxPercentage || undefined,
      });
      setEditHSNSACId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("hsnsac")) {
      toast.error("You do not have permission to delete HSN/SAC codes");
      return;
    }

    try {
      const response = await deleteHSNSAC(id).unwrap();
      toast.success(response.message);
      setDeleteHSNSACId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete HSN/SAC code");
    }
  };

  const handleAddHSNSAC = () => {
    if (!canCreate("hsnsac")) {
      toast.error("You do not have permission to create HSN/SAC codes");
      return;
    }

    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    {
      key: "code",
      label: "Code",
    },
    {
      key: "type",
      label: "Type",
      render: (row: any) => (
        <Box
          sx={{
            display: "inline-block",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: row.type === "HSN" ? "#e3f2fd" : "#f3e5f5",
            color: row.type === "HSN" ? "#1976d2" : "#7b1fa2",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {row.type}
        </Box>
      ),
    },
    {
      key: "description",
      label: "Description",
    },
    {
      key: "taxPercentage",
      label: "Tax %",
      render: (row: any) => (
        <Box>
          {row.taxPercentage !== null && row.taxPercentage !== undefined
            ? `${Number(row.taxPercentage).toFixed(2)}%`
            : "-"}
        </Box>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (row: any) => (
        <Box
          sx={{
            display: "inline-block",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: row.isActive ? "#e8f5e8" : "#ffebee",
            color: row.isActive ? "#2e7d32" : "#c62828",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {row.isActive ? "Active" : "Inactive"}
        </Box>
      ),
    },
    {
      key: "subsidiary",
      label: "Subsidiary",
      render: (row: any) => <Box>{row.subsidiary?.subsidiary_name || "N/A"}</Box>,
    },
  ];

  // If user cannot read HSN/SAC but can create, show Access Denied but allow create flow
  if (!canRead("hsnsac")) {
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
              Access Denied: You do not have permission to view HSN/SAC codes.
            </Typography>
            {canCreate("hsnsac") && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={() => {
                  setOpen(true);
                  setIsEdit(false);
                  formik.resetForm();
                }}
              >
                Add HSN/SAC Code
              </Button>
            )}
          </Box>

          {/* Keep the dialog and confirmation rendered so create-only users can use the create flow */}
          <Dialog
            open={isOpen}
            onClose={() => setOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {isEdit ? "Edit HSN/SAC Code" : "Add HSN/SAC Code"}
            </DialogTitle>
            <DialogContent>
              <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{ mt: 2 }}
              >
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="code">Code</FormLabel>
                  <TextField
                    id="code"
                    fullWidth
                    variant="outlined"
                    placeholder="Enter HSN/SAC code"
                    {...formik.getFieldProps("code")}
                    error={formik.touched.code && !!formik.errors.code}
                    helperText={formik.touched.code && formik.errors.code}
                  />
                </FormControl>

                <FormControl
                  fullWidth
                  sx={{ mb: 2 }}
                  error={formik.touched.type && !!formik.errors.type}
                >
                  <FormLabel htmlFor="type">Type</FormLabel>
                  <Select
                    id="type"
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    displayEmpty
                  >
                    <MenuItem value="HSN">HSN</MenuItem>
                    <MenuItem value="SAC">SAC</MenuItem>
                  </Select>
                  {formik.touched.type && formik.errors.type && (
                    <FormHelperText error>{formik.errors.type}</FormHelperText>
                  )}
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <TextField
                    id="description"
                    fullWidth
                    variant="outlined"
                    rows={3}
                    placeholder="Enter description"
                    {...formik.getFieldProps("description")}
                    error={
                      formik.touched.description && !!formik.errors.description
                    }
                    helperText={
                      formik.touched.description && formik.errors.description
                    }
                  />
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="taxPercentage">
                    Tax Percentage (%)
                  </FormLabel>
                  <TextField
                    id="taxPercentage"
                    fullWidth
                    variant="outlined"
                    type="number"
                    placeholder="Enter tax percentage (0-100)"
                    inputProps={{
                      min: 0,
                      max: 100,
                      step: 0.01,
                    }}
                    {...formik.getFieldProps("taxPercentage")}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (value === "") {
                        formik.setFieldValue("taxPercentage", "");
                        return;
                      }
                      if (/^\.(\d*)$/.test(value)) {
                        formik.setFieldValue("taxPercentage", value);
                        return;
                      }
                      if (value.includes(".")) {
                        const parts = value.split(".");
                        const intPart = parts[0].replace(/^0+(?=\d)/, "");
                        const fracPart = parts[1] ?? "";
                        value =
                          (intPart === "" ? "0" : intPart) + "." + fracPart;
                        formik.setFieldValue("taxPercentage", value);
                        return;
                      }
                      value = value.replace(/^0+(?=\d)/, "");
                      formik.setFieldValue("taxPercentage", value);
                    }}
                    error={
                      formik.touched.taxPercentage &&
                      !!formik.errors.taxPercentage
                    }
                    helperText={
                      formik.touched.taxPercentage &&
                      formik.errors.taxPercentage
                    }
                  />
                </FormControl>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={formik.isSubmitting}
                >
                  {isEdit ? "Update" : "Submit"}
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
              setDeleteHSNSACId(null);
            }}
            onConfirm={() =>
              deleteHSNSACId !== null && handleDelete(deleteHSNSACId)
            }
            variant="delete"
            title="Delete HSN/SAC Code"
            message="Are you sure you want to delete this HSN/SAC code? This action cannot be undone."
          />
        </Box>
    );
  }

  return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h3">HSN/SAC Codes</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={() => navigate("/hsn-sac/csv-import")}
            >
              CSV Import
            </Button>
            {canCreate("hsnsac") && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={handleAddHSNSAC}
              >
                Add HSN/SAC Code
              </Button>
            )}
          </Box>
        </Box>

        <Dialog
          open={isOpen}
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {isEdit ? "Edit HSN/SAC Code" : "Add HSN/SAC Code"}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="code">Code</FormLabel>
                <TextField
                  id="code"
                  fullWidth
                  variant="outlined"
                  placeholder="Enter HSN/SAC code"
                  {...formik.getFieldProps("code")}
                  error={formik.touched.code && !!formik.errors.code}
                  helperText={formik.touched.code && formik.errors.code}
                />
              </FormControl>

              <FormControl
                fullWidth
                sx={{ mb: 2 }}
                error={formik.touched.type && !!formik.errors.type}
              >
                <FormLabel htmlFor="type">Type</FormLabel>
                <Select
                  id="type"
                  name="type"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  displayEmpty
                >
                  <MenuItem value="HSN">HSN</MenuItem>
                  <MenuItem value="SAC">SAC</MenuItem>
                </Select>
                {formik.touched.type && formik.errors.type && (
                  <FormHelperText error>{formik.errors.type}</FormHelperText>
                )}
              </FormControl>

              <FormControl
                fullWidth
                sx={{ mb: 2 }}
                error={
                  formik.touched.subsidiary_id && !!formik.errors.subsidiary_id
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
                  displayEmpty
                >
                  <MenuItem value="">Select Subsidiary</MenuItem>
                  {subsidiaries.map((s: any) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.subsidiary_name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.subsidiary_id &&
                  formik.errors.subsidiary_id && (
                    <FormHelperText error>
                      {String(formik.errors.subsidiary_id)}
                    </FormHelperText>
                  )}
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="description">Description</FormLabel>
                <TextField
                  id="description"
                  fullWidth
                  variant="outlined"
                  rows={3}
                  placeholder="Enter description"
                  {...formik.getFieldProps("description")}
                  error={
                    formik.touched.description && !!formik.errors.description
                  }
                  helperText={
                    formik.touched.description && formik.errors.description
                  }
                />
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="taxPercentage">
                  Tax Percentage (%)
                </FormLabel>
                <TextField
                  id="taxPercentage"
                  fullWidth
                  variant="outlined"
                  type="number"
                  placeholder="Enter tax percentage (0-100)"
                  inputProps={{
                    min: 0,
                    max: 100,
                    step: 0.01,
                  }}
                  {...formik.getFieldProps("taxPercentage")}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Allow empty input
                    if (value === "") {
                      formik.setFieldValue("taxPercentage", "");
                      return;
                    }

                    // If user types only a dot or starts with dot, allow ('.5')
                    if (/^\.(\d*)$/.test(value)) {
                      formik.setFieldValue("taxPercentage", value);
                      return;
                    }

                    // If contains decimal point, normalize by removing leading zeros before integer part
                    if (value.includes(".")) {
                      // Split integer and fractional parts
                      const parts = value.split(".");
                      const intPart = parts[0].replace(/^0+(?=\d)/, ""); // remove leading zeros but keep single 0 if that's the only digit
                      const fracPart = parts[1] ?? "";
                      value = (intPart === "" ? "0" : intPart) + "." + fracPart;
                      formik.setFieldValue("taxPercentage", value);
                      return;
                    }

                    // For integer inputs: remove all leading zeros
                    value = value.replace(/^0+(?=\d)/, "");
                    formik.setFieldValue("taxPercentage", value);
                  }}
                  error={
                    formik.touched.taxPercentage &&
                    !!formik.errors.taxPercentage
                  }
                  helperText={
                    formik.touched.taxPercentage && formik.errors.taxPercentage
                  }
                />
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={formik.isSubmitting}
              >
                {isEdit ? "Update" : "Submit"}
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
            setDeleteHSNSACId(null);
          }}
          onConfirm={() =>
            deleteHSNSACId !== null && handleDelete(deleteHSNSACId)
          }
          variant="delete"
          title="Delete HSN/SAC Code"
          message="Are you sure you want to delete this HSN/SAC code? This action cannot be undone."
        />

        <DynamicTable
          columns={columns}
          data={hsnSacData?.result || []}
          getRowId={(row) => row.id}
          onEdit={
            canUpdate("hsnsac") ? (id) => handleEdit(Number(id)) : undefined
          }
          onDelete={
            canDelete("hsnsac")
              ? (id) => {
                  setDeleteHSNSACId(Number(id));
                  setDeleteDialogOpen(true);
                }
              : undefined
          }
        />
      </Box>
  );
};

export default HSNSACComp;