import React, { useState } from "react";
// import Layout from "../../components/Layout/index";
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
  InputLabel,
  FormHelperText,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

import {
  useCreateServiceCategoryMutation,
  useDeleteServiceCategoryMutation,
  useGetServiceCategoriesQuery,
  useUpdateServiceCategoryMutation,
} from "../RTK/services/serviceCategoryApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import DynamicTable from "../components/Tables";
import { usePermissions } from "../Hooks/usePermissions";

interface ServiceCategoryType {
  id?: number;
  category_name: string;
  isActive?: boolean;
  subsidiary_id?: number | string;
}

const ServiceCategoryComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: categoriesData } = useGetServiceCategoriesQuery();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();
  const [createServiceCategory] = useCreateServiceCategoryMutation();
  const [updateServiceCategory] = useUpdateServiceCategoryMutation();
  const [deleteServiceCategory] = useDeleteServiceCategoryMutation();

  const formik = useFormik<ServiceCategoryType>({
    initialValues: {
      category_name: "",
      isActive: true,
      subsidiary_id: "",
    },
    validationSchema: Yup.object({
      category_name: Yup.string()
        .min(2)
        .max(200)
        .required("Category name is required"),
      isActive: Yup.boolean(),
      subsidiary_id: Yup.mixed()
      .optional().nullable()
      //.required("Subsidiary is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload: any = { ...values };
        // ensure subsidiary_id is sent as number or null
        payload.subsidiary_id = values.subsidiary_id
          ? Number(values.subsidiary_id)
          : null;

        if (isEdit && editId) {
          if (!canUpdate("servicecategory")) {
            toast.error(
              "You do not have permission to update service categories"
            );
            return;
          }
          const response = await updateServiceCategory({
            id: editId,
            payload,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate("servicecategory")) {
            toast.error(
              "You do not have permission to create service categories"
            );
            return;
          }
          const response = await createServiceCategory(payload).unwrap();
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
    if (!canUpdate("servicecategory")) {
      toast.error("You do not have permission to edit service categories");
      return;
    }
    const item = categoriesData?.result?.find((x: any) => x.id === id);
    if (item) {
      formik.setValues({
        category_name: item.category_name,
        isActive: item.isActive ?? true,
        subsidiary_id: item.subsidiary_id ?? item.subsidiary?.id ?? "",
      } as any);
      setEditId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("servicecategory")) {
      toast.error("You do not have permission to delete service categories");
      return;
    }
    try {
      const response = await deleteServiceCategory(id).unwrap();
      toast.success(response.message);
      setDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete service category");
    }
  };

  const handleAdd = () => {
    if (!canCreate("servicecategory")) {
      toast.error("You do not have permission to create service categories");
      return;
    }
    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    { key: "category_name", label: "Category Name" },
    // category_type removed
    {
      key: "isActive",
      label: "Status",
      render: (row: any) => (row.isActive ? "Active" : "Inactive"),
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

  if (!canRead("servicecategory")) {
    return (
    //   <Layout>
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
              Access Denied: You do not have permission to view service
              categories.
            </Typography>
            {canCreate("servicecategory") && (
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
                Add Service Category
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
              {isEdit ? "Edit Service Category" : "Add Service Category"}
            </DialogTitle>
            <DialogContent>
              <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{ mt: 2 }}
              >
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="category_name">Category Name</FormLabel>
                  <TextField
                    id="category_name"
                    fullWidth
                    variant="outlined"
                    placeholder="Enter category name"
                    {...formik.getFieldProps("category_name")}
                    error={
                      formik.touched.category_name &&
                      !!formik.errors.category_name
                    }
                    helperText={
                      formik.touched.category_name &&
                      formik.errors.category_name
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
                    // labelId="subsidiary-label"
                    id="subsidiary_id"
                    value={formik.values.subsidiary_id ?? ""}
                    // label="Subsidiary"
                    onChange={(e) =>
                      formik.setFieldValue("subsidiary_id", e.target.value)
                    }
                  >
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

                {/* category_type removed */}

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
              setDeleteId(null);
            }}
            onConfirm={() => deleteId !== null && handleDelete(deleteId)}
            variant="delete"
            title="Delete Service Category"
            message="Are you sure you want to delete this service category? This action cannot be undone."
          />
        </Box>
    //   </Layout>
    );
  }

  return (
    // <Layout>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h3">Service Categories</Typography>
          {canCreate("servicecategory") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAdd}
            >
              Add Service Category
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
            {isEdit ? "Edit Service Category" : "Add Service Category"}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="category_name">Category Name</FormLabel>
                <TextField
                  id="category_name"
                  fullWidth
                  variant="outlined"
                  placeholder="Enter category name"
                  {...formik.getFieldProps("category_name")}
                  error={
                    formik.touched.category_name &&
                    !!formik.errors.category_name
                  }
                  helperText={
                    formik.touched.category_name && formik.errors.category_name
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
                <InputLabel id="subsidiary-label">Subsidiary</InputLabel>
                <Select
                  labelId="subsidiary-label"
                  id="subsidiary_id"
                  value={formik.values.subsidiary_id ?? ""}
                  label="Subsidiary"
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

              {/* category_type removed */}

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
            setDeleteId(null);
          }}
          onConfirm={() => deleteId !== null && handleDelete(deleteId)}
          variant="delete"
          title="Delete Service Category"
          message="Are you sure you want to delete this service category? This action cannot be undone."
        />

        <DynamicTable
          columns={columns}
          data={categoriesData?.result || []}
          getRowId={(row) => row.id}
          onEdit={
            canUpdate("servicecategory")
              ? (id) => handleEdit(Number(id))
              : undefined
          }
          onDelete={
            canDelete("servicecategory")
              ? (id) => {
                  setDeleteId(Number(id));
                  setDeleteDialogOpen(true);
                }
              : undefined
          }
        />
      </Box>
    // </Layout>
  );
};

export default ServiceCategoryComp;