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
    Select,
    MenuItem,
    FormHelperText,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

import {
    useCreateMISTypeMutation,
    useDeleteMISTypeMutation,
    useGetMISTypesQuery,
    useUpdateMISTypeMutation,
} from "../RTK/services/misTypeApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import DynamicTable from "../components/Tables";
import { usePermissions } from "../Hooks/usePermissions";

interface MISTypeType {
    id?: number;
    mis_type_name: string;
    isActive?: boolean;
    subsidiary_id?: number | string;
}

const MISTypeComp: React.FC = () => {
    const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

    const [isOpen, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: typesData } = useGetMISTypesQuery();
    const { data: subsidiariesData } = useGetSubsidiariesQuery();
    const [createMISType] = useCreateMISTypeMutation();
    const [updateMISType] = useUpdateMISTypeMutation();
    const [deleteMISType] = useDeleteMISTypeMutation();

    const formik = useFormik<MISTypeType>({
        initialValues: {
            mis_type_name: "",
            isActive: true,
            subsidiary_id: "",
        },
        validationSchema: Yup.object({
            mis_type_name: Yup.string()
                .min(1)
                .max(200)
                .required("MIS Type is required"),
            isActive: Yup.boolean(),
            subsidiary_id: Yup.mixed()
                .optional().nullable(),
            //.required("Subsidiary is required"),
        }),
        onSubmit: async (values) => {
            try {
                const payload: any = { ...values };
                payload.subsidiary_id = values.subsidiary_id
                    ? Number(values.subsidiary_id)
                    : null;

                if (isEdit && editId) {
                    if (!canUpdate("mistype")) {
                        toast.error("You do not have permission to update MIS Types");
                        return;
                    }
                    const response = await updateMISType({
                        id: editId,
                        payload,
                    }).unwrap();
                    toast.success(response.message);
                } else {
                    if (!canCreate("mistype")) {
                        toast.error("You do not have permission to create MIS Types");
                        return;
                    }
                    const response = await createMISType(payload).unwrap();
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
        if (!canUpdate("mistype")) {
            toast.error("You do not have permission to edit MIS Types");
            return;
        }
        const item = typesData?.result?.find((x: any) => x.id === id);
        if (item) {
            formik.setValues({
                mis_type_name: item.mis_type_name,
                isActive: item.isActive ?? true,
                subsidiary_id: item.subsidiary_id ?? item.subsidiary?.id ?? "",
            } as any);
            setEditId(id);
            setIsEdit(true);
            setOpen(true);
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDelete("mistype")) {
            toast.error("You do not have permission to delete MIS Types");
            return;
        }
        try {
            const response = await deleteMISType(id).unwrap();
            toast.success(response.message);
            setDeleteId(null);
            setDeleteDialogOpen(false);
        } catch (error) {
            toast.error("Failed to delete MIS Type");
        }
    };

    const handleAdd = () => {
        if (!canCreate("mistype")) {
            toast.error("You do not have permission to create MIS Types");
            return;
        }
        setOpen(true);
        setIsEdit(false);
        formik.resetForm();
    };

    const columns = [
        { key: "mis_type_name", label: "MIS Type" },
        {
            key: "isActive",
            label: "Status",
            render: (row: any) => (row.isActive ? "Active" : "Inactive"),
        },
        {
            key: "subsidiary",
            label: "Subsidiary",
            render: (row: any) => row.subsidiary?.subsidiary_name || "N/A",
        },
        {
            key: "createdAt",
            label: "Created Date",
            render: (row: any) =>
                row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A",
        },
    ];

    if (!canRead("mistype")) {
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
                        Access Denied: You do not have permission to view MIS Types.
                    </Typography>
                    {canCreate("mistype") && (
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
                            Add MIS Type
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
                        {isEdit ? "Edit MIS Type" : "Add MIS Type"}
                    </DialogTitle>
                    <DialogContent>
                        <Box
                            component="form"
                            onSubmit={formik.handleSubmit}
                            sx={{ mt: 2 }}
                        >
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <FormLabel htmlFor="mis_type_name">MIS Type</FormLabel>
                                <TextField
                                    id="mis_type_name"
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Enter MIS Type"
                                    {...formik.getFieldProps("mis_type_name")}
                                    error={
                                        formik.touched.mis_type_name &&
                                        !!formik.errors.mis_type_name
                                    }
                                    helperText={
                                        formik.touched.mis_type_name &&
                                        formik.errors.mis_type_name
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
                                        ? "MIS Type is active"
                                        : "MIS Type is inactive"}
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
                    title="Delete MIS Type"
                    message="Are you sure you want to delete this MIS Type? This action cannot be undone."
                />
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h3">MIS Types</Typography>
                {canCreate("mistype") && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={handleAdd}
                    >
                        Add MIS Type
                    </Button>
                )}
            </Box>

            <Dialog
                open={isOpen}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{isEdit ? "Edit MIS Type" : "Add MIS Type"}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <FormLabel htmlFor="mis_type_name">MIS Type</FormLabel>
                            <TextField
                                id="mis_type_name"
                                fullWidth
                                variant="outlined"
                                placeholder="Enter MIS Type"
                                {...formik.getFieldProps("mis_type_name")}
                                error={
                                    formik.touched.mis_type_name &&
                                    !!formik.errors.mis_type_name
                                }
                                helperText={
                                    formik.touched.mis_type_name && formik.errors.mis_type_name
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
                                labelId="subsidiary_id"
                                id="subsidiary_id"
                                name="subsidiary_id"
                                value={formik.values.subsidiary_id ?? ""}
                                label="Subsidiary"
                                onChange={(e) =>
                                    formik.setFieldValue("subsidiary_id", e.target.value)
                                }
                                displayEmpty
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
                                    ? "MIS Type is active"
                                    : "MIS Type is inactive"}
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
                title="Delete MIS Type"
                message="Are you sure you want to delete this MIS Type? This action cannot be undone."
            />

            <DynamicTable
                columns={columns}
                data={typesData?.result || []}
                getRowId={(row) => row.id}
                onEdit={
                    canUpdate("mistype") ? (id) => handleEdit(Number(id)) : undefined
                }
                onDelete={
                    canDelete("mistype")
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

export default MISTypeComp;