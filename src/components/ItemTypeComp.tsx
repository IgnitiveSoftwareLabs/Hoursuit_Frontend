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
import { Add } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

import {
  useCreateItemTypeMutation,
  useDeleteItemTypeMutation,
  useGetItemTypesQuery,
  useUpdateItemTypeMutation,
} from "../RTK/services/itemTypeApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import DynamicTable from "../components/Tables";
import { usePermissions } from "../Hooks/usePermissions";

interface ItemTypeType {
  id?: number;
  item_type_name: string;
  description?: string | null;
  isActive?: boolean;
}

const ItemTypeComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: itemTypesData } = useGetItemTypesQuery();
  const [createItemType] = useCreateItemTypeMutation();
  const [updateItemType] = useUpdateItemTypeMutation();
  const [deleteItemType] = useDeleteItemTypeMutation();

  const formik = useFormik<ItemTypeType>({
    initialValues: {
      item_type_name: "",
      description: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      item_type_name: Yup.string()
        .min(1)
        .max(200)
        .required("Item Type is required"),
      description: Yup.string().max(1000).optional().nullable(),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          item_type_name: values.item_type_name,
          description: values.description || null,
          isActive: values.isActive,
        } as any;

        if (isEdit && editId) {
          if (!canUpdate("platform.itemType")) {
            toast.error("You do not have permission to update item types");
            return;
          }
          const response = await updateItemType({
            id: editId,
            payload,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate("platform.itemType")) {
            toast.error("You do not have permission to create item types");
            return;
          }
          const response = await createItemType(payload).unwrap();
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
    if (!canUpdate("platform.itemType")) {
      toast.error("You do not have permission to edit item types");
      return;
    }
    const item = itemTypesData?.result?.find((x: any) => x.id === id);
    if (item) {
      formik.setValues({
        item_type_name: item.item_type_name,
        description: item.description ?? "",
        isActive: item.isActive ?? true,
      } as any);
      setEditId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("platform.itemType")) {
      toast.error("You do not have permission to delete item types");
      return;
    }
    try {
      const response = await deleteItemType(id).unwrap();
      toast.success(response.message);
      setDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete item type");
    }
  };

  const handleAdd = () => {
    if (!canCreate("platform.itemType")) {
      toast.error("You do not have permission to create item types");
      return;
    }
    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    { key: "item_type_name", label: "Item Type" },
    {
      key: "description",
      label: "Description",
      render: (row: any) => row.description || "N/A",
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

  if (!canRead("platform.itemType")) {
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
            Access Denied: You do not have permission to view item types.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h3">Item Types</Typography>
        {canCreate("platform.itemType") && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleAdd}
          >
            Add Item Type
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
          {isEdit ? "Edit Item Type" : "Add Item Type"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel htmlFor="item_type_name">Item Type</FormLabel>
              <TextField
                id="item_type_name"
                fullWidth
                variant="outlined"
                placeholder="Enter item type"
                {...formik.getFieldProps("item_type_name")}
                error={
                  formik.touched.item_type_name &&
                  !!formik.errors.item_type_name
                }
                helperText={
                  formik.touched.item_type_name &&
                  formik.errors.item_type_name
                }
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel htmlFor="description">Description</FormLabel>
              <TextField
                id="description"
                fullWidth
                variant="outlined"
                placeholder="Enter description (optional)"
                multiline
                rows={3}
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
                  ? "Item Type is active"
                  : "Item Type is inactive"}
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
          setDeleteId(null);
        }}
        onConfirm={() => deleteId !== null && handleDelete(deleteId)}
        variant="delete"
        title="Delete Item Type"
        message="Are you sure you want to delete this item type? This action cannot be undone."
      />

      <DynamicTable
        columns={columns}
        data={itemTypesData?.result || []}
        getRowId={(row) => row.id}
        onEdit={
          canUpdate("platform.itemType")
            ? (id) => handleEdit(Number(id))
            : undefined
        }
        onDelete={
          canDelete("platform.itemType")
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

export default ItemTypeComp;
