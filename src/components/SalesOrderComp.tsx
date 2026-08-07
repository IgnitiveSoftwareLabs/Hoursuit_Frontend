import React, { useState } from "react";

import { Add, RemoveCircleOutline } from "@mui/icons-material";
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
import Grid from "@mui/material/Grid";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useGetTransportationModesQuery } from "../RTK/services/transportationModeApi";
import { useFetchWarehousesQuery } from "../RTK/services/warehouseApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetCustomersQuery } from "../RTK/services/customerApi";
import { useFetchGodownsQuery } from "../RTK/services/godownApi";
import { useFetchStacksQuery } from "../RTK/services/stackApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import { usePermissions } from "../Hooks/usePermissions";
import { useGetUOMsQuery } from "../RTK/services/uomApi";
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
import DynamicTable from './Tables';
import {
  useGetSalesOrdersQuery,
  useCreateSalesOrderMutation,
} from "../RTK/services/salesApi";


const SalesOrderComp: React.FC = () => {
  const { canRead, canCreate } = usePermissions();
  const [isEdit, setIsEdit] = useState(false);
  const [isOpen, setOpen] = useState(false);

  // Queries
  const { data: warehousesData } = useFetchWarehousesQuery({ page: 1, limit: 100 });
  const { data: salesOrdersData } = useGetSalesOrdersQuery({ page: 1, limit: 10 });
  const { data: transportationModeData } = useGetTransportationModesQuery();
  const { data: customersData } = useGetCustomersQuery({ option: true });
  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 100 });
  const { data: subsidiariesData } = useGetSubsidiariesQuery();
  const { data: citiesData } = useGetCitiesQuery();
  const { data: uomsData } = useGetUOMsQuery();

  // console.log(customersData, uomsData, subsidiariesData, citiesData, warehousesData, itemsData);

  const transportationModes = Array.isArray(transportationModeData) ? transportationModeData : transportationModeData?.result ?? [];
  const subsidiaries = Array.isArray(subsidiariesData) ? subsidiariesData : subsidiariesData?.result ?? [];
  const warehouses = Array.isArray(warehousesData) ? warehousesData : warehousesData?.result ?? [];
  const customers = Array.isArray(customersData) ? customersData : customersData?.result ?? [];
  const cities = Array.isArray(citiesData) ? citiesData : citiesData?.result ?? [];
  const items = Array.isArray(itemsData) ? itemsData : itemsData?.result ?? [];
  const uoms = Array.isArray(uomsData) ? uomsData : uomsData?.result ?? [];

  // console.log("Transportation Modes:", transportationModes);

  // Mutations
  const [createSalesOrder] = useCreateSalesOrderMutation();

  const formik = useFormik({
    initialValues: {
      header: {
        orderNumber: "",
        orderDate: new Date().toISOString().split("T")[0],
        expectedDeliveryDate: "",
        customerId: "",
        uomId: "",
        transportationModeId: "",
        warehouseId: "",
        godownId: "",
        stackId: "",
        subsidiaryId: "",
        cityId: "",
        customerPO: "",
        referenceNumber: "",
        status: "DRAFT",
        shippingAmount: 0,
        remarks: "",
        shippingAddress: "",
        billingAddress: "",
      },
      lineItems: [
        {
          itemId: "",
          orderedQty: 1,
          dispatchedQty: 0,
          pendingQty: 1,
          unitPrice: 0,
          discountPercent: 0,
          discountAmount: 0,
          taxPercent: 0,
          taxAmount: 0,
          lineTotal: 0,
          remarks: "",
        }
      ],
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
    },
    validationSchema: Yup.object({
      header: Yup.object({
        orderNumber: Yup.string().required("Order Number is required"),
        orderDate: Yup.date().required("Order Date is required"),
        customerId: Yup.string().required("Customer is required"),
        uomId: Yup.string().required("UOM is required"),
        warehouseId: Yup.string().required("Warehouse is required"),
        subsidiaryId: Yup.string().required("Subsidiary is required"),
        cityId: Yup.string().required("City is required"),
        transportationModeId: Yup.string().required("Transportation Mode is required"),
      }),
      lineItems: Yup.array().of(
        Yup.object({
          itemId: Yup.string().required("Item is required"),
          orderedQty: Yup.number().min(1, "Qty must be >= 1").required("Qty is required"),
          dispatchedQty: Yup.number().min(0, "Dispatched qty must be >= 0").required("Dispatched qty is required"),
          unitPrice: Yup.number().min(0, "Price must be >= 0").required("Price is required"),
          discountPercent: Yup.number().min(0, "Discount must be >= 0"),
          taxPercent: Yup.number().min(0, "Tax must be >= 0"),
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
          toast.success("Sales Order update coming soon");
        } else {
          await createSalesOrder(payload).unwrap();
          toast.success("Sales Order created successfully");
        }
        setOpen(false);
        formik.resetForm();
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong");
      }
    },
  });

  // Logic to fetch godowns and stacks based on Formik values
  const selectedWarehouseId = formik.values.header.warehouseId;
  const { data: godownsData } = useFetchGodownsQuery(
    { warehouseId: Number(selectedWarehouseId), page: 1, limit: 50 },
    { skip: !selectedWarehouseId }
  );

  const selectedGodownId = formik.values.header.godownId;
  const { data: stacksData } = useFetchStacksQuery(
    { godownId: Number(selectedGodownId), page: 1, limit: 50 },
    { skip: !selectedGodownId }
  );

  const godowns = Array.isArray(godownsData) ? godownsData : godownsData?.result ?? [];
  const stacks = Array.isArray(stacksData) ? stacksData : stacksData?.result ?? [];

  // console.log("Godowns:", godowns);

  // Calculation logic
  const calculateTotals = () => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    formik.values.lineItems.forEach((item) => {
      const qty = Number(item.orderedQty) || 0;
      const price = Number(item.unitPrice) || 0;
      const disc = Number(item.discountPercent) || 0;
      const tax = Number(item.taxPercent) || 0;

      const lineSubtotal = qty * price;
      const lineDiscount = lineSubtotal * (disc / 100);
      const lineTax = (lineSubtotal - lineDiscount) * (tax / 100);

      subtotal += lineSubtotal;
      discountAmount += lineDiscount;
      taxAmount += lineTax;
    });

    const totalAmount = subtotal - discountAmount + taxAmount + (Number(formik.values.header.shippingAmount) || 0);

    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    };
  };

  const totals = calculateTotals();

  const updateLineItemField = (index: number, field: string, value: any) => {
    const lineItems = [...formik.values.lineItems];
    const lineItem = { ...lineItems[index], [field]: value };
    const qty = Number(lineItem.orderedQty) || 0;
    const dispatchedQty = Number(lineItem.dispatchedQty) || 0;
    const unitPrice = Number(lineItem.unitPrice) || 0;
    const discountPercent = Number(lineItem.discountPercent) || 0;
    const taxPercent = Number(lineItem.taxPercent) || 0;

    const subtotal = qty * unitPrice;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxPercent / 100);
    const lineTotal = taxableAmount + taxAmount;

    lineItem.discountAmount = Number(discountAmount.toFixed(2));
    lineItem.taxAmount = Number(taxAmount.toFixed(2));
    lineItem.lineTotal = Number(lineTotal.toFixed(2));
    lineItem.pendingQty = Number((qty - dispatchedQty).toFixed(2));

    lineItems[index] = lineItem;
    formik.setFieldValue("lineItems", lineItems);
  };

  const handleAddLineItem = () => {
    formik.setFieldValue("lineItems", [
      ...formik.values.lineItems,
      {
        itemId: "",
        orderedQty: 1,
        dispatchedQty: 0,
        pendingQty: 1,
        unitPrice: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: 0,
        taxAmount: 0,
        lineTotal: 0,
        remarks: "",
      }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    const newLineItems = [...formik.values.lineItems];
    newLineItems.splice(index, 1);
    formik.setFieldValue("lineItems", newLineItems);
  };

  const columns = [
    { key: "orderNumber", label: "Order Number" },
    { key: "customer.customer_name", label: "Customer", render: (row: any) => row.customer?.customer_name || "N/A" },
    { key: "orderDate", label: "Order Date", render: (row: any) => new Date(row.orderDate).toLocaleDateString() },
    {
      key: "status", label: "Status", render: (row: any) => (
        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor:
              row.status === "DRAFT" ? "#f5f5f5" :
                row.status === "CONFIRMED" ? "#e3f2fd" :
                  row.status === "COMPLETED" ? "#e8f5e9" : "#fff3e0",
            color:
              row.status === "DRAFT" ? "#616161" :
                row.status === "CONFIRMED" ? "#1976d2" :
                  row.status === "COMPLETED" ? "#2e7d32" : "#e65100",
            fontSize: "0.75rem",
            fontWeight: "bold",
            textAlign: "center"
          }}
        >
          {row.status}
        </Box>
      )
    },
    { key: "totalAmount", label: "Total Amount", render: (row: any) => `₹${Number(row.totalAmount).toLocaleString()}` },
  ];

  if (!canRead("sales_order")) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view Sales Orders.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h3">Sales Orders</Typography>
          <NavbarBreadcrumbs />
        </Box>

        {canCreate("sales_order") && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setOpen(true);
              setIsEdit(false);
              formik.resetForm();
            }}
          >
            Add Sales Order
          </Button>
        )}
      </Box>

      <DynamicTable
        columns={columns}
        data={salesOrdersData?.result || []}
        getRowId={(row: any) => row.id}
      />

      <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>
          {isEdit ? "Edit Sales Order" : "New Sales Order"}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={formik.handleSubmit}>
            {/* <Typography variant="h6" gutterBottom color="primary">Header Information</Typography> */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={formik.touched.header?.orderNumber && !!formik.errors.header?.orderNumber}>
                  <FormLabel>Order Number</FormLabel>
                  <TextField
                    size="small"
                    name="header.orderNumber"
                    placeholder="Enter order number"
                    value={formik.values.header.orderNumber}
                    onChange={formik.handleChange}
                    error={formik.touched.header?.orderNumber && !!formik.errors.header?.orderNumber}
                    helperText={formik.touched.header?.orderNumber && (formik.errors.header as any)?.orderNumber}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={formik.touched.header?.orderDate && !!formik.errors.header?.orderDate}>
                  <FormLabel>Order Date</FormLabel>
                  <TextField
                    size="small"
                    type="date"
                    name="header.orderDate"
                    value={formik.values.header.orderDate}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={formik.touched.header?.expectedDeliveryDate && !!formik.errors.header?.expectedDeliveryDate}>
                  <FormLabel>Expected Delivery</FormLabel>
                  <TextField
                    size="small"
                    type="date"
                    name="header.expectedDeliveryDate"
                    value={formik.values.header.expectedDeliveryDate}
                    onChange={formik.handleChange}
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
                    displayEmpty
                  >
                    <MenuItem value="">Select Customer</MenuItem>
                    {customers.map((c: any) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
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
                    displayEmpty
                  >
                    <MenuItem value="">Select City</MenuItem>
                    {cities.map((c: any) => (
                      <MenuItem key={c.id} value={c.id}>{c.city_name}</MenuItem>
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
                    displayEmpty
                  >
                    <MenuItem value="">Select Subsidiary</MenuItem>
                    {subsidiaries.map((s: any) => (
                      <MenuItem key={s.id} value={s.id}>{s.subsidiary_name}</MenuItem>
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
                    displayEmpty
                  >
                    <MenuItem value="">Select Warehouse</MenuItem>
                    {warehouses.map((w: any) => (
                      <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Godown</FormLabel>
                  <Select
                    size="small"
                    name="header.godownId"
                    value={formik.values.header.godownId}
                    onChange={formik.handleChange}
                    displayEmpty
                    disabled={!selectedWarehouseId}
                  >
                    <MenuItem value="">Select Godown</MenuItem>
                    {godowns.map((g: any) => (
                      <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Stack</FormLabel>
                  <Select
                    size="small"
                    name="header.stackId"
                    value={formik.values.header.stackId}
                    onChange={formik.handleChange}
                    displayEmpty
                    disabled={!selectedGodownId}
                  >
                    <MenuItem value="">Select Stack</MenuItem>
                    {stacks.map((s: any) => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Customer PO</FormLabel>
                  <TextField
                    size="small"
                    name="header.customerPO"
                    placeholder="Enter customer PO"
                    value={formik.values.header.customerPO}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Reference Number</FormLabel>
                  <TextField
                    size="small"
                    name="header.referenceNumber"
                    placeholder="Enter reference number"
                    value={formik.values.header.referenceNumber}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={formik.touched.header?.uomId && !!formik.errors.header?.uomId}>
                  <FormLabel>UOM</FormLabel>
                  <Select
                    size="small"
                    name="header.uomId"
                    value={formik.values.header.uomId}
                    onChange={formik.handleChange}
                    displayEmpty
                  >
                    <MenuItem value="">Select UOM</MenuItem>
                    {uoms.map((u: any) => (
                      <MenuItem key={u.id} value={u.id}>{u.uom_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Shipping Amount</FormLabel>
                  <TextField
                    size="small"
                    type="number"
                    name="header.shippingAmount"
                    value={formik.values.header.shippingAmount}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={formik.touched.header?.transportationModeId && !!formik.errors.header?.transportationModeId}>
                  <FormLabel>Transportation Mode</FormLabel>
                  <Select
                    size="small"
                    name="header.transportationModeId"
                    value={formik.values.header.transportationModeId}
                    onChange={formik.handleChange}
                    displayEmpty
                  >
                    <MenuItem value="">Select Transportation Mode</MenuItem>
                    {transportationModes?.map((t: any) => (
                      <MenuItem key={t.id} value={t.id}>{t.mode_name}</MenuItem>
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
                    <MenuItem value="DRAFT">DRAFT</MenuItem>
                    <MenuItem value="CONFIRMED">CONFIRMED</MenuItem>
                    <MenuItem value="PARTIAL_DISPATCHED">PARTIAL DISPATCHED</MenuItem>
                    <MenuItem value="DISPATCHED">DISPATCHED</MenuItem>
                    <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                    <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel>Shipping Address</FormLabel>
                  <TextField
                    size="small"
                    multiline
                    // rows={2}
                    name="header.shippingAddress"
                    placeholder="Enter shipping address"
                    value={formik.values.header.shippingAddress}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <FormLabel>Billing Address</FormLabel>
                  <TextField
                    size="small"
                    multiline
                    // rows={2}
                    name="header.billingAddress"
                    placeholder="Enter billing address"
                    value={formik.values.header.billingAddress}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>

              <Grid size={12}>
                <FormControl fullWidth>
                  <FormLabel>Remarks</FormLabel>
                  <TextField
                    size="small"
                    multiline
                    // rows={2}
                    name="header.remarks"
                    value={formik.values.header.remarks}
                    onChange={formik.handleChange}
                    placeholder="Enter any additional information..."
                  />
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" color="primary">Line Items</Typography>
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={handleAddLineItem}>
                Add Item
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 2000 }}>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell width="8%">Item</TableCell>
                    <TableCell width="7%">Qty</TableCell>
                    <TableCell width="7%">Dispatched</TableCell>
                    <TableCell width="7%">Pending</TableCell>
                    <TableCell width="7%">Unit Price</TableCell>
                    <TableCell width="7%">Disc%</TableCell>
                    <TableCell width="7%">Disc Amt</TableCell>
                    <TableCell width="7%">Tax%</TableCell>
                    <TableCell width="7%">Tax Amt</TableCell>
                    <TableCell width="7%">Total</TableCell>
                    <TableCell width="8%">Remarks</TableCell>
                    <TableCell width="5%">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formik.values.lineItems.map((item, index) => {
                    const qty = Number(item.orderedQty) || 0;
                    const dispatchedQty = Number(item.dispatchedQty) || 0;
                    const unitPrice = Number(item.unitPrice) || 0;
                    const discountPercent = Number(item.discountPercent) || 0;
                    const taxPercent = Number(item.taxPercent) || 0;
                    const lineSubtotal = qty * unitPrice;
                    const discountAmount = lineSubtotal * (discountPercent / 100);
                    const taxableAmount = lineSubtotal - discountAmount;
                    const taxAmount = taxableAmount * (taxPercent / 100);
                    const lineTotal = taxableAmount + taxAmount;
                    const pendingQty = Number(item.pendingQty) || Math.max(0, qty - dispatchedQty);
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            fullWidth
                            size="small"
                            name={`lineItems.${index}.itemId`}
                            value={item.itemId}
                            onChange={(e) => updateLineItemField(index, 'itemId', e.target.value)}
                          >
                            <MenuItem value="">Select Item</MenuItem>
                            {items?.map((i: any) => (
                              <MenuItem key={i.id} value={i.id}>{i.item_name}</MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0 }}
                            value={item.orderedQty}
                            onChange={(e) => updateLineItemField(index, 'orderedQty', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0 }}
                            value={item.dispatchedQty}
                            onChange={(e) => updateLineItemField(index, 'dispatchedQty', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={pendingQty}
                            InputProps={{ readOnly: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            value={item.unitPrice}
                            onChange={(e) => updateLineItemField(index, 'unitPrice', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                            value={item.discountPercent}
                            onChange={(e) => updateLineItemField(index, 'discountPercent', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.discountAmount?.toFixed?.(2) ?? discountAmount.toFixed(2)}
                            InputProps={{ readOnly: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                            value={item.taxPercent}
                            onChange={(e) => updateLineItemField(index, 'taxPercent', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.taxAmount?.toFixed?.(2) ?? taxAmount.toFixed(2)}
                            InputProps={{ readOnly: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.lineTotal?.toFixed?.(2) ?? lineTotal.toFixed(2)}
                            InputProps={{ readOnly: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            name={`lineItems.${index}.remarks`}
                            value={item.remarks}
                            onChange={(e) => updateLineItemField(index, 'remarks', e.target.value)}
                            placeholder="Line remarks"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => handleRemoveLineItem(index)}>
                            <RemoveCircleOutline />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Grid container spacing={2} sx={{ mt: 2, justifyContent: 'flex-end' }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">₹{totals.subtotal}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Discount:</Typography>
                    <Typography variant="body2" color="error">- ₹{totals.discountAmount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Tax:</Typography>
                    <Typography variant="body2">+ ₹{totals.taxAmount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Shipping:</Typography>
                    <Typography variant="body2">+ ₹{formik.values.header.shippingAmount || 0}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" color="primary">Total:</Typography>
                    <Typography variant="h6" color="primary">₹{totals.totalAmount}</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
              <Button onClick={() => setOpen(false)} variant="outlined">Cancel</Button>
              <Button type="submit" variant="contained">
                {isEdit ? "Update Order" : "Place Order"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SalesOrderComp;