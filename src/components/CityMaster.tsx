import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";
// import Layout from "../../components/Layout/index";

import React, { useState } from "react";
import { Add } from "@mui/icons-material";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import {
  useCreateCityMutation,
  useDeleteCityMutation,
  useGetCitiesQuery,
  useUpdateCityMutation,
} from "../RTK/services/cityApi";
import * as Yup from "yup";
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

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { useGetStatesQuery } from "../RTK/services/stateApi";
import { usePermissions } from "../Hooks/usePermissions";
import DynamicTable from "../components/Tables";

interface CityType {
  id?: number;
  city_name: string;
  state_code_id: number | string;
}

const CityComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editCityId, setEditCityId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCityId, setDeleteCityId] = useState<number | null>(null);

  const { data: cities } = useGetCitiesQuery();
  const { data: states } = useGetStatesQuery();
  const [createCity] = useCreateCityMutation();
  const [updateCity] = useUpdateCityMutation();
  const [deleteCity] = useDeleteCityMutation();

  const formik = useFormik<CityType>({
    initialValues: {
      city_name: "",
      state_code_id: "",
    },
    validationSchema: Yup.object({
      city_name: Yup.string().required("Location name is required"),
      state_code_id: Yup.number().required("State is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,
          state_code_id: Number(values.state_code_id),
        };

        if (isEdit && editCityId) {
          if (!canUpdate("city")) {
            toast.error("You do not have permission to update cities");
            return;
          }
          const response = await updateCity({
            id: editCityId,
            payload,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate("city")) {
            toast.error("You do not have permission to create cities");
            return;
          }
          const response = await createCity(payload).unwrap();
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
    if (!canUpdate("city")) {
      toast.error("You do not have permission to edit cities");
      return;
    }

    const city = cities?.result?.find((c: any) => c.id === id);
    if (city) {
      formik.setValues({
        city_name: city.city_name,
        state_code_id: city.state_code_id,
      });
      setEditCityId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("city")) {
      toast.error("You do not have permission to delete cities");
      return;
    }

    try {
      const response = await deleteCity(id).unwrap();
      toast.success(response.message);
      setDeleteCityId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete city");
    }
  };

  const handleAddCity = () => {
    if (!canCreate("city")) {
      toast.error("You do not have permission to create cities");
      return;
    }

    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    {
      key: "city_name",
      label: "Location Name",
    },
    {
      key: "state.state_name",
      label: "State Name",
      render: (row: any) => row.state?.state_name || "N/A",
    },
    {
      key: "state.state_code",
      label: "State Code",
      render: (row: any) => row.state?.state_code || "N/A",
    },
  ];

  // If user cannot read cities but can create, show Access Denied but allow create flow
  if (!canRead("city")) {
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
              Access Denied: You do not have permission to view location.
            </Typography>
            {canCreate("city") && (
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
                Add Location
              </Button>
            )}
          </Box>

          {/* Still render dialog and confirmation so create-only users can use the create flow */}
          <Dialog
            open={isOpen}
            onClose={() => setOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>{isEdit ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogContent>
              <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{ mt: 2 }}
              >
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="city_name">Location Name</FormLabel>
                  <TextField
                    id="city_name"
                    fullWidth
                    variant="outlined"
                    {...formik.getFieldProps("city_name")}
                    error={
                      formik.touched.city_name && !!formik.errors.city_name
                    }
                    helperText={
                      formik.touched.city_name && formik.errors.city_name
                    }
                  />
                </FormControl>

                <FormControl
                  fullWidth
                  sx={{ mb: 2 }}
                  error={
                    formik.touched.state_code_id &&
                    !!formik.errors.state_code_id
                  }
                >
                  <FormLabel htmlFor="state_code_id">State</FormLabel>
                  <Select
                    id="state_code_id"
                    name="state_code_id"
                    value={formik.values.state_code_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Select a state</em>
                    </MenuItem>
                    {states?.result?.map((state: any) => (
                      <MenuItem key={state.id} value={state.id}>
                        {state.state_name} ({state.state_code})
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.state_code_id &&
                    formik.errors.state_code_id && (
                      <FormHelperText error>
                        {formik.errors.state_code_id}
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
              setDeleteCityId(null);
            }}
            onConfirm={() =>
              deleteCityId !== null && handleDelete(deleteCityId)
            }
            variant="delete"
            title="Delete Location"
            message="Are you sure you want to delete this location? This action cannot be undone."
          />
        </Box>
    );
  }

  return ( 
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h3">Locations</Typography>
          {canCreate("city") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddCity}
            >
              Add Location
            </Button>
          )}
        </Box>

        <Dialog
          open={isOpen}
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{isEdit ? "Edit Location" : "Add Location"}</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="city_name">Location Name</FormLabel>
                <TextField
                  id="city_name"
                  fullWidth
                  variant="outlined"
                  {...formik.getFieldProps("city_name")}
                  error={formik.touched.city_name && !!formik.errors.city_name}
                  helperText={
                    formik.touched.city_name && formik.errors.city_name
                  }
                />
              </FormControl>

              <FormControl
                fullWidth
                sx={{ mb: 2 }}
                error={
                  formik.touched.state_code_id && !!formik.errors.state_code_id
                }
              >
                <FormLabel htmlFor="state_code_id">State</FormLabel>
                <Select
                  id="state_code_id"
                  name="state_code_id"
                  value={formik.values.state_code_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Select a state</em>
                  </MenuItem>
                  {states?.result?.map((state: any) => (
                    <MenuItem key={state.id} value={state.id}>
                      {state.state_name} ({state.state_code})
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.state_code_id &&
                  formik.errors.state_code_id && (
                    <FormHelperText error>
                      {formik.errors.state_code_id}
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
            setDeleteCityId(null);
          }}
          onConfirm={() => deleteCityId !== null && handleDelete(deleteCityId)}
          variant="delete"
          title="Delete Location"
          message="Are you sure you want to delete this location? This action cannot be undone."
        />

        <DynamicTable
          columns={columns}
          data={cities?.result || []}
          getRowId={(row) => row.id}
          onEdit={
            canUpdate("city") ? (id) => handleEdit(Number(id)) : undefined
          }
          onDelete={
            canDelete("city")
              ? (id) => {
                  setDeleteCityId(Number(id));
                  setDeleteDialogOpen(true);
                }
              : undefined
          }
        />
      </Box>
  );
};

export default CityComp;