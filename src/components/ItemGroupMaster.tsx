import React, { useState } from "react";

import { Add } from "@mui/icons-material";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  FormLabel,
  InputAdornment,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  CircularProgress,
  FormControlLabel,
} from "@mui/material";

import ConfirmationDialog from "./Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
import {
  useCreateItemGroupMutation,
  useDeleteItemGroupMutation,
  useGetItemGroupsQuery,
  useUpdateItemGroupMutation,
} from "../RTK/services/itemGroupApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import DynamicTable from "./Tables";

interface ItemGroupType {
  id?: number;
  item_group_code: string;
  item_group_name: string;
  subsidiary_id?: number | null;
  isActive?: boolean;
  base_rate: number;
  subsidiary?: { subsidiary_name: string } | null;
}

const ItemGroupComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete, isAdmin } = usePermissions();

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isOpen, setOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [editItemGroupId, setEditItemGroupId] = useState<number | null>(null);
  const [deleteItemGroupId, setDeleteItemGroupId] = useState<number | null>(null);

  const { data: response, isLoading, refetch } = useGetItemGroupsQuery() as {
    data: { result: ItemGroupType[] } | undefined;
    isLoading: boolean;
    refetch: () => void;
  };

  const itemGroups = response?.result || [];
  const sortedItemGroups = [...itemGroups].sort((a, b) => (a.id || 0) - (b.id || 0));
  const { data: subsidiariesResponse } = useGetSubsidiariesQuery();

  const [createItemGroup, { isLoading: creating }] = useCreateItemGroupMutation();
  const [updateItemGroup, { isLoading: updating }] = useUpdateItemGroupMutation();
  const [deleteItemGroup] = useDeleteItemGroupMutation();

  const formik = useFormik<{
    item_group_code: string;
    item_group_name: string;
    subsidiary_id?: number | null;
    isActive: boolean;
    base_rate: number;
  }>({
    initialValues: {
      item_group_code: "",
      item_group_name: "",
      subsidiary_id: null,
      isActive: true,
      base_rate: 0,
    },
    validationSchema: Yup.object({
      item_group_code: Yup.string().required("Item group code is required"),
      item_group_name: Yup.string().required("Item group name is required"),
      base_rate: Yup.number().required("Base rate is required").min(0, "Base rate must be >= 0"),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const payload: any = {
          item_group_code: values.item_group_code.trim(),
          item_group_name: values.item_group_name.trim(),
          subsidiary_id: values.subsidiary_id,
          base_rate: values.base_rate,
          isActive: values.isActive,
        };

        if (isEdit && editItemGroupId) {
          if (!canUpdate("item_group")) {
            toast.error("No permission to update");
            return;
          }
          await updateItemGroup({ id: editItemGroupId, payload }).unwrap();
          toast.success("Item group updated successfully");
        } else {
          if (!canCreate("item_group")) {
            toast.error("No permission to create");
            return;
          }
          await createItemGroup(payload).unwrap();
          toast.success("Item group created successfully");
        }

        setOpen(false);
        setIsEdit(false);
        resetForm();
        refetch();
      } catch (error: any) {
        const msg = error?.data?.message || "Operation failed";
        toast.error(msg);
      }
    },
  });

  const handleEdit = (id: number) => {
    if (!canUpdate("item_group")) {
      toast.error("No permission to edit");
      return;
    }

    const group = itemGroups.find((g) => g.id === id);
    if (!group) return;

    formik.setValues({
      item_group_code: group.item_group_code,
      item_group_name: group.item_group_name,
      subsidiary_id: group.subsidiary_id || null,
      isActive: group.isActive ?? true,
      base_rate: group.base_rate,
    });

    setEditItemGroupId(id);
    setIsEdit(true);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("item_group")) {
      toast.error("No permission to delete");
      return;
    }

    try {
      await deleteItemGroup(id).unwrap();
      toast.success("Item group deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteItemGroupId(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete");
    }
  };

  const handleAdd = () => {
    if (!canCreate("item_group")) {
      toast.error("No permission to create");
      return;
    }
    formik.resetForm();
    setIsEdit(false);
    setEditItemGroupId(null);
    setOpen(true);
  };

  const columns = [
    { key: "item_group_code", label: "Code" },
    { key: "item_group_name", label: "Name" },
    {
      key: "base_rate",
      label: "Base Rate",
      render: (row: ItemGroupType) => (
        <Typography>
          ₹{row.base_rate?.toFixed(2) || "0.00"}
        </Typography>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (row: ItemGroupType) => (
        <Typography
          sx={{ color: row.isActive ? "success.main" : "error.main", fontWeight: "bold" }}
        >
          {row.isActive ? "Active" : "Inactive"}
        </Typography>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin && !canRead("item_group")) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          Access Denied: You do not have permission to view item groups.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" }, p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h3" gutterBottom>
            Item Groups
          </Typography>
          <NavbarBreadcrumbs />
        </Box>

        {canCreate("item_group") && (
          <Button variant="contained" onClick={handleAdd} startIcon={<Add />}>
            Add Item Group
          </Button>
        )}
      </Box>

      <DynamicTable
        columns={columns}
        data={sortedItemGroups}
        getRowId={(row) => String(row.id)} 
        onEdit={
          canUpdate("item_group")
            ? (id: string) => handleEdit(Number(id)) 
            : undefined
        }
        onDelete={
          canDelete("item_group")
            ? (id: string) => {
              setDeleteItemGroupId(Number(id));
              setDeleteDialogOpen(true);
            }
            : undefined
        }
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? "Edit Item Group" : "Add New Item Group"}</DialogTitle>
        <Box component="form" onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl fullWidth>
                <FormLabel>Item Group Code</FormLabel>
                <TextField
                  {...formik.getFieldProps("item_group_code")}
                  placeholder="e.g., GRP001"
                  error={formik.touched.item_group_code && !!formik.errors.item_group_code}
                  helperText={formik.touched.item_group_code && formik.errors.item_group_code}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel>Item Group Name</FormLabel>
                <TextField
                  {...formik.getFieldProps("item_group_name")}
                  placeholder="e.g., Raw Materials"
                  error={formik.touched.item_group_name && !!formik.errors.item_group_name}
                  helperText={formik.touched.item_group_name && formik.errors.item_group_name}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel>Subsidiary</FormLabel>
                <Select
                  id="subsidiary_id"
                  value={formik.values.subsidiary_id ?? ""}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "subsidiary_id",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {subsidiariesResponse?.result?.map((subsidiary: any) => (
                    <MenuItem key={subsidiary.id} value={subsidiary.id}>
                      {subsidiary.subsidiary_name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.subsidiary_id && formik.errors.subsidiary_id && (
                  <FormHelperText>{String(formik.errors.subsidiary_id)}</FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth>
                <FormLabel>Base Rate</FormLabel>
                <TextField
                  type="number"
                  {...formik.getFieldProps("base_rate")}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: "0.01" }}
                  error={formik.touched.base_rate && !!formik.errors.base_rate}
                  helperText={formik.touched.base_rate && formik.errors.base_rate}
                />
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.isActive}
                    onChange={(e) => formik.setFieldValue("isActive", e.target.checked)}
                  />
                }
                label="Active"
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formik.isSubmitting || creating || updating}
            >
              {formik.isSubmitting || creating || updating ? (
                <CircularProgress size={20} />
              ) : isEdit ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteItemGroupId(null);
        }}
        onConfirm={() => deleteItemGroupId && handleDelete(deleteItemGroupId)}
        title="Delete Item Group"
        message="This action cannot be undone."
        variant="delete"
      />
    </Box>
  );
};

export default ItemGroupComp;