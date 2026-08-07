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

import { useGetCustomersQuery } from "../RTK/services/customerApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import { usePermissions } from "../Hooks/usePermissions";
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
import DynamicTable from './Tables';
import {
    useGetSalesOrdersQuery,
    useGetSalesReturnsQuery,
    useCreateSalesReturnMutation,
} from "../RTK/services/salesApi";

const SalesReturnComp: React.FC = () => {
    const { canRead, canCreate } = usePermissions();
    const [isEdit, setIsEdit] = useState(false);
    const [isOpen, setOpen] = useState(false);

    // Queries
    const { data: salesReturnsData } = useGetSalesReturnsQuery({ page: 1, limit: 10 });
    const { data: salesOrdersData } = useGetSalesOrdersQuery({ page: 1, limit: 100 });
    const { data: customersData } = useGetCustomersQuery({ option: true });
    const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 100 });

    const salesReturns = Array.isArray(salesReturnsData) ? salesReturnsData : salesReturnsData?.result ?? [];
    const salesOrders = Array.isArray(salesOrdersData) ? salesOrdersData : salesOrdersData?.result ?? [];
    const customers = Array.isArray(customersData) ? customersData : customersData?.result ?? [];
    const items = Array.isArray(itemsData) ? itemsData : itemsData?.result ?? [];

    // Mutations
    const [createSalesReturn] = useCreateSalesReturnMutation();

    const formik = useFormik({
        initialValues: {
            header: {
                returnNumber: "",
                returnDate: new Date().toISOString().split("T")[0],
                customerId: "",
                salesOrderHeaderId: "",
                status: "DRAFT",
                returnReason: "",
                remarks: "",
                receivedBy: "",
                approvedBy: "",
            },
            lineItems: [
                {
                    itemId: "",
                    salesOrderLineId: "",
                    deliveryChallanLineId: "",
                    batchNo: "",
                    returnQty: 0,
                    approvedQty: 0,
                    rejectedQty: 0,
                    damagedQty: 0,
                    unitPrice: 0,
                    lineTotal: 0,
                    reason: "",
                    remarks: "",
                    status: "PENDING",
                }
            ],
            subtotal: 0,
            totalAmount: 0,
        },
        validationSchema: Yup.object({
            header: Yup.object({
                returnNumber: Yup.string().required("Return Number is required"),
                returnDate: Yup.date().required("Return Date is required"),
                customerId: Yup.string().required("Customer is required"),
            }),
            lineItems: Yup.array().of(
                Yup.object({
                    itemId: Yup.string().required("Item is required"),
                    salesOrderLineId: Yup.string(),
                    deliveryChallanLineId: Yup.string(),
                    returnQty: Yup.number().min(0.01, "Qty must be > 0").required("Qty is required"),
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
                    toast.success("Sales Return update coming soon");
                } else {
                    await createSalesReturn(payload).unwrap();
                    toast.success("Sales Return created successfully");
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
            const qty = Number(item.returnQty) || 0;
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
                salesOrderLineId: "",
                deliveryChallanLineId: "",
                batchNo: "",
                returnQty: 0,
                approvedQty: 0,
                rejectedQty: 0,
                damagedQty: 0,
                unitPrice: 0,
                lineTotal: 0,
                reason: "",
                remarks: "",
                status: "PENDING",
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

        if (field === "returnQty" || field === "unitPrice") {
            const qty = Number(updatedLineItems[index].returnQty) || 0;
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
        { key: "returnNumber", label: "Return Number" },
        { key: "returnDate", label: "Return Date" },
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
                    <Typography variant="h3">Sales Return</Typography>
                    <NavbarBreadcrumbs />
                </Box>
                {canCreate("sales_return") && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleOpenDialog}
                    >
                        Create Sales Return
                    </Button>
                )}
            </Box>
            <DynamicTable
                columns={columns}
                data={salesReturns}
                getRowId={(row) => row.id?.toString() || row.returnNumber || String(Math.random())}
                onEdit={(_) => {
                    setIsEdit(true);
                    setOpen(true);
                    // Load data into form using id
                }}
            />
            {/* Create/Edit Dialog */}
            <Dialog open={isOpen} onClose={handleCloseDialog} maxWidth="xl" fullWidth>
                <DialogTitle>{isEdit ? "Edit Sales Return" : "Create Sales Return"}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={formik.handleSubmit} mt={1}>
                        {/* <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Sales Return Header</Typography> */}

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth error={formik.touched.header?.returnNumber && !!formik.errors.header?.returnNumber}>
                                    <FormLabel>Return Number</FormLabel>
                                    <TextField
                                        size="small"
                                        placeholder="Enter return number"
                                        name="header.returnNumber"
                                        value={formik.values.header.returnNumber}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={formik.touched.header?.returnNumber && !!formik.errors.header?.returnNumber}
                                        helperText={formik.touched.header?.returnNumber && formik.errors.header?.returnNumber}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth error={formik.touched.header?.returnDate && !!formik.errors.header?.returnDate}>
                                    <FormLabel>Return Date</FormLabel>
                                    <TextField
                                        size="small"
                                        type="date"
                                        name="header.returnDate"
                                        value={formik.values.header.returnDate}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        InputLabelProps={{ shrink: true }}
                                        error={formik.touched.header?.returnDate && !!formik.errors.header?.returnDate}
                                        helperText={formik.touched.header?.returnDate && formik.errors.header?.returnDate}
                                    />
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
                                <FormControl fullWidth>
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
                                <FormControl fullWidth>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        size="small"
                                        name="header.status"
                                        value={formik.values.header.status}
                                        onChange={formik.handleChange}
                                    >
                                        <MenuItem value="DRAFT">Draft</MenuItem>
                                        <MenuItem value="RECEIVED">Received</MenuItem>
                                        <MenuItem value="INSPECTED">Inspected</MenuItem>
                                        <MenuItem value="COMPLETED">Completed</MenuItem>
                                        <MenuItem value="CANCELLED">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <FormLabel>Return Reason</FormLabel>
                                    <TextField
                                        size="small"
                                        placeholder="Enter reason"
                                        name="header.returnReason"
                                        value={formik.values.header.returnReason}
                                        onChange={formik.handleChange}
                                    />
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
                            <Typography variant="h6" color="primary">Line Items</Typography>
                            <Button startIcon={<Add />} variant="outlined" size="small" onClick={handleAddLineItem}>
                                Add Line Item
                            </Button>
                        </Box>

                        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%' }}>
                            <Table size="small" sx={{ minWidth: 2000 }}>
                                <TableHead sx={{ bgcolor: 'grey.100' }}>
                                    <TableRow>
                                        <TableCell width="10%">Item</TableCell>
                                        <TableCell width="10%">Batch No</TableCell>
                                        <TableCell width="8%">Return Qty</TableCell>
                                        <TableCell width="8%">Approved Qty</TableCell>
                                        <TableCell width="8%">Rejected Qty</TableCell>
                                        <TableCell width="8%">Damaged Qty</TableCell>
                                        <TableCell width="10%">Unit Price</TableCell>
                                        <TableCell width="10%">Line Total</TableCell>
                                        <TableCell width="10%">Reason</TableCell>
                                        <TableCell width="10%">Status</TableCell>
                                        <TableCell width="10%">Remarks</TableCell>
                                        <TableCell align="center" width="10%">Action</TableCell>
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
                                                    value={lineItem.returnQty}
                                                    onChange={(e) => handleLineItemChange(index, "returnQty", Number(e.target.value))}
                                                    error={formik.touched.lineItems?.[index]?.returnQty && !!formik.errors.lineItems}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    inputProps={{ min: 0, step: 0.01 }}
                                                    value={lineItem.approvedQty}
                                                    onChange={(e) => handleLineItemChange(index, "approvedQty", Number(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    inputProps={{ min: 0, step: 0.01 }}
                                                    value={lineItem.rejectedQty}
                                                    onChange={(e) => handleLineItemChange(index, "rejectedQty", Number(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    inputProps={{ min: 0, step: 0.01 }}
                                                    value={lineItem.damagedQty}
                                                    onChange={(e) => handleLineItemChange(index, "damagedQty", Number(e.target.value))}
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
                                                    value={lineItem.reason}
                                                    onChange={(e) => handleLineItemChange(index, "reason", e.target.value)}
                                                    placeholder="Reason"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    size="small"
                                                    value={lineItem.status || "PENDING"}
                                                    onChange={(e) => handleLineItemChange(index, "status", e.target.value)}
                                                    displayEmpty
                                                >
                                                    <MenuItem value="PENDING">Pending</MenuItem>
                                                    <MenuItem value="APPROVED">Approved</MenuItem>
                                                    <MenuItem value="REJECTED">Rejected</MenuItem>
                                                    <MenuItem value="DAMAGED">Damaged</MenuItem>
                                                    <MenuItem value="COMPLETED">Completed</MenuItem>
                                                </Select>
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

export default SalesReturnComp;