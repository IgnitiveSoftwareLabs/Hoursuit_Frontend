import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
import { useGetWorkCategoriesQuery } from "../RTK/services/workCategoryApi";
import { useFetchWarehousesQuery } from "../RTK/services/warehouseApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
// import { useGetCustomersQuery } from "../RTK/services/customerApi";
import { useFetchGodownsQuery } from "../RTK/services/godownApi";
import { useGetVendorsQuery } from "../RTK/services/vendorApi";
import { useFetchStacksQuery } from "../RTK/services/stackApi";
import { useGetHSNSACsQuery } from "../RTK/services/hsnSacApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import { usePermissions } from "../Hooks/usePermissions";
import { useGetUOMsQuery } from "../RTK/services/uomApi";
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
import {
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation
} from "../RTK/services/purchaseApi";
import DynamicTable from './Tables';


const PurchaseOrderComp: React.FC = () => {
  const navigate = useNavigate();
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const [activeSection, setActiveSection] = useState<"lineItems" | "transport">("lineItems");
  const [isEdit, setIsEdit] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedChallan, setSelectedChallan] = useState<any>(null);

  const [updatePurchaseOrder] = useUpdatePurchaseOrderMutation();
  const [deletePurchaseOrder] = useDeletePurchaseOrderMutation();

  // Queries
  const { data: purchaseOrdersData,
    error,
    isLoading,
    refetch,
  } = useGetPurchaseOrdersQuery({ page: 1, limit: 10 });
  const { data: warehousesData } = useFetchWarehousesQuery({ page: 1, limit: 100 });
  const { data: transportationModeData } = useGetTransportationModesQuery();
  // const { data: customersData } = useGetCustomersQuery({ option: true });
  const { data: vendorsData } = useGetVendorsQuery({ page: 1, option: true });
  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 100 });
  const { data: workCategoriesData } = useGetWorkCategoriesQuery();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();
  const { data: hsnsacData } = useGetHSNSACsQuery();
  const { data: citiesData } = useGetCitiesQuery();
  const { data: uomsData } = useGetUOMsQuery();

  // console.log(customersData, uomsData, subsidiariesData, citiesData, warehousesData, itemsData);

  const transportationModes = Array.isArray(transportationModeData) ? transportationModeData : transportationModeData?.result ?? [];
  const workCategories = Array.isArray(workCategoriesData) ? workCategoriesData : workCategoriesData?.result ?? [];
  const subsidiaries = Array.isArray(subsidiariesData) ? subsidiariesData : subsidiariesData?.result ?? [];
  const warehouses = Array.isArray(warehousesData) ? warehousesData : warehousesData?.result ?? [];
  // const customers = Array.isArray(customersData) ? customersData : customersData?.result ?? [];
  const vendors = Array.isArray(vendorsData) ? vendorsData : vendorsData?.result ?? [];
  const hsnsacs = Array.isArray(hsnsacData) ? hsnsacData : hsnsacData?.result ?? [];
  const cities = Array.isArray(citiesData) ? citiesData : citiesData?.result ?? [];
  const items = Array.isArray(itemsData) ? itemsData : itemsData?.result ?? [];
  const uoms = Array.isArray(uomsData) ? uomsData : uomsData?.result ?? [];
  const purchaseOrders = Array.isArray(purchaseOrdersData) ? purchaseOrdersData : purchaseOrdersData?.result ?? [];

  // console.log("Transportation Modes:", transportationModes);

  // Mutations
  const [createPurchaseOrder] = useCreatePurchaseOrderMutation();

  const formik = useFormik({
    initialValues: {
      header: {
        purchaseNo: "",
        shipped_from: "",
        shipped_to: "",
        work_order_no: "",
        transporterName: "",
        driverName: "",
        driverPhone: "",
        vehicleNumber: "",
        customer_id: "",
        vendor_id: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        deliveryDate: "",
        city_id: "",
        transportation_mode_id: "",
        warehouse_id: "",
        godown_id: "",
        stack_id: "",
        subsidiary_id: "",
        user_id: "",
        remarks: "",
      },
      lineItems: [
        {
          item_id: "",
          hsn_sac_id: "",
          work_category_id: "",
          work_order_no: "",
          lot_number: "",
          use_rate_calculation: true,
          quantity: 1,
          uom_id: "",
          rate: 0,
          amount: 0,
          tax_rate: 0,
          tax_amount: 0,
          line_total: 0,
          india_tax_nature: "Good",
          remarks: "",
          user_id: "",
          isActive: true,
        }
      ],
      subtotal: 0,
      totalAmount: 0,
    },
    validationSchema: Yup.object({
      header: Yup.object({
        purchaseNo: Yup.string().required("Purchase Number is required"),
        purchaseDate: Yup.date().required("Purchase Date is required"),
        // customer_id: Yup.string().required("Customer is required"),
        vendor_id: Yup.string().required("Vendor is required"),
        deliveryDate: Yup.date().required("Delivery Date is required"),
        city_id: Yup.string().required("City is required"),
        warehouse_id: Yup.string().required("Warehouse is required"),
        subsidiary_id: Yup.string().required("Subsidiary is required"),
      }),
      lineItems: Yup.array().of(
        Yup.object({
          item_id: Yup.string().required("Item is required"),
          quantity: Yup.number().min(0.01, "Qty must be > 0").required("Quantity is required"),
          uom_id: Yup.string().required("UOM is required"),
          rate: Yup.number().min(0, "Rate must be >= 0").required("Rate is required"),
          tax_rate: Yup.number().min(0, "Tax must be >= 0"),
        })
      ).min(1, "At least one line item is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          header: values.header,
          lineItems: values.lineItems,
        };

        if (isEdit && editId) {
          if (!canUpdate("purchase_order")) {
            toast.error("No permission to update");
            return;
          }
          const res = await updatePurchaseOrder({ id: editId, payload }).unwrap();
          toast.success(res?.message || "Purchase Order updated successfully.");
        } else {
          await createPurchaseOrder(payload).unwrap();
          toast.success("Purchase Order created successfully");
        }
        setOpen(false);
        setIsEdit(false);
        setEditId(null);
        formik.resetForm();
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong");
      }
    },
  });

  // Logic to fetch godowns and stacks based on Formik values
  const selectedWarehouseId = formik.values.header.warehouse_id;
  const { data: godownsData } = useFetchGodownsQuery(
    { warehouseId: Number(selectedWarehouseId), page: 1, limit: 50 },
    { skip: !selectedWarehouseId }
  );

  const selectedGodownId = formik.values.header.godown_id;
  const { data: stacksData } = useFetchStacksQuery(
    { godownId: Number(selectedGodownId), page: 1, limit: 50 },
    { skip: !selectedGodownId }
  );

  const godowns = Array.isArray(godownsData) ? godownsData : godownsData?.result ?? [];
  const stacks = Array.isArray(stacksData) ? stacksData : stacksData?.result ?? [];

  // Calculation logic
  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;

    formik.values.lineItems.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const taxRate = Number(item.tax_rate) || 0;

      const lineSubtotal = qty * rate;
      const lineTax = lineSubtotal * (taxRate / 100);

      subtotal += lineSubtotal;
      taxAmount += lineTax;
    });

    const totalAmount = subtotal + taxAmount;

    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    };
  };

  const totals = calculateTotals();

  useEffect(() => {
    const workOrderNo = formik.values.header.work_order_no;
    const updatedLineItems = formik.values.lineItems.map((lineItem) => ({
      ...lineItem,
      work_order_no: workOrderNo,
    }));
    formik.setFieldValue("lineItems", updatedLineItems);
  }, [formik.values.header.work_order_no]);

  const fillLineItemFromSelectedItem = (index: number, itemId: any) => {
    const selectedItem = items.find((i: any) => String(i.id) === String(itemId));
    const lineItems = [...formik.values.lineItems];
    const lineItem = { ...lineItems[index], item_id: itemId };

    if (selectedItem) {
      lineItem.hsn_sac_id = selectedItem.hsn_sac_code_id ?? selectedItem.hsn_sac_id ?? "";
      lineItem.work_category_id = selectedItem.work_category_id ?? selectedItem.item_category_id ?? "";
      lineItem.uom_id = selectedItem.uom_id ?? "";
    } else {
      lineItem.hsn_sac_id = "";
      lineItem.work_category_id = "";
      lineItem.uom_id = "";
    }

    lineItem.work_order_no = formik.values.header.work_order_no;

    const qty = Number(lineItem.quantity) || 0;
    const rate = Number(lineItem.rate) || 0;
    const taxRate = Number(lineItem.tax_rate) || 0;
    const lineSubtotal = qty * rate;
    const taxAmount = lineSubtotal * (taxRate / 100);
    const lineTotal = lineSubtotal + taxAmount;

    lineItem.tax_amount = Number(taxAmount.toFixed(2));
    lineItem.line_total = Number(lineTotal.toFixed(2));
    lineItem.user_id = formik.values.header.user_id;

    lineItems[index] = lineItem;
    formik.setFieldValue("lineItems", lineItems);
  };

  const updateLineItemField = (index: number, field: string, value: any) => {
    const lineItems = [...formik.values.lineItems];
    const lineItem = { ...lineItems[index], [field]: value };
    const qty = Number(lineItem.quantity) || 0;
    const rate = Number(lineItem.rate) || 0;
    const taxRate = Number(lineItem.tax_rate) || 0;

    const lineSubtotal = qty * rate;
    const taxAmount = lineSubtotal * (taxRate / 100);
    const lineTotal = lineSubtotal + taxAmount;

    lineItem.tax_amount = Number(taxAmount.toFixed(2));
    lineItem.line_total = Number(lineTotal.toFixed(2));
    lineItem.user_id = formik.values.header.user_id;

    lineItems[index] = lineItem;
    formik.setFieldValue("lineItems", lineItems);
  };

  const handleAddLineItem = () => {
    formik.setFieldValue("lineItems", [
      ...formik.values.lineItems,
      {
        item_id: "",
        hsn_sac_id: "",
        work_category_id: "",
        work_order_no: "",
        lot_number: "",
        use_rate_calculation: true,
        quantity: 1,
        uom_id: "",
        rate: 0,
        amount: 0,
        tax_rate: 0,
        tax_amount: 0,
        line_total: 0,
        india_tax_nature: "Good",
        remarks: "",
        user_id: formik.values.header.user_id,
        isActive: true,
      }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    const newLineItems = [...formik.values.lineItems];
    newLineItems.splice(index, 1);
    formik.setFieldValue("lineItems", newLineItems);
  };

  const handleEdit = (id: number) => {
    if (!canUpdate("purchase_order")) {
      toast.error("No permission to edit");
      return;
    }
    const item = purchaseOrders.find((x: any) => String(x.id) === String(id));
    if (item) {
      const header = item.header ?? item;
      const lineSource = item.lineItems ?? item.line_items ?? item.purchaseOrderLines ?? [];
      formik.setValues({
        header: {
          purchaseNo: header.purchaseNo ?? header.purchase_no ?? "",
          shipped_from: header.shipped_from ?? header.shippedFrom ?? "",
          shipped_to: header.shipped_to ?? header.shippedTo ?? "",
          work_order_no: header.work_order_no ?? header.workOrderNo ?? "",
          transporterName: header.transporterName ?? header.transporter_name ?? "",
          driverName: header.driverName ?? header.driver_name ?? "",
          driverPhone: header.driverPhone ?? header.driver_phone ?? "",
          vehicleNumber: header.vehicleNumber ?? header.vehicle_number ?? "",
          customer_id: header.customer_id ?? header.customerId ?? "",
          vendor_id: header.vendor_id ?? header.vendorId ?? "",
          purchaseDate: header.purchaseDate ?? header.purchase_date ?? new Date().toISOString().split("T")[0],
          deliveryDate: header.deliveryDate ?? header.delivery_date ?? "",
          city_id: header.city_id ?? header.cityId ?? "",
          transportation_mode_id: header.transportation_mode_id ?? header.transportationModeId ?? "",
          warehouse_id: header.warehouse_id ?? header.warehouseId ?? "",
          godown_id: header.godown_id ?? header.godownId ?? "",
          stack_id: header.stack_id ?? header.stackId ?? "",
          subsidiary_id: header.subsidiary_id ?? header.subsidiaryId ?? "",
          user_id: header.user_id ?? header.userId ?? "",
          remarks: header.remarks ?? "",
        },
        lineItems: Array.isArray(lineSource)
          ? lineSource.map((line: any) => ({
              item_id: line.item_id ?? line.itemId ?? "",
              hsn_sac_id: line.hsn_sac_id ?? line.hsnSacId ?? "",
              work_category_id: line.work_category_id ?? line.workCategoryId ?? "",
              work_order_no: line.work_order_no ?? line.workOrderNo ?? "",
              lot_number: line.lot_number ?? line.lotNumber ?? "",
              use_rate_calculation: line.use_rate_calculation ?? line.useRateCalculation ?? true,
              quantity: Number(line.quantity ?? line.qty ?? 1),
              uom_id: line.uom_id ?? line.uomId ?? "",
              rate: Number(line.rate ?? line.unitPrice ?? 0),
              amount: Number(line.amount ?? 0),
              tax_rate: Number(line.tax_rate ?? line.taxRate ?? 0),
              tax_amount: Number(line.tax_amount ?? line.taxAmount ?? 0),
              line_total: Number(line.line_total ?? line.lineTotal ?? 0),
              india_tax_nature: line.india_tax_nature ?? line.indiaTaxNature ?? "Good",
              remarks: line.remarks ?? "",
              user_id: line.user_id ?? line.userId ?? "",
              isActive: line.isActive ?? true,
            }))
          : [
              {
                item_id: "",
                hsn_sac_id: "",
                work_category_id: "",
                work_order_no: "",
                lot_number: "",
                use_rate_calculation: true,
                quantity: 1,
                uom_id: "",
                rate: 0,
                amount: 0,
                tax_rate: 0,
                tax_amount: 0,
                line_total: 0,
                india_tax_nature: "Good",
                remarks: "",
                user_id: "",
                isActive: true,
              },
            ],
        subtotal: 0,
        totalAmount: 0,
      } as any);
      setEditId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  // Handle view
  const handleView = (challan: any) => {
    navigate(`/purchase-order/view/${challan.id}`);
    // handleMenuClose();
  };

  // Handle delete
  const handleDelete = (purchaseOrder: any) => {
    if (!canDelete("purchase_order")) {
      toast.error("You do not have permission to delete this purchase order");
      return;
    }
    setSelectedChallan(purchaseOrder);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    const targetId = selectedChallan?.id ?? deleteId;
    if (!targetId) {
      setDeleteDialogOpen(false);
      setSelectedChallan(null);
      return;
    }

    if (!canDelete("purchase_order")) {
      toast.error("You do not have permission to delete this purchase order");
      setDeleteDialogOpen(false);
      setSelectedChallan(null);
      return;
    }

    try {
      await deletePurchaseOrder(targetId).unwrap();
      toast.success("Purchase Order deleted successfully");
      refetch();
    } catch (error: any) {
      console.error("Error deleting purchase order:", error);
      toast.error(error?.data?.message || "Failed to delete Purchase Order");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedChallan(null);
      setDeleteId(null);
    }
  };

  const columns = [
    { key: "purchaseNo", label: "Purchase No" },
    { key: "vendor.vendor_name", label: "Vendor", render: (row: any) => row.vendor?.vendor_name || "N/A" },
    { key: "purchaseDate", label: "Purchase Date", render: (row: any) => new Date(row.purchaseDate).toLocaleDateString() },
    { key: "deliveryDate", label: "Delivery Date", render: (row: any) => row.deliveryDate ? new Date(row.deliveryDate).toLocaleDateString() : "" },
    {
      key: "line_total", label: "Total Amount", render: (row: any) =>
        row.purchaseOrderLines.reduce(
          (sum: number, line: any) => sum + Number(line.line_total),
          0
        ).toFixed(2)
    },
    {
      key: "status", label: "Status", render: (row: any) => {
        let bg = "#f5f5f5";
        let color = "#616161";
        const status = row.status || "DRAFT";
        if (status === "APPROVED") { bg = "#e3f2fd"; color = "#1976d2"; }
        else if (status === "PARTIALLY_RECEIVED") { bg = "#fff8e1"; color = "#f57f17"; }
        else if (status === "COMPLETED") { bg = "#e8f5e9"; color = "#2e7d32"; }
        else if (status === "CANCELLED") { bg = "#ffebee"; color = "#c62828"; }

        return (
          <Box
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: bg,
              color: color,
              fontSize: "0.75rem",
              fontWeight: "bold",
              textAlign: "center"
            }}
          >
            {status}
          </Box>
        );
      }
    },
  ];

  if (!canRead("purchase_order")) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view Purchase Orders.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h3">Purchase Orders</Typography>
          <NavbarBreadcrumbs />
        </Box>

        {canCreate("purchase_order") && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setOpen(true);
              setIsEdit(false);
              setEditId(null);
              formik.resetForm();
            }}
          >
            Add Purchase Order
          </Button>
        )}
      </Box>

      <DynamicTable
        columns={columns}
        data={purchaseOrders}
        getRowId={(row: any) => row.id}
        onEdit={
          canUpdate("purchase_order") ? (id) => handleEdit(Number(id)) : undefined
        }
        onDelete={
          canDelete("purchase_order")
            ? (id) => {
              setDeleteId(Number(id));
              setDeleteDialogOpen(true);
            }
            : undefined
        }
      />

      <Dialog open={isDeleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this purchase order?</Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen} onClose={() => setOpen(false)} fullWidth maxWidth="xl">
        <DialogTitle>{isEdit ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
            {/* <Typography variant="h6" gutterBottom color="primary">Header Information</Typography> */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={formik.touched.header?.purchaseNo && !!formik.errors.header?.purchaseNo}>
                  <FormLabel>Purchase Number</FormLabel>
                  <TextField
                    size="small"
                    name="header.purchaseNo"
                    placeholder="Enter purchase number"
                    value={formik.values.header.purchaseNo}
                    onChange={formik.handleChange}
                    error={formik.touched.header?.purchaseNo && !!formik.errors.header?.purchaseNo}
                    helperText={formik.touched.header?.purchaseNo && (formik.errors.header as any)?.purchaseNo}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={formik.touched.header?.purchaseDate && !!formik.errors.header?.purchaseDate}>
                  <FormLabel>Purchase Date</FormLabel>
                  <TextField
                    size="small"
                    type="date"
                    name="header.purchaseDate"
                    value={formik.values.header.purchaseDate}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={formik.touched.header?.deliveryDate && !!formik.errors.header?.deliveryDate}>
                  <FormLabel>Delivery Date</FormLabel>
                  <TextField
                    size="small"
                    type="date"
                    name="header.deliveryDate"
                    value={formik.values.header.deliveryDate}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Work Order No</FormLabel>
                  <TextField
                    size="small"
                    name="header.work_order_no"
                    placeholder="Enter work order no"
                    value={formik.values.header.work_order_no}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Shipped From</FormLabel>
                  <TextField
                    size="small"
                    name="header.shipped_from"
                    placeholder="Shipped from"
                    value={formik.values.header.shipped_from}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Shipped To</FormLabel>
                  <TextField
                    size="small"
                    name="header.shipped_to"
                    placeholder="Shipped to"
                    value={formik.values.header.shipped_to}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={formik.touched.header?.vendor_id && !!formik.errors.header?.vendor_id}>
                  <FormLabel>Vendor</FormLabel>
                  <Select
                    size="small"
                    name="header.vendor_id"
                    value={formik.values.header.vendor_id}
                    onChange={formik.handleChange}
                    displayEmpty
                  >
                    <MenuItem value="">Select Vendor</MenuItem>
                    {vendors?.map((v: any) => (
                      <MenuItem key={v.id} value={v.id}>{v.vendor_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={formik.touched.header?.subsidiary_id && !!formik.errors.header?.subsidiary_id}>
                  <FormLabel>Subsidiary</FormLabel>
                  <Select
                    size="small"
                    name="header.subsidiary_id"
                    value={formik.values.header.subsidiary_id}
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
                <FormControl fullWidth error={formik.touched.header?.city_id && !!formik.errors.header?.city_id}>
                  <FormLabel>Location</FormLabel>
                  <Select
                    size="small"
                    name="header.city_id"
                    value={formik.values.header.city_id}
                    onChange={formik.handleChange}
                    displayEmpty
                  >
                    <MenuItem value="">Select Location</MenuItem>
                    {cities.map((c: any) => (
                      <MenuItem key={c.id} value={c.id}>{c.city_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={formik.touched.header?.warehouse_id && !!formik.errors.header?.warehouse_id}>
                  <FormLabel>Warehouse</FormLabel>
                  <Select
                    size="small"
                    name="header.warehouse_id"
                    value={formik.values.header.warehouse_id}
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
                    name="header.godown_id"
                    value={formik.values.header.godown_id}
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
                    name="header.stack_id"
                    value={formik.values.header.stack_id}
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

              <Grid size={12} mt={2}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    size="small"
                    variant={activeSection === 'lineItems' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('lineItems')}
                  >
                    Line Items
                  </Button>
                  <Button
                    size="small"
                    variant={activeSection === 'transport' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('transport')}
                  >
                    Transport Details
                  </Button>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {activeSection === 'transport' ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} my={2}>
                  <Typography variant="h6" color="primary">Transport Details</Typography>
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%', mb: 2 }}>
                  <Table size="small" sx={{ minWidth: 1200 }}>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell width="20%">Transportation Mode</TableCell>
                        <TableCell width="20%">Transporter Name</TableCell>
                        <TableCell width="20%">Driver Name</TableCell>
                        <TableCell width="20%">Driver Phone</TableCell>
                        <TableCell width="20%">Vehicle Number</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <FormControl fullWidth>
                            <Select
                              size="small"
                              name="header.transportation_mode_id"
                              value={formik.values.header.transportation_mode_id}
                              onChange={formik.handleChange}
                              displayEmpty
                            >
                              <MenuItem value="">Select Transportation Mode</MenuItem>
                              {transportationModes?.map((t: any) => (
                                <MenuItem key={t.id} value={t.id}>{t.mode_name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            name="header.transporterName"
                            value={formik.values.header.transporterName}
                            onChange={formik.handleChange}
                            placeholder="Transporter Name"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            name="header.driverName"
                            value={formik.values.header.driverName}
                            onChange={formik.handleChange}
                            placeholder="Driver Name"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            name="header.driverPhone"
                            value={formik.values.header.driverPhone}
                            onChange={formik.handleChange}
                            placeholder="Driver Phone"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            name="header.vehicleNumber"
                            value={formik.values.header.vehicleNumber}
                            onChange={formik.handleChange}
                            placeholder="Vehicle Number"
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" color="primary">Line Items</Typography>
                  <Button size="small" variant="outlined" startIcon={<Add />} onClick={handleAddLineItem}>
                    Add Line Item
                  </Button>
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%' }}>
                  <Table size="small" sx={{ minWidth: 2000 }}>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell width="10%">Item</TableCell>
                        <TableCell width="10%">HSN/SAC</TableCell>
                        <TableCell width="10%">Work Category</TableCell>
                        <TableCell width="8%">Lot No</TableCell>
                        <TableCell width="8%">Qty</TableCell>
                        <TableCell width="8%">UOM</TableCell>
                        <TableCell width="8%">Rate</TableCell>
                        <TableCell width="10%">India Tax Nature</TableCell>
                        <TableCell width="8%">Tax %</TableCell>
                        <TableCell width="9%">Tax Amt</TableCell>
                        <TableCell width="10%">Line Total</TableCell>
                        <TableCell width="5%">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formik.values.lineItems.map((item, index) => {
                        const qty = Number(item.quantity) || 0;
                        const rate = Number(item.rate) || 0;
                        const taxRate = Number(item.tax_rate) || 0;
                        const lineSubtotal = qty * rate;
                        const taxAmount = lineSubtotal * (taxRate / 100);
                        const lineTotal = lineSubtotal + taxAmount;
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Select
                                fullWidth
                                size="small"
                                name={`lineItems.${index}.item_id`}
                                value={item.item_id}
                                onChange={(e) => fillLineItemFromSelectedItem(index, e.target.value)}
                              >
                                <MenuItem value="">Select Item</MenuItem>
                                {items?.map((i: any) => (
                                  <MenuItem key={i.id} value={i.id}>{i.item_name}</MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                fullWidth
                                size="small"
                                name={`lineItems.${index}.hsn_sac_id`}
                                value={item.hsn_sac_id}
                                onChange={(e) => updateLineItemField(index, 'hsn_sac_id', e.target.value)}
                                displayEmpty
                              >
                                <MenuItem value="">Select HSN/SAC</MenuItem>
                                {hsnsacs.map((hsn: any) => (
                                  <MenuItem key={hsn.id} value={hsn.id}>{hsn.code}</MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                fullWidth
                                size="small"
                                name={`lineItems.${index}.work_category_id`}
                                value={item.work_category_id}
                                onChange={(e) => updateLineItemField(index, 'work_category_id', e.target.value)}
                                displayEmpty
                              >
                                <MenuItem value="">Select Category</MenuItem>
                                {workCategories.map((cat: any) => (
                                  <MenuItem key={cat.id} value={cat.id}>{cat.work_category_name}</MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                name={`lineItems.${index}.lot_number`}
                                value={item.lot_number}
                                onChange={(e) => updateLineItemField(index, 'lot_number', e.target.value)}
                                placeholder="Lot"
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                inputProps={{ min: 0, step: 0.01 }}
                                value={item.quantity}
                                onChange={(e) => updateLineItemField(index, 'quantity', Number(e.target.value))}
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                fullWidth
                                size="small"
                                name={`lineItems.${index}.uom_id`}
                                value={item.uom_id}
                                onChange={(e) => updateLineItemField(index, 'uom_id', e.target.value)}
                                displayEmpty
                              >
                                <MenuItem value="">Select UOM</MenuItem>
                                {uoms.map((u: any) => (
                                  <MenuItem key={u.id} value={u.id}>{u.uom_name}</MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ min: 0, step: 0.01 }}
                                value={item.rate}
                                onChange={(e) => updateLineItemField(index, 'rate', Number(e.target.value))}
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                fullWidth
                                size="small"
                                name={`lineItems.${index}.india_tax_nature`}
                                value={item.india_tax_nature}
                                onChange={(e) => updateLineItemField(index, 'india_tax_nature', e.target.value)}
                                displayEmpty
                              >
                                <MenuItem value="Good">Good</MenuItem>
                                <MenuItem value="Services">Services</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ min: 0, max: 100, step: 0.01 }}
                                value={item.tax_rate}
                                onChange={(e) => updateLineItemField(index, 'tax_rate', Number(e.target.value))}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={item.tax_amount?.toFixed?.(2) ?? taxAmount.toFixed(2)}
                                InputProps={{ readOnly: true }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={item.line_total?.toFixed?.(2) ?? lineTotal.toFixed(2)}
                                InputProps={{ readOnly: true }}
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
                        <Typography variant="body2">Tax:</Typography>
                        <Typography variant="body2">+ ₹{totals.taxAmount}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" color="primary">Total:</Typography>
                        <Typography variant="h6" color="primary">₹{totals.totalAmount}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}

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

export default PurchaseOrderComp;