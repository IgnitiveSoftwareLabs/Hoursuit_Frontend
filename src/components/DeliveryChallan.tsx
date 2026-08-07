import React, { useState } from "react";

import { Add, RemoveCircleOutline } from "@mui/icons-material";
import Grid from "@mui/material/Grid";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControl,
    FormLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider
} from "@mui/material";

import { useGetTransportationModesQuery } from "../RTK/services/transportationModeApi";
import { useFetchWarehousesQuery } from "../RTK/services/warehouseApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetCustomersQuery } from "../RTK/services/customerApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import { useGetUOMsQuery } from "../RTK/services/uomApi";
import { usePermissions } from "../Hooks/usePermissions";
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
import DynamicTable from './Tables';
import {
    useGetSalesOrdersQuery,
    useGetDeliveryChallansQuery,
    useCreateDeliveryChallanMutation,
} from "../RTK/services/salesApi";

const DeliveryChallan: React.FC = () => {
    const { canRead, canCreate } = usePermissions();
    const [isEdit, setIsEdit] = useState(false);
    const [isOpen, setOpen] = useState(false);

    // Queries
    const { data: deliveryChallanData } = useGetDeliveryChallansQuery({ page: 1, limit: 10 });
    const { data: warehousesData } = useFetchWarehousesQuery({ page: 1, limit: 100 });
    const { data: salesOrdersData } = useGetSalesOrdersQuery({ page: 1, limit: 100 });
    const { data: transportationModeData } = useGetTransportationModesQuery();
    const { data: customersData } = useGetCustomersQuery({ option: true });
    const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 100 });
    const { data: subsidiariesData } = useGetSubsidiariesQuery();
    const { data: citiesData } = useGetCitiesQuery();
    const { data: uomData } = useGetUOMsQuery();

    const transportationModes = Array.isArray(transportationModeData) ? transportationModeData : transportationModeData?.result ?? [];
    const subsidiaries = Array.isArray(subsidiariesData) ? subsidiariesData : subsidiariesData?.result ?? [];
    const salesOrders = Array.isArray(salesOrdersData) ? salesOrdersData : salesOrdersData?.result ?? [];
    const warehouses = Array.isArray(warehousesData) ? warehousesData : warehousesData?.result ?? [];
    const customers = Array.isArray(customersData) ? customersData : customersData?.result ?? [];
    const cities = Array.isArray(citiesData) ? citiesData : citiesData?.result ?? [];
    const items = Array.isArray(itemsData) ? itemsData : itemsData?.result ?? [];
    const uoms = Array.isArray(uomData) ? uomData : uomData?.result ?? [];

    // Mutations
    const [createDeliveryChallan] = useCreateDeliveryChallanMutation();

    const formik = useFormik({
        initialValues: {
            header: {
                challanNumber: "",
                challanDate: new Date().toISOString().split("T")[0],
                salesOrderHeaderId: "",
                customerId: "",
                vehicleNumber: "",
                transporterName: "",
                uom_id: "",
                transportationModeId: "",
                warehouseId: "",
                subsidiaryId: "",
                cityId: "",
                driverName: "",
                driverPhone: "",
                dispatchDate: "",
                deliveredDate: "",
                status: "DRAFT",
                remarks: "",
                shippingAddress: "",
            },
            lineItems: [
                {
                    itemId: "",
                    salesOrderLineId: "",
                    batchNo: "",
                    dispatchQty: 0,
                    unitPrice: 0,
                    lineTotal: 0,
                    remarks: "",
                }
            ],
            subtotal: 0,
            totalAmount: 0,
        },
        validationSchema: Yup.object({
            header: Yup.object({
                challanNumber: Yup.string().required("Challan Number is required"),
                challanDate: Yup.date().required("Challan Date is required"),
                salesOrderHeaderId: Yup.string().required("Sales Order is required"),
                customerId: Yup.string().required("Customer is required"),
                warehouseId: Yup.string().required("Warehouse is required"),
                subsidiaryId: Yup.string().required("Subsidiary is required"),
                cityId: Yup.string().required("City is required"),
            }),
            lineItems: Yup.array().of(
                Yup.object({
                    itemId: Yup.string().required("Item is required"),
                    salesOrderLineId: Yup.string(),
                    dispatchQty: Yup.number().min(0.01, "Qty must be > 0").required("Qty is required"),
                    unitPrice: Yup.number().min(0, "Price must be >= 0").required("Price is required"),
                })
            ).min(1, "At least one line item is required"),
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    header: values.header,
                    lineItems: values.lineItems,
                };

                if (isEdit) {
                    toast.success("Delivery Challan update coming soon");
                } else {
                    await createDeliveryChallan(payload).unwrap();
                    toast.success("Delivery Challan created successfully");
                }
                setOpen(false);
                formik.resetForm();
            } catch (error: any) {
                toast.error(error?.data?.message || "Something went wrong");
            }
        },
    });

    // Calculation logic
    const calculateTotals = () => {
        let subtotal = 0;
        let totalAmount = 0;

        formik.values.lineItems.forEach((item) => {
            const qty = Number(item.dispatchQty) || 0;
            const price = Number(item.unitPrice) || 0;
            const lineTotal = qty * price;

            subtotal += lineTotal;
            totalAmount += lineTotal;
        });

        return { subtotal, totalAmount };
    };

    const totals = calculateTotals();

    const handleAddLineItem = () => {
        formik.setFieldValue("lineItems", [
            ...formik.values.lineItems,
            {
                itemId: "",
                batchNo: "",
                dispatchQty: 0,
                unitPrice: 0,
                lineTotal: 0,
                remarks: "",
            },
        ]);
    };

    const handleRemoveLineItem = (index: number) => {
        const newLineItems = formik.values.lineItems.filter((_, i) => i !== index);
        formik.setFieldValue("lineItems", newLineItems);
    };

    const handleLineItemChange = (index: number, field: string, value: any) => {
        const updatedLineItems = [...formik.values.lineItems];
        updatedLineItems[index] = { ...updatedLineItems[index], [field]: value };

        if (field === "dispatchQty" || field === "unitPrice") {
            const qty = Number(updatedLineItems[index].dispatchQty) || 0;
            const price = Number(updatedLineItems[index].unitPrice) || 0;
            updatedLineItems[index].lineTotal = qty * price;
        }

        formik.setFieldValue("lineItems", updatedLineItems);
    };

    const handleOpenDialog = () => {
        setIsEdit(false);
        setOpen(true);
    };

    const handleCloseDialog = () => {
        setOpen(false);
        formik.resetForm();
    };

    const columns = [
        { key: "challanNumber", label: "Challan Number" },
        { key: "challanDate", label: "Date" },
        { key: "salesOrderHeaderId", label: "Sales Order" },
        { key: "customerId", label: "Customer" },
        { key: "status", label: "Status" },
    ];

    if (!canRead) {
        return <Typography>Access Denied</Typography>;
    }

    return (
        <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Box>
                    <Typography variant="h3">Delivery Challan</Typography>
                    <NavbarBreadcrumbs />
                </Box>
                {canCreate("delivery_challan") && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleOpenDialog}
                    >
                        Create Challan
                    </Button>
                )}
            </Box>

            <DynamicTable
                columns={columns}
                data={Array.isArray(deliveryChallanData) ? deliveryChallanData : deliveryChallanData?.result ?? []}
                getRowId={(row) => row.id?.toString() || row.challanNumber || String(Math.random())}
                onEdit={(_) => {
                    setIsEdit(true);
                    setOpen(true);
                    // Load data into form using id
                }}
            />

            {/* Create/Edit Dialog */}
            <Dialog open={isOpen} onClose={handleCloseDialog} maxWidth="xl" fullWidth>
                <DialogTitle>{isEdit ? "Edit Delivery Challan" : "Create Delivery Challan"}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit}>
                        {/* <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Challan Header</Typography> */}

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth error={formik.touched.header?.challanNumber && !!formik.errors.header?.challanNumber}>
                                    <FormLabel>Challan Number</FormLabel>
                                    <TextField
                                        size="small"
                                        placeholder="Enter challan number"
                                        name="header.challanNumber"
                                        value={formik.values.header.challanNumber}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={formik.touched.header?.challanNumber && !!formik.errors.header?.challanNumber}
                                        helperText={formik.touched.header?.challanNumber && formik.errors.header?.challanNumber}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth error={formik.touched.header?.challanDate && !!formik.errors.header?.challanDate}>
                                    <FormLabel>Challan Date</FormLabel>
                                    <TextField
                                        size="small"
                                        type="date"
                                        name="header.challanDate"
                                        value={formik.values.header.challanDate}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        InputLabelProps={{ shrink: true }}
                                        error={formik.touched.header?.challanDate && !!formik.errors.header?.challanDate}
                                        helperText={formik.touched.header?.challanDate && formik.errors.header?.challanDate}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth error={formik.touched.header?.salesOrderHeaderId && !!formik.errors.header?.salesOrderHeaderId}>
                                    <FormLabel>Sales Order</FormLabel>
                                    <Select
                                        size="small"
                                        name="header.salesOrderHeaderId"
                                        value={formik.values.header.salesOrderHeaderId}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Select Sales Order</MenuItem>
                                        {salesOrders.map((order: any) => (
                                            <MenuItem key={order.id} value={order.id}>
                                                {order.orderNumber || order.order_number || `#${order.id}`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth error={formik.touched.header?.customerId && !!formik.errors.header?.customerId}>
                                    <FormLabel>Customer</FormLabel>
                                    <Select
                                        size="small"
                                        name="header.customerId"
                                        value={formik.values.header.customerId}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Select Customer</MenuItem>
                                        {customers.map((customer: any) => (
                                            <MenuItem key={customer.id} value={customer.id}>
                                                {customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || `#${customer.id}`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth error={formik.touched.header?.cityId && !!formik.errors.header?.cityId}>
                                    <FormLabel>City</FormLabel>
                                    <Select
                                        size="small"
                                        name="header.cityId"
                                        value={formik.values.header.cityId}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Select City</MenuItem>
                                        {cities.map((city: any) => (
                                            <MenuItem key={city.id} value={city.id}>
                                                {city.city_name || city.name || `#${city.id}`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth error={formik.touched.header?.subsidiaryId && !!formik.errors.header?.subsidiaryId}>
                                    <FormLabel>Subsidiary</FormLabel>
                                    <Select
                                        size="small"
                                        name="header.subsidiaryId"
                                        value={formik.values.header.subsidiaryId}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Select Subsidiary</MenuItem>
                                        {subsidiaries.map((subsidiary: any) => (
                                            <MenuItem key={subsidiary.id} value={subsidiary.id}>
                                                {subsidiary.subsidiary_name || subsidiary.name || `#${subsidiary.id}`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth error={formik.touched.header?.warehouseId && !!formik.errors.header?.warehouseId}>
                                    <FormLabel>Warehouse</FormLabel>
                                    <Select
                                        size="small"
                                        name="header.warehouseId"
                                        value={formik.values.header.warehouseId}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Select Warehouse</MenuItem>
                                        {warehouses.map((warehouse: any) => (
                                            <MenuItem key={warehouse.id} value={warehouse.id}>
                                                {warehouse.name || `#${warehouse.id}`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <FormLabel>UOM</FormLabel>
                                    <Select
                                        size="small"
                                        name="header.uom_id"
                                        value={formik.values.header.uom_id}
                                        onChange={formik.handleChange}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Select UOM</MenuItem>
                                        {uoms.map((uom: any) => (
                                            <MenuItem key={uom.id} value={uom.id}>
                                                {uom.name || uom.uom_name || `#${uom.id}`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <FormLabel>Vehicle Number</FormLabel>
                                    <TextField
                                        size="small"
                                        placeholder="Vehical number"
                                        name="header.vehicleNumber"
                                        value={formik.values.header.vehicleNumber}
                                        onChange={formik.handleChange}
                                    />
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <FormLabel>Transportation Mode</FormLabel>
                                    <Select
                                        size="small"
                                        name="header.transportationModeId"
                                        value={formik.values.header.transportationModeId}
                                        onChange={formik.handleChange}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Select Mode</MenuItem>
                                        {transportationModes.map((mode: any) => (
                                            <MenuItem key={mode.id} value={mode.id}>
                                                {mode.mode_name || mode.name || `#${mode.id}`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <FormLabel>Transporter Name</FormLabel>
                                    <TextField
                                        size="small"
                                        placeholder="Transporter name"
                                        name="header.transporterName"
                                        value={formik.values.header.transporterName}
                                        onChange={formik.handleChange}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <FormLabel>Driver Name</FormLabel>
                                    <TextField
                                        size="small"
                                        placeholder="Driver name"
                                        name="header.driverName"
                                        value={formik.values.header.driverName}
                                        onChange={formik.handleChange}
                                    />
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <FormLabel>Driver Phone</FormLabel>
                                    <TextField
                                        size="small"
                                        placeholder="Driver phone"
                                        name="header.driverPhone"
                                        value={formik.values.header.driverPhone}
                                        onChange={formik.handleChange}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <FormLabel>Dispatch Date</FormLabel>
                                    <TextField
                                        size="small"
                                        type="date"
                                        name="header.dispatchDate"
                                        value={formik.values.header.dispatchDate}
                                        onChange={formik.handleChange}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <FormLabel>Delivered Date</FormLabel>
                                    <TextField
                                        size="small"
                                        type="date"
                                        name="header.deliveredDate"
                                        value={formik.values.header.deliveredDate}
                                        onChange={formik.handleChange}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
                                    <FormLabel>Shipping Address</FormLabel>
                                    <TextField
                                        size="small"
                                        placeholder="Shipping address"
                                        name="header.shippingAddress"
                                        value={formik.values.header.shippingAddress}
                                        onChange={formik.handleChange}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        size="small"
                                        name="header.status"
                                        value={formik.values.header.status}
                                        onChange={formik.handleChange}
                                    >
                                        <MenuItem value="DRAFT">Draft</MenuItem>
                                        <MenuItem value="DISPATCHED">Dispatched</MenuItem>
                                        <MenuItem value="DELIVERED">Delivered</MenuItem>
                                        <MenuItem value="CANCELLED">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <FormControl fullWidth>
                                    <FormLabel>Remarks</FormLabel>
                                    <TextField
                                        size="small"
                                        placeholder="Enter remark"
                                        name="header.remarks"
                                        value={formik.values.header.remarks}
                                        onChange={formik.handleChange}
                                    />
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 1 }} />

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Line Items
                            </Typography>
                            <Button startIcon={<Add />} variant="outlined" size="small" onClick={handleAddLineItem}>
                                Add Item
                            </Button>
                        </Box>

                        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%' }}>
                            <Table size="small" sx={{ minWidth: 1200 }}>
                                <TableHead sx={{ bgcolor: 'grey.100' }}>
                                    <TableRow>
                                        <TableCell width="8%">Item</TableCell>
                                        <TableCell width="8%">Batch No</TableCell>
                                        <TableCell width="7%">Dispatch Qty</TableCell>
                                        <TableCell width="8%">Unit Price</TableCell>
                                        <TableCell width="8%">Line Total</TableCell>
                                        <TableCell width="10%">Remarks</TableCell>
                                        <TableCell align="center" width="8%">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {formik.values.lineItems.map((lineItem, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <FormControl fullWidth size="small" error={formik.touched.lineItems?.[index]?.itemId && !!formik.errors.lineItems}>
                                                    <Select
                                                        size="small"
                                                        value={lineItem.itemId}
                                                        onChange={(e) => handleLineItemChange(index, "itemId", e.target.value)}
                                                        onBlur={formik.handleBlur}
                                                        displayEmpty
                                                    >
                                                        <MenuItem value="">Select Item</MenuItem>
                                                        {items?.map((item: any) => (
                                                            <MenuItem key={item.id} value={item.id}>
                                                                {item.item_name || item.name || `#${item.id}`}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    value={lineItem.batchNo}
                                                    onChange={(e) => handleLineItemChange(index, "batchNo", e.target.value)}
                                                    placeholder="Batch"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    inputProps={{ min: 0, step: 0.01 }}
                                                    value={lineItem.dispatchQty}
                                                    onChange={(e) => handleLineItemChange(index, "dispatchQty", Number(e.target.value))}
                                                    error={formik.touched.lineItems?.[index]?.dispatchQty && !!formik.errors.lineItems}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    inputProps={{ min: 0, step: 0.01 }}
                                                    value={lineItem.unitPrice}
                                                    onChange={(e) => handleLineItemChange(index, "unitPrice", Number(e.target.value))}
                                                    error={formik.touched.lineItems?.[index]?.unitPrice && !!formik.errors.lineItems}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    size="small"
                                                    value={(lineItem.lineTotal || 0).toFixed(2)}
                                                    InputProps={{ readOnly: true }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    value={lineItem.remarks}
                                                    onChange={(e) => handleLineItemChange(index, "remarks", e.target.value)}
                                                    placeholder="Remarks"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" color="error" onClick={() => handleRemoveLineItem(index)}>
                                                    <RemoveCircleOutline />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Grid container spacing={2} sx={{ mt: 2, justifyContent: 'flex-end' }}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Subtotal:</Typography>
                                        <Typography variant="body2">₹{totals.subtotal.toFixed(2)}</Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                        <Typography>Total Amount:</Typography>
                                        <Typography sx={{ color: 'primary.main' }}>₹{totals.totalAmount.toFixed(2)}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>

                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                            <Button variant="outlined" onClick={handleCloseDialog}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="contained" disabled={!formik.dirty}>
                                {isEdit ? "Update" : "Create"}
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default DeliveryChallan;