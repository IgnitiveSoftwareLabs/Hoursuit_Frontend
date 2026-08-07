import type { } from "@mui/x-date-pickers/themeAugmentation";
import type { } from "@mui/x-charts/themeAugmentation";
import type { } from "@mui/x-data-grid-pro/themeAugmentation";
import type { } from "@mui/x-tree-view/themeAugmentation";
// import Layout from "../../components/Layout/index";

import { Add } from "@mui/icons-material";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useFormik } from "formik";

import {
    useCreatePaymentMethodMutation,
    useDeletePaymentMethodMutation,
    useGetPaymentMethodsQuery,
    useUpdatePaymentMethodMutation,
} from "../RTK/services/paymentMethodApi";
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
    FormControlLabel,
    Switch,
} from "@mui/material";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import DynamicTable from "../components/Tables";

interface PaymentMethodType {
    id?: number;
    name: string;
    isActive: boolean;
}

const PaymentMethodComp: React.FC = () => {
    const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

    const [isOpen, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editPaymentMethodId, setEditPaymentMethodId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletePaymentMethodId, setDeletePaymentMethodId] = useState<number | null>(null);

    const { data: paymentMethods } = useGetPaymentMethodsQuery({ page: 1, limit: 100, search: "" });
    const [createPaymentMethod] = useCreatePaymentMethodMutation();
    const [updatePaymentMethod] = useUpdatePaymentMethodMutation();
    const [deletePaymentMethod] = useDeletePaymentMethodMutation();

    const formik = useFormik<PaymentMethodType>({
        initialValues: {
            name: "",
            isActive: true,
        },
        validationSchema: Yup.object({
            name: Yup.string().required("Name is required"),
            isActive: Yup.boolean().required(),
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    ...values,
                    isActive: values.isActive,
                };

                if (isEdit && editPaymentMethodId) {
                    if (!canUpdate("paymentMethod")) {
                        toast.error("You do not have permission to update payment method");
                        return;
                    }
                    const response = await updatePaymentMethod({
                        id: editPaymentMethodId,
                        payload,
                    }).unwrap();
                    toast.success(response.message);
                } else {
                    if (!canCreate("paymentMethod")) {
                        toast.error("You do not have permission to create payment method");
                        return;
                    }
                    const response = await createPaymentMethod(payload).unwrap();
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
        if (!canUpdate("paymentMethod")) {
            toast.error("You do not have permission to edit payment method");
            return;
        }

        const paymentMethod = paymentMethods?.result?.find((item: any) => item.id === id);
        if (paymentMethod) {
            formik.setValues({
                name: paymentMethod.name,
                isActive: paymentMethod.isActive ?? true,
            });
            setEditPaymentMethodId(id);
            setIsEdit(true);
            setOpen(true);
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDelete("paymentMethod")) {
            toast.error("You do not have permission to delete payment method");
            return;
        }

        try {
            const response = await deletePaymentMethod(id).unwrap();
            toast.success(response.message);
            setDeletePaymentMethodId(null);
            setDeleteDialogOpen(false);
        } catch (error) {
            toast.error("Failed to delete payment method");
        }
    };

    const handleAddPaymentMethod = () => {
        if (!canCreate("paymentMethod")) {
            toast.error("You do not have permission to create payment method");
            return;
        }

        setOpen(true);
        setIsEdit(false);
        formik.resetForm();
    };

    const columns = [
        {
            key: "name",
            label: "Name",
        },
        {
            key: "isActive",
            label: "Active",
            render: (row: any) => (row.isActive ? "Yes" : "No"),
        },
    ];

    // If user cannot read cities but can create, show Access Denied but allow create flow
    if (!canRead("paymentMethod")) {
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
                        Access Denied: You do not have permission to view payment methods.
                    </Typography>
                    {canCreate("paymentMethod") && (
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
                            Add Payment Method
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
                    <DialogTitle>{isEdit ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
                    <DialogContent>
                        <Box
                            component="form"
                            onSubmit={formik.handleSubmit}
                            sx={{ mt: 2 }}
                        >
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <FormLabel htmlFor="name">Name</FormLabel>
                                <TextField
                                    id="name"
                                    fullWidth
                                    variant="outlined"
                                    {...formik.getFieldProps("name")}
                                    error={formik.touched.name && !!formik.errors.name}
                                    helperText={formik.touched.name && formik.errors.name}
                                />
                            </FormControl>
                            <FormControlLabel
                                sx={{ mb: 2 }}
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
                        setDeletePaymentMethodId(null);
                    }}
                    onConfirm={() =>
                        deletePaymentMethodId !== null && handleDelete(deletePaymentMethodId)
                    }
                    variant="delete"
                    title="Delete Payment Method"
                    message="Are you sure you want to delete this payment method? This action cannot be undone."
                />
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h3">Payment Methods</Typography>
                {canCreate("paymentMethod") && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={handleAddPaymentMethod}
                    >
                        Add Payment Method
                    </Button>
                )}
            </Box>

            <Dialog
                open={isOpen}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{isEdit ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <FormLabel htmlFor="name">Add Payment Method</FormLabel>
                            <TextField
                                id="name"
                                placeholder="Eg: Cash, Card, UPI etc"
                                fullWidth
                                variant="outlined"
                                {...formik.getFieldProps("name")}
                                error={formik.touched.name && !!formik.errors.name}
                                helperText={formik.touched.name && formik.errors.name}
                            />
                        </FormControl>

                        <FormControlLabel
                            sx={{ mb: 2 }}
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
                    setDeletePaymentMethodId(null);
                }}
                onConfirm={() => deletePaymentMethodId !== null && handleDelete(deletePaymentMethodId)}
                variant="delete"
                title="Delete Payment Method"
                message="Are you sure you want to delete this payment method? This action cannot be undone."
            />

            <DynamicTable
                columns={columns}
                data={paymentMethods?.result || []}
                getRowId={(row) => row.id}
                onEdit={
                    canUpdate("paymentMethod") ? (id) => handleEdit(Number(id)) : undefined
                }
                onDelete={
                    canDelete("paymentMethod")
                        ? (id) => {
                            setDeletePaymentMethodId(Number(id));
                            setDeleteDialogOpen(true);
                        }
                        : undefined
                }
            />
        </Box>
    );
};

export default PaymentMethodComp;