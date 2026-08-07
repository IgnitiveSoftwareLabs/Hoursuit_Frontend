import type { } from "@mui/x-date-pickers/themeAugmentation";
import type { } from "@mui/x-charts/themeAugmentation";
import type { } from "@mui/x-data-grid-pro/themeAugmentation";
import type { } from "@mui/x-tree-view/themeAugmentation";

import React, { useState } from "react";

import { Add } from "@mui/icons-material";
import toast from "react-hot-toast";
import { useFormik } from "formik";
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
import {
    useCreatePanAvailibilityMutation,
    useDeletePanAvailibilityMutation,
    useGetPanAvailabilitiesQuery,
    useUpdatePanAvailibilityMutation,
} from "../RTK/services/panAvailibiltyApi";

interface PanAvailibilityType {
    id?: number;
    name: string;
    isActive: boolean;
}

const PanAvailibilityComp: React.FC = () => {
    const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

    const [isOpen, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editPanAvailId, setEditPanAvailId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletePanAvailId, setDeletePanAvailId] = useState<number | null>(null);

    const { data: panAvailabilities } = useGetPanAvailabilitiesQuery({ page: 1, limit: 100, search: "" });
    const [createPanAvailability] = useCreatePanAvailibilityMutation();
    const [updatePanAvailability] = useUpdatePanAvailibilityMutation();
    const [deletePanAvailability] = useDeletePanAvailibilityMutation();

    const formik = useFormik<PanAvailibilityType>({
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

                if (isEdit && editPanAvailId) {
                    if (!canUpdate("panAvailibitlity")) {
                        toast.error("You do not have permission to update pan availability");
                        return;
                    }
                    const response = await updatePanAvailability({
                        id: editPanAvailId,
                        payload,
                    }).unwrap();
                    toast.success(response.message);
                } else {
                    if (!canCreate("panAvailibitlity")) {
                        toast.error("You do not have permission to create pan availability");
                        return;
                    }
                    const response = await createPanAvailability(payload).unwrap();
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
        if (!canUpdate("panAvailibitlity")) {
            toast.error("You do not have permission to edit pan availability");
            return;
        }

        const panAvailability = panAvailabilities?.result?.find((item: any) => item.id === id);
        if (panAvailability) {
            formik.setValues({
                name: panAvailability.name,
                isActive: panAvailability.isActive ?? true,
            });
            setEditPanAvailId(id);
            setIsEdit(true);
            setOpen(true);
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDelete("panAvailibitlity")) {
            toast.error("You do not have permission to delete pan availability");
            return;
        }

        try {
            const response = await deletePanAvailability(id).unwrap();
            toast.success(response.message);
            setDeletePanAvailId(null);
            setDeleteDialogOpen(false);
        } catch (error) {
            toast.error("Failed to delete pan availability");
        }
    };

    const handleAddPanAvail = () => {
        if (!canCreate("panAvailibitlity")) {
            toast.error("You do not have permission to create pan availability");
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
    if (!canRead("panAvailibitlity")) {
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
                        Access Denied: You do not have permission to view pan availability.
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h3">Pan Availabilities</Typography>
                {canCreate("panAvailibitlity") && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={handleAddPanAvail}
                    >
                        Add Pan Availability
                    </Button>
                )}
            </Box>

            <Dialog
                open={isOpen}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{isEdit ? "Edit Pan Availability" : "Add Pan Availability"}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <FormLabel htmlFor="name">Name</FormLabel>
                            <TextField
                                id="name"
                                placeholder="Eg: Available, Unavailable, etc"
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
                    setDeletePanAvailId(null);
                }}
                onConfirm={() => deletePanAvailId !== null && handleDelete(deletePanAvailId)}
                variant="delete"
                title="Delete Pan Availability"
                message="Are you sure you want to delete this pan availability? This action cannot be undone."
            />

            <DynamicTable
                columns={columns}
                data={panAvailabilities?.result || []}
                getRowId={(row) => row.id}
                onEdit={
                    canUpdate("panAvailibitlity") ? (id) => handleEdit(Number(id)) : undefined
                }
                onDelete={
                    canDelete("panAvailibitlity")
                        ? (id) => {
                            setDeletePanAvailId(Number(id));
                            setDeleteDialogOpen(true);
                        }
                        : undefined
                }
            />
        </Box>
    );
};

export default PanAvailibilityComp;