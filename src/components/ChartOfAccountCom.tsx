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
    useCreateChartOfAccountMutation,
    useDeleteChartOfAccountMutation,
    useGetChartOfAccountsQuery,
    useUpdateChartOfAccountMutation,
} from "../RTK/services/chartOfAccountApi";

import { useGetAccountTypesQuery } from "../RTK/services/accountTypeApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";
import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import DynamicTable from "../components/Tables";
import { usePermissions } from "../Hooks/usePermissions";

interface ChartType {
    id?: number;
    account_number: string;
    account_name: string;
    account_type_id: number | string;
    subsidiary_id: number | string;
    parent_account_number?: string | null;
    currency_id: number | string;
    isActive?: boolean;
}

const ChartOfAccountComp: React.FC = () => {
    const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

    const [isOpen, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: chartData } = useGetChartOfAccountsQuery();
    const { data: accountTypesData } = useGetAccountTypesQuery();
    const { data: subsidiariesData } = useGetSubsidiariesQuery();
    const { data: currenciesData } = useGetCurrenciesQuery();

    const [createChart] = useCreateChartOfAccountMutation();
    const [updateChart] = useUpdateChartOfAccountMutation();
    const [deleteChart] = useDeleteChartOfAccountMutation();

    const formik = useFormik<ChartType>({
        initialValues: {
            account_number: "",
            account_name: "",
            account_type_id: "",
            subsidiary_id: "",
            parent_account_number: "",
            currency_id: "",
            isActive: true,
        },
        validationSchema: Yup.object({
            account_number: Yup.string()
                .min(1)
                .max(100)
                .required("Account number is required"),
            account_name: Yup.string()
                .min(1)
                .max(200)
                .required("Account name is required"),
            account_type_id: Yup.number().required("Select account type"),
            // subsidiary is optional now
            subsidiary_id: Yup.number().nullable().notRequired(),
            currency_id: Yup.number().required("Select currency"),
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    account_number: values.account_number,
                    account_name: values.account_name,
                    account_type_id: Number(values.account_type_id),
                    subsidiary_id: values.subsidiary_id
                        ? Number(values.subsidiary_id)
                        : null,
                    parent_account_number: values.parent_account_number || null,
                    currency_id: Number(values.currency_id),
                    isActive: values.isActive,
                } as any;

                if (isEdit && editId) {
                    if (!canUpdate("chartofaccount")) {
                        toast.error("You do not have permission to update chart accounts");
                        return;
                    }
                    const response = await updateChart({ id: editId, payload }).unwrap();
                    toast.success(response.message);
                } else {
                    if (!canCreate("chartofaccount")) {
                        toast.error("You do not have permission to create chart accounts");
                        return;
                    }
                    const response = await createChart(payload).unwrap();
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
        if (!canUpdate("chartofaccount")) {
            toast.error("You do not have permission to edit chart accounts");
            return;
        }
        const item = chartData?.result?.find((x: any) => x.id === id);
        if (item) {
            formik.setValues({
                account_number: item.account_number,
                account_name: item.account_name,
                account_type_id: item.account_type_id ?? "",
                subsidiary_id: item.subsidiary_id ?? "",
                parent_account_number: item.parent_account_number ?? "",
                currency_id: item.currency_id ?? "",
                isActive: item.isActive ?? true,
            } as any);
            setEditId(id);
            setIsEdit(true);
            setOpen(true);
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDelete("chartofaccount")) {
            toast.error("You do not have permission to delete chart accounts");
            return;
        }
        try {
            const response = await deleteChart(id).unwrap();
            toast.success(response.message);
            setDeleteId(null);
            setDeleteDialogOpen(false);
        } catch (error) {
            toast.error("Failed to delete chart account");
        }
    };

    const handleAdd = () => {
        if (!canCreate("chartofaccount")) {
            toast.error("You do not have permission to create chart accounts");
            return;
        }
        setOpen(true);
        setIsEdit(false);
        formik.resetForm();
    };

    const columns = [
        { key: "account_number", label: "Account Number" },
        { key: "account_name", label: "Account Name" },
        {
            key: "accountType.account_type_name",
            label: "Account Type",
            render: (row: any) => row.accountType?.account_type_name || "N/A",
        },
        {
            key: "subsidiary.subsidiary_name",
            label: "Subsidiary",
            render: (row: any) => row.subsidiary?.subsidiary_name || "N/A",
        },
        { key: "parent_account_number", label: "Parent Account" },
        {
            key: "currency.currency_name",
            label: "Currency",
            render: (row: any) => row.currency?.currency_name || "N/A",
        },
        {
            key: "isActive",
            label: "Status",
            render: (row: any) => (row.isActive ? "Active" : "Inactive"),
        },
    ];

    if (!canRead("chartofaccount")) {
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
                        Access Denied: You do not have permission to view chart accounts.
                    </Typography>
                    {canCreate("chartofaccount") && (
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
                            Add Chart Account
                        </Button>
                    )}
                </Box>

                <Dialog
                    open={isOpen}
                    onClose={() => setOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {isEdit ? "Edit Chart Account" : "Add Chart Account"}
                    </DialogTitle>
                    <DialogContent>
                        <Box
                            component="form"
                            onSubmit={formik.handleSubmit}
                            sx={{ mt: 2 }}
                        >
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <FormLabel htmlFor="account_number">Account Number</FormLabel>
                                <TextField
                                    id="account_number"
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Enter account number"
                                    {...formik.getFieldProps("account_number")}
                                    error={
                                        formik.touched.account_number &&
                                        !!formik.errors.account_number
                                    }
                                    helperText={
                                        formik.touched.account_number &&
                                        formik.errors.account_number
                                    }
                                />
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <FormLabel htmlFor="account_name">Account Name</FormLabel>
                                <TextField
                                    id="account_name"
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Enter account name"
                                    {...formik.getFieldProps("account_name")}
                                    error={
                                        formik.touched.account_name &&
                                        !!formik.errors.account_name
                                    }
                                    helperText={
                                        formik.touched.account_name && formik.errors.account_name
                                    }
                                />
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <FormLabel htmlFor="account_type_id">Account Type</FormLabel>
                                <Select
                                    id="account_type_id"
                                    fullWidth
                                    value={formik.values.account_type_id}
                                    onChange={(e) =>
                                        formik.setFieldValue("account_type_id", e.target.value)
                                    }
                                    displayEmpty
                                >
                                    <MenuItem value="">Select Account Type</MenuItem>
                                    {accountTypesData?.result?.map((a) => (
                                        <MenuItem key={a.id} value={a.id}>
                                            {a.account_type_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <FormLabel htmlFor="subsidiary_id">Subsidiary</FormLabel>
                                <Select
                                    id="subsidiary_id"
                                    fullWidth
                                    value={formik.values.subsidiary_id}
                                    onChange={(e) =>
                                        formik.setFieldValue("subsidiary_id", e.target.value)
                                    }
                                    displayEmpty
                                >
                                    <MenuItem value="">Select Subsidiary</MenuItem>
                                    {subsidiariesData?.result?.map((s) => (
                                        <MenuItem key={s.id} value={s.id}>
                                            {s.subsidiary_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <FormLabel htmlFor="parent_account_number">
                                    Parent Account Number
                                </FormLabel>
                                <TextField
                                    id="account_number"
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Enter account number"
                                    {...formik.getFieldProps("parent_account_number")}
                                    error={
                                        formik.touched.parent_account_number &&
                                        !!formik.errors.parent_account_number
                                    }
                                    helperText={
                                        formik.touched.parent_account_number &&
                                        formik.errors.parent_account_number
                                    }
                                />
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <FormLabel htmlFor="currency_id">Currency</FormLabel>
                                <Select
                                    id="currency_id"
                                    fullWidth
                                    value={formik.values.currency_id}
                                    onChange={(e) =>
                                        formik.setFieldValue("currency_id", e.target.value)
                                    }
                                    displayEmpty
                                >
                                    <MenuItem value="">Select Currency</MenuItem>
                                    {currenciesData?.result?.map((c) => (
                                        <MenuItem
                                            key={c.id}
                                            value={c.id}
                                        >{`${c.currency_name} (${c.currency_code})`}</MenuItem>
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
                    title="Delete Chart Account"
                    message="Are you sure you want to delete this chart account? This action cannot be undone."
                />
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h3">Chart of Accounts</Typography>
                {canCreate("chartofaccount") && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={handleAdd}
                    >
                        Add Chart Account
                    </Button>
                )}
            </Box>

            <Dialog
                open={isOpen}
                onClose={() => setOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {isEdit ? "Edit Chart Account" : "Add Chart Account"}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <FormLabel htmlFor="account_number">Account Number</FormLabel>
                            <TextField
                                id="account_number"
                                fullWidth
                                variant="outlined"
                                placeholder="Enter account number"
                                {...formik.getFieldProps("account_number")}
                                error={
                                    formik.touched.account_number &&
                                    !!formik.errors.account_number
                                }
                                helperText={
                                    formik.touched.account_number &&
                                    formik.errors.account_number
                                }
                            />
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <FormLabel htmlFor="account_name">Account Name</FormLabel>
                            <TextField
                                id="account_name"
                                fullWidth
                                variant="outlined"
                                placeholder="Enter account name"
                                {...formik.getFieldProps("account_name")}
                                error={
                                    formik.touched.account_name && !!formik.errors.account_name
                                }
                                helperText={
                                    formik.touched.account_name && formik.errors.account_name
                                }
                            />
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <FormLabel htmlFor="account_type_id">Account Type</FormLabel>
                            <Select
                                id="account_type_id"
                                fullWidth
                                value={formik.values.account_type_id}
                                onChange={(e) =>
                                    formik.setFieldValue("account_type_id", e.target.value)
                                }
                                displayEmpty
                            >
                                <MenuItem value="">Select Account Type</MenuItem>
                                {accountTypesData?.result?.map((a) => (
                                    <MenuItem key={a.id} value={a.id}>
                                        {a.account_type_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <FormLabel htmlFor="subsidiary_id">Subsidiary</FormLabel>
                            <Select
                                id="subsidiary_id"
                                fullWidth
                                value={formik.values.subsidiary_id}
                                onChange={(e) =>
                                    formik.setFieldValue("subsidiary_id", e.target.value)
                                }
                                displayEmpty
                            >
                                <MenuItem value="">Select Subsidiary</MenuItem>
                                {subsidiariesData?.result?.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {s.subsidiary_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <FormLabel htmlFor="parent_account_number">
                                Parent Account Number
                            </FormLabel>
                            <TextField
                                id="account_number"
                                fullWidth
                                variant="outlined"
                                placeholder="Enter account number"
                                {...formik.getFieldProps("parent_account_number")}
                                error={
                                    formik.touched.parent_account_number &&
                                    !!formik.errors.parent_account_number
                                }
                                helperText={
                                    formik.touched.parent_account_number &&
                                    formik.errors.parent_account_number
                                }
                            />
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <FormLabel htmlFor="currency_id">Currency</FormLabel>
                            <Select
                                id="currency_id"
                                fullWidth
                                value={formik.values.currency_id}
                                onChange={(e) =>
                                    formik.setFieldValue("currency_id", e.target.value)
                                }
                                displayEmpty
                            >
                                <MenuItem value="">Select Currency</MenuItem>
                                {currenciesData?.result?.map((c) => (
                                    <MenuItem
                                        key={c.id}
                                        value={c.id}
                                    >{`${c.currency_name} (${c.currency_code})`}</MenuItem>
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
                title="Delete Chart Account"
                message="Are you sure you want to delete this chart account? This action cannot be undone."
            />

            <DynamicTable
                columns={columns}
                data={chartData?.result || []}
                getRowId={(row) => row.id}
                onEdit={
                    canUpdate("chartofaccount")
                        ? (id) => handleEdit(Number(id))
                        : undefined
                }
                onDelete={
                    canDelete("chartofaccount")
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

export default ChartOfAccountComp;