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
  MenuItem,
  Select,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

import {
  useCreateAccountTypeMutation,
  useDeleteAccountTypeMutation,
  useGetAccountTypesQuery,
  useUpdateAccountTypeMutation,
} from "../RTK/services/accountTypeApi";

import { useGetMISTypesQuery } from "../RTK/services/misTypeApi";
import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import DynamicTable from "../components/Tables";
import { usePermissions } from "../Hooks/usePermissions";

interface AccountTypeType {
  id?: number;
  account_type_name: string;
  mis_type_id?: number | string;
  isActive?: boolean;
}

const AccountTypeComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: accountTypesData } = useGetAccountTypesQuery();
  const { data: misTypesData } = useGetMISTypesQuery();
  const [createAccountType] = useCreateAccountTypeMutation();
  const [updateAccountType] = useUpdateAccountTypeMutation();
  const [deleteAccountType] = useDeleteAccountTypeMutation();

  const formik = useFormik<AccountTypeType>({
    initialValues: {
      account_type_name: "",
      mis_type_id: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      account_type_name: Yup.string()
        .min(1)
        .max(200)
        .required("Account Type is required"),
      mis_type_id: Yup.number().transform((v, o) =>
        o === "" ? undefined : v
      ),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        const payload: any = {
          account_type_name: values.account_type_name,
          isActive: values.isActive,
        };

        if (values.mis_type_id !== "" && values.mis_type_id != null) {
          payload.mis_type_id = Number(values.mis_type_id);
        }

        if (isEdit && editId) {
          if (!canUpdate("platform.accountType")) {
            toast.error("You do not have permission to update account types");
            return;
          }
          const response = await updateAccountType({
            id: editId,
            payload,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate("platform.accountType")) {
            toast.error("You do not have permission to create account types");
            return;
          }
          const response = await createAccountType(payload).unwrap();
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
    if (!canUpdate("platform.accountType")) {
      toast.error("You do not have permission to edit account types");
      return;
    }
    const item = accountTypesData?.result?.find((x: any) => x.id === id);
    if (item) {
      formik.setValues({
        account_type_name: item.account_type_name,
        mis_type_id: item.mis_type_id ?? "",
        isActive: item.isActive ?? true,
      } as any);
      setEditId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("platform.accountType")) {
      toast.error("You do not have permission to delete account types");
      return;
    }
    try {
      const response = await deleteAccountType(id).unwrap();
      toast.success(response.message);
      setDeleteId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete account type");
    }
  };

  const handleAdd = () => {
    if (!canCreate("platform.accountType")) {
      toast.error("You do not have permission to create account types");
      return;
    }
    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    { key: "account_type_name", label: "Account Type" },
    {
      key: "misType.mis_type_name",
      label: "MIS Type",
      render: (row: any) => row.misType?.mis_type_name || "N/A",
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

  if (!canRead("platform.accountType")) {
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
            Access Denied: You do not have permission to view account types.
          </Typography>
        </Box>
      </Box>
    );
  }

  const renderForm = () => (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <FormLabel htmlFor="account_type_name">Account Type</FormLabel>
        <TextField
          id="account_type_name"
          fullWidth
          variant="outlined"
          placeholder="Enter account type"
          {...formik.getFieldProps("account_type_name")}
          error={
            formik.touched.account_type_name &&
            !!formik.errors.account_type_name
          }
          helperText={
            formik.touched.account_type_name &&
            formik.errors.account_type_name
          }
        />
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <FormLabel htmlFor="mis_type_id">MIS Type (Optional)</FormLabel>
        <Select
          id="mis_type_id"
          fullWidth
          value={formik.values.mis_type_id}
          onChange={(e) =>
            formik.setFieldValue("mis_type_id", e.target.value)
          }
          displayEmpty
        >
          <MenuItem value="">Select MIS Type</MenuItem>
          {misTypesData?.result?.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.mis_type_name}
            </MenuItem>
          ))}
        </Select>
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
            ? "Account Type is active"
            : "Account Type is inactive"}
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
  );

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h3">Account Types</Typography>
        {canCreate("platform.accountType") && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleAdd}
          >
            Add Account Type
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
          {isEdit ? "Edit Account Type" : "Add Account Type"}
        </DialogTitle>
        <DialogContent>{renderForm()}</DialogContent>
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
        title="Delete Account Type"
        message="Are you sure you want to delete this account type? This action cannot be undone."
      />

      <DynamicTable
        columns={columns}
        data={accountTypesData?.result || []}
        getRowId={(row) => row.id}
        onEdit={
          canUpdate("platform.accountType")
            ? (id) => handleEdit(Number(id))
            : undefined
        }
        onDelete={
          canDelete("platform.accountType")
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

export default AccountTypeComp;