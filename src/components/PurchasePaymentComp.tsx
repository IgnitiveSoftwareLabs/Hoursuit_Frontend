import { useMemo, useState } from "react";
import {
  Add,
  Assessment,
  CheckCircleOutline,
  Cancel,
  Delete,
  Edit,
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
import { useGetPaymentMethodsQuery } from "../RTK/services/paymentMethodApi";
import { useGetJournalEntryByIdQuery } from "../RTK/services/journalEntryApi";

const STATUS_OPTIONS = ["DRAFT", "POSTED", "CANCELLED"] as const;

type PaymentStatus = (typeof STATUS_OPTIONS)[number];

interface PurchasePaymentLine {
  purchaseInvoiceLineId: string | number;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceTotal?: number;
  invoiceBalance?: number;
  amountPaid: number;
  remarks?: string;
}

interface PurchaseOrderLine {
  id?: string | number;
  lineNumber?: number;
  itemId?: string | number;
  itemName?: string;
  itemCode?: string;
  sku?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  lineTotal?: number;
}

interface PurchasePaymentForm {
  paymentNumber: string;
  paymentDate: string;
  purchaseInvoiceHeaderId: string | number;
  invoiceNumber: string;
  invoiceDate: string;
  vendorInvoiceNumber: string;
  vendorId: string | number;
  vendorName: string;
  invoiceTotalAmount: number;
  invoicePaidAmount: number;
  invoiceBalanceAmount: number;
  invoiceStatus: string;
  currency: string;
  exchangeRate: number;
  purchaseOrderNumber: string;
  paymentMethodId: string | number;
  bankAccountId: string | number;
  referenceNo: string;
  totalAmount: number;
  remarks: string;
  status: PaymentStatus;
  lines: PurchasePaymentLine[];
  purchaseOrderLines: PurchaseOrderLine[];
}

export default function PurchasePaymentComp() {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const userId = currentUser?.id ?? "";

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any>(null);
  const [selectedPaymentForGl, setSelectedPaymentForGl] = useState<any>(null);
  const [glImpactOpen, setGlImpactOpen] = useState(false);

  const { data: paymentMethodsData } = useGetPaymentMethodsQuery({ page: 1, limit: 100 });
  const { data: paymentsData } = useGetPurchasePaymentsQuery({ page: 1, limit: 50 });
  const { data: invoicesData } = useGetPurchaseInvoicesQuery({ page: 1, limit: 100 });
  const { data: vendorsData } = useGetVendorsQuery({ option: true });
  const { data: chartOfAccountsData } = useGetChartOfAccountsQuery();
  const { data: currenciesData } = useGetCurrenciesQuery();

  const { data: journalEntriesData, isLoading: isJournalLoading } = useGetJournalEntryByIdQuery(
    {
      id: Number(selectedPaymentForGl?.id ?? 0),
      source: "PURCHASE_PAYMENT",
    },
    {
      skip: !selectedPaymentForGl?.id,
    }
  );

  const [updatePurchasePaymentStatus] = useUpdatePurchasePaymentStatusMutation();
  const [createPurchasePayment] = useCreatePurchasePaymentMutation();
  const [updatePurchasePayment] = useUpdatePurchasePaymentMutation();
  const [deletePurchasePayment] = useDeletePurchasePaymentMutation();

  const payments = useMemo(() => {
    if (!paymentsData) return [];

    return Array.isArray(paymentsData) ? paymentsData : paymentsData?.result ?? [];
  }, [paymentsData]);

  const vendors = useMemo(() => {
    if (!vendorsData) return [];

    return Array.isArray(vendorsData) ? vendorsData : vendorsData?.result ?? [];
  }, [vendorsData]);

  const glVendorName = useMemo(() => {
    if (!selectedPaymentForGl) return "Vendor";
    if (selectedPaymentForGl.vendor?.vendor_name) return selectedPaymentForGl.vendor.vendor_name;
    if (selectedPaymentForGl.vendor?.vendorName) return selectedPaymentForGl.vendor.vendorName;
    const foundVendor = vendors.find((v: any) => String(v.id) === String(selectedPaymentForGl.vendorId || selectedPaymentForGl.vendor_id));
    return foundVendor?.vendor_name || foundVendor?.vendorName || "Vendor";
  }, [selectedPaymentForGl, vendors]);

  const currencies = useMemo(() => {
    if (!currenciesData) return [];

    return Array.isArray(currenciesData) ? currenciesData : currenciesData?.result ?? [];
  }, [currenciesData]);

  const allInvoices = useMemo(() => {
    if (!invoicesData) return [];

    return Array.isArray(invoicesData) ? invoicesData : invoicesData?.result ?? [];
  }, [invoicesData]);

  // const bankAccounts = useMemo(() => {
  //   const coaList = Array.isArray(chartOfAccountsData?.result)
  //     ? chartOfAccountsData.result : Array.isArray(chartOfAccountsData)
  //       ? chartOfAccountsData : [];

  //   return coaList.filter((acc: any) => {
  //     const accountType = acc?.account_name?.toLowerCase() || "";
  //     const typeGroup = acc.accountType?.account_type_name?.toLowerCase() || "";

  //     return (
  //       accountType.includes("bank") ||
  //       accountType.includes("cash") ||
  //       accountType.includes("asset") ||
  //       typeGroup === "asset"
  //     );
  //   });
  // }, [chartOfAccountsData]);

  const bankAccounts = chartOfAccountsData?.result ?? [];
  const paymentMethods = paymentMethodsData?.result ?? [];

  // console.log(bankAccounts)

  const initialValues: PurchasePaymentForm = {
    paymentNumber: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    purchaseInvoiceHeaderId: "",
    invoiceNumber: "",
    invoiceDate: "",
    vendorInvoiceNumber: "",
    vendorId: "",
    vendorName: "",
    invoiceTotalAmount: 0,
    invoicePaidAmount: 0,
    invoiceBalanceAmount: 0,
    invoiceStatus: "",
    currency: "INR",
    exchangeRate: 1,
    purchaseOrderNumber: "",
    paymentMethodId: null,
    bankAccountId: "",
    referenceNo: "",
    totalAmount: 0,
    remarks: "",
    status: "DRAFT",
    lines: [],
    purchaseOrderLines: [],
  };

  const validationSchema = Yup.object().shape({
    purchaseInvoiceHeaderId: Yup.string().required("Purchase Invoice is required"),
    paymentNumber: Yup.string().required("Payment No. is required"),
    paymentDate: Yup.string().required("Payment Date is required"),
    totalAmount: Yup.number().positive("Payment amount must be greater than zero").required("Payment amount is required"),
    paymentMethodId: Yup.string().required("Payment method is required"),
    bankAccountId: Yup.string().required("Paying account is required"),
  });

  const formik = useFormik<PurchasePaymentForm>({
    initialValues,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (!values.purchaseInvoiceHeaderId) {
          toast.error("Please select a Purchase Invoice");
          return;
        }

        const paymentAmount = Number(values.totalAmount || 0);
        const invoiceBalance = Number(values.invoiceBalanceAmount || 0);

        if (paymentAmount <= 0) {
          toast.error("Payment amount must be greater than zero");
          return;
        }

        if (paymentAmount > invoiceBalance) {
          toast.error("Payment amount cannot exceed invoice balance");
          return;
        }

        const paymentLines = [
          {
            purchaseInvoiceLineId: values.purchaseInvoiceHeaderId,
            amountPaid: paymentAmount,
            remarks: values.remarks || "",
          },
        ];

        const payload = {
          paymentNumber: values.paymentNumber || undefined,
          paymentDate: values.paymentDate,
          vendorId: values.vendorId,
          paymentMethodId: values.paymentMethodId,
          bankAccountId: values.bankAccountId,
          totalAmount: paymentAmount,
          currency: values.currency,
          exchangeRate: Number(values.exchangeRate || 1),
          referenceNo: values.referenceNo,
          status: values.status,
          remarks: values.remarks,
          user_id: userId,
          lines: paymentLines,
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
        toast.error(error?.data?.message || "Failed to save purchase payment");
      }
    },
  });

  const getPurchaseOrderLines = (invoice: any): PurchaseOrderLine[] => {

    const lines = invoice?.purchaseOrderLines ||
      invoice?.purchaseOrder?.lines ||
      invoice?.purchaseOrder?.purchaseOrderLines ||
      invoice?.poLines || [];

    if (!Array.isArray(lines)) {
      return [];
    }

    return lines.map((line: any) => ({
      id: line.id,
      lineNumber: line.lineNumber ??
        line.line_no ??
        line.sequence,
      itemId: line.itemId ??
        line.item_id,
      itemName: line.item?.itemName ||
        line.item?.name ||
        line.itemName ||
        line.item_name,
      itemCode: line.item?.itemCode ||
        line.item?.code ||
        line.itemCode ||
        line.item_code,
      sku: line.item?.sku ||
        line.sku,
      description: line.description ||
        line.item?.description || "",
      quantity: Number(
        line.quantity ||
        line.orderQty ||
        line.orderedQuantity || 0),
      unitPrice: Number(
        line.unitPrice ||
        line.rate ||
        line.price || 0),
      discountPercent: Number(line.discountPercent || 0),
      discountAmount: Number(line.discountAmount || 0),
      taxPercent: Number(line.taxPercent || 0),
      taxAmount: Number(line.taxAmount || 0),
      lineTotal: Number(
        line.lineTotal ||
        line.totalAmount ||
        line.amount || 0),
    }));
  };

  const getPurchaseOrderNumber = (invoice: any) => {
    return (
      invoice?.purchaseOrder?.purchaseNo ||
      invoice?.purchaseOrder?.orderNumber ||
      invoice?.purchaseOrderNumber ||
      invoice?.poNumber ||
      invoice?.purchaseOrder?.number || ""
    );
  };

  const handleInvoiceSelect = (invoiceId: string | number) => {
    const invoice = allInvoices.find((inv: any) => String(inv.id) === String(invoiceId));

    if (!invoice) {
      formik.setValues({ ...initialValues, paymentDate: new Date().toISOString().slice(0, 10) });
      return;
    }

    const invoiceTotal = Number(invoice.totalAmount || 0);
    const invoicePaid = Number(invoice.paidAmount || invoice.amountPaid || 0);
    const invoiceBalance = Number(invoice.balanceAmount ?? invoiceTotal - invoicePaid);
    const vendor = invoice.vendor || vendors.find((v: any) => String(v.id) === String(invoice.vendorId));

    const vendorName = vendor?.vendorName || vendor?.name || vendor?.vendor_name || "";
    const poLines = getPurchaseOrderLines(invoice);
    const poNumber = invoice?.purchaseOrder?.purchaseNo;
    // console.log(poNumber)

    formik.setValues({
      ...formik.values,
      purchaseInvoiceHeaderId: invoice.id,
      invoiceNumber: invoice.invoiceNumber || "",
      invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.slice(0, 10) : "",
      vendorInvoiceNumber: invoice.vendorInvoiceNumber || "",
      vendorId: invoice.vendorId || "",
      vendorName,
      invoiceTotalAmount: invoiceTotal,
      invoicePaidAmount: invoicePaid,
      invoiceBalanceAmount: invoiceBalance,
      invoiceStatus: invoice.status || "",
      currency: invoice.currency || invoice.currencyCode || "INR",
      exchangeRate: Number(invoice.exchangeRate || 1),
      purchaseOrderNumber: poNumber,
      totalAmount: 0,
      lines: [
        {
          purchaseInvoiceLineId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          invoiceTotalAmount: invoiceTotal,
          invoiceBalanceAmount: invoiceBalance,
          amountPaid: 0,
          remarks: "",
        } as any,
      ],
      purchaseOrderLines: poLines,
    });
  };

  const handlePaymentAmountChange = (value: string) => {
    const amount = Number(value || 0);
    const balance = Number(formik.values.invoiceBalanceAmount || 0);

    if (amount > balance) {
      toast.error("Payment amount cannot exceed invoice balance");
      formik.setFieldValue("totalAmount", balance);
      return;
    }

    formik.setFieldValue("totalAmount", amount);

    const updatedLines = formik.values.lines.map((line) => ({
      ...line,
      amountPaid: amount,
    }));

    formik.setFieldValue("lines", updatedLines);
  };

  const handleStatusChange = async (id: number | string, newStatus: PaymentStatus) => {
    try {
      await updatePurchasePaymentStatus({ id, body: { status: newStatus, } }).unwrap();

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

  const handleEdit = (row: any) => {
    setIsEdit(true);
    setEditId(row.id);
    const invoice = row.purchaseInvoice || row.invoice ||
      allInvoices.find((inv: any) => String(inv.id) === String(row.lines?.[0]?.purchaseInvoiceHeaderId));
    let purchaseOrderLines: PurchaseOrderLine[] = [];

    if (invoice) {
      purchaseOrderLines = getPurchaseOrderLines(invoice);
    }

    const paymentLine = row.lines?.[0];
    formik.setValues({
      paymentNumber: row.paymentNumber || "",
      paymentDate: row.paymentDate ? row.paymentDate.slice(0, 10) : "",
      purchaseInvoiceHeaderId: paymentLine?.purchaseInvoiceLineId || invoice?.id || "",
      invoiceNumber: invoice?.invoiceNumber || paymentLine?.purchaseInvoice?.invoiceNumber || "",
      invoiceDate: invoice?.invoiceDate ? invoice.invoiceDate.slice(0, 10)
        : paymentLine?.purchaseInvoice?.invoiceDate
          ? paymentLine.purchaseInvoice.invoiceDate.slice(0, 10) : "",
      vendorInvoiceNumber: invoice?.vendorInvoiceNumber || "",
      vendorId: row.vendorId || invoice?.vendorId || "",
      vendorName: row.vendor?.vendorName || row.vendor?.name || invoice?.vendor?.vendorName ||
        invoice?.vendor?.name || "",
      invoiceTotalAmount: Number(invoice?.totalAmount || 0),
      invoicePaidAmount: Number(invoice?.paidAmount || invoice?.amountPaid || 0),
      invoiceBalanceAmount: Number(invoice?.balanceAmount ?? invoice?.totalAmount ?? 0),
      invoiceStatus: invoice?.status || "",
      currency: row.currency || invoice?.currency || "INR",
      exchangeRate: Number(row.exchangeRate || invoice?.exchangeRate || 1),
      purchaseOrderNumber: getPurchaseOrderNumber(invoice),
      paymentMethodId: row.paymentMethodId || null,
      bankAccountId: row.bankAccountId || "",
      referenceNo: row.referenceNo || "",
      totalAmount: Number(row.totalAmount || 0),
      remarks: row.remarks || "",
      status: row.status || "DRAFT",
      lines: row.lines || [],
      purchaseOrderLines,
    });
    setOpen(true);
  };

  const columns = [
    {
      key: "paymentNumber",
      label: "Payment No.",
       render: (row: any) => row.paymentNumber ? row.paymentNumber : "-",
    },
    {
      key: "paymentDate",
      label: "Date",
      render: (row: any) => row.paymentDate ? row.paymentDate.slice(0, 10) : "-",
    },
    {
      key: "invoiceNumber",
      label: "Purchase Invoice",
      render: (row: any) => row.lines?.[0]?.purchaseInvoice?.invoiceNumber ||
        row.purchaseInvoice?.invoiceNumber ||
        row.invoiceNumber || row.lines?.[0]?.purchaseInvoiceHeaderId || "-",
    },
    {
      key: "vendor",
      label: "Vendor",
      render: (row: any) => row.vendor?.vendorName || row.vendor?.name || row.vendor?.vendor_name || "-",
    },
    {
      key: "paymentMethodId",
      label: "Mode",
    },
    {
      key: "totalAmount",
      label: "Total Amount",
      render: (row: any) => `₹${Number(row.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    },
    {
      key: "referenceNo",
      label: "Ref / UTR #",
    },
    {
      key: "status",
      label: "Status",
      render: (row: any) => {
        const val = row.status;
        let color:
          | "default"
          | "info"
          | "success"
          | "error" =
          "default";
        if (val === "DRAFT") color = "info";
        if (val === "POSTED") color = "success";
        if (val === "CANCELLED") color = "error";
        return (
          <Chip
            label={val}
            color={color}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: any) => (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
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
          <IconButton
            size="small"
            color="secondary"
            title="GL Impact"
            onClick={() => {
              setSelectedPaymentForGl(row);
              setGlImpactOpen(true);
            }}
          >
            <Assessment fontSize="small" />
          </IconButton>
          {row.status === "DRAFT" && (
            <>
              {canUpdate && (
                <IconButton
                  size="small"
                  color="primary"
                  title="Edit Payment"
                  onClick={() => handleEdit(row)}
                >
                  <Edit fontSize="small" />
                </IconButton>
              )}
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={
                  <CheckCircleOutline />
                }
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
              onClick={() =>
                handleStatusChange(row.id, "CANCELLED")
              }
            >
              Cancel
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: {
          sm: "100%",
          md: "1810px",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight="bold"
          >
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
      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
        }}
      >
        <DynamicTable
          columns={columns}
          data={payments}
          getRowId={(row: any) => String(row.id || row._id)}
        />
      </Paper>
      <Dialog
        open={isOpen}
        onClose={() => setOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            borderBottom: "1px solid #eee",
          }}
        >
          {isEdit ? "Edit Purchase Payment" : "Create New Purchase Payment"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <form onSubmit={formik.handleSubmit}>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ mt: 1, mb: 2 }}
            >
              Payment & Invoice Details
            </Typography>
            <Grid
              container
              spacing={2}
            >
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl
                  fullWidth
                  size="small"
                  error={formik.touched.purchaseInvoiceHeaderId &&
                    Boolean(formik.errors.purchaseInvoiceHeaderId)
                  }
                >
                  <FormLabel>
                    Purchase Invoice *
                  </FormLabel>
                  <Select
                    name="purchaseInvoiceHeaderId"
                    value={formik.values.purchaseInvoiceHeaderId}
                    onChange={(e) => handleInvoiceSelect(e.target.value)}
                  >
                    <MenuItem value="">
                      Select Purchase Invoice
                    </MenuItem>
                    {allInvoices?.filter((inv: any) => inv.status === "POSTED" || inv.status === "PARTIAL_PAID")
                      .filter((inv: any) => inv.balanceAmount === undefined || Number(inv.balanceAmount) > 0
                      ).map((invoice: any) => (
                        <MenuItem
                          key={invoice.id}
                          value={invoice.id}
                        >
                          {invoice.invoiceNumber || `Invoice #${invoice.id}`}
                          {" — "} ₹ {Number(invoice.balanceAmount ?? invoice.totalAmount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, })}
                        </MenuItem>
                      ))}
                  </Select>
                  {formik.touched.purchaseInvoiceHeaderId && (
                    <FormHelperText>
                      {formik.errors.purchaseInvoiceHeaderId}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Invoice Number</FormLabel>
                  <TextField
                    size="small"
                    value={formik.values.invoiceNumber}
                    disabled
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Vendor Invoice Number</FormLabel>
                  <TextField
                    size="small"
                    value={formik.values.vendorInvoiceNumber}
                    disabled
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Vendor</FormLabel>
                  <TextField
                    size="small"
                    value={formik.values.vendorName}
                    disabled
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Invoice Date</FormLabel>
                  <TextField
                    type="date"
                    size="small"
                    value={formik.values.invoiceDate}
                    disabled
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Purchase Order</FormLabel>
                  <TextField
                    size="small"
                    value={formik.values.purchaseOrderNumber}
                    disabled
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Invoice Total</FormLabel>
                  <TextField
                    size="small"
                    value={`₹${Number(formik.values.invoiceTotalAmount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}`}
                    disabled
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Already Paid</FormLabel>
                  <TextField
                    size="small"
                    value={`₹${Number(formik.values.invoicePaidAmount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}`}
                    disabled
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Balance Due</FormLabel>
                  <TextField
                    size="small"
                    value={`₹${Number(formik.values.invoiceBalanceAmount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}`}
                    disabled
                    sx={{ "& .MuiInputBase-input": { fontWeight: "bold" } }}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Invoice Status</FormLabel>
                  <TextField
                    size="small"
                    value={formik.values.invoiceStatus}
                    disabled
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Currency</FormLabel>
                  <TextField
                    size="small"
                    value={formik.values.currency}
                    disabled
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Exchange Rate</FormLabel>
                  <TextField
                    type="number"
                    size="small"
                    value={formik.values.exchangeRate}
                    disabled
                  />
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ mb: 2 }}
            > Payment Details</Typography>

            <Grid container spacing={2} >
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl
                  fullWidth
                  size="small"
                >
                  <Grid>
                <FormControl fullWidth>
                  <FormLabel>Payment Number</FormLabel>
                  <TextField
                    name="paymentNumber"
                    size="small"
                    placeholder="e.g. UTR12345678"
                    value={formik.values.paymentNumber}
                    onChange={formik.handleChange}
                    error={formik.touched.paymentNumber &&
                      Boolean(formik.errors.paymentNumber)
                    }
                  />
                </FormControl>
              </Grid>
                  <FormLabel>Payment Date *</FormLabel>
                  <TextField
                    type="date"
                    name="paymentDate"
                    size="small"
                    value={formik.values.paymentDate}
                    onChange={formik.handleChange}
                    error={formik.touched.paymentDate &&
                      Boolean(formik.errors.paymentDate)
                    }
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth  size="small"
                >
                  <FormLabel>Payment Method *</FormLabel>
                  <Select
                    name="paymentMethodId"
                    value={formik.values.paymentMethodId}
                    onChange={formik.handleChange}
                  >
                    {/* <MenuItem value="Bank Transfer">Bank Transfer / NEFT /RTGS</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Credit Card">Credit Card</MenuItem> */}
                    <MenuItem value="">Select Payment</MenuItem>
                    {paymentMethods?.map(
                      (pay: any) => (
                        <MenuItem
                          key={pay?.id}
                          value={pay?.id}
                        >
                          {pay?.name}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl
                  fullWidth
                  size="small"
                  error={formik.touched.bankAccountId && Boolean(formik.errors.bankAccountId)}
                >
                  <FormLabel>Paying Bank / Cash Account *</FormLabel>
                  <Select
                    name="bankAccountId"
                    value={formik.values.bankAccountId}
                    onChange={formik.handleChange}
                  >
                    <MenuItem value="">Select Account</MenuItem>
                    {bankAccounts?.map(
                      (acc: any) => (
                        <MenuItem
                          key={acc?.id}
                          value={acc?.id}
                        >
                          {acc?.account_name} ({acc?.account_number})
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Payment Amount *</FormLabel>
                  <TextField
                    type="number"
                    name="totalAmount"
                    size="small"
                    value={formik.values.totalAmount}
                    onChange={(e) => handlePaymentAmountChange(e.target.value)}
                    inputProps={{
                      min: 0,
                      max: formik.values.invoiceBalanceAmount,
                    }}
                    error={formik.touched.totalAmount && Boolean(formik.errors.totalAmount)
                    }
                    helperText={
                      formik.touched.totalAmount
                        ? formik.errors.totalAmount
                        : `Maximum payable: ₹${Number(
                          formik.values.invoiceBalanceAmount || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          }
                          )}`
                    }
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
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
              {/* <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel> Payment Status</FormLabel>
                  <TextField
                    size="small"
                    value={formik.values.status}
                    disabled
                  />
                </FormControl>
              </Grid> */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
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

            <Divider sx={{ my: 3 }} />

            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ mb: 1 }}
            >Purchase Order Line Items
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Line items associated with the
              Purchase Order of the selected
              Purchase Invoice.
            </Typography>

            {formik.values.purchaseOrderLines.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: "center",
                }}
              >
                <Typography color="text.secondary">
                  {formik.values.purchaseInvoiceHeaderId
                    ? "No Purchase Order line items found for this invoice."
                    : "Select a Purchase Invoice to view Purchase Order line items."}
                </Typography>
              </Paper>
            ) : (
              <TableContainer
                component={Paper}
                variant="outlined"
              >
                <Table
                  size="small"
                  sx={{ minWidth: 1000 }}
                >
                  <TableHead
                    sx={{ backgroundColor: "#f5f5f5" }}
                  >
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Item</TableCell>
                      <TableCell>SKU / Code</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Discount</TableCell>
                      <TableCell align="right">Tax</TableCell>
                      <TableCell align="right">Line Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formik.values.purchaseOrderLines.map((line, index) => (
                      <TableRow
                        key={line.id || index}
                      >
                        <TableCell>{line.lineNumber || index + 1}</TableCell>
                        <TableCell><Typography fontWeight="bold">{line.itemName || "-"}</Typography></TableCell>
                        <TableCell>{line.sku || line.itemCode || "-"}</TableCell>
                        <TableCell>{line.description || "-"}</TableCell>
                        <TableCell align="right">{Number(line.quantity || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">
                          ₹ {Number(line.unitPrice || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          }
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {Number(line.discountAmount || 0).toFixed(2)}
                          {Number(line.discountPercent || 0) > 0 && ` (${Number(line.discountPercent).toFixed(2)}%)`}
                        </TableCell>
                        <TableCell align="right">
                          ₹{Number(line.taxAmount || 0).toFixed(2)}
                          {Number(line.taxPercent || 0) > 0 &&
                            ` (${Number(line.taxPercent).toFixed(2)}%)`}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: "bold" }}
                        >
                          ₹ {Number(line.lineTotal || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          }
                          )}
                        </TableCell>
                      </TableRow>
                    )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ mb: 2 }}
            >Payment Allocation</Typography>
            <TableContainer
              component={Paper}
              variant="outlined"
            >
              <Table size="small">
                <TableHead
                  sx={{ backgroundColor: "#f5f5f5" }}
                >
                  <TableRow>
                    <TableCell>Purchase Invoice</TableCell>
                    <TableCell>Invoice Total</TableCell>
                    <TableCell>Balance Due</TableCell>
                    <TableCell>Payment Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formik.values.purchaseInvoiceHeaderId ? (
                    <TableRow>
                      <TableCell>
                        <Typography fontWeight="bold">{formik.values.invoiceNumber}</Typography>
                      </TableCell>
                      <TableCell>
                        ₹{Number(formik.values.invoiceTotalAmount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        }
                        )}
                      </TableCell>
                      <TableCell sx={{ color: "error.main", fontWeight: "bold", }}>
                        ₹
                        {Number(formik.values.invoiceBalanceAmount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        }
                        )}
                      </TableCell>
                      <TableCell sx={{ color: "success.main", fontWeight: "bold" }}>
                        ₹{Number(formik.values.totalAmount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        }
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                      >
                        <Typography color="text.secondary">
                          Select a Purchase
                          Invoice to
                          create payment
                          allocation.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box
              sx={{
                mt: 3,
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
              }}
            >
              <Button
                onClick={() => setOpen(false)}
                color="inherit"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!formik.values.purchaseInvoiceHeaderId}
              >
                {isEdit ? "Update Payment" : "Save Payment"}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: "1px solid #eee" }}>Payment Details -{" "} {selectedPayment?.paymentNumber}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedPayment && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">Payment Number</Typography>
                <Typography fontWeight="bold">{selectedPayment.paymentNumber}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">Purchase Invoice</Typography>
                <Typography fontWeight="bold">
                  {selectedPayment.lines?.[0]?.purchaseInvoice?.invoiceNumber ||
                    selectedPayment.invoiceNumber || selectedPayment.lines?.[0]?.purchaseInvoiceLineId || "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">Vendor</Typography>
                <Typography fontWeight="bold">
                  {selectedPayment.vendor?.vendor_name || selectedPayment.vendor?.vendor_name || "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">Payment Date</Typography>
                <Typography fontWeight="bold">
                  {selectedPayment.paymentDate?.slice(0, 10) ||"-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                <Typography fontWeight="bold">{selectedPayment.paymentMethodId}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Reference / UTR
                </Typography>
                <Typography fontWeight="bold">
                  {
                    selectedPayment.referenceNo
                  }
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Status
                </Typography>
                <Box>
                  <Chip
                    label={
                      selectedPayment.status
                    }
                    color="primary"
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Total Amount
                </Typography>
                <Typography
                  fontWeight="bold"
                  color="success.main"
                >
                  ₹
                  {Number(
                    selectedPayment.totalAmount ||
                    0
                  ).toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Currency
                </Typography>
                <Typography fontWeight="bold">
                  {
                    selectedPayment.currency ||
                    "INR"
                  }
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />

                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mb: 1 }}
                >
                  Allocated Invoice
                </Typography>

                <TableContainer
                  component={Paper}
                  variant="outlined"
                >
                  <Table size="small">
                    <TableHead
                      sx={{
                        backgroundColor:
                          "#f5f5f5",
                      }}
                    >
                      <TableRow>
                        <TableCell>
                          Invoice #
                        </TableCell>

                        <TableCell align="right">
                          Amount Paid
                        </TableCell>

                        <TableCell>
                          Remarks
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {selectedPayment.lines?.map(
                        (
                          line: any,
                          idx: number
                        ) => (
                          <TableRow
                            key={idx}
                          >
                            <TableCell>
                              {line
                                .purchaseInvoice
                                ?.invoiceNumber ||
                                line.purchaseInvoiceLineId}
                            </TableCell>

                            <TableCell
                              align="right"
                              sx={{
                                fontWeight:
                                  "bold",
                              }}
                            >
                              ₹
                              {Number(
                                line.amountPaid ||
                                0
                              ).toFixed(
                                2
                              )}
                            </TableCell>

                            <TableCell>
                              {line.remarks ||
                                "-"}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* GL Impact Modal */}
      <Dialog open={glImpactOpen} onClose={() => setGlImpactOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>GL Impact - Payment Disbursement Voucher</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ py: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" mb={2}>
              GL posting breakdown for vendor <strong>{glVendorName}</strong>:
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Debit (DR)</TableCell>
                    <TableCell align="right">Credit (CR)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isJournalLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Loading GL entries...
                      </TableCell>
                    </TableRow>
                  ) : journalEntriesData?.result?.lines?.length ? (
                    <>
                      {journalEntriesData.result.lines.map((line: any, idx: number) => (
                        <TableRow key={line.id || idx}>
                          <TableCell>
                            <strong>
                              {line.account ? `${line.account.account_number} - ${line.account.account_name}` : line.account_name || `Account #${line.account_id}`}
                            </strong>
                          </TableCell>
                          <TableCell>{line.narration || line.memo || line.description || "-"}</TableCell>
                          <TableCell align="right" sx={{ color: Number(line.debit_amount || line.debit) > 0 ? "success.main" : "inherit", fontWeight: Number(line.debit_amount || line.debit) > 0 ? "bold" : "normal" }}>
                            {Number(line.debit_amount || line.debit || 0) > 0
                              ? `₹${Number(line.debit_amount || line.debit).toLocaleString()}`
                              : "-"}
                          </TableCell>
                          <TableCell align="right" sx={{ color: Number(line.credit_amount || line.credit) > 0 ? "error.main" : "inherit", fontWeight: Number(line.credit_amount || line.credit) > 0 ? "bold" : "normal" }}>
                            {Number(line.credit_amount || line.credit || 0) > 0
                              ? `₹${Number(line.credit_amount || line.credit).toLocaleString()}`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: "grey.100" }}>
                        <TableCell colSpan={2} align="right">
                          <strong>Total</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>
                            ₹{Number(journalEntriesData?.result?.total_debit ?? 0).toLocaleString()}
                          </strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>
                            ₹{Number(journalEntriesData?.result?.total_credit ?? 0).toLocaleString()}
                          </strong>
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <>
                      <TableRow>
                        <TableCell><strong>Accounts Payable - {glVendorName}</strong></TableCell>
                        <TableCell>Reducing vendor liability</TableCell>
                        <TableCell align="right" sx={{ color: "success.main", fontWeight: "bold" }}>
                          ₹{Number(selectedPaymentForGl?.totalAmount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">-</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <strong>
                            {selectedPaymentForGl?.bankAccount
                              ? `${selectedPaymentForGl.bankAccount.account_name} (${selectedPaymentForGl.bankAccount.account_number})`
                              : selectedPaymentForGl?.paymentMethod?.name
                              ? `${selectedPaymentForGl.paymentMethod.name} Account`
                              : "Bank / Cash Account"}
                          </strong>
                        </TableCell>
                        <TableCell>Outward payment disbursement</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right" sx={{ color: "error.main", fontWeight: "bold" }}>
                          ₹{Number(selectedPaymentForGl?.totalAmount || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => setGlImpactOpen(false)}>Close</Button>
        </Box>
      </Dialog>

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      <Dialog
        open={deleteDialogOpen}
        onClose={() =>
          setDeleteDialogOpen(false)
        }
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete
            payment record{" "}
            <strong>
              {
                paymentToDelete?.paymentNumber
              }
            </strong>
            ?
          </Typography>

          <Box
            sx={{
              mt: 3,
              display: "flex",
              justifyContent:
                "flex-end",
              gap: 2,
            }}
          >
            <Button
              onClick={() =>
                setDeleteDialogOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}