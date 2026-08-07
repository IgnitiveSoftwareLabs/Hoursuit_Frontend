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
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import DynamicTable from "../components/Tables";
import NavbarBreadcrumbs from "../components/NavbarBreadcrumbs";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from "../RTK/services/categoryApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";

interface CategoryType {
  id?: number;
  item_category_name: string;
  subsidiary_id?: number | string | null;
  isActive: boolean;
}

const CategoryComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);

  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const categories = categoriesData?.result ?? categoriesData ?? [];
  const subsidiaries = subsidiariesData?.result ?? subsidiariesData ?? [];

  const formik = useFormik<CategoryType>({
    initialValues: {
      item_category_name: "",
      subsidiary_id: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      item_category_name: Yup.string()
        .min(2, "Category name must be at least 2 characters")
        .max(200, "Category name must be at most 200 characters")
        .required("Category name is required"),
      subsidiary_id: Yup.mixed().optional().nullable(),
      isActive: Yup.boolean().required(),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          item_category_name: values.item_category_name,
          subsidiary_id:
            values.subsidiary_id && String(values.subsidiary_id).trim() !== ""
              ? Number(values.subsidiary_id)
              : null,
          isActive: values.isActive,
        };

        if (isEdit && editCategoryId) {
          if (!canUpdate("category")) {
            toast.error("You do not have permission to update categories");
            return;
          }
          const response = await updateCategory({
            id: editCategoryId,
            payload,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate("category")) {
            toast.error("You do not have permission to create categories");
            return;
          }
          const response = await createCategory(payload).unwrap();
          toast.success(response.message);
        }

        formik.resetForm();
        setOpen(false);
        setIsEdit(false);
        setEditCategoryId(null);
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong");
        setOpen(false);
      }
    },
  });

  const handleEdit = (id: number) => {
    if (!canUpdate("category")) {
      toast.error("You do not have permission to edit categories");
      return;
    }

    const category = categories.find((item: any) => item.id === id);
    if (category) {
      formik.setValues({
        item_category_name: category.item_category_name || "",
        subsidiary_id: category.subsidiary?.id ?? category.subsidiary_id ?? "",
        isActive: category.isActive ?? true,
      });
      setEditCategoryId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("category")) {
      toast.error("You do not have permission to delete categories");
      return;
    }

    try {
      const response = await deleteCategory(id).unwrap();
      toast.success(response.message);
      setDeleteCategoryId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const handleAddCategory = () => {
    if (!canCreate("category")) {
      toast.error("You do not have permission to create categories");
      return;
    }

    setOpen(true);
    setIsEdit(false);
    setEditCategoryId(null);
    formik.resetForm();
  };

  const columns = [
    {
      key: "item_category_name",
      label: "Category Name",
    },
    {
      key: "subsidiary",
      label: "Subsidiary",
      render: (row: any) => <Box>{row.subsidiary?.subsidiary_name || "N/A"}</Box>,
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
  ];

//   if (!canRead("category")) {
//     return (
//       <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
//         <Box
//           sx={{
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             height: "50vh",
//             flexDirection: "column",
//             gap: 2,
//           }}
//         >
//           <Typography variant="h6" color="error">
//             Access Denied: You do not have permission to view categories.
//           </Typography>
//           {canCreate("category") && (
//             <Button
//               variant="contained"
//               color="primary"
//               startIcon={<Add />}
//               onClick={handleAddCategory}
//             >
//               Add Category
//             </Button>
//           )}
//         </Box>

//         <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
//           <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
//           <DialogContent>
//             <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
//               <FormControl fullWidth sx={{ mb: 2 }}>
//                 <FormLabel htmlFor="item_category_name">Category Name</FormLabel>
//                 <TextField
//                   id="item_category_name"
//                   fullWidth
//                   variant="outlined"
//                   placeholder="Enter category name"
//                   {...formik.getFieldProps("item_category_name")}
//                   error={
//                     formik.touched.item_category_name &&
//                     !!formik.errors.item_category_name
//                   }
//                   helperText={
//                     formik.touched.item_category_name &&
//                     formik.errors.item_category_name
//                   }
//                 />
//               </FormControl>

//               <FormControl
//                 fullWidth
//                 sx={{ mb: 2 }}
//                 error={
//                   formik.touched.subsidiary_id && !!formik.errors.subsidiary_id
//                 }
//               >
//                 <FormLabel htmlFor="subsidiary_id">Subsidiary</FormLabel>
//                 <Select
//                   id="subsidiary_id"
//                   name="subsidiary_id"
//                   value={formik.values.subsidiary_id ?? ""}
//                   onChange={(e) =>
//                     formik.setFieldValue("subsidiary_id", e.target.value)
//                   }
//                   displayEmpty
//                 >
//                   <MenuItem value="">
//                     <em>Select Subsidiary</em>
//                   </MenuItem>
//                   {subsidiaries.map((s: any) => (
//                     <MenuItem key={s.id} value={s.id}>
//                       {s.subsidiary_name}
//                     </MenuItem>
//                   ))}
//                 </Select>
//                 {formik.touched.subsidiary_id && formik.errors.subsidiary_id && (
//                   <FormHelperText error>
//                     {String(formik.errors.subsidiary_id)}
//                   </FormHelperText>
//                 )}
//               </FormControl>

//               <FormControlLabel
//                 control={
//                   <Switch
//                     checked={formik.values.isActive}
//                     onChange={(e) => formik.setFieldValue("isActive", e.target.checked)}
//                   />
//                 }
//                 label="Active"
//               />

//               <Button
//                 type="submit"
//                 variant="contained"
//                 color="primary"
//                 fullWidth
//                 sx={{ mt: 2 }}
//                 disabled={formik.isSubmitting}
//               >
//                 {isEdit ? "Update" : "Submit"}
//               </Button>
//             </Box>
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={() => setOpen(false)} color="inherit">
//               Cancel
//             </Button>
//           </DialogActions>
//         </Dialog>

//         <ConfirmationDialog
//           open={isDeleteDialogOpen}
//           onClose={() => {
//             setDeleteDialogOpen(false);
//             setDeleteCategoryId(null);
//           }}
//           onConfirm={() =>
//             deleteCategoryId !== null && handleDelete(deleteCategoryId)
//           }
//           variant="delete"
//           title="Delete Category"
//           message="Are you sure you want to delete this category? This action cannot be undone."
//         />
//       </Box>
//     );
//   }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h3">Categories</Typography>
          <NavbarBreadcrumbs />
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          {canCreate("category") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddCategory}
            >
              Add Category
            </Button>
          )}
        </Box>
      </Box>

      <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel htmlFor="item_category_name">Category Name</FormLabel>
              <TextField
                id="item_category_name"
                fullWidth
                variant="outlined"
                placeholder="Enter category name"
                {...formik.getFieldProps("item_category_name")}
                error={
                  formik.touched.item_category_name &&
                  !!formik.errors.item_category_name
                }
                helperText={
                  formik.touched.item_category_name &&
                  formik.errors.item_category_name
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
                value={formik.values.subsidiary_id ?? ""}
                onChange={(e) =>
                  formik.setFieldValue("subsidiary_id", e.target.value)
                }
                displayEmpty
              >
                <MenuItem value="">
                  <em>Select Subsidiary</em>
                </MenuItem>
                {subsidiaries.map((s: any) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.subsidiary_name}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.subsidiary_id && formik.errors.subsidiary_id && (
                <FormHelperText error>
                  {String(formik.errors.subsidiary_id)}
                </FormHelperText>
              )}
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

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
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
        onConfirm={() => deleteCategoryId !== null && handleDelete(deleteCategoryId)}
        variant="delete"
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
      />

      <DynamicTable
        columns={columns}
        data={categories}
        getRowId={(row) => row.id}
        onEdit={canUpdate("category") ? (id) => handleEdit(Number(id)) : undefined}
        onDelete={
          canDelete("category")
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

export default CategoryComp;
