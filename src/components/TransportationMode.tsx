import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";

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
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Select, MenuItem, FormHelperText } from "@mui/material";
import { Add, DirectionsBus } from "@mui/icons-material";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import * as Yup from "yup";

import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import DynamicTable from "../components/Tables";
import {
  useCreateTransportationModeMutation,
  useDeleteTransportationModeMutation,
  useGetTransportationModesQuery,
  useUpdateTransportationModeMutation,
} from "../RTK/services/transportationModeApi";

interface TransportationModeType {
  id?: number;
  mode_name: string;
  isActive?: boolean;
  subsidiary_id?: number | string | null;
}

const TransportationModeComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editTransportationModeId, setEditTransportationModeId] = useState<
    number | null
  >(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTransportationModeId, setDeleteTransportationModeId] = useState<
    number | null
  >(null);

  const { data: transportationModesData } = useGetTransportationModesQuery();
  const [createTransportationMode] = useCreateTransportationModeMutation();
  const [updateTransportationMode] = useUpdateTransportationModeMutation();
  const [deleteTransportationMode] = useDeleteTransportationModeMutation();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();

  const formik = useFormik<TransportationModeType>({
    initialValues: {
      mode_name: "",
      isActive: true,
      subsidiary_id: "",
    },
    validationSchema: Yup.object({
      mode_name: Yup.string()
        .min(2, "Transportation mode name must be at least 2 characters")
        .max(100, "Transportation mode name must be at most 100 characters")
        .required("Transportation mode name is required"),
      subsidiary_id: Yup.mixed()
        .optional().nullable(),
        //.required("Subsidiary is required"),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,
          subsidiary_id: values.subsidiary_id
            ? Number(values.subsidiary_id)
            : null,
        };

        if (isEdit && editTransportationModeId) {
          if (!canUpdate("transportationmode")) {
            toast.error(
              "You do not have permission to update transportation modes"
            );
            return;
          }
          const response = await updateTransportationMode({
            id: editTransportationModeId,
            payload,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate("transportationmode")) {
            toast.error(
              "You do not have permission to create transportation modes"
            );
            return;
          }
          const response = await createTransportationMode(payload).unwrap();
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
    if (!canUpdate("transportationmode")) {
      toast.error("You do not have permission to edit transportation modes");
      return;
    }

    const transportationMode = transportationModesData?.result?.find(
      (item: any) => item.id === id
    );
    if (transportationMode) {
      formik.setValues({
        mode_name: transportationMode.mode_name,
        subsidiary_id:
          transportationMode.subsidiary_id ??
          transportationMode.subsidiary?.id ??
          "",
        isActive: transportationMode.isActive ?? true,
      });
      setEditTransportationModeId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("transportationmode")) {
      toast.error("You do not have permission to delete transportation modes");
      return;
    }

    try {
      const response = await deleteTransportationMode(id).unwrap();
      toast.success(response.message);
      setDeleteTransportationModeId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete transportation mode");
    }
  };

  const handleAddTransportationMode = () => {
    if (!canCreate("transportationmode")) {
      toast.error("You do not have permission to create transportation modes");
      return;
    }

    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    {
      key: "mode_name",
      label: "Transportation Mode",
      render: (row: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DirectionsBus sx={{ color: "#666", fontSize: "1.2rem" }} />
          <Typography variant="body2" fontWeight="medium">
            {row.mode_name}
          </Typography>
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
      key: "subsidiary.subsidiary_name",
      label: "Subsidiary",
      render: (row: any) => row.subsidiary?.subsidiary_name || "N/A",
    },
    {
      key: "createdAt",
      label: "Created Date",
      render: (row: any) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A",
    },
  ];

  // If user cannot read transportation modes, allow create-only users to open the create dialog.
  if (!canRead("transportationmode")) {
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
              Access Denied: You do not have permission to view transportation
              modes.
            </Typography>
            {canCreate("transportationmode") && (
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
                Add Transportation Mode
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
              {isEdit ? "Edit Transportation Mode" : "Add Transportation Mode"}
            </DialogTitle>
            <DialogContent>
              <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{ mt: 2 }}
              >
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="mode_name">
                    Transportation Mode Name
                  </FormLabel>
                  <TextField
                    id="mode_name"
                    fullWidth
                    variant="outlined"
                    placeholder="Enter transportation mode name (e.g., Truck, Train, Ship, Air)"
                    {...formik.getFieldProps("mode_name")}
                    error={
                      formik.touched.mode_name && !!formik.errors.mode_name
                    }
                    helperText={
                      formik.touched.mode_name && formik.errors.mode_name
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
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.isActive}
                        onChange={(e) =>
                          formik.setFieldValue("isActive", e.target.checked)
                        }
                        name="isActive"
                        color="primary"
                      />
                    }
                    label="Active Status"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formik.values.isActive
                      ? "Transportation mode is active"
                      : "Transportation mode is inactive"}
                  </Typography>
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
              setDeleteTransportationModeId(null);
            }}
            onConfirm={() =>
              deleteTransportationModeId !== null &&
              handleDelete(deleteTransportationModeId)
            }
            variant="delete"
            title="Delete Transportation Mode"
            message="Are you sure you want to delete this transportation mode? This action cannot be undone."
          />
        </Box>
    );
  }

  return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h3">Transportation Modes</Typography>
          {canCreate("transportationmode") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddTransportationMode}
            >
              Add Transportation Mode
            </Button>
          )}
        </Box>

        <Dialog
          open={isOpen}
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {isEdit ? "Edit Transportation Mode" : "Add Transportation Mode"}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="mode_name">
                  Transportation Mode Name
                </FormLabel>
                <TextField
                  id="mode_name"
                  fullWidth
                  variant="outlined"
                  placeholder="Enter transportation mode name (e.g., Truck, Train, Ship, Air)"
                  {...formik.getFieldProps("mode_name")}
                  error={formik.touched.mode_name && !!formik.errors.mode_name}
                  helperText={
                    formik.touched.mode_name && formik.errors.mode_name
                  }
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
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.isActive}
                      onChange={(e) =>
                        formik.setFieldValue("isActive", e.target.checked)
                      }
                      name="isActive"
                      color="primary"
                    />
                  }
                  label="Active Status"
                />
                <Typography variant="caption" color="text.secondary">
                  {formik.values.isActive
                    ? "Transportation mode is active"
                    : "Transportation mode is inactive"}
                </Typography>
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
            setDeleteTransportationModeId(null);
          }}
          onConfirm={() =>
            deleteTransportationModeId !== null &&
            handleDelete(deleteTransportationModeId)
          }
          variant="delete"
          title="Delete Transportation Mode"
          message="Are you sure you want to delete this transportation mode? This action cannot be undone."
        />

        <DynamicTable
          columns={columns}
          data={transportationModesData?.result || []}
          getRowId={(row) => row.id}
          onEdit={
            canUpdate("transportationmode")
              ? (id) => handleEdit(Number(id))
              : undefined
          }
          onDelete={
            canDelete("transportationmode")
              ? (id) => {
                  setDeleteTransportationModeId(Number(id));
                  setDeleteDialogOpen(true);
                }
              : undefined
          }
        />
      </Box>
  );
};

export default TransportationModeComp;