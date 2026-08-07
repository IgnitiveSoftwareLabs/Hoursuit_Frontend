import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import DynamicTable from "../components/Tables";
import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import {
  useGetSubsidiariesQuery,
  useCreateSubsidiaryMutation,
  useUpdateSubsidiaryMutation,
  useDeleteSubsidiaryMutation,
} from "../RTK/services/subsdiaryApi";
import { Add } from "@mui/icons-material";

interface SubsidiaryType {
  id?: number;
  subsidiary_name: string;
  currency_id: number | string;
  parent_subsidiary_id?: number | string | null;
  isActive?: boolean;
}

const SubsidiaryComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  const [isEdit, setIsEdit] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: subsidiariesData } = useGetSubsidiariesQuery();
  const { data: currenciesData } = useGetCurrenciesQuery();
  const [createSubsidiary] = useCreateSubsidiaryMutation();
  const [updateSubsidiary] = useUpdateSubsidiaryMutation();
  const [deleteSubsidiary] = useDeleteSubsidiaryMutation();

  const formik = useFormik<SubsidiaryType>({
    initialValues: {
      subsidiary_name: "",
      currency_id: "",
      parent_subsidiary_id: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      subsidiary_name: Yup.string()
        .min(1)
        .max(200)
        .required("Name is required"),
      currency_id: Yup.number()
        .typeError("Please select a currency")
        .required("Currency is required"),
      parent_subsidiary_id: Yup.number().nullable().notRequired(),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        const payload: any = {
          subsidiary_name: values.subsidiary_name,
          currency_id: Number(values.currency_id),
          parent_subsidiary_id:
            values.parent_subsidiary_id === "" ||
            values.parent_subsidiary_id === null
              ? undefined
              : Number(values.parent_subsidiary_id),
          isActive: values.isActive,
        };

        if (isEdit && editId) {
          if (!canUpdate("subsidiary")) {
            toast.error("You do not have permission to update subsidiaries");
            return;
          }
          const response = await updateSubsidiary({
            id: editId,
            payload,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate("subsidiary")) {
            toast.error("You do not have permission to create subsidiaries");
            return;
          }
          const response = await createSubsidiary(payload).unwrap();
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
    if (!canUpdate("subsidiary")) {
      toast.error("You do not have permission to edit subsidiaries");
      return;
    }

    const item = subsidiariesData?.result?.find((s: any) => s.id === id);
    if (item) {
      formik.setValues({
        subsidiary_name: item.subsidiary_name,
        currency_id: item.currency_id ?? "",
        parent_subsidiary_id: item.parent_subsidiary_id ?? "",
        isActive: item.isActive ?? true,
      });
      setEditId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("subsidiary")) {
      toast.error("You do not have permission to delete subsidiaries");
      return;
    }
    try {
      const response = await deleteSubsidiary(id).unwrap();
      toast.success(response.message);
      setDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (err) {
      toast.error("Failed to delete subsidiary");
    }
  };

  const handleAdd = () => {
    setOpen(true);
    if (!canCreate("subsidiary")) {
      toast.error("You do not have permission to create subsidiaries");
      return;
    }
    // keep modal state unchanged here; UI controls visibility outside
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    { key: "subsidiary_name", label: "Subsidiary Name" },
    {
      key: "currency.currency_name",
      label: "Currency",
      render: (row: any) => row.currency?.currency_name || "N/A",
    },
    {
      key: "parentSubsidiary.subsidiary_name",
      label: "Parent Subsidiary",
      render: (row: any) => row.parentSubsidiary?.subsidiary_name || "N/A",
    },
    {
      key: "isActive",
      label: "Status",
      render: (row: any) => (row.isActive ? "Active" : "Inactive"),
    },
    {
      key: "createdAt",
      label: "Created Date",
      render: (row: any) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A",
    },
  ];

  if (!canRead("subsidiary")) {
    return (
        <Box> You don't have permission to view subsidiaries </Box>
    );
  }

  return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h3">Subsidiary Master</Typography>

          {/* <Button variant="contained" color="primary" onClick={handleAdd}>
            Add Subsidiary
          </Button> */}
          {canCreate("subsidiary") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAdd}
            >
              Add Subsidiary
            </Button>
          )}
        </Box>
        <Dialog
          open={isOpen}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            {isEdit ? "Edit Subsidiary" : "Add Subsidiary"}
          </DialogTitle>
          <form onSubmit={formik.handleSubmit}>
            <DialogContent>
              <FormControl fullWidth margin="normal">
                <FormLabel>Subsidiary Name</FormLabel>
                <TextField
                  name="subsidiary_name"
                  value={formik.values.subsidiary_name}
                  onChange={formik.handleChange}
                  error={
                    !!(
                      formik.touched.subsidiary_name &&
                      formik.errors.subsidiary_name
                    )
                  }
                  helperText={
                    formik.touched.subsidiary_name &&
                    (formik.errors.subsidiary_name as any)
                  }
                />
              </FormControl>

              <FormControl fullWidth margin="normal">
                <FormLabel>Currency</FormLabel>
                <Select
                  name="currency_id"
                  value={formik.values.currency_id}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="">Select Currency</MenuItem>
                  {currenciesData?.result?.map((c: any) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.currency_name} ({c.currency_code})
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.currency_id && formik.errors.currency_id ? (
                  <FormHelperText error>
                    {formik.errors.currency_id as any}
                  </FormHelperText>
                ) : null}
              </FormControl>

              <FormControl fullWidth margin="normal">
                <FormLabel>Parent Subsidiary (optional)</FormLabel>
                <Select
                  name="parent_subsidiary_id"
                  value={formik.values.parent_subsidiary_id}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="">None</MenuItem>
                  {subsidiariesData?.result
                    ?.filter((s: any) => (editId ? s.id !== editId : true))
                    .map((s: any) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.subsidiary_name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={!!formik.values.isActive}
                    onChange={(e) =>
                      formik.setFieldValue("isActive", e.target.checked)
                    }
                  />
                }
                label="Active"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {isEdit ? "Update" : "Create"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={() => deleteId !== null && handleDelete(deleteId)}
          variant="delete"
          title="Delete Subsidiary"
          message="Are you sure you want to delete this subsidiary? This action cannot be undone."
        />

        <DynamicTable
          columns={columns}
          data={subsidiariesData?.result || []}
          getRowId={(row) => row.id}
          onEdit={
            canUpdate("subsidiary") ? (id) => handleEdit(Number(id)) : undefined
          }
          onDelete={
            canDelete("subsidiary")
              ? (id) => {
                  setDeleteId(Number(id));
                  setDeleteDialogOpen(true);
                }
              : undefined
          }
        />
      </Box>
  );
};

export default SubsidiaryComp;