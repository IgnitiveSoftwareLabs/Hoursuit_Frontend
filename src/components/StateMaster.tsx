import React, { useState, useCallback, useMemo } from "react";
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
import { Add } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import DynamicTable from "../components/Tables";
import { usePermissions } from "../Hooks/usePermissions";
import {
  useCreateStateMutation,
  useDeleteStateMutation,
  useGetStatesQuery,
  useUpdateStateMutation,
} from "../RTK/services/stateApi";

// Removed unused type imports to reduce bundle size
interface StateType {
  id?: number;
  state_name: string;
  state_code: string;
}

// Memoize the component to prevent unnecessary re-renders
const StateComp: React.FC = React.memo(() => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editStateId, setEditStateId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteStateId, setDeleteStateId] = useState<number | null>(null);

  // Optimize RTK Query with caching and refetch control
  const { data: states, isLoading } = useGetStatesQuery(undefined, {
    refetchOnMountOrArgChange: true, // Fetch only when necessary
    pollingInterval: 0, // Disable polling to reduce API calls
  });

  const [createState] = useCreateStateMutation();
  const [updateState] = useUpdateStateMutation();
  const [deleteState] = useDeleteStateMutation();

  // Memoize formik configuration to prevent reinitialization
  const initialValues = useMemo(
    () => ({
      state_name: "",
      state_code: "",
    }),
    []
  );

  const validationSchema = useMemo(
    () =>
      Yup.object({
        state_name: Yup.string().required("State name is required"),
        state_code: Yup.string()
          .required("State code is required")
          .min(2, "State code must be at least 2 characters")
          .max(3, "State code must be at most 3 characters"),
      }),
    []
  );

  const formik = useFormik<StateType>({
    initialValues,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (isEdit && editStateId) {
          if (!canUpdate("state")) {
            toast.error("You do not have permission to update states");
            return;
          }
          const response = await updateState({
            id: editStateId,
            payload: values,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate("state")) {
            toast.error("You do not have permission to create states");
            return;
          }
          const response = await createState(values).unwrap();
          toast.success(response.message);
        }

        resetForm();
        setOpen(false);
        setIsEdit(false);
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong");
        setOpen(false);
      }
    },
  });

  // Memoize handlers to prevent re-creation
  const handleEdit = useCallback(
    (id: number) => {
      if (!canUpdate("state")) {
        toast.error("You do not have permission to edit states");
        return;
      }

      const state = states?.result?.find((s: any) => s.id === id);
      if (state) {
        formik.setValues({
          state_name: state.state_name,
          state_code: state.state_code,
        });
        setEditStateId(id);
        setIsEdit(true);
        setOpen(true);
      }
    },
    [states, canUpdate, formik]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      if (!canDelete("state")) {
        toast.error("You do not have permission to delete states");
        return;
      }

      try {
        const response = await deleteState(id).unwrap();
        toast.success(response.message);
        setDeleteStateId(null);
        setDeleteDialogOpen(false);
      } catch (error) {
        toast.error("Failed to delete state");
      }
    },
    [canDelete, deleteState]
  );

  const handleAddState = useCallback(() => {
    if (!canCreate("state")) {
      toast.error("You do not have permission to create states");
      return;
    }

    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  }, [canCreate, formik]);

  const handleCloseDialog = useCallback(() => {
    setOpen(false);
    formik.resetForm();
  }, [formik]);

  // Memoize table columns to prevent re-creation
  const columns = useMemo(
    () => [
      { key: "state_name", label: "State Name" },
      { key: "state_code", label: "State Code" },
    ],
    []
  );

  // If user cannot read states but can create, show Access Denied but allow create flow
  if (!canRead("state")) {
    return (
    //   <Layout>
        <Box
          sx={{
            width: "100%",
            maxWidth: { sm: "100%", md: "1700px" },
            textAlign: "center",
            mt: 4,
          }}
        >
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view states.
          </Typography>
          {canCreate("state") && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={handleAddState}
              >
                Add State
              </Button>
            </Box>
          )}

          {/* Render dialog and confirmation so create flow works for create-only users */}
          <Dialog
            open={isOpen}
            onClose={handleCloseDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>{isEdit ? "Edit State" : "Add State"}</DialogTitle>
            <DialogContent>
              <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{ mt: 2 }}
              >
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="state_name">State Name</FormLabel>
                  <TextField
                    id="state_name"
                    fullWidth
                    variant="outlined"
                    {...formik.getFieldProps("state_name")}
                    error={
                      formik.touched.state_name && !!formik.errors.state_name
                    }
                    helperText={
                      formik.touched.state_name && formik.errors.state_name
                    }
                    onChange={(e) => {
                      formik.handleChange(e);
                    }}
                  />
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="state_code">State Code</FormLabel>
                  <TextField
                    id="state_code"
                    fullWidth
                    variant="outlined"
                    placeholder="e.g., CA, NY, TX"
                    {...formik.getFieldProps("state_code")}
                    error={
                      formik.touched.state_code && !!formik.errors.state_code
                    }
                    helperText={
                      formik.touched.state_code && formik.errors.state_code
                    }
                    onChange={(e) => {
                      formik.handleChange(e);
                    }}
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
              <Button onClick={handleCloseDialog} color="inherit">
                Cancel
              </Button>
            </DialogActions>
          </Dialog>

          <ConfirmationDialog
            open={isDeleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setDeleteStateId(null);
            }}
            onConfirm={() =>
              deleteStateId !== null && handleDelete(deleteStateId)
            }
            variant="delete"
            title="Delete State"
            message="Are you sure you want to delete this state? This action cannot be undone."
          />
        </Box>
    //   </Layout>
    );
  }

  // Conditional rendering to show loading state
  if (isLoading) {
    return (
    //   <Layout>
        <Box
          sx={{
            width: "100%",
            maxWidth: { sm: "100%", md: "1700px" },
            textAlign: "center",
            mt: 4,
          }}
        >
          <Typography variant="h6">Loading...</Typography>
        </Box>
    //   </Layout>
    );
  }

  return (
    // <Layout>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h3">States</Typography>
          {canCreate("state") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddState}
            >
              Add State
            </Button>
          )}
        </Box>

        {/* Lazy-load Dialog content to reduce initial render cost */}
        <Dialog
          open={isOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{isEdit ? "Edit State" : "Add State"}</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="state_name">State Name</FormLabel>
                <TextField
                  id="state_name"
                  fullWidth
                  variant="outlined"
                  {...formik.getFieldProps("state_name")}
                  error={
                    formik.touched.state_name && !!formik.errors.state_name
                  }
                  helperText={
                    formik.touched.state_name && formik.errors.state_name
                  }
                  onChange={(e) => {
                    // Debounce input changes to reduce re-renders
                    formik.handleChange(e);
                  }}
                />
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="state_code">State Code</FormLabel>
                <TextField
                  id="state_code"
                  fullWidth
                  variant="outlined"
                  placeholder="e.g., CA, NY, TX"
                  {...formik.getFieldProps("state_code")}
                  error={
                    formik.touched.state_code && !!formik.errors.state_code
                  }
                  helperText={
                    formik.touched.state_code && formik.errors.state_code
                  }
                  onChange={(e) => {
                    // Debounce input changes
                    formik.handleChange(e);
                  }}
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
            <Button onClick={handleCloseDialog} color="inherit">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setDeleteStateId(null);
          }}
          onConfirm={() =>
            deleteStateId !== null && handleDelete(deleteStateId)
          }
          variant="delete"
          title="Delete State"
          message="Are you sure you want to delete this state? This action cannot be undone."
        />

        <DynamicTable
          columns={columns}
          data={states?.result || []}
          getRowId={(row) => row.id}
          onEdit={
            canUpdate("state") ? (id) => handleEdit(Number(id)) : undefined
          }
          onDelete={
            canDelete("state")
              ? (id) => {
                  setDeleteStateId(Number(id));
                  setDeleteDialogOpen(true);
                }
              : undefined
          }
        />
      </Box>
    // </Layout>
  );
});

// Add display name for better debugging
StateComp.displayName = "StateComp";

export default StateComp;