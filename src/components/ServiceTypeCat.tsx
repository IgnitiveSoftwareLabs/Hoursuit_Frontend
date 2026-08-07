import type { } from "@mui/x-date-pickers/themeAugmentation";
import type { } from "@mui/x-charts/themeAugmentation";
import type { } from "@mui/x-data-grid-pro/themeAugmentation";
import type { } from "@mui/x-tree-view/themeAugmentation";

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
    Select,
    MenuItem,
    FormHelperText,
    Switch,
    FormControlLabel,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

import {
    useCreateServiceTypeMutation,
    useDeleteServiceTypeMutation,
    useGetServiceTypesQuery,
    useUpdateServiceTypeMutation,
} from "../RTK/services/serviceTypeApi";

import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";

import { useGetUOMsQuery } from "../RTK/services/uomApi";
import { useGetServiceCategoriesQuery } from "../RTK/services/serviceCategoryApi";
// import { useGetChartOfAccountsQuery } from "../RTK/services/chartOfAccountApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import DynamicTable from "../components/Tables";
import { usePermissions } from "../Hooks/usePermissions";

interface ServiceTypeType {
    id?: number;
    service_name: string;
    uom_id: number | string;
    service_category_id?: number | string | null;
    chart_of_account_id?: number | string;
    subsidiary_id?: number | string | null;
    isActive?: boolean;
}

const ServiceTypeComp: React.FC = () => {
    const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

    const [isOpen, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editServiceTypeId, setEditServiceTypeId] = useState<number | null>(
        null
    );
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteServiceTypeId, setDeleteServiceTypeId] = useState<number | null>(
        null
    );

    const { data: serviceTypesData } = useGetServiceTypesQuery();
    const { data: subsidiariesData } = useGetSubsidiariesQuery();
    const { data: uomData } = useGetUOMsQuery();
    const { data: serviceCategoriesData } = useGetServiceCategoriesQuery();
    // const { data: chartAccountsData } = useGetChartOfAccountsQuery();
    const [createServiceType] = useCreateServiceTypeMutation();
    const [updateServiceType] = useUpdateServiceTypeMutation();
    const [deleteServiceType] = useDeleteServiceTypeMutation();

    const formik = useFormik<ServiceTypeType>({
        initialValues: {
            service_name: "",
            uom_id: "",
            service_category_id: "",
            chart_of_account_id: "",
            subsidiary_id: "",
            isActive: true,
        },
        validationSchema: Yup.object({
            service_name: Yup.string()
                .min(2, "Service name must be at least 2 characters")
                .max(200, "Service name must be at most 200 characters")
                .required("Service name is required"),
            uom_id: Yup.number()
                .transform((value, originalValue) =>
                    originalValue === "" ? null : value
                )
                .nullable()
                .notRequired()
                .positive("Please select a valid UOM"),
            service_category_id: Yup.number()
                .transform((value, originalValue) =>
                    originalValue === "" ? null : value
                )
                .nullable()
                .notRequired()
                .positive("Please select a valid service category"),
            chart_of_account_id: Yup.number()
                .transform((value, originalValue) =>
                    originalValue === "" ? null : value
                )
                .nullable()
                .notRequired()
                .positive("Please select a valid chart account"),
            subsidiary_id: Yup.mixed()
                .optional().nullable(),
            //.required("Subsidiary is required"),
            isActive: Yup.boolean(),
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    ...values,
                    // if uom is empty or null, send undefined so backend treats it as null
                    uom_id:
                        values.uom_id === "" || values.uom_id === null
                            ? undefined
                            : Number(values.uom_id),
                    service_category_id:
                        values.service_category_id === "" ||
                            values.service_category_id === null
                            ? undefined
                            : Number(values.service_category_id),
                    chart_of_account_id:
                        values.chart_of_account_id === "" ||
                            values.chart_of_account_id === null
                            ? undefined
                            : Number(values.chart_of_account_id),
                    subsidiary_id: values.subsidiary_id
                        ? Number(values.subsidiary_id)
                        : null
                };

                if (isEdit && editServiceTypeId) {
                    if (!canUpdate("servicetype")) {
                        toast.error("You do not have permission to update service types");
                        return;
                    }
                    const response = await updateServiceType({
                        id: editServiceTypeId,
                        payload,
                    }).unwrap();
                    toast.success(response.message);
                } else {
                    if (!canCreate("servicetype")) {
                        toast.error("You do not have permission to create service types");
                        return;
                    }
                    const response = await createServiceType(payload).unwrap();
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
        if (!canUpdate("servicetype")) {
            toast.error("You do not have permission to edit service types");
            return;
        }

        const serviceType = serviceTypesData?.result?.find(
            (item: any) => item.id === id
        );
        if (serviceType) {
            formik.setValues({
                service_name: serviceType.service_name,
                uom_id: serviceType.uom_id ?? "",
                service_category_id: serviceType.service_category_id ?? "",
                chart_of_account_id: serviceType.chart_of_account_id ?? "",
                subsidiary_id:
                    serviceType.subsidiary_id ?? serviceType.subsidiary?.id ?? "",
                isActive: serviceType.isActive ?? true,
            });
            setEditServiceTypeId(id);
            setIsEdit(true);
            setOpen(true);
        }
    };

    const handleDelete = async (id: number) => {
        if (!canDelete("servicetype")) {
            toast.error("You do not have permission to delete service types");
            return;
        }

        try {
            const response = await deleteServiceType(id).unwrap();
            toast.success(response.message);
            setDeleteServiceTypeId(null);
            setDeleteDialogOpen(false);
        } catch (error) {
            toast.error("Failed to delete service type");
        }
    };

    const handleAddServiceType = () => {
        if (!canCreate("servicetype")) {
            toast.error("You do not have permission to create service types");
            return;
        }

        setOpen(true);
        setIsEdit(false);
        formik.resetForm();
    };

    const columns = [
        {
            key: "service_name",
            label: "Service Name",
        },
        {
            key: "uom.uom_name",
            label: "UOM",
            render: (row: any) => (
                <Box
                    sx={{
                        display: "inline-block",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: "#f5f5f5",
                        color: "#333",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        border: "1px solid #ddd",
                    }}
                >
                    {row.uom?.uom_name || "N/A"}
                </Box>
            ),
        },
        {
            key: "serviceCategory.category_name",
            label: "Service Category",
            render: (row: any) => row.serviceCategory?.category_name || "N/A",
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
        {
            key: "subsidiary.subsidiary_name",
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

    // If user cannot read service types, allow create-only users to open the create dialog.
    if (!canRead("servicetype")) {
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
                        Access Denied: You do not have permission to view service types.
                    </Typography>
                    {canCreate("servicetype") && (
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
                            Add Service Type
                        </Button>
                    )}
                </Box>

                {/* Keep the dialog and confirmation rendered so create-only users can use the create flow */}
                <Dialog
                    open={isOpen}
                    onClose={() => setOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        {isEdit ? "Edit Service Type" : "Add Service Type"}
                    </DialogTitle>
                    <DialogContent>
                        <Box
                            component="form"
                            onSubmit={formik.handleSubmit}
                            sx={{ mt: 2 }}
                        >
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <FormLabel htmlFor="service_name">Service Name</FormLabel>
                                <TextField
                                    id="service_name"
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Enter service name"
                                    {...formik.getFieldProps("service_name")}
                                    error={
                                        formik.touched.service_name &&
                                        !!formik.errors.service_name
                                    }
                                    helperText={
                                        formik.touched.service_name && formik.errors.service_name
                                    }
                                />
                            </FormControl>

                            <FormControl
                                fullWidth
                                sx={{ mb: 2 }}
                                error={formik.touched.uom_id && !!formik.errors.uom_id}
                            >
                                <FormLabel htmlFor="uom_id">Unit of Measurement</FormLabel>
                                <Select
                                    id="uom_id"
                                    name="uom_id"
                                    value={formik.values.uom_id}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    displayEmpty
                                >
                                    <MenuItem value="">
                                        <em>Select UOM</em>
                                    </MenuItem>
                                    {uomData?.result?.map((uom: any) => (
                                        <MenuItem key={uom.id} value={uom.id}>
                                            {uom.uom_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {formik.touched.uom_id && formik.errors.uom_id && (
                                    <FormHelperText error>
                                        {formik.errors.uom_id}
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
                                        ? "Service type is active"
                                        : "Service type is inactive"}
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
                        setDeleteServiceTypeId(null);
                    }}
                    onConfirm={() =>
                        deleteServiceTypeId !== null && handleDelete(deleteServiceTypeId)
                    }
                    variant="delete"
                    title="Delete Service Type"
                    message="Are you sure you want to delete this service type? This action cannot be undone."
                />
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h3">Service Types</Typography>
                {canCreate("servicetype") && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={handleAddServiceType}
                    >
                        Add Service Type
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
                    {isEdit ? "Edit Service Type" : "Add Service Type"}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <FormLabel htmlFor="service_name">Service Name</FormLabel>
                            <TextField
                                id="service_name"
                                fullWidth
                                variant="outlined"
                                placeholder="Enter service name"
                                {...formik.getFieldProps("service_name")}
                                error={
                                    formik.touched.service_name && !!formik.errors.service_name
                                }
                                helperText={
                                    formik.touched.service_name && formik.errors.service_name
                                }
                            />
                        </FormControl>

                        <FormControl
                            fullWidth
                            sx={{ mb: 2 }}
                            error={
                                formik.touched.service_category_id &&
                                !!formik.errors.service_category_id
                            }
                        >
                            <FormLabel htmlFor="service_category_id">
                                Service Category
                            </FormLabel>
                            <Select
                                id="service_category_id"
                                name="service_category_id"
                                value={formik.values.service_category_id ?? ""}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                displayEmpty
                            >
                                <MenuItem value="">
                                    <em>Select Service Category</em>
                                </MenuItem>
                                {serviceCategoriesData?.result?.map((c: any) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.category_name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {formik.touched.service_category_id &&
                                formik.errors.service_category_id && (
                                    <FormHelperText error>
                                        {formik.errors.service_category_id}
                                    </FormHelperText>
                                )}
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
                                onBlur={formik.handleBlur}
                                displayEmpty
                            >
                                <MenuItem value="">
                                    <em>Select Subsidiary</em>
                                </MenuItem>
                                {subsidiariesData?.result?.map((s: any) => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {s.subsidiary_name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {formik.touched.subsidiary_id &&
                                formik.errors.subsidiary_id && (
                                    <FormHelperText error>
                                        {formik.errors.subsidiary_id}
                                    </FormHelperText>
                                )}
                        </FormControl>

                        {/* <FormControl
                            fullWidth
                            sx={{ mb: 2 }}
                            error={
                                formik.touched.chart_of_account_id &&
                                !!formik.errors.chart_of_account_id
                            }
                        >
                            <FormLabel htmlFor="chart_of_account_id">
                                Expense Code
                            </FormLabel>
                            <Select
                                id="chart_of_account_id"
                                name="chart_of_account_id"
                                value={formik.values.chart_of_account_id}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                displayEmpty
                            >
                                <MenuItem value="">
                                    <em>Select Expense Code</em>
                                </MenuItem>
                                {chartAccountsData?.result?.map((c: any) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {`${c.account_number} - ${c.account_name}`}
                                    </MenuItem>
                                ))}
                            </Select>
                            {formik.touched.chart_of_account_id &&
                                formik.errors.chart_of_account_id && (
                                    <FormHelperText error>
                                        {formik.errors.chart_of_account_id}
                                    </FormHelperText>
                                )}
                        </FormControl> */}

                        <FormControl
                            fullWidth
                            sx={{ mb: 2 }}
                            error={formik.touched.uom_id && !!formik.errors.uom_id}
                        >
                            <FormLabel htmlFor="uom_id">Unit of Measurement</FormLabel>
                            <Select
                                id="uom_id"
                                name="uom_id"
                                value={formik.values.uom_id}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                displayEmpty
                            >
                                <MenuItem value="">
                                    <em>Select UOM</em>
                                </MenuItem>
                                {uomData?.result?.map((uom: any) => (
                                    <MenuItem key={uom.id} value={uom.id}>
                                        {uom.uom_name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {formik.touched.uom_id && formik.errors.uom_id && (
                                <FormHelperText error>{formik.errors.uom_id}</FormHelperText>
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
                                    ? "Service type is active"
                                    : "Service type is inactive"}
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
                    setDeleteServiceTypeId(null);
                }}
                onConfirm={() =>
                    deleteServiceTypeId !== null && handleDelete(deleteServiceTypeId)
                }
                variant="delete"
                title="Delete Service Type"
                message="Are you sure you want to delete this service type? This action cannot be undone."
            />

            <DynamicTable
                columns={columns}
                data={serviceTypesData?.result || []}
                getRowId={(row) => row.id}
                onEdit={
                    canUpdate("servicetype")
                        ? (id) => handleEdit(Number(id))
                        : undefined
                }
                onDelete={
                    canDelete("servicetype")
                        ? (id) => {
                            setDeleteServiceTypeId(Number(id));
                            setDeleteDialogOpen(true);
                        }
                        : undefined
                }
            />
        </Box>
    );
};

export default ServiceTypeComp;