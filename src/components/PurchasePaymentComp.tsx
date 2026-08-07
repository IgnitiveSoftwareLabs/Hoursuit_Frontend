import React, { useMemo, useState } from "react";
import {
  Add,
  CheckCircleOutline,
  Cancel,
  Delete,
  Edit,
  Payments,
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
import { useGetChartOfAccountsQuery } from "../RTK/services/chartOfAccountApi";
import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";
import { useAppSelector } from "../Hooks/Reduxhook/hooks";
import { usePermissions } from "../Hooks/usePermissions";
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
import DynamicTable from "./Tables";
import {
  useCreatePurchasePaymentMutation,
  useDeletePurchasePaymentMutation,
  useGetPurchaseInvoicesQuery,
  useGetPurchasePaymentsQuery,
  useUpdatePurchasePaymentMutation,
  useUpdatePurchasePaymentStatusMutation,
} from "../RTK/services/purchaseApi";

const STATUS_OPTIONS = ["DRAFT", "POSTED", "CANCELLED"] as const;
type PaymentStatus = (typeof STATUS_OPTIONS)[number];

interface AllocationLine {
  purchaseInvoiceHeaderId: string | number;
  invoiceNumber?: string;
  vendorInvoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  balanceAmount?: number;
  amountPaid: number;
  remarks: string;
}

interface PurchasePaymentHeaderForm {
  paymentNumber: string;
  paymentDate: string;
  vendorId: string | number;
  paymentMethodId: string | number;
  paymentMode: string;
  bankAccountId: string | number;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  referenceNo: string;
  status: PaymentStatus;
  remarks: string;
  lines: AllocationLine[];
}

export default function PurchasePaymentComp() {
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const userId = currentUser?.id ?? "";

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any>(null);

  const { data: paymentsData } = useGetPurchasePaymentsQuery({ page: 1, limit: 50 });
  const { data: vendorsData } = useGetVendorsQuery({ option: true });
  const { data: chartOfAccountsData } = useGetChartOfAccountsQuery();
  const { data: currenciesData } = useGetCurrenciesQuery();
  const { data: invoicesData } = useGetPurchaseInvoicesQuery({ page: 1, limit: 100 });

  const [createPurchasePayment] = useCreatePurchasePaymentMutation();
  const [updatePurchasePayment] = useUpdatePurchasePaymentMutation();
  const [updatePurchasePaymentStatus] = useUpdatePurchasePaymentStatusMutation();
  const [deletePurchasePayment] = useDeletePurchasePaymentMutation();

  const payments = useMemo(() => {
    if (!paymentsData) return [];
    return Array.isArray(paymentsData) ? paymentsData : paymentsData?.result ?? [];
  }, [paymentsData]);

  const vendors = useMemo(() => {
    if (!vendorsData) return [];
    return Array.isArray(vendorsData) ? vendorsData : vendorsData?.result ?? [];
  }, [vendorsData]);

  const currencies = useMemo(() => {
    if (!currenciesData) return [];
    return Array.isArray(currenciesData) ? currenciesData : currenciesData?.result ?? [];
  }, [currenciesData]);

  const bankAccounts = useMemo(() => {
    const coaList = Array.isArray(chartOfAccountsData?.result)
      ? chartOfAccountsData.result
      : Array.isArray(chartOfAccountsData)
        ? chartOfAccountsData
        : [];
    // Filter cash & bank accounts or return all asset accounts
    return coaList.filter(
      (acc: any) =>
        acc.accountType?.name?.toLowerCase().includes("bank") ||
        acc.accountType?.name?.toLowerCase().includes("cash") ||
        acc.accountType?.name?.toLowerCase().includes("asset") ||
        acc.accountType?.typeGroup?.toLowerCase() === "asset"
    );
  }, [chartOfAccountsData]);

  const allInvoices = useMemo(() => {
    if (!invoicesData) return [];
    return Array.isArray(invoicesData) ? invoicesData : invoicesData?.result ?? [];
  }, [invoicesData]);

  const initialValues: PurchasePaymentHeaderForm = {
    paymentNumber: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    vendorId: "",
    paymentMethodId: "",
    paymentMode: "Bank Transfer",
    bankAccountId: "",
    totalAmount: 0,
    currency: "INR",
    exchangeRate: 1,
    referenceNo: "",
    status: "DRAFT",
    remarks: "",
    lines: [],
  };

  const validationSchema = Yup.object().shape({
    vendorId: Yup.string().required("Vendor is required"),
    paymentDate: Yup.string().required("Payment Date is required"),
    totalAmount: Yup.number().positive("Total payment amount must be greater than zero").required(),
  });

  const formik = useFormik<PurchasePaymentHeaderForm>({
    initialValues,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const payload = {
          ...values,
          user_id: userId,
          lines: values.lines
            .filter((l) => Number(l.amountPaid) > 0)
            .map((l) => ({
              purchaseInvoiceHeaderId: l.purchaseInvoiceHeaderId,
              amountPaid: Number(l.amountPaid),
              remarks: l.remarks || "",
            })),
        };

        if (isEdit && editId) {
          await updatePurchasePayment({ id: editId, body: payload }).unwrap();
          toast.success("Purchase Payment updated successfully");
        } else {
          await createPurchasePayment(payload).unwrap();
          toast.success("Purchase Payment created successfully");
        }
        setOpen(false);
        setIsEdit(false);
        setEditId(null);
        resetForm();
      } catch (error: any) {
        toast.error(error?.data?.message || "Operation failed");
      }
    },
  });

  // When Vendor changes in form, populate un-paid invoices for that vendor
  const handleVendorSelect = (vendorId: string | number) => {
    formik.setFieldValue("vendorId", vendorId);
    if (!vendorId) {
      formik.setFieldValue("lines", []);
      return;
    }

    const vendorInvoices = allInvoices.filter(
      (inv: any) =>
        String(inv.vendorId) === String(vendorId) &&
        (inv.status === "POSTED" || inv.status === "PARTIAL_PAID") &&
        (inv.balanceAmount === undefined || Number(inv.balanceAmount) > 0)
    );

    const lines: AllocationLine[] = vendorInvoices.map((inv: any) => ({
      purchaseInvoiceHeaderId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      vendorInvoiceNumber: inv.vendorInvoiceNumber,
      invoiceDate: inv.invoiceDate,
      totalAmount: Number(inv.totalAmount || 0),
      balanceAmount: Number(inv.balanceAmount ?? inv.totalAmount ?? 0),
      amountPaid: 0,
      remarks: "",
    }));

    formik.setFieldValue("lines", lines);
  };

  const handleLineAmountChange = (index: number, val: number) => {
    const updatedLines = [...formik.values.lines];
    updatedLines[index].amountPaid = val;
    formik.setFieldValue("lines", updatedLines);

    // Sum up line amounts to set totalAmount
    const newTotal = updatedLines.reduce((acc, curr) => acc + (Number(curr.amountPaid) || 0), 0);
    formik.setFieldValue("totalAmount", newTotal);
  };

  const handleStatusChange = async (id: number | string, newStatus: PaymentStatus) => {
    try {
      await updatePurchasePaymentStatus({ id, body: { status: newStatus } }).unwrap();
      toast.success(`Payment status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update payment status");
    }
  };

  const handleDelete = async () => {
    if (!paymentToDelete) return;
    try {
      await deletePurchasePayment(paymentToDelete.id).unwrap();
      toast.success("Purchase Payment deleted");
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete payment");
    }
  };

  const columns = [
    { key: "paymentNumber", label: "Payment #" },
    {
      key: "paymentDate",
      label: "Date",
      render: (row: any) => row.paymentDate ? row.paymentDate.slice(0, 10) : "-",
    },
    {
      key: "vendor",
      label: "Vendor",
      render: (row: any) => row.vendor?.vendorName || row.vendor?.name || row.vendor?.vendor_name || "-",
    },
    { key: "paymentMode", label: "Mode" },
    {
      key: "totalAmount",
      label: "Total Amount",
      render: (row: any) => `₹${Number(row.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    },
    { key: "referenceNo", label: "Ref / UTR #" },
    {
      key: "status",
      label: "Status",
      render: (row: any) => {
        const val = row.status;
        let color: "default" | "info" | "success" | "error" = "default";
        if (val === "DRAFT") color = "info";
        if (val === "POSTED") color = "success";
        if (val === "CANCELLED") color = "error";
        return <Chip label={val} color={color} size="small" variant="outlined" />;
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: any) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            size="small"
            color="info"
            title="View Details"
            onClick={() => {
              setSelectedPayment(row);
              setViewModalOpen(true);
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>

          {row.status === "DRAFT" && (
            <>
              {canUpdate && (
                <IconButton
                  size="small"
                  color="primary"
                  title="Edit Payment"
                  onClick={() => {
                    setIsEdit(true);
                    setEditId(row.id);
                    formik.setValues({
                      paymentNumber: row.paymentNumber || "",
                      paymentDate: row.paymentDate ? row.paymentDate.slice(0, 10) : "",
                      vendorId: row.vendorId || "",
                      paymentMethodId: row.paymentMethodId || "",
                      paymentMode: row.paymentMode || "Bank Transfer",
                      bankAccountId: row.bankAccountId || "",
                      totalAmount: row.totalAmount || 0,
                      currency: row.currency || "INR",
                      exchangeRate: row.exchangeRate || 1,
                      referenceNo: row.referenceNo || "",
                      status: row.status || "DRAFT",
                      remarks: row.remarks || "",
                      lines: row.lines || [],
                    });
                    setOpen(true);
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              )}

              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircleOutline />}
                onClick={() => handleStatusChange(row.id, "POSTED")}
              >
                Post
              </Button>

              {canDelete && (
                <IconButton
                  size="small"
                  color="error"
                  title="Delete"
                  onClick={() => {
                    setPaymentToDelete(row);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </>
          )}

          {row.status === "POSTED" && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => handleStatusChange(row.id, "CANCELLED")}
            >
              Cancel
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Purchase Payment (Vendor Payment)
          </Typography>
          <NavbarBreadcrumbs />
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setIsEdit(false);
              setEditId(null);
              formik.resetForm();
              setOpen(true);
            }}
          >
            New Payment
          </Button>
        )}
      </Box>

      {/* Dynamic Data Table */}
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <DynamicTable columns={columns} data={payments} getRowId={(row: any) => String(row.id || row._id)} />
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: "1px solid #eee" }}>
          {isEdit ? "Edit Purchase Payment" : "Create New Purchase Payment"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small" error={formik.touched.vendorId && Boolean(formik.errors.vendorId)}>
                  <FormLabel>Vendor *</FormLabel>
                  <Select
                    name="vendorId"
                    value={formik.values.vendorId}
                    onChange={(e) => handleVendorSelect(e.target.value)}
                  >
                    <MenuItem value="">Select Vendor</MenuItem>
                    {vendors.map((v: any) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.vendorName || v.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.vendorId && <FormHelperText>{formik.errors.vendorId}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <FormLabel>Payment Date *</FormLabel>
                  <TextField
                    type="date"
                    name="paymentDate"
                    size="small"
                    value={formik.values.paymentDate}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>

              <Grid xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <FormLabel>Payment Mode</FormLabel>
                  <Select
                    name="paymentMode"
                    value={formik.values.paymentMode}
                    onChange={formik.handleChange}
                  >
                    <MenuItem value="Bank Transfer">Bank Transfer / NEFT / RTGS</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Credit Card">Credit Card</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <FormLabel>Paying Bank / Cash Account</FormLabel>
                  <Select
                    name="bankAccountId"
                    value={formik.values.bankAccountId}
                    onChange={formik.handleChange}
                  >
                    <MenuItem value="">Select Account</MenuItem>
                    {bankAccounts.map((acc: any) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.accountName} ({acc.accountCode})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <FormLabel>Reference / UTR / Cheque No</FormLabel>
                  <TextField
                    name="referenceNo"
                    size="small"
                    placeholder="e.g. UTR12345678"
                    value={formik.values.referenceNo}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>

              <Grid xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <FormLabel>Total Payment Amount (₹)</FormLabel>
                  <TextField
                    type="number"
                    name="totalAmount"
                    size="small"
                    value={formik.values.totalAmount}
                    InputProps={{ readOnly: formik.values.lines.length > 0 }}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>

              <Grid xs={12}>
                <FormControl fullWidth size="small">
                  <FormLabel>Remarks</FormLabel>
                  <TextField
                    name="remarks"
                    size="small"
                    multiline
                    rows={2}
                    value={formik.values.remarks}
                    onChange={formik.handleChange}
                  />
                </FormControl>
              </Grid>
            </Grid>

            {/* Invoice Allocations Section */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              Invoice Allocations
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Allocate payment amounts against unpaid or partially paid purchase invoices for this vendor.
            </Typography>

            {formik.values.lines.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">
                  {formik.values.vendorId
                    ? "No pending invoices found for selected vendor."
                    : "Please select a vendor to load open purchase invoices."}
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Invoice Total</TableCell>
                      <TableCell align="right">Balance Due</TableCell>
                      <TableCell align="right">Amount Paid (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formik.values.lines.map((line, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{line.invoiceNumber || line.purchaseInvoiceHeaderId}</TableCell>
                        <TableCell>{line.invoiceDate ? line.invoiceDate.slice(0, 10) : "-"}</TableCell>
                        <TableCell align="right">₹{Number(line.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "error.main" }}>
                          ₹{Number(line.balanceAmount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ width: 180 }}>
                          <TextField
                            type="number"
                            size="small"
                            value={line.amountPaid}
                            onChange={(e) => handleLineAmountChange(idx, Number(e.target.value))}
                            inputProps={{ min: 0, max: line.balanceAmount }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button onClick={() => setOpen(false)} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                {isEdit ? "Update Payment" : "Save Payment"}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: "1px solid #eee" }}>
          Payment Details - {selectedPayment?.paymentNumber}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedPayment && (
            <Grid container spacing={2}>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">
                  Vendor
                </Typography>
                <Typography fontWeight="bold">
                  {selectedPayment.vendor?.vendorName || selectedPayment.vendor?.name || "-"}
                </Typography>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">
                  Payment Date
                </Typography>
                <Typography fontWeight="bold">{selectedPayment.paymentDate?.slice(0, 10)}</Typography>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box>
                  <Chip label={selectedPayment.status} color="primary" size="small" />
                </Box>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">
                  Payment Mode
                </Typography>
                <Typography fontWeight="bold">{selectedPayment.paymentMode || "-"}</Typography>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">
                  Ref / UTR #
                </Typography>
                <Typography fontWeight="bold">{selectedPayment.referenceNo || "-"}</Typography>
              </Grid>
              <Grid xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography fontWeight="bold" color="success.main">
                  ₹{Number(selectedPayment.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </Typography>
              </Grid>

              <Grid xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                  Allocated Invoices
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableRow>
                        <TableCell>Invoice #</TableCell>
                        <TableCell align="right">Amount Paid</TableCell>
                        <TableCell>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPayment.lines?.map((line: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {line.purchaseInvoice?.invoiceNumber || line.purchaseInvoiceHeaderId}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: "bold" }}>
                            ₹{Number(line.amountPaid || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>{line.remarks || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete payment record{" "}
            <strong>{paymentToDelete?.paymentNumber}</strong>?
          </Typography>
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}