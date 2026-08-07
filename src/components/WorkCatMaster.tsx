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
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

import {
  useGetWorkCategoriesQuery,
  useCreateWorkCategoryMutation,
  useUpdateWorkCategoryMutation,
  useDeleteWorkCategoryMutation,
} from "../RTK/services/workCategoryApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import DynamicTable from "../components/Tables";
import { usePermissions } from "../Hooks/usePermissions";

interface WorkCategoryType {
  id?: number;
  work_category_name: string;
  isActive?: boolean;
  subsidiary_id?: number | string | null;
}

const WorkCategoryMaster: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);

  const { data: workCategoriesData } = useGetWorkCategoriesQuery();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();
  const [createCategory] = useCreateWorkCategoryMutation();
  const [updateCategory] = useUpdateWorkCategoryMutation();
  const [deleteCategory] = useDeleteWorkCategoryMutation();

  const formik = useFormik<WorkCategoryType>({
    initialValues: {
      work_category_name: "",
      isActive: true,
      subsidiary_id: "",
    },
    validationSchema: Yup.object({
      work_category_name: Yup.string()
        .min(2, "Category name must be at least 2 characters")
        .max(100, "Category name must be at most 100 characters")
        .required("Category name is required"),
      isActive: Yup.boolean(),
      subsidiary_id: Yup.mixed()
      .optional().nullable(),
      //.required("Subsidiary is required"),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit && editCategoryId) {
          if (!canUpdate("work_category")) {
            toast.error("You do not have permission to update work categories");
            return;
          }
          const payload = {
            ...values,
            subsidiary_id: values.subsidiary_id
              ? Number(values.subsidiary_id)
              : null,
          };

          const response = await updateCategory({
            id: editCategoryId,
            payload,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate("work_category")) {
            toast.error("You do not have permission to create work categories");
            return;
          }

          const payload = {
            ...values,
            subsidiary_id: values.subsidiary_id
              ? Number(values.subsidiary_id)
              : null,
          };

          const response = await createCategory(payload).unwrap();
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
    if (!canUpdate("work_category")) {
      toast.error("You do not have permission to edit work categories");
      return;
    }

    const category = workCategoriesData?.result?.find(
      (item: any) => item.id === id
    );
    if (category) {
      formik.setValues({
        work_category_name: category.work_category_name,
        isActive: category.isActive ?? true,
        subsidiary_id: category.subsidiary_id ?? category.subsidiary?.id ?? "",
      });
      setEditCategoryId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("work_category")) {
      toast.error("You do not have permission to delete work categories");
      return;
    }

    try {
      const response = await deleteCategory(id).unwrap();
      toast.success(response.message);
      setDeleteCategoryId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete work category");
    }
  };

  const handleAdd = () => {
    if (!canCreate("work_category")) {
      toast.error("You do not have permission to create work categories");
      return;
    }
    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    {
      key: "work_category_name",
      label: "Category Name",
      render: (row: any) => (
        <Typography variant="body2" fontWeight="medium">
          {row.work_category_name}
        </Typography>
      ),
    },
    {
      key: "subsidiary",
      label: "Subsidiary",
      render: (row: any) => (
        <Typography variant="body2" fontWeight="medium">
          {row.subsidiary?.subsidiary_name || "N/A"}
        </Typography>
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
      key: "createdAt",
      label: "Created Date",
      render: (row: any) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A",
    },
  ];

  // If user cannot read work categories but can create, show Access Denied but allow create flow
  if (!canRead("work_category")) {
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
              Access Denied: You do not have permission to view work categories.
            </Typography>
            {canCreate("work_category") && (
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
                Add Category
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
            <DialogTitle>
              {isEdit ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogContent>
              <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{ mt: 2 }}
              >
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="work_category_name">
                    Work Category Name
                  </FormLabel>
                  <TextField
                    id="work_category_name"
                    fullWidth
                    variant="outlined"
                    placeholder="Enter work category name"
                    {...formik.getFieldProps("work_category_name")}
                    error={
                      formik.touched.work_category_name &&
                      !!formik.errors.work_category_name
                    }
                    helperText={
                      formik.touched.work_category_name &&
                      formik.errors.work_category_name
                    }
                  />
                </FormControl>
                <FormControl
                  fullWidth
                  sx={{ mb: 2 }}
                  error={
                    !!(
                      formik.touched.subsidiary_id &&
                      formik.errors.subsidiary_id
                    )
                  }
                >
                  <FormLabel htmlFor="subsidiary_id">Subsidiary</FormLabel>
                  <Select
                    labelId="subsidiary-label"
                    id="subsidiary_id"
                    label="Subsidiary"
                    value={formik.values.subsidiary_id ?? ""}
                    onChange={(e) =>
                      formik.setFieldValue("subsidiary_id", e.target.value)
                    }
                  >
                    <MenuItem value="">Select Subsidiary</MenuItem>
                    {subsidiariesData?.result?.map((s: any) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.subsidiary_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.subsidiary_id &&
                    formik.errors.subsidiary_id && (
                      <FormHelperText>
                        {String(formik.errors.subsidiary_id)}
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
                      ? "Category is active"
                      : "Category is inactive"}
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
              setDeleteCategoryId(null);
            }}
            onConfirm={() =>
              deleteCategoryId !== null && handleDelete(deleteCategoryId)
            }
            variant="delete"
            title="Delete Work Category"
            message="Are you sure you want to delete this work category? This action cannot be undone."
          />
        </Box>
    );
  }

  return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h3">Work Category Master</Typography>
          {canCreate("work_category") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAdd}
            >
              Add Category
            </Button>
          )}
        </Box>

        {/* Dialog Form */}
        <Dialog
          open={isOpen}
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="work_category_name">
                  Work Category Name
                </FormLabel>
                <TextField
                  id="work_category_name"
                  fullWidth
                  variant="outlined"
                  placeholder="Enter work category name"
                  {...formik.getFieldProps("work_category_name")}
                  error={
                    formik.touched.work_category_name &&
                    !!formik.errors.work_category_name
                  }
                  helperText={
                    formik.touched.work_category_name &&
                    formik.errors.work_category_name
                  }
                />
              </FormControl>

              <FormControl
                fullWidth
                sx={{ mb: 2 }}
                error={
                  !!(
                    formik.touched.subsidiary_id && formik.errors.subsidiary_id
                  )
                }
              >
                <FormLabel htmlFor="subsidiary_id">Subsidiary</FormLabel>
                <Select
                  labelId="subsidiary_id"
                  id="subsidiary_id"
                  name="subsidiary_id"
                  label="Subsidiary"
                  value={formik.values.subsidiary_id ?? ""}
                  onChange={(e) =>
                    formik.setFieldValue("subsidiary_id", e.target.value)
                  }
                  displayEmpty
                >
                  <MenuItem value="">Select Subsidiary</MenuItem>
                  {subsidiariesData?.result?.map((s: any) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.subsidiary_name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.subsidiary_id &&
                  formik.errors.subsidiary_id && (
                    <FormHelperText>
                      {String(formik.errors.subsidiary_id)}
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
                    ? "Category is active"
                    : "Category is inactive"}
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

        {/* Delete Confirmation */}
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setDeleteCategoryId(null);
          }}
          onConfirm={() =>
            deleteCategoryId !== null && handleDelete(deleteCategoryId)
          }
          variant="delete"
          title="Delete Work Category"
          message="Are you sure you want to delete this work category? This action cannot be undone."
        />

        {/* Table */}
        <DynamicTable
          columns={columns}
          data={workCategoriesData?.result || []}
          getRowId={(row) => row.id}
          onEdit={
            canUpdate("work_category")
              ? (id) => handleEdit(Number(id))
              : undefined
          }
          onDelete={
            canDelete("work_category")
              ? (id) => {
                  setDeleteCategoryId(Number(id));
                  setDeleteDialogOpen(true);
                }
              : undefined
          }
        />
      </Box>
  );
};

export default WorkCategoryMaster;