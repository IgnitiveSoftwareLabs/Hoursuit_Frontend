import React, { useMemo, useState } from "react";

import {
  Add,
  Cancel,
  CheckCircleOutline,
  Delete,
  Edit,
  LocalShipping,
  RemoveCircleOutline,
  Visibility,
} from "@mui/icons-material";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import * as Yup from "yup";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { useGetVendorsQuery } from "../RTK/services/vendorApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import { useAppSelector } from "../Hooks/Reduxhook/hooks";
import { usePermissions } from "../Hooks/usePermissions";
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
import {
  useCreatePurchaseReturnMutation,
  useDeletePurchaseReturnMutation,
  useGetGRNsQuery,
  useGetPurchaseInvoicesQuery,
  useGetPurchaseOrdersQuery,
  useGetPurchaseReturnsQuery,
  useUpdatePurchaseReturnMutation,
  useUpdatePurchaseReturnStatusMutation,
} from "../RTK/services/purchaseApi";

const STATUS_OPTIONS = ["DRAFT", "APPROVED", "RETURNED", "CANCELLED"] as const;
type ReturnStatus = (typeof STATUS_OPTIONS)[number];

interface PurchaseReturnHeaderForm {
  returnNumber: string;
  vendorId: string;
  grnHeaderId: string;
  purchaseOrderHeaderId: string;
  purchaseInvoiceHeaderId: string;
  returnDate: string;
  status: ReturnStatus;
  reason: string;
  remarks: string;
  user_id: number | string;
}

interface PurchaseReturnLineForm {
  returnHeaderId: string;
  grnLineId: string;
  itemId: string;
  batchNo: string;
  returnQty: number;
  rejectedQty: number;
  damagedQty: number;
  unitPrice: number;
  reason: string;
  remarks: string;
}

const emptyLineItem = (): PurchaseReturnLineForm => ({
  returnHeaderId: "",
  grnLineId: "",
  itemId: "",
  batchNo: "",
  returnQty: 0,
  rejectedQty: 0,
  damagedQty: 0,
  unitPrice: 0,
  reason: "",
  remarks: "",
});

const PurchaseReturnComp: React.FC = () => {
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const userId = currentUser?.id ?? "";

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<any>(null);

  const { data: purchaseReturnsData } = useGetPurchaseReturnsQuery({ page: 1, limit: 20 });
  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery({ page: 1, limit: 50 });
  const { data: purchaseInvoicesData } = useGetPurchaseInvoicesQuery({ page: 1, limit: 50 });
  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 100 });
  const { data: grnsData } = useGetGRNsQuery({ page: 1, limit: 50 });
  const { data: vendorsData } = useGetVendorsQuery({ option: true });

  const [createPurchaseReturn] = useCreatePurchaseReturnMutation();
  const [updatePurchaseReturn] = useUpdatePurchaseReturnMutation();
  const [updatePurchaseReturnStatus] = useUpdatePurchaseReturnStatusMutation();
  const [deletePurchaseReturn] = useDeletePurchaseReturnMutation();

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);

  const purchaseReturns = Array.isArray(purchaseReturnsData)
    ? purchaseReturnsData
    : purchaseReturnsData?.result ?? [];
  const purchaseOrders = Array.isArray(purchaseOrdersData)
    ? purchaseOrdersData
    : purchaseOrdersData?.result ?? [];
  const purchaseInvoices = Array.isArray(purchaseInvoicesData)
    ? purchaseInvoicesData
    : purchaseInvoicesData?.result ?? [];
  const grns = Array.isArray(grnsData) ? grnsData : grnsData?.result ?? [];
  const vendors = Array.isArray(vendorsData) ? vendorsData : vendorsData?.result ?? [];
  const items = Array.isArray(itemsData) ? itemsData : itemsData?.result ?? [];

  const formik = useFormik<{
    header: PurchaseReturnHeaderForm;
    lineItems: PurchaseReturnLineForm[];
  }>({
    initialValues: {
      header: {
        returnNumber: "",
        vendorId: "",
        grnHeaderId: "",
        purchaseOrderHeaderId: "",
        purchaseInvoiceHeaderId: "",
        returnDate: new Date().toISOString().split("T")[0],
        status: "DRAFT",
        reason: "",
        remarks: "",
        user_id: userId,
      },
      lineItems: [emptyLineItem()],
    },
    validationSchema: Yup.object({
      header: Yup.object({
        returnNumber: Yup.string().required("Return Number is required"),
        vendorId: Yup.string().required("Vendor is required"),
        grnHeaderId: Yup.string().nullable(),
        purchaseOrderHeaderId: Yup.string().nullable(),
        purchaseInvoiceHeaderId: Yup.string().nullable(),
        returnDate: Yup.date().required("Return Date is required"),
        status: Yup.string().oneOf([...STATUS_OPTIONS], "Invalid status").required("Status is required"),
      }),
      lineItems: Yup.array()
        .of(
          Yup.object({
            grnLineId: Yup.string().nullable(),
            itemId: Yup.string().required("Item is required"),
            returnQty: Yup.number().moreThan(0, "Return qty must be greater than 0").required("Return qty is required"),
            rejectedQty: Yup.number().min(0, "Rejected qty cannot be negative"),
            damagedQty: Yup.number().min(0, "Damaged qty cannot be negative"),
            unitPrice: Yup.number().min(0, "Unit price cannot be negative").required("Unit price is required"),
          })
        )
        .min(1, "At least one return line is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          header: {
            returnNumber: values.header.returnNumber,
            vendorId: Number(values.header.vendorId),
            grnHeaderId: values.header.grnHeaderId ? Number(values.header.grnHeaderId) : null,
            purchaseOrderHeaderId: values.header.purchaseOrderHeaderId ? Number(values.header.purchaseOrderHeaderId) : null,
            purchaseInvoiceHeaderId: values.header.purchaseInvoiceHeaderId ? Number(values.header.purchaseInvoiceHeaderId) : null,
            returnDate: values.header.returnDate,
            status: values.header.status,
            reason: values.header.reason || null,
            remarks: values.header.remarks || null,
            user_id: Number(userId || values.header.user_id) || null,
          },
          lineItems: values.lineItems.map((line) => ({
            returnHeaderId: line.returnHeaderId ? Number(line.returnHeaderId) : undefined,
            grnLineId: line.grnLineId ? Number(line.grnLineId) : null,
            itemId: Number(line.itemId),
            batchNo: line.batchNo || null,
            returnQty: Number(line.returnQty),
            rejectedQty: Number(line.rejectedQty) || 0,
            damagedQty: Number(line.damagedQty) || 0,
            unitPrice: Number(line.unitPrice),
            reason: line.reason || null,
            remarks: line.remarks || null,
          })),
        };

        if (isEdit && editId) {
          await updatePurchaseReturn({ id: editId, body: payload }).unwrap();
          toast.success("Purchase return updated successfully");
        } else {
          await createPurchaseReturn(payload).unwrap();
          toast.success("Purchase return created successfully");
        }
        setOpen(false);
        setIsEdit(false);
        setEditId(null);
        formik.resetForm();
      } catch (error: any) {
        toast.error(error?.data?.message || "Unable to save purchase return");
      }
    },
  });

  const canReadPurchaseReturn = canRead("purchase_return") || canRead("purchase");
  const canCreatePurchaseReturn = canCreate("purchase_return") || canCreate("purchase");

  const getFieldError = (field: string) => {
    const error = field.split(".").reduce((obj: any, key: string) => obj?.[key], formik.errors);
    const touched = field.split(".").reduce((obj: any, key: string) => obj?.[key], formik.touched);
    return touched && error ? String(error) : "";
  };

  const updateLineItemField = (index: number, field: keyof PurchaseReturnLineForm, value: any) => {
    const lineItems = [...formik.values.lineItems];
    lineItems[index] = { ...lineItems[index], [field]: value };
    formik.setFieldValue("lineItems", lineItems);
  };

  const handleAddLineItem = () => {
    formik.setFieldValue("lineItems", [...formik.values.lineItems, emptyLineItem()]);
  };

  const handleRemoveLineItem = (index: number) => {
    const lineItems = [...formik.values.lineItems];
    lineItems.splice(index, 1);
    formik.setFieldValue("lineItems", lineItems.length ? lineItems : [emptyLineItem()]);
  };

  const handleEdit = (record: any) => {
    if (!canUpdate("purchase_return") && !canUpdate("purchase")) {
      toast.error("No permission to edit purchase return");
      return;
    }

    const header = record?.header ?? record;
    const lineSource = record?.lineItems ?? record?.line_items ?? [];

    formik.setValues({
      header: {
        returnNumber: header?.returnNumber ?? header?.return_number ?? "",
        vendorId: header?.vendorId ?? header?.vendor_id ?? "",
        grnHeaderId: header?.grnHeaderId ?? header?.grn_header_id ?? "",
        purchaseOrderHeaderId: header?.purchaseOrderHeaderId ?? header?.purchase_order_header_id ?? "",
        purchaseInvoiceHeaderId: header?.purchaseInvoiceHeaderId ?? header?.purchase_invoice_header_id ?? "",
        returnDate: header?.returnDate ?? header?.return_date ?? new Date().toISOString().split("T")[0],
        status: header?.status ?? "DRAFT",
        reason: header?.reason ?? "",
        remarks: header?.remarks ?? "",
        user_id: header?.user_id ?? userId,
      },
      lineItems: Array.isArray(lineSource) && lineSource.length
        ? lineSource.map((line: any) => ({
          returnHeaderId: line?.returnHeaderId ?? line?.return_header_id ?? "",
          grnLineId: line?.grnLineId ?? line?.grn_line_id ?? "",
          itemId: line?.itemId ?? line?.item_id ?? "",
          batchNo: line?.batchNo ?? line?.batch_no ?? "",
          returnQty: Number(line?.returnQty ?? line?.return_qty ?? 0),
          rejectedQty: Number(line?.rejectedQty ?? line?.rejected_qty ?? 0),
          damagedQty: Number(line?.damagedQty ?? line?.damaged_qty ?? 0),
          unitPrice: Number(line?.unitPrice ?? line?.unit_price ?? 0),
          reason: line?.reason ?? "",
          remarks: line?.remarks ?? "",
        }))
        : [emptyLineItem()],
    });

    setEditId(record?.id ?? null);
    setIsEdit(true);
    setOpen(true);
  };

  const handleDeleteRequest = (record: any) => {
    if (!canDelete("purchase_return") && !canDelete("purchase")) {
      toast.error("No permission to delete purchase return");
      return;
    }
    setReturnToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!returnToDelete?.id) {
      setDeleteDialogOpen(false);
      setReturnToDelete(null);
      return;
    }

    try {
      await deletePurchaseReturn(returnToDelete.id).unwrap();
      toast.success("Purchase return deleted successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete purchase return");
    } finally {
      setDeleteDialogOpen(false);
      setReturnToDelete(null);
    }
  };

  const handleStatusChange = async (id: number | string, newStatus: string) => {
    try {
      await updatePurchaseReturnStatus({ id, body: { status: newStatus } }).unwrap();
      toast.success(`Return status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update return status");
    }
  };

  const getVendorName = (vendorId: any) => {
    const vendor = vendors.find((v: any) => String(v.id) === String(vendorId));
    return vendor?.vendorName || vendor?.name || vendorId || "-";
  };

  const getStatusChip = (status: string) => {
    let color: "default" | "info" | "success" | "warning" | "error" = "default";
    if (status === "DRAFT") color = "info";
    if (status === "APPROVED") color = "warning";
    if (status === "RETURNED") color = "success";
    if (status === "CANCELLED") color = "error";
    return <Chip label={status} color={color} size="small" variant="outlined" />;
  };

  if (!canReadPurchaseReturn) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view Purchase Returns.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h3">Purchase Returns</Typography>
          <NavbarBreadcrumbs />
        </Box>
        {canCreatePurchaseReturn && (
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
            New Purchase Return
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Recent Purchase Returns
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Return Number</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>GRN</TableCell>
                <TableCell>Return Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseReturns.map((ret: any) => (
                <TableRow key={ret.id ?? ret.returnNumber ?? ret._id}>
                  <TableCell>{ret.returnNumber}</TableCell>
                  <TableCell>{getVendorName(ret.vendorId)}</TableCell>
                  <TableCell>{ret.grnHeaderId || "-"}</TableCell>
                  <TableCell>{ret.returnDate ? ret.returnDate.slice(0, 10) : "-"}</TableCell>
                  <TableCell>{getStatusChip(ret.status)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {/* View Details */}
                      <IconButton
                        size="small"
                        color="info"
                        title="View Details"
                        onClick={() => {
                          setSelectedReturn(ret);
                          setViewModalOpen(true);
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>

                      {/* DRAFT -> Edit / Approve / Delete */}
                      {ret.status === "DRAFT" && (
                        <>
                          {(canUpdate("purchase_return") || canUpdate("purchase")) && (
                            <IconButton size="small" color="primary" onClick={() => handleEdit(ret)} aria-label="Edit purchase return">
                              <Edit fontSize="small" />
                            </IconButton>
                          )}
                          <Button
                            size="small"
                            variant="contained"
                            color="warning"
                            startIcon={<CheckCircleOutline />}
                            onClick={() => handleStatusChange(ret.id, "APPROVED")}
                          >
                            Approve
                          </Button>
                          {(canDelete("purchase_return") || canDelete("purchase")) && (
                            <IconButton size="small" color="error" onClick={() => handleDeleteRequest(ret)} aria-label="Delete purchase return">
                              <Delete fontSize="small" />
                            </IconButton>
                          )}
                        </>
                      )}

                      {/* APPROVED -> Mark Returned / Cancel */}
                      {ret.status === "APPROVED" && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<LocalShipping />}
                            onClick={() => handleStatusChange(ret.id, "RETURNED")}
                          >
                            Mark Returned
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleStatusChange(ret.id, "CANCELLED")}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* View Details Dialog */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: "1px solid #eee" }}>
          Return Details - {selectedReturn?.returnNumber}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedReturn && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Vendor</Typography>
                <Typography fontWeight="bold">{getVendorName(selectedReturn.vendorId)}</Typography>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Return Date</Typography>
                <Typography fontWeight="bold">{selectedReturn.returnDate?.slice(0, 10)}</Typography>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box>{getStatusChip(selectedReturn.status)}</Box>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">GRN Ref</Typography>
                <Typography fontWeight="bold">{selectedReturn.grnHeaderId || "-"}</Typography>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">PO Ref</Typography>
                <Typography fontWeight="bold">{selectedReturn.purchaseOrderHeaderId || "-"}</Typography>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Invoice Ref</Typography>
                <Typography fontWeight="bold">{selectedReturn.purchaseInvoiceHeaderId || "-"}</Typography>
              </Grid>
              {selectedReturn.reason && (
                <Grid xs={12}>
                  <Typography variant="caption" color="text.secondary">Reason</Typography>
                  <Typography>{selectedReturn.reason}</Typography>
                </Grid>
              )}
              {selectedReturn.remarks && (
                <Grid xs={12}>
                  <Typography variant="caption" color="text.secondary">Remarks</Typography>
                  <Typography>{selectedReturn.remarks}</Typography>
                </Grid>
              )}
              <Grid xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Line Items</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Batch No</TableCell>
                        <TableCell align="right">Return Qty</TableCell>
                        <TableCell align="right">Rejected Qty</TableCell>
                        <TableCell align="right">Damaged Qty</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Line Amount</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedReturn.lineItems || selectedReturn.line_items || []).map((line: any, idx: number) => {
                        const itemName = items.find((it: any) => String(it.id) === String(line.itemId))?.itemName || line.itemId;
                        const lineAmt = Number(line.returnQty || 0) * Number(line.unitPrice || 0);
                        return (
                          <TableRow key={idx}>
                            <TableCell>{itemName}</TableCell>
                            <TableCell>{line.batchNo || "-"}</TableCell>
                            <TableCell align="right">{line.returnQty}</TableCell>
                            <TableCell align="right">{line.rejectedQty || 0}</TableCell>
                            <TableCell align="right">{line.damagedQty || 0}</TableCell>
                            <TableCell align="right">₹{Number(line.unitPrice || 0).toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>₹{lineAmt.toFixed(2)}</TableCell>
                            <TableCell>{line.reason || "-"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this purchase return?</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen} onClose={() => setOpen(false)} fullWidth maxWidth="xl">
        <DialogTitle>{isEdit ? "Edit Purchase Return" : "Create Purchase Return"}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.returnNumber"))}>
                  <FormLabel>Return Number</FormLabel>
                  <TextField
                    name="header.returnNumber"
                    placeholder="Enter return Number"
                    value={formik.values.header.returnNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                  />
                  <FormHelperText>{getFieldError("header.returnNumber")}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.vendorId"))}>
                  <FormLabel>Vendor</FormLabel>
                  <Select
                    name="header.vendorId"
                    value={formik.values.header.vendorId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Select vendor</em>
                    </MenuItem>
                    {vendors.map((vendor: any) => (
                      <MenuItem key={vendor.id ?? vendor._id} value={String(vendor.id ?? vendor._id)}>
                        {vendor.vendor_name ?? vendor.name ?? `Vendor-${vendor.id ?? vendor._id}`}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{getFieldError("header.vendorId")}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.grnHeaderId"))}>
                  <FormLabel>GRN</FormLabel>
                  <Select
                    name="header.grnHeaderId"
                    value={formik.values.header.grnHeaderId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Select GRN</em>
                    </MenuItem>
                    {grns.map((grn: any) => (
                      <MenuItem key={grn.id ?? grn._id} value={String(grn.id ?? grn._id)}>
                        {grn.grnNumber ?? grn.grn_number ?? `GRN-${grn.id ?? grn._id}`}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{getFieldError("header.grnHeaderId")}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.purchaseOrderHeaderId"))}>
                  <FormLabel>Purchase Order</FormLabel>
                  <Select
                    name="header.purchaseOrderHeaderId"
                    value={formik.values.header.purchaseOrderHeaderId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Select PO</em>
                    </MenuItem>
                    {purchaseOrders.map((po: any) => (
                      <MenuItem key={po.id ?? po._id} value={String(po.id ?? po._id)}>
                        {po.purchaseNo ?? po.purchase_no ?? `PO-${po.id ?? po._id}`}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{getFieldError("header.purchaseOrderHeaderId")}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.purchaseInvoiceHeaderId"))}>
                  <FormLabel>Purchase Invoice</FormLabel>
                  <Select
                    name="header.purchaseInvoiceHeaderId"
                    value={formik.values.header.purchaseInvoiceHeaderId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Select Invoice</em>
                    </MenuItem>
                    {purchaseInvoices.map((inv: any) => (
                      <MenuItem key={inv.id ?? inv._id} value={String(inv.id ?? inv._id)}>
                        {inv.invoiceNumber ?? inv.invoice_number ?? `INV-${inv.id ?? inv._id}`}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{getFieldError("header.purchaseInvoiceHeaderId")}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.returnDate"))}>
                  <FormLabel>Return Date</FormLabel>
                  <TextField
                    name="header.returnDate"
                    type="date"
                    value={formik.values.header.returnDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                  />
                  <FormHelperText>{getFieldError("header.returnDate")}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.status"))}>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name="header.status"
                    value={formik.values.header.status}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{getFieldError("header.status")}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Reason</FormLabel>
                  <TextField
                    name="header.reason"
                    placeholder="Enter reason"
                    value={formik.values.header.reason}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                  />
                </FormControl>
              </Grid>

            </Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <FormLabel>Remarks</FormLabel>
                <TextField
                  name="header.remarks"
                  placeholder="Enter remarks"
                  value={formik.values.header.remarks}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  size="small"
                />
              </FormControl>
            </Grid>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" gutterBottom>Lines Items</Typography>
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={handleAddLineItem}>
                Add Line Item
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%' }}>
              <Table size="small" sx={{ minWidth: 2000 }}>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell width="10%">GRN Line Id</TableCell>
                    <TableCell width="10%">Item</TableCell>
                    <TableCell width="10%">Batch No</TableCell>
                    <TableCell width="8%">Return Qty</TableCell>
                    <TableCell width="8%">Rejected Qty</TableCell>
                    <TableCell width="8%">Damaged Qty</TableCell>
                    <TableCell width="8%">Unit Price</TableCell>
                    <TableCell width="8%">Line Amount</TableCell>
                    <TableCell width="10%">Reason</TableCell>
                    <TableCell width="10%">Remarks</TableCell>
                    <TableCell align="center" width="8%">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formik.values.lineItems.map((line, index) => {
                    const lineAmount = (Number(line.returnQty) || 0) * (Number(line.unitPrice) || 0);
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={line.grnLineId}
                            onChange={(e) => updateLineItemField(index, "grnLineId", e.target.value)}
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <FormControl fullWidth error={Boolean(getFieldError(`lineItems.${index}.itemId`))}>
                            <Select
                              size="small"
                              value={line.itemId}
                              onChange={(e) => updateLineItemField(index, "itemId", e.target.value)}
                            >
                              <MenuItem value="">
                                <em>Select item</em>
                              </MenuItem>
                              {items?.map((item: any) => (
                                <MenuItem key={item.id ?? item._id} value={String(item.id ?? item._id)}>
                                  {item.item_name ?? item.name ?? item.itemName ?? `Item-${item.id ?? item._id}`}
                                </MenuItem>
                              ))}
                            </Select>
                            <FormHelperText>{getFieldError(`lineItems.${index}.itemId`)}</FormHelperText>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="Batch No"
                            value={line.batchNo}
                            onChange={(e) => updateLineItemField(index, "batchNo", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={line.returnQty}
                            onChange={(e) => updateLineItemField(index, "returnQty", Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={line.rejectedQty}
                            onChange={(e) => updateLineItemField(index, "rejectedQty", Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={line.damagedQty}
                            onChange={(e) => updateLineItemField(index, "damagedQty", Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={line.unitPrice}
                            onChange={(e) => updateLineItemField(index, "unitPrice", Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={lineAmount.toFixed(2)} InputProps={{ readOnly: true }} />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="Reason"
                            value={line.reason}
                            onChange={(e) => updateLineItemField(index, "reason", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="Remarks"
                            value={line.remarks}
                            onChange={(e) => updateLineItemField(index, "remarks", e.target.value)}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <IconButton onClick={() => handleRemoveLineItem(index)}>
                            <RemoveCircleOutline />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
              <Button onClick={() => setOpen(false)} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={!canCreatePurchaseReturn}>
                {isEdit ? "Update" : "Create"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PurchaseReturnComp;
