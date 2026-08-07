import type { } from "@mui/x-date-pickers/themeAugmentation";
import type { } from "@mui/x-charts/themeAugmentation";
import type { } from "@mui/x-data-grid-pro/themeAugmentation";
import type { } from "@mui/x-tree-view/themeAugmentation";

import React, { useState } from "react";

import { Add } from "@mui/icons-material";
import toast from "react-hot-toast";
import { useFormik } from "formik";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import DynamicTable from "../components/Tables";
import {
    useCreateRegistrationTypeMutation,
    useDeleteRegistrationTypeMutation,
    useGetRegistrationTypesQuery,
    useUpdateRegistrationTypeMutation,
} from "../RTK/services/resigtrationTypeApi";
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

interface RegistrationTypeFormValues {
    id?: number;
    registration_type: string;
    isActive: boolean;
}

const RegistrationTypeComp: React.FC = () => {
    const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

    const [isOpen, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editRegistrationTypeId, setEditRegistrationTypeId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteRegistrationTypeId, setDeleteRegistrationTypeId] = useState<number | null>(null);

    const { data: registrationTypes } = useGetRegistrationTypesQuery({ page: 1, limit: 100, search: "" });
    const [createRegistrationType] = useCreateRegistrationTypeMutation();
    const [updateRegistrationType] = useUpdateRegistrationTypeMutation();
    const [deleteRegistrationType] = useDeleteRegistrationTypeMutation();

    const formik = useFormik<RegistrationTypeFormValues>({
        initialValues: {
            registration_type: "",
            isActive: true,
        },
        validationSchema: Yup.object({
            registration_type: Yup.string().required("Registration type is required"),
            isActive: Yup.boolean().required(),
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    ...values,
                    isActive: values.isActive
                };

                if (isEdit && editRegistrationTypeId) {
                    if (!canUpdate("registrationType")) {
                        toast.error("You do not have permission to update registration types");
                        return;
                    }
                    const response = await updateRegistrationType({
                        id: editRegistrationTypeId,
                        payload,
                    }).unwrap();
                    toast.success(response.message);
                } else {
                    if (!canCreate("registrationType")) {
                        toast.error("You do not have permission to create registration types");
                        return;
                    }
                    const response = await createRegistrationType(payload).unwrap();
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
        if (!canUpdate("registrationType")) {
            toast.error("You do not have permission to edit registration types");
            return;
        }

        const registrationType = registrationTypes?.result?.find((item: any) => item.id === id);
        if (registrationType) {
            formik.setValues({
                registration_type: registrationType.registration_type || "",
                isActive: registrationType.isActive ?? true,
            });
            setEditRegistrationTypeId(id);
            setIsEdit(true);
            setOpen(true);
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDelete("registrationType")) {
            toast.error("You do not have permission to delete registration types");
            return;
        }

        try {
            const response = await deleteRegistrationType(id).unwrap();
            toast.success(response.message);
            setDeleteRegistrationTypeId(null);
            setDeleteDialogOpen(false);
        } catch (error) {
            toast.error("Failed to delete registration type");
        }
    };

    const handleAddRegistrationType = () => {
        if (!canCreate("registrationType")) {
            toast.error("You do not have permission to create registration types");
            return;
        }

        setOpen(true);
        setIsEdit(false);
        formik.resetForm();
    };

    const columns = [
        {
            key: "registration_type",
            label: "Registration Type",
        },
        {
            key: "isActive",
            label: "Active",
            render: (row: any) => (row.isActive ? "Yes" : "No"),
        },
    ];

    // If user cannot read cities but can create, show Access Denied but allow create flow
    if (!canRead("registrationType")) {
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
                        Access Denied: You do not have permission to view registration types.
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h3">Registration Types</Typography>
                {canCreate("registrationType") && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={handleAddRegistrationType}
                    >
                        Add Registration Type
                    </Button>
                )}
            </Box>

            <Dialog
                open={isOpen}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{isEdit ? "Edit Registration Type" : "Add Registration Type"}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <FormLabel htmlFor="registration_type">Registration Type</FormLabel>
                            <TextField
                                id="registration_type"
                                placeholder="Eg: Regular, VIP, etc"
                                fullWidth
                                variant="outlined"
                                {...formik.getFieldProps("registration_type")}
                                error={formik.touched.registration_type && !!formik.errors.registration_type}
                                helperText={formik.touched.registration_type && formik.errors.registration_type}
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
                    setDeleteRegistrationTypeId(null);
                }}
                onConfirm={() => deleteRegistrationTypeId !== null && handleDelete(deleteRegistrationTypeId)}
                variant="delete"
                title="Delete Registration Type"
                message="Are you sure you want to delete this registration type? This action cannot be undone."
            />

            <DynamicTable
                columns={columns}
                data={registrationTypes?.result || []}
                getRowId={(row) => row.id}
                onEdit={
                    canUpdate("registrationType") ? (id) => handleEdit(Number(id)) : undefined
                }
                onDelete={
                    canDelete("registrationType")
                        ? (id) => {
                            setDeleteRegistrationTypeId(Number(id));
                            setDeleteDialogOpen(true);
                        }
                        : undefined
                }
            />
        </Box>
    );
};

export default RegistrationTypeComp;