import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";
import type {} from "@mui/x-charts/themeAugmentation";

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
} from "@mui/material";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { Select, MenuItem, FormHelperText } from "@mui/material";
import { Add, Upload } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import * as Yup from "yup";

import {
  useCreateUOMMutation,
  useDeleteUOMMutation,
  useGetUOMsQuery,
  useUpdateUOMMutation,
} from "../RTK/services/uomApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import DynamicTable from "../components/Tables";

interface UOMType {
  id?: number;
  uom_name: string;
  subsidiary_id?: number | string | null;
}

const UOMComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  const navigate = useNavigate();

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editUOMId, setEditUOMId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUOMId, setDeleteUOMId] = useState<number | null>(null);

  const { data: uomData } = useGetUOMsQuery();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();
  const [createUOM] = useCreateUOMMutation();
  const [updateUOM] = useUpdateUOMMutation();
  const [deleteUOM] = useDeleteUOMMutation();

  const subsidiaries = subsidiariesData?.result || [];

  const formik = useFormik<UOMType>({
    initialValues: {
      uom_name: "",
      subsidiary_id: "",
    },
    validationSchema: Yup.object({
      uom_name: Yup.string()
        .min(1, "UOM name must be at least 1 character")
        .max(100, "UOM name must be at most 100 characters")
        .required("UOM name is required"),
      subsidiary_id: Yup.number()
        //.typeError("Subsidiary is required")
        //.required("Subsidiary is required"),
        .optional().nullable(),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit && editUOMId) {
          if (!canUpdate("uom")) {
            toast.error("You do not have permission to update UOMs");
            return;
          }
          const response = await updateUOM({
            id: editUOMId,
            payload: values,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate("uom")) {
            toast.error("You do not have permission to create UOMs");
            return;
          }
          const response = await createUOM(values).unwrap();
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
    if (!canUpdate("uom")) {
      toast.error("You do not have permission to edit UOMs");
      return;
    }

    const uom = uomData?.result?.find((item: any) => item.id === id);
    if (uom) {
      formik.setValues({
        uom_name: uom.uom_name,
        subsidiary_id: uom.subsidiary?.id || uom.subsidiary_id || "",
      });
      setEditUOMId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("uom")) {
      toast.error("You do not have permission to delete UOMs");
      return;
    }

    try {
      const response = await deleteUOM(id).unwrap();
      toast.success(response.message);
      setDeleteUOMId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete UOM");
    }
  };

  const handleAddUOM = () => {
    if (!canCreate("uom")) {
      toast.error("You do not have permission to create UOMs");
      return;
    }

    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    {
      key: "uom_name",
      label: "UOM Name",
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
      render: (row: any) =>
        row.subsidiary ? row.subsidiary.subsidiary_name : "N/A",
    },
    {
      key: "createdAt",
      label: "Created Date",
      render: (row: any) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A",
    },
  ];

  // If user cannot read UOMs but can create, show Access Denied but allow create flow
  if (!canRead("uom")) {
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
              Access Denied: You do not have permission to view UOMs.
            </Typography>
            {canCreate("uom") && (
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
                Add UOM
              </Button>
            )}
          </Box>

          {/* Render dialog and confirmation so create-only users can use the create flow */}
          <Dialog
            open={isOpen}
            onClose={() => setOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>{isEdit ? "Edit UOM" : "Add UOM"}</DialogTitle>
            <DialogContent>
              <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{ mt: 2 }}
              >
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="uom_name">UOM Name</FormLabel>
                  <TextField
                    id="uom_name"
                    fullWidth
                    variant="outlined"
                    placeholder="Enter UOM name (e.g., kg, liter, piece, meter)"
                    {...formik.getFieldProps("uom_name")}
                    error={formik.touched.uom_name && !!formik.errors.uom_name}
                    helperText={
                      formik.touched.uom_name && formik.errors.uom_name
                    }
                  />
                </FormControl>

                <FormControl
                  fullWidth
                  sx={{ mb: 2 }}
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
              setDeleteUOMId(null);
            }}
            onConfirm={() => deleteUOMId !== null && handleDelete(deleteUOMId)}
            variant="delete"
            title="Delete UOM"
            message="Are you sure you want to delete this UOM? This action cannot be undone."
          />
        </Box>
    );
  }

  return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h3">Unit of Measurement (UOM)</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            {canCreate("uom") && (
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => navigate("/uom/csv-import")}
              >
                CSV Import
              </Button>
            )}
            {canCreate("uom") && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={handleAddUOM}
              >
                Add UOM
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
          <DialogTitle>{isEdit ? "Edit UOM" : "Add UOM"}</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="uom_name">UOM Name</FormLabel>
                <TextField
                  id="uom_name"
                  fullWidth
                  variant="outlined"
                  placeholder="Enter UOM name (e.g., kg, liter, piece, meter)"
                  {...formik.getFieldProps("uom_name")}
                  error={formik.touched.uom_name && !!formik.errors.uom_name}
                  helperText={formik.touched.uom_name && formik.errors.uom_name}
                />
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
            setDeleteUOMId(null);
          }}
          onConfirm={() => deleteUOMId !== null && handleDelete(deleteUOMId)}
          variant="delete"
          title="Delete UOM"
          message="Are you sure you want to delete this UOM? This action cannot be undone."
        />

        <DynamicTable
          columns={columns}
          data={uomData?.result || []}
          getRowId={(row) => row.id}
          onEdit={canUpdate("uom") ? (id) => handleEdit(Number(id)) : undefined}
          onDelete={
            canDelete("uom")
              ? (id) => {
                  setDeleteUOMId(Number(id));
                  setDeleteDialogOpen(true);
                }
              : undefined
          }
        />
      </Box>
  );
};

export default UOMComp;
