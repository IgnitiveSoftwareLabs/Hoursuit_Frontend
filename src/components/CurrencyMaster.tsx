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
import { Add, Upload } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import {
  useCreateCurrencyMutation,
  useDeleteCurrencyMutation,
  useGetCurrenciesQuery,
  useUpdateCurrencyMutation,
} from "../RTK/services/currencyApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import DynamicTable from "../components/Tables";
import { usePermissions } from "../Hooks/usePermissions";

interface CurrencyFormType {
  id?: number;
  currency_code: string;
  currency_name: string;
  currency_symbol?: string | null;
  country_name?: string | null;
  decimal_places: number;
  isActive?: boolean;
}

const CurrencyMaster: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();
  const navigate = useNavigate();
  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: currenciesData } = useGetCurrenciesQuery();
  const [createCurrency] = useCreateCurrencyMutation();
  const [updateCurrency] = useUpdateCurrencyMutation();
  const [deleteCurrency] = useDeleteCurrencyMutation();

  const formik = useFormik<CurrencyFormType>({
    initialValues: {
      currency_code: "",
      currency_name: "",
      currency_symbol: "",
      country_name: "",
      decimal_places: 2,
      isActive: true,
    },
    validationSchema: Yup.object({
      currency_code: Yup.string()
        .length(3, "Currency code must be 3 characters")
        .required("Currency code is required"),
      currency_name: Yup.string()
        .min(1)
        .max(100)
        .required("Currency name is required"),
      currency_symbol: Yup.string().max(10),
      country_name: Yup.string().max(100),
      decimal_places: Yup.number()
        .integer()
        .min(0)
        .max(8)
        .required("Decimal places required"),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        const payload = { ...values };
        if (isEdit && editId) {
          if (!canUpdate("currency")) {
            toast.error("No permission to update");
            return;
          }
          const res = await updateCurrency({ id: editId, payload }).unwrap();
          toast.success(res.message);
        } else {
          if (!canCreate("currency")) {
            toast.error("No permission to create");
            return;
          }
          const res = await createCurrency(payload).unwrap();
          toast.success(res.message);
        }
        formik.resetForm();
        setOpen(false);
        setIsEdit(false);
      } catch (err: any) {
        toast.error(err?.data?.message || "Something went wrong");
        setOpen(false);
      }
    },
  });

  const handleEdit = (id: number) => {
    if (!canUpdate("currency")) {
      toast.error("No permission to edit");
      return;
    }
    const item = currenciesData?.result?.find((x: any) => x.id === id);
    if (item) {
      formik.setValues({
        currency_code: item.currency_code,
        currency_name: item.currency_name,
        currency_symbol: item.currency_symbol || "",
        country_name: item.country_name || "",
        decimal_places: item.decimal_places ?? 2,
        isActive: item.isActive ?? true,
      } as any);
      setEditId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("currency")) {
      toast.error("No permission to delete");
      return;
    }
    try {
      const res = await deleteCurrency(id).unwrap();
      toast.success(res.message);
      setDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (err) {
      toast.error("Failed to delete currency");
    }
  };

  const handleAdd = () => {
    if (!canCreate("currency")) {
      toast.error("No permission to create");
      return;
    }
    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    { key: "currency_code", label: "Code" },
    { key: "currency_name", label: "Name" },
    { key: "currency_symbol", label: "Symbol" },
    { key: "country_name", label: "Country" },
    { key: "decimal_places", label: "Decimals" },
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

  if (!canRead("currency")) {
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
              Access Denied: You do not have permission to view currencies.
            </Typography>
            {canCreate("currency") && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setOpen(true);
                  setIsEdit(false);
                  formik.resetForm();
                }}
              >
                Add Currency
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
              {isEdit ? "Edit Currency" : "Add Currency"}
            </DialogTitle>
            <DialogContent>
              <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{ mt: 2 }}
              >
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="currency_code">Currency Code</FormLabel>
                  <TextField
                    id="currency_code"
                    fullWidth
                    variant="outlined"
                    placeholder="USD"
                    {...formik.getFieldProps("currency_code")}
                    error={
                      formik.touched.currency_code &&
                      !!formik.errors.currency_code
                    }
                    helperText={
                      formik.touched.currency_code &&
                      formik.errors.currency_code
                    }
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="currency_name">Currency Name</FormLabel>
                  <TextField
                    id="currency_name"
                    fullWidth
                    variant="outlined"
                    placeholder="US Dollar"
                    {...formik.getFieldProps("currency_name")}
                    error={
                      formik.touched.currency_name &&
                      !!formik.errors.currency_name
                    }
                    helperText={
                      formik.touched.currency_name &&
                      formik.errors.currency_name
                    }
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="currency_symbol">Symbol</FormLabel>
                  <TextField
                    id="currency_symbol"
                    fullWidth
                    variant="outlined"
                    placeholder="$"
                    {...formik.getFieldProps("currency_symbol")}
                    error={
                      formik.touched.currency_symbol &&
                      !!formik.errors.currency_symbol
                    }
                    helperText={
                      formik.touched.currency_symbol &&
                      formik.errors.currency_symbol
                    }
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="country_name">Country</FormLabel>
                  <TextField
                    id="country_name"
                    fullWidth
                    variant="outlined"
                    placeholder="United States"
                    {...formik.getFieldProps("country_name")}
                    error={
                      formik.touched.country_name &&
                      !!formik.errors.country_name
                    }
                    helperText={
                      formik.touched.country_name && formik.errors.country_name
                    }
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <FormLabel htmlFor="decimal_places">Decimal Places</FormLabel>
                  <TextField
                    id="decimal_places"
                    fullWidth
                    variant="outlined"
                    type="number"
                    {...formik.getFieldProps("decimal_places")}
                    error={
                      formik.touched.decimal_places &&
                      !!formik.errors.decimal_places
                    }
                    helperText={
                      formik.touched.decimal_places &&
                      formik.errors.decimal_places
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
                      ? "Currency is active"
                      : "Currency is inactive"}
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
            title="Delete Currency"
            message="Are you sure you want to delete this currency? This action cannot be undone."
          />
        </Box>
    //   </Layout>
    );
  }

  return (
    // <Layout>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h3">Currencies</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            {canCreate("currency") && (
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => navigate("/currencies/csv-import")}
              >
                CSV Import
              </Button>
            )}
            {canCreate("currency") && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={handleAdd}
              >
                Add Currency
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
          <DialogTitle>{isEdit ? "Edit Currency" : "Add Currency"}</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="currency_code">Currency Code</FormLabel>
                <TextField
                  id="currency_code"
                  fullWidth
                  variant="outlined"
                  placeholder="USD"
                  {...formik.getFieldProps("currency_code")}
                  error={
                    formik.touched.currency_code &&
                    !!formik.errors.currency_code
                  }
                  helperText={
                    formik.touched.currency_code && formik.errors.currency_code
                  }
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="currency_name">Currency Name</FormLabel>
                <TextField
                  id="currency_name"
                  fullWidth
                  variant="outlined"
                  placeholder="US Dollar"
                  {...formik.getFieldProps("currency_name")}
                  error={
                    formik.touched.currency_name &&
                    !!formik.errors.currency_name
                  }
                  helperText={
                    formik.touched.currency_name && formik.errors.currency_name
                  }
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="currency_symbol">Symbol</FormLabel>
                <TextField
                  id="currency_symbol"
                  fullWidth
                  variant="outlined"
                  placeholder="$"
                  {...formik.getFieldProps("currency_symbol")}
                  error={
                    formik.touched.currency_symbol &&
                    !!formik.errors.currency_symbol
                  }
                  helperText={
                    formik.touched.currency_symbol &&
                    formik.errors.currency_symbol
                  }
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="country_name">Country</FormLabel>
                <TextField
                  id="country_name"
                  fullWidth
                  variant="outlined"
                  placeholder="United States"
                  {...formik.getFieldProps("country_name")}
                  error={
                    formik.touched.country_name && !!formik.errors.country_name
                  }
                  helperText={
                    formik.touched.country_name && formik.errors.country_name
                  }
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel htmlFor="decimal_places">Decimal Places</FormLabel>
                <TextField
                  id="decimal_places"
                  fullWidth
                  variant="outlined"
                  type="number"
                  {...formik.getFieldProps("decimal_places")}
                  error={
                    formik.touched.decimal_places &&
                    !!formik.errors.decimal_places
                  }
                  helperText={
                    formik.touched.decimal_places &&
                    formik.errors.decimal_places
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
                    ? "Currency is active"
                    : "Currency is inactive"}
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
          title="Delete Currency"
          message="Are you sure you want to delete this currency? This action cannot be undone."
        />

        <DynamicTable
          columns={columns}
          data={currenciesData?.result || []}
          getRowId={(row) => row.id}
          onEdit={
            canUpdate("currency") ? (id) => handleEdit(Number(id)) : undefined
          }
          onDelete={
            canDelete("currency")
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

export default CurrencyMaster;