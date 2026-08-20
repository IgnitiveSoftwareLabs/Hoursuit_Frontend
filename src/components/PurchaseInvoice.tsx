import React, { useMemo, useState } from "react";

import {
  Add,
  Assessment,
  Cancel,
  CheckCircleOutline,
  Delete,
  Edit,
  Payments,
  RemoveCircleOutline,
} from "@mui/icons-material";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import * as Yup from "yup";
import {
  Box,
  Button,
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

import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";
import { useGetVendorsQuery } from "../RTK/services/vendorApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import { useGetChartOfAccountsQuery } from "../RTK/services/chartOfAccountApi";
import { usePostJournalEntryMutation, useGetJournalEntryByIdQuery } from "../RTK/services/journalEntryApi";
import { useAppSelector } from "../Hooks/Reduxhook/hooks";
import { usePermissions } from "../Hooks/usePermissions";
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
import {
  useCreatePurchaseInvoiceMutation,
  useDeletePurchaseInvoiceMutation,
  useGetGRNsQuery,
  useGetPurchaseInvoicesQuery,
  useGetPurchaseOrdersQuery,
  useUpdatePurchaseInvoiceMutation,
  useUpdatePurchaseInvoiceStatusMutation,
} from "../RTK/services/purchaseApi";
import DynamicTable from "./Tables";
import { useNavigate } from "react-router-dom";

const STATUS_OPTIONS = [
  "DRAFT",
  "POSTED",
  "PARTIAL_PAID",
  "PAID",
  "CANCELLED",
] as const;

type PurchaseInvoiceStatus = (typeof STATUS_OPTIONS)[number];

interface PurchaseInvoiceHeaderForm {
  invoiceNumber: string;
  invoiceType: string;
  vendorInvoiceNumber: string;
  poHeaderId: string;
  grnHeaderId: string;
  vendorId: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  exchangeRate: number;
  freightAmount: number;
  otherCharges: number;
  paidAmount: number;
  status: PurchaseInvoiceStatus;
  remarks: string;
  user_id: number | string;
}

interface PurchaseInvoiceLineForm {
  invoiceHeaderId: string;
  poLineId: string;
  grnLineId: string;
  itemId: string;
  description: string;
  batchNo: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  lineTotal: number;
  user_id: number | string;
  remarks: string;
}

const makeLineItem = (userId: number | string): PurchaseInvoiceLineForm => ({
  invoiceHeaderId: "",
  poLineId: "",
  grnLineId: "",
  itemId: "",
  description: "",
  batchNo: "",
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
  discountAmount: 0,
  taxPercent: 0,
  taxAmount: 0,
  lineTotal: 0,
  user_id: userId,
  remarks: "",
});

type LineCalc = {
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  lineTotal: number;
};

const calculateLine = (line: PurchaseInvoiceLineForm): LineCalc => {
  const quantity = Number(line.quantity) || 0;
  const unitPrice = Number(line.unitPrice) || 0;
  const discountPercent = Number(line.discountPercent) || 0;
  const taxPercent = Number(line.taxPercent) || 0;

  const gross = quantity * unitPrice;
  const discountAmount = (gross * discountPercent) / 100;
  const taxable = gross - discountAmount;
  const taxAmount = (taxable * taxPercent) / 100;
  const lineTotal = taxable + taxAmount;

  return {
    quantity,
    unitPrice,
    discountPercent,
    discountAmount: Number(discountAmount.toFixed(2)),
    taxPercent,
    taxAmount: Number(taxAmount.toFixed(2)),
    lineTotal: Number(lineTotal.toFixed(2)),
  };
};

const calculateHeaderSummary = (
  lines: PurchaseInvoiceLineForm[],
  freightAmount: number,
  otherCharges: number,
  paidAmount: number
) => {
  let subtotal = 0;
  let taxAmount = 0;
  let discountAmount = 0;

  lines.forEach((line) => {
    const computed = calculateLine(line);
    subtotal += computed.quantity * computed.unitPrice;
    taxAmount += computed.taxAmount;
    discountAmount += computed.discountAmount;
  });

  const totalAmount =
    subtotal - discountAmount + taxAmount + (Number(freightAmount) || 0) + (Number(otherCharges) || 0);
  const balanceAmount = totalAmount - (Number(paidAmount) || 0);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    balanceAmount: Number(balanceAmount.toFixed(2)),
  };
};

const PurchaseInvoiceComp: React.FC = () => {
  const navigate = useNavigate();
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const userId = currentUser?.id ?? "";

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);

  // const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  // const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  // const [paymentAmount, setPaymentAmount] = useState<number>(0);
  // const [paymentAccountId, setPaymentAccountId] = useState<string | number>("");
  // const [paymentMode, setPaymentMode] = useState<string>("Bank Transfer");
  const [cancelInvoiceOpen, setCancelInvoiceOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<any>(null);

  const [glImpactModalOpen, setGlImpactModalOpen] = useState(false);
  const [selectedInvoiceForGl, setSelectedInvoiceForGl] = useState<any>(null);

  const { data: purchaseInvoicesData } = useGetPurchaseInvoicesQuery({ page: 1, limit: 20 });
  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery({ page: 1, limit: 50 }, { skip: !isOpen });
  const { data: grnsData } = useGetGRNsQuery({ page: 1, limit: 50 }, { skip: !isOpen });
  const { data: vendorsData } = useGetVendorsQuery({ option: true }, { skip: !isOpen });
  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 100 }, { skip: !isOpen });
  const { data: currenciesData } = useGetCurrenciesQuery(undefined, { skip: !isOpen });
  const { data: chartOfAccountsData } = useGetChartOfAccountsQuery(undefined, { skip: !isOpen });
  const { data: invoiceGlData } = useGetJournalEntryByIdQuery(
    { id: selectedInvoiceForGl?.id, source: "PurchaseInvoice" },
    { skip: !glImpactModalOpen || !selectedInvoiceForGl?.id }
  );

  const [createPurchaseInvoice] = useCreatePurchaseInvoiceMutation();
  const [updatePurchaseInvoice] = useUpdatePurchaseInvoiceMutation();
  const [updatePurchaseInvoiceStatus] = useUpdatePurchaseInvoiceStatusMutation();
  const [deletePurchaseInvoice] = useDeletePurchaseInvoiceMutation();
  // const [postJournalEntry] = usePostJournalEntryMutation();

  const purchaseInvoices = Array.isArray(purchaseInvoicesData)
    ? purchaseInvoicesData
    : purchaseInvoicesData?.result ?? [];
  const purchaseOrders = Array.isArray(purchaseOrdersData)
    ? purchaseOrdersData
    : purchaseOrdersData?.result ?? [];
  const grns = Array.isArray(grnsData) ? grnsData : grnsData?.result ?? [];
  const vendors = Array.isArray(vendorsData) ? vendorsData : vendorsData?.result ?? [];
  const items = Array.isArray(itemsData) ? itemsData : itemsData?.result ?? [];
  const currencies = Array.isArray(currenciesData)
    ? currenciesData
    : currenciesData?.result ?? [];
  const chartOfAccounts = useMemo(
    () =>
      Array.isArray(chartOfAccountsData?.result)
        ? chartOfAccountsData.result
        : Array.isArray(chartOfAccountsData?.result)
          ? chartOfAccountsData.result
          : Array.isArray(chartOfAccountsData)
            ? chartOfAccountsData
            : [],
    [chartOfAccountsData]
  );

  const handleStatusChange = async (id: number | string, newStatus: string) => {
    try {
      await updatePurchaseInvoiceStatus({ id, body: { status: newStatus } }).unwrap();
      toast.success(`Invoice status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update Invoice status");
    }
  };

  const handleInvoiceCancelRequest = (invoice: any) => {
    setInvoiceToCancel(invoice);
    setCancelInvoiceOpen(true);
  };

  const handleConfirmCancelInvoice = async () => {
    if (!invoiceToCancel) return;
    await handleStatusChange(invoiceToCancel.id, "CANCELLED");
    setCancelInvoiceOpen(false);
    setInvoiceToCancel(null);
  };

  // const handleRecordPaymentSubmit = async () => {
  //   if (!selectedInvoiceForPayment || !paymentAmount || paymentAmount <= 0) {
  //     toast.error("Please enter a valid payment amount");
  //     return;
  //   }

  //   const maxAmount = Number(selectedInvoiceForPayment.balanceAmount ?? selectedInvoiceForPayment.totalAmount ?? 0);
  //   if (paymentAmount > maxAmount) {
  //     toast.error("Payment amount cannot exceed remaining balance");
  //     return;
  //   }

  //   try {
  //     await postJournalEntry({
  //       entry_date: new Date().toISOString().split("T")[0],
  //       reference_no: `PI-${selectedInvoiceForPayment.invoiceNumber || selectedInvoiceForPayment.id}`,
  //       narration: `Vendor payment for Invoice #${selectedInvoiceForPayment.invoiceNumber || selectedInvoiceForPayment.id}`,
  //       invoiceHeaderId: selectedInvoiceForPayment.id,
  //       lines: [
  //         {
  //           account_id: selectedInvoiceForPayment.vendor?.account_id || 2000,
  //           debit: paymentAmount,
  //           credit: 0,
  //           memo: `Payment for Invoice #${selectedInvoiceForPayment.invoiceNumber || selectedInvoiceForPayment.id}`,
  //           reference_no: String(selectedInvoiceForPayment.id),
  //         },
  //         {
  //           account_id: paymentAccountId || 1000,
  //           debit: 0,
  //           credit: paymentAmount,
  //           memo: `Payment out via ${paymentMode}`,
  //         },
  //       ],
  //     }).unwrap();

  //     toast.success("Vendor payment posted successfully!");
  //     setPaymentModalOpen(false);
  //     setSelectedInvoiceForPayment(null);
  //     setPaymentAmount(0);
  //     setPaymentAccountId("");
  //     setPaymentMode("Bank Transfer");
  //   } catch (error: any) {
  //     toast.error(error?.data?.message || "Failed to post vendor payment");
  //   }
  // };

  const formik = useFormik<{
    header: PurchaseInvoiceHeaderForm;
    lineItems: PurchaseInvoiceLineForm[];
  }>({
    initialValues: {
      header: {
        invoiceNumber: "",
        invoiceType: "",
        vendorInvoiceNumber: "",
        poHeaderId: "",
        grnHeaderId: "",
        vendorId: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        currency: "INR",
        exchangeRate: 1,
        freightAmount: 0,
        otherCharges: 0,
        paidAmount: 0,
        status: "DRAFT",
        remarks: "",
        user_id: userId,
      },
      lineItems: [makeLineItem(userId)],
    },
    validationSchema: Yup.object({
      header: Yup.object({
        invoiceNumber: Yup.string().nullable(),
        invoiceType: Yup.string().required("Invoice Type is required"),
        invoiceDate: Yup.date().required("Invoice Date is required"),
        currency: Yup.string().nullable(),
        exchangeRate: Yup.number().min(0, "Exchange rate cannot be negative").nullable(),
        status: Yup.string().nullable(),
      }),
      lineItems: Yup.array()
        .of(
          Yup.object({
            itemId: Yup.string().required("Item is required"),
            quantity: Yup.number().moreThan(0, "Quantity must be greater than 0").required("Quantity is required"),
            unitPrice: Yup.number().min(0, "Unit price cannot be negative").required("Unit price is required"),
            discountPercent: Yup.number().min(0, "Discount % cannot be negative").max(100, "Discount % cannot exceed 100"),
            taxPercent: Yup.number().min(0, "Tax % cannot be negative").max(100, "Tax % cannot exceed 100"),
          })
        )
        .min(1, "At least one invoice line is required"),
    }),
    onSubmit: async (values) => {
      try {
        const summary = calculateHeaderSummary(
          values.lineItems,
          0,
          0,
          values.header.paidAmount
        );

        const payload = {
          header: {
            invoiceNumber: values.header.invoiceNumber || undefined,
            invoiceType: values.header.invoiceType || "Standard Bill",
            vendorInvoiceNumber: values.header.vendorInvoiceNumber || undefined,
            poHeaderId: values.header.poHeaderId ? Number(values.header.poHeaderId) : null,
            grnHeaderId: values.header.grnHeaderId ? Number(values.header.grnHeaderId) : null,
            vendorId: values.header.vendorId ? Number(values.header.vendorId) : null,
            invoiceDate: values.header.invoiceDate,
            dueDate: values.header.dueDate || null,
            currency: values.header.currency || "INR",
            exchangeRate: Number(values.header.exchangeRate) || 1,
            subtotal: summary.subtotal,
            taxAmount: summary.taxAmount,
            discountAmount: summary.discountAmount,
            freightAmount: 0,
            otherCharges: 0,
            totalAmount: summary.totalAmount,
            paidAmount: Number(values.header.paidAmount) || 0,
            balanceAmount: summary.balanceAmount,
            status: "DRAFT",
            remarks: values.header.remarks || null,
            user_id: Number(userId || values.header.user_id) || null,
          },
          lineItems: values.lineItems.map((line) => {
            const computed = calculateLine(line);
            return {
              invoiceHeaderId: line.invoiceHeaderId ? Number(line.invoiceHeaderId) : undefined,
              poLineId: line.poLineId ? Number(line.poLineId) : null,
              grnLineId: line.grnLineId ? Number(line.grnLineId) : null,
              itemId: Number(line.itemId),
              description: line.description || null,
              batchNo: line.batchNo || null,
              quantity: computed.quantity,
              unitPrice: computed.unitPrice,
              discountPercent: computed.discountPercent,
              discountAmount: computed.discountAmount,
              taxPercent: computed.taxPercent,
              taxAmount: computed.taxAmount,
              lineTotal: computed.lineTotal,
              user_id: Number(userId || line.user_id) || null,
              remarks: line.remarks || null,
            };
          }),
        };

        if (isEdit && editId) {
          await updatePurchaseInvoice({ id: editId, body: payload }).unwrap();
          toast.success("Purchase invoice updated successfully");
        } else {
          await createPurchaseInvoice(payload).unwrap();
          toast.success("Purchase invoice created successfully");
        }
        setOpen(false);
        setIsEdit(false);
        setEditId(null);
        formik.resetForm();
      } catch (error: any) {
        toast.error(error?.data?.message || "Unable to save purchase invoice");
      }
    },
  });

  const canReadPurchaseInvoice = canRead("purchase_invoice") || canRead("purchase");
  const canCreatePurchaseInvoice = canCreate("purchase_invoice") || canCreate("purchase");

  const getFieldError = (field: string) => {
    const error = field.split(".").reduce((obj: any, key: string) => obj?.[key], formik.errors);
    const touched = field.split(".").reduce((obj: any, key: string) => obj?.[key], formik.touched);
    return touched && error ? String(error) : "";
  };

  const updateLineItemField = (index: number, field: keyof PurchaseInvoiceLineForm, value: any) => {
    const lineItems = [...formik.values.lineItems];
    const updated = { ...lineItems[index], [field]: value };
    const computed = calculateLine(updated);
    lineItems[index] = {
      ...updated,
      discountAmount: computed.discountAmount,
      taxAmount: computed.taxAmount,
      lineTotal: computed.lineTotal,
      user_id: userId,
    };
    formik.setFieldValue("lineItems", lineItems);
  };

  const handlePOChange = (poId: string) => {
    const selectedPO = purchaseOrders.find(
      (po: any) => String(po.id ?? po._id) === String(poId)
    );

    if (!selectedPO) {
      formik.setFieldValue("header.poHeaderId", "");
      formik.setFieldValue("header.grnHeaderId", "");
      formik.setFieldValue("header.vendorId", "");
      formik.setFieldValue("header.currency", "INR");
      formik.setFieldValue("lineItems", [makeLineItem(userId)]);
      return;
    }

    // Find GRN belonging to selected PO
    const selectedGRN = grns.find(
      (grn: any) =>
        String(grn.purchaseOrderId ?? grn.purchase_order_id) === String(poId)
    );

    // Find PO lines
    const poLines =
      selectedPO.lines ??
      selectedPO.lineItems ??
      selectedPO.purchaseOrderLines ??
      selectedPO.purchase_order_lines ??
      [];

    formik.setFieldValue("header.poHeaderId", poId);

    // Automatically select GRN
    formik.setFieldValue(
      "header.grnHeaderId",
      selectedGRN
        ? String(selectedGRN.id ?? selectedGRN._id)
        : ""
    );

    // Automatically select Vendor
    formik.setFieldValue(
      "header.vendorId",
      selectedPO.vendorId ?? selectedPO.vendor_id
        ? String(selectedPO.vendorId ?? selectedPO.vendor_id)
        : ""
    );

    // Automatically select Currency
    formik.setFieldValue(
      "header.currency",
      selectedPO.currency ?? selectedPO.currency_code ?? "INR"
    );

    // Automatically create invoice lines from PO lines
    const invoiceLines = poLines.map((line: any) => ({
      ...makeLineItem(userId),
      poLineId: String(line.id ?? line.poLineId ?? line.po_line_id ?? ""),
      itemId: String(line.itemId ?? line.item_id ?? line.item?.id ?? ""),
      description: line.description ?? line.item?.item_name ?? line.item?.item_desc ?? "",
      quantity: Number(line.quantity ?? line.qty ?? 1),
      unitPrice: Number(line.unitPrice ?? line.unit_price ?? line.rate ?? 0),
      discountPercent: Number(line.discountPercent ?? line.discount_percent ?? 0),
      taxPercent: Number(line.taxPercent ?? line.tax_percent ?? line.tax_rate ?? 0),
      grnLineId: "",
    }));

    formik.setFieldValue(
      "lineItems",
      invoiceLines.length ? invoiceLines : [makeLineItem(userId)]
    );
  };

  const handleGRNChange = (grnId: string) => {
    if (!grnId) {
      formik.setFieldValue("header.grnHeaderId", "");
      formik.setFieldValue("header.poHeaderId", "");
      formik.setFieldValue("header.vendorId", "");
      formik.setFieldValue("lineItems", [makeLineItem(userId)]);
      return;
    }

    const selectedGRN = grns.find(
      (grn: any) => String(grn.id ?? grn._id) === String(grnId)
    );

    if (!selectedGRN) return;

    formik.setFieldValue("header.grnHeaderId", String(grnId));

    const linkedPoId = selectedGRN.purchaseOrderId ?? selectedGRN.purchase_order_id ?? selectedGRN.purchaseOrder?.id;
    if (linkedPoId) {
      formik.setFieldValue("header.poHeaderId", String(linkedPoId));
    }

    const selectedPO = linkedPoId ? purchaseOrders.find((po: any) => String(po.id ?? po._id) === String(linkedPoId)) : null;
    const vendorId = selectedGRN.vendor_id ?? selectedGRN.vendorId ?? selectedGRN.purchaseOrder?.vendor_id ?? selectedPO?.vendorId ?? selectedPO?.vendor_id;

    if (vendorId) {
      formik.setFieldValue("header.vendorId", String(vendorId));
    }

    formik.setFieldValue("header.currency", selectedPO?.currency ?? selectedGRN.purchaseOrder?.currency ?? "INR");

    const grnLines = selectedGRN.lineItems ?? selectedGRN.grnLines ?? selectedGRN.line_items ?? [];
    if (Array.isArray(grnLines) && grnLines.length > 0) {
      const invoiceLines = grnLines.map((line: any) => {
        const qty = Number(line.acceptedQty > 0 ? line.acceptedQty : (line.receivedQty || line.orderedQty || 1));
        const rate = Number(line.purchaseOrderLine?.rate || line.item?.cost_price || line.item?.default_rate || 0);
        const lineItem = {
          ...makeLineItem(userId),
          grnLineId: String(line.id ?? line.grnLineId ?? ""),
          poLineId: String(line.purchaseOrderLineId ?? line.purchase_order_line_id ?? ""),
          itemId: String(line.itemId ?? line.item_id ?? line.item?.id ?? ""),
          description: line.item?.item_name || line.item?.item_desc || "",
          quantity: qty,
          unitPrice: rate,
          discountPercent: 0,
          taxPercent: 0,
        };
        const computed = calculateLine(lineItem);
        return {
          ...lineItem,
          discountAmount: computed.discountAmount,
          taxAmount: computed.taxAmount,
          lineTotal: computed.lineTotal,
        };
      });
      formik.setFieldValue("lineItems", invoiceLines);
    }
  };

  const handleAddLineItem = () => {
    formik.setFieldValue("lineItems", [...formik.values.lineItems, makeLineItem(userId)]);
  };

  const handleRemoveLineItem = (index: number) => {
    const lineItems = [...formik.values.lineItems];
    lineItems.splice(index, 1);
    formik.setFieldValue("lineItems", lineItems.length ? lineItems : [makeLineItem(userId)]);
  };

  const summary = useMemo(
    () =>
      calculateHeaderSummary(
        formik.values.lineItems,
        formik.values.header.freightAmount,
        formik.values.header.otherCharges,
        formik.values.header.paidAmount
      ),
    [formik.values.lineItems, formik.values.header.freightAmount, formik.values.header.otherCharges, formik.values.header.paidAmount]
  );

  const handleEdit = (invoice: any) => {
    if (!canUpdate("purchase_invoice") && !canUpdate("purchase")) {
      toast.error("No permission to edit purchase invoice");
      return;
    }

    const formatDateForInput = (dateVal: any) => {
      if (!dateVal) return "";
      try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
      } catch {
        return "";
      }
    };

    const header = invoice?.header ?? invoice;
    if (String(header?.status || "").toUpperCase() !== "DRAFT") {
      toast.error("Only purchase invoices in DRAFT status can be edited");
      return;
    }
    const lineSource = invoice?.purchaseInvoiceLines ?? invoice?.lineItems ?? invoice?.line_items ?? invoice?.invoiceLines ?? [];

    formik.setValues({
      header: {
        invoiceNumber: header?.invoiceNumber ?? header?.invoice_number ?? "",
        invoiceType: header?.invoiceType ?? header?.invoice_type ?? "",
        vendorInvoiceNumber: header?.vendorInvoiceNumber ?? header?.vendor_invoice_number ?? "",
        poHeaderId: String(header?.poHeaderId ?? header?.po_header_id ?? header?.purchaseOrder?.id ?? ""),
        grnHeaderId: String(header?.grnHeaderId ?? header?.grn_header_id ?? header?.grn?.id ?? ""),
        vendorId: String(header?.vendorId ?? header?.vendor_id ?? header?.vendor?.id ?? ""),
        invoiceDate: formatDateForInput(header?.invoiceDate ?? header?.invoice_date) || new Date().toISOString().split("T")[0],
        dueDate: formatDateForInput(header?.dueDate ?? header?.due_date),
        currency: header?.currency ?? "INR",
        exchangeRate: Number(header?.exchangeRate ?? header?.exchange_rate ?? 1),
        freightAmount: Number(header?.freightAmount ?? header?.freight_amount ?? 0),
        otherCharges: Number(header?.otherCharges ?? header?.other_charges ?? 0),
        paidAmount: Number(header?.paidAmount ?? header?.paid_amount ?? 0),
        status: header?.status ?? "DRAFT",
        remarks: header?.remarks ?? "",
        user_id: header?.user_id ?? userId,
      },
      lineItems: Array.isArray(lineSource) && lineSource.length
        ? lineSource.map((line: any) => ({
          invoiceHeaderId: line?.invoiceHeaderId ?? line?.invoice_header_id ?? "",
          poLineId: line?.poLineId ?? line?.po_line_id ?? "",
          grnLineId: line?.grnLineId ?? line?.grn_line_id ?? "",
          itemId: String(line?.itemId ?? line?.item_id ?? line?.item?.id ?? ""),
          description: line?.description || line?.item?.item_name || line?.item?.item_desc || "",
          batchNo: line?.batchNo ?? line?.batch_no ?? "",
          quantity: Number(line?.quantity ?? line?.qty ?? 1),
          unitPrice: Number(line?.unitPrice ?? line?.unit_price ?? 0),
          discountPercent: Number(line?.discountPercent ?? line?.discount_percent ?? 0),
          discountAmount: Number(line?.discountAmount ?? line?.discount_amount ?? 0),
          taxPercent: Number(line?.taxPercent ?? line?.tax_percent ?? 0),
          taxAmount: Number(line?.taxAmount ?? line?.tax_amount ?? 0),
          lineTotal: Number(line?.lineTotal ?? line?.line_total ?? 0),
          user_id: line?.user_id ?? userId,
          remarks: line?.remarks ?? "",
        }))
        : [makeLineItem(userId)],
    });

    setEditId(invoice?.id ?? invoice?.invoiceHeaderId ?? null);
    setIsEdit(true);
    setOpen(true);
  };

  const handleDeleteRequest = (invoice: any) => {
    if (!canDelete("purchase_invoice") && !canDelete("purchase")) {
      toast.error("No permission to delete purchase invoice");
      return;
    }
    const header = invoice?.header ?? invoice;
    if (String(header?.status || "").toUpperCase() !== "DRAFT") {
      toast.error("Only purchase invoices in DRAFT status can be deleted");
      return;
    }
    setInvoiceToDelete(invoice);
    setDeleteId(invoice?.id ?? null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const targetId = deleteId ?? invoiceToDelete?.id;
    if (!targetId) {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      setDeleteId(null);
      return;
    }

    try {
      await deletePurchaseInvoice(targetId).unwrap();
      toast.success("Purchase invoice deleted successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete purchase invoice");
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      setDeleteId(null);
    }
  };

  const columns = [
    { key: "invoiceNumber", label: "Invoice Number" },
    { key: "invoiceType", label: "Invoice Type" },
    { key: "vendor.vendor_name", label: "Vendor", render: (row: any) => row.vendor?.vendor_name || "N/A" },
    { key: "invoiceDate", label: "Invoice Date", render: (row: any) => new Date(row.invoiceDate).toLocaleDateString() },
    { key: "grnHeaderId", label: "GRN Number", render: (row: any) => row.grn?.grnNo ?? row.grn?.grnNo ?? "N/A" },
    { key: "purchaseNo", label: "Purchase No", render: (row: any) => row.purchaseOrder?.purchaseNo ?? row.purchaseOrder?.purchaseNo ?? "N/A" },
    { key: "balanceAmount", label: "Balance Amount", render: (row: any) => `₹${Number(row.balanceAmount).toLocaleString()}` },
    {
      key: "status", label: "Status", render: (row: any) => (
        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor:
              row.status === "DRAFT" ? "#f5f5f5" :
                row.status === "POSTED" ? "#e3f2fd" :
                  row.status === "PARTIAL_PAID" ? "#fff8e1" :
                    row.status === "PAID" ? "#e8f5e9" : "#fff3e0",
            color:
              row.status === "DRAFT" ? "#616161" :
                row.status === "POSTED" ? "#1976d2" :
                  row.status === "PARTIAL_PAID" ? "#f57f17" :
                    row.status === "PAID" ? "#2e7d32" : "#e65100",
            fontSize: "0.75rem",
            fontWeight: "bold",
            textAlign: "center"
          }}
        >
          {row.status}
        </Box>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: any) => {
        const isDraft = String(row.status || "").toUpperCase() === "DRAFT";
        const isPosted = row.status === "POSTED";
        const isPartial = row.status === "PARTIAL_PAID";
        const isPaid = row.status === "PAID";
        const isCancelled = row.status === "CANCELLED";
        return (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {(canUpdate("purchase_invoice") || canUpdate("purchase")) && isDraft && (
              <IconButton size="small" color="primary" onClick={() => handleEdit(row)} aria-label="Edit invoice">
                <Edit />
              </IconButton>
            )}
            {(canDelete("purchase_invoice") || canDelete("purchase")) && isDraft && (
              <IconButton size="small" color="error" onClick={() => handleDeleteRequest(row)} aria-label="Delete invoice">
                <Delete />
              </IconButton>
            )}
            {isDraft && (
              <IconButton size="small" color="success" onClick={() => handleStatusChange(row.id, "POSTED")} aria-label="Post invoice">
                <CheckCircleOutline />
              </IconButton>
            )}
            {(isPosted || isPartial) && (
              <IconButton
                size="small"
                color="success"
                onClick={() => {
                  navigate(`/purchase-payment`);
                }}
                aria-label="Purchase payments"
                title="Purchase Payments"
              >
                <Payments />
              </IconButton>
            )}
            {!isDraft && !isCancelled && (
              <IconButton
                size="small"
                color="info"
                onClick={() => {
                  setSelectedInvoiceForGl(row);
                  setGlImpactModalOpen(true);
                }}
                aria-label="GL impact"
                title="GL Impact"
              >
                <Assessment />
              </IconButton>
            )}
            {!isCancelled && (
              <IconButton
                size="small"
                color="warning"
                onClick={() => handleInvoiceCancelRequest(row)}
                aria-label="Cancel invoice"
              >
                <Cancel />
              </IconButton>
            )}
          </Box>
        );
      },
    },
  ];

  if (!canReadPurchaseInvoice) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view Purchase Bills.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h3">Purchase Bill</Typography>
          <NavbarBreadcrumbs />
        </Box>
        {canCreatePurchaseInvoice && (
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
            New Purchase Bill
          </Button>
        )}
      </Box>

      <DynamicTable
        columns={columns}
        data={purchaseInvoices}
        getRowId={(row: any) => row.id}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this purchase bill?</Typography>
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

      {/* <Dialog open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="subtitle2">Invoice: {selectedInvoiceForPayment?.invoiceNumber || selectedInvoiceForPayment?.id}</Typography>
            <Typography variant="body2">Remaining balance: ₹{Number(selectedInvoiceForPayment?.balanceAmount ?? selectedInvoiceForPayment?.totalAmount ?? 0).toLocaleString()}</Typography>
            <FormControl fullWidth>
              <FormLabel>Payment Amount</FormLabel>
              <TextField
                type="number"
                size="small"
                value={paymentAmount}
                inputProps={{ min: 0, step: 0.01, max: Number(selectedInvoiceForPayment?.balanceAmount ?? selectedInvoiceForPayment?.totalAmount ?? 0) }}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel>Payment Mode</FormLabel>
              <Select
                size="small"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                displayEmpty
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <FormLabel>Payment Account</FormLabel>
              <Select
                size="small"
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Select payment account</em>
                </MenuItem>
                {chartOfAccounts?.map((account: any) => (
                  <MenuItem key={account.id ?? account.account_id} value={account.id ?? account.account_id}>
                    {account.name || account.account_name || `Account ${account.id ?? account.account_id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
              <Button variant="outlined" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="contained" color="success" onClick={handleRecordPaymentSubmit}>
                Post Payment
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog> */}

      <Dialog open={glImpactModalOpen} onClose={() => setGlImpactModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>GL Impact - Invoice #{selectedInvoiceForGl?.invoiceNumber || selectedInvoiceForGl?.id}</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" mb={2}>
              GL posting generated upon invoice posting:
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
                  {invoiceGlData?.result?.lines?.length > 0 ? (
                    <>
                      {invoiceGlData.result.lines.map((line: any, idx: number) => (
                        <TableRow key={line.id || idx}>
                          <TableCell>
                            <strong>
                              {line.account ? `${line.account.account_number} - ${line.account.account_name}` : line.account_name || `Account #${line.account_id}`}
                            </strong>
                          </TableCell>
                          <TableCell>{line.narration || line.memo || selectedInvoiceForGl?.remarks || 'GL Impact Journal Line'}</TableCell>
                          <TableCell align="right" sx={{ color: Number(line.debit_amount || line.debit) > 0 ? "success.main" : "text.secondary", fontWeight: Number(line.debit_amount || line.debit) > 0 ? "bold" : "normal" }}>
                            {Number(line.debit_amount || line.debit) > 0 ? `₹${Number(line.debit_amount || line.debit).toLocaleString()}` : "-"}
                          </TableCell>
                          <TableCell align="right" sx={{ color: Number(line.credit_amount || line.credit) > 0 ? "error.main" : "text.secondary", fontWeight: Number(line.credit_amount || line.credit) > 0 ? "bold" : "normal" }}>
                            {Number(line.credit_amount || line.credit) > 0 ? `₹${Number(line.credit_amount || line.credit).toLocaleString()}` : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell colSpan={2} align="right"><strong>Total</strong></TableCell>
                        <TableCell align="right">
                          <strong>
                            ₹{invoiceGlData.result.lines
                              .reduce((sum: number, l: any) => sum + Number(l.debit_amount || l.debit || 0), 0)
                              .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>
                            ₹{invoiceGlData.result.lines
                              .reduce((sum: number, l: any) => sum + Number(l.credit_amount || l.credit || 0), 0)
                              .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <>
                      <TableRow>
                        <TableCell>
                          <strong>
                            {(() => {
                              const lineItem = selectedInvoiceForGl?.purchaseInvoiceLines?.[0];
                              const itemAccount = lineItem?.item?.expense_account || lineItem?.item?.asset_account;
                              const itemAccId = lineItem?.item?.expense_account_id || lineItem?.item?.asset_account_id;
                              if (itemAccount?.account_name && itemAccount?.account_number) {
                                return `${itemAccount.account_name} (${itemAccount.account_number})`;
                              }
                              const foundAcc = chartOfAccounts?.find(
                                (a: any) => String(a.id || a.account_id) === String(itemAccId || itemAccount?.id)
                              );
                              if (foundAcc?.account_name && foundAcc?.account_number) {
                                return `${foundAcc.account_name} (${foundAcc.account_number})`;
                              }
                              const expAcc = chartOfAccounts?.find(
                                (a: any) =>
                                  a.accountType?.account_type_name?.toLowerCase().includes("expense") ||
                                  a.account_name?.toLowerCase().includes("expense") ||
                                  a.account_name?.toLowerCase().includes("clearing")
                              );
                              return expAcc ? `${expAcc.account_name} (${expAcc.account_number})` : `Account #${itemAccId || 1}`;
                            })()}
                          </strong>
                        </TableCell>
                        <TableCell>
                          {selectedInvoiceForGl?.vendor?.vendor_name ? `${selectedInvoiceForGl.vendor.vendor_name} Invoice Charges` : 'Invoice Charges'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: "success.main", fontWeight: "bold" }}>
                          ₹{Number(selectedInvoiceForGl?.totalAmount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">-</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <strong>
                            {(() => {
                              const apAcc = chartOfAccounts?.find(
                                (a: any) =>
                                  a.accountType?.account_type_name?.toLowerCase().includes("payable") ||
                                  a.account_name?.toLowerCase().includes("payable") ||
                                  a.account_name?.toLowerCase().includes("vendor")
                              );
                              return apAcc
                                ? `${apAcc.account_name} (${apAcc.account_number})`
                                : selectedInvoiceForGl?.vendor?.vendor_name
                                  ? selectedInvoiceForGl.vendor.vendor_name
                                  : "Accounts Payable";
                            })()}
                          </strong>
                        </TableCell>
                        <TableCell>
                          {selectedInvoiceForGl?.vendor?.vendor_name ? `${selectedInvoiceForGl.vendor.vendor_name} Liability` : 'Vendor Liability'}
                        </TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right" sx={{ color: "error.main", fontWeight: "bold" }}>
                          ₹{Number(selectedInvoiceForGl?.totalAmount || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelInvoiceOpen} onClose={() => setCancelInvoiceOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Cancel Invoice</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel invoice #{invoiceToCancel?.invoiceNumber || invoiceToCancel?.id}? This action will stop further posting and payment.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={() => setCancelInvoiceOpen(false)}>
              No
            </Button>
            <Button variant="contained" color="error" onClick={handleConfirmCancelInvoice}>
              Yes, Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Recent Purchase Invoices
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Invoice Type</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Invoice Date</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Balance Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No purchase invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                purchaseInvoices.map((invoice: any) => (
                  <TableRow key={invoice.id ?? invoice.invoiceNumber ?? invoice._id}>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.invoiceType}</TableCell>
                    <TableCell>{invoice.vendorId ?? invoice.vendor_id}</TableCell>
                    <TableCell>{invoice.invoiceDate}</TableCell>
                    <TableCell>{invoice.totalAmount}</TableCell>
                    <TableCell>{invoice.balanceAmount}</TableCell>
                    <TableCell>{invoice.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper> */}

      <Dialog open={isOpen} onClose={() => setOpen(false)} fullWidth maxWidth="xl">
        <DialogTitle>{isEdit ? "Edit Purchase Bill" : "Create Purchase Bill"}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              {/* 1. GRN (Goods Receipt Note) */}
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.grnHeaderId"))}>
                  <FormLabel>GRN (Goods Receipt Note)</FormLabel>
                  <Select
                    name="header.grnHeaderId"
                    value={formik.values.header.grnHeaderId}
                    onChange={(e) => handleGRNChange(e.target.value)}
                    onBlur={formik.handleBlur}
                    disabled={isEdit}
                    displayEmpty
                    size="small"
                    renderValue={(selected) => {
                      if (!selected) {
                        return <span style={{ color: "#888" }}>Select GRN</span>;
                      }
                      const grn = grns?.find((g: any) => String(g.id ?? g._id) === String(selected));
                      if (!grn) return String(selected);
                      const poNo = grn.purchaseOrder?.purchaseNo || (grn.purchaseOrderId ? `PO-${grn.purchaseOrderId}` : "");
                      return `${grn.grnNo || `GRN-${grn.id}`} ${poNo ? `(${poNo})` : ""}`;
                    }}
                  >
                    <MenuItem value="">
                      <em>Select GRN</em>
                    </MenuItem>
                    {grns?.map((grn: any) => {
                      const poNo = grn.purchaseOrder?.purchaseNo || (grn.purchaseOrderId ? `PO-${grn.purchaseOrderId}` : "");
                      const label = `${grn.grnNo || `GRN-${grn.id}`} ${poNo ? `(${poNo})` : ""}`;
                      return (
                        <MenuItem key={grn.id ?? grn._id} value={String(grn.id ?? grn._id)}>
                          {label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <FormHelperText>{getFieldError("header.grnHeaderId")}</FormHelperText>
                </FormControl>
              </Grid>

              {/* 2. Purchase Order & 3. Vendor (Only shown when GRN is selected) */}
              {Boolean(formik.values.header.grnHeaderId) && (
                <>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                      <FormLabel>Purchase Order</FormLabel>
                      <Select
                        name="header.poHeaderId"
                        value={formik.values.header.poHeaderId}
                        disabled={true}
                        displayEmpty
                        size="small"
                        renderValue={(selected) => {
                          if (!selected) {
                            return <span style={{ color: "#888" }}>Auto-selected from GRN</span>;
                          }
                          const po = purchaseOrders.find((p: any) => String(p.id ?? p._id) === String(selected));
                          return po ? (po.purchaseNo ?? po.purchase_no ?? `PO-${po.id ?? po._id}`) : String(selected);
                        }}
                      >
                        <MenuItem value="">
                          <em>Auto-selected from GRN</em>
                        </MenuItem>
                        {purchaseOrders.map((po: any) => (
                          <MenuItem key={po.id ?? po._id} value={String(po.id ?? po._id)}>
                            {po.purchaseNo ?? po.purchase_no ?? `PO-${po.id ?? po._id}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                      <FormLabel>Vendor</FormLabel>
                      <Select
                        name="header.vendorId"
                        value={formik.values.header.vendorId}
                        disabled={true}
                        displayEmpty
                        size="small"
                        renderValue={(selected) => {
                          if (!selected) {
                            return <span style={{ color: "#888" }}>Auto-selected from GRN</span>;
                          }
                          const v = vendors.find((vend: any) => String(vend.id ?? vend._id) === String(selected));
                          return v ? (v.vendor_name ?? v.name ?? `Vendor-${v.id ?? v._id}`) : String(selected);
                        }}
                      >
                        <MenuItem value="">
                          <em>Auto-selected from GRN</em>
                        </MenuItem>
                        {vendors.map((vendor: any) => (
                          <MenuItem key={vendor.id ?? vendor._id} value={String(vendor.id ?? vendor._id)}>
                            {vendor.vendor_name ?? vendor.name ?? `Vendor-${vendor.id ?? vendor._id}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}

              {/* 4. Invoice Type */}
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.invoiceType"))}>
                  <FormLabel>Invoice Type</FormLabel>
                  <TextField
                    name="header.invoiceType"
                    placeholder="Enter Invoice Type (e.g. Standard Bill)"
                    value={formik.values.header.invoiceType}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                  />
                  <FormHelperText>{getFieldError("header.invoiceType")}</FormHelperText>
                </FormControl>
              </Grid>

              {/* 5. Invoice Date */}
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.invoiceDate"))}>
                  <FormLabel>Invoice Date</FormLabel>
                  <TextField
                    name="header.invoiceDate"
                    type="date"
                    value={formik.values.header.invoiceDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                  />
                  <FormHelperText>{getFieldError("header.invoiceDate")}</FormHelperText>
                </FormControl>
              </Grid>

              {/* 6. Due Date */}
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Due Date</FormLabel>
                  <TextField
                    name="header.dueDate"
                    type="date"
                    value={formik.values.header.dueDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                  />
                </FormControl>
              </Grid>

              {/* 7. Remarks */}
              <Grid size={{ xs: 12, md: 12 }}>
                <FormControl fullWidth>
                  <FormLabel>Remarks</FormLabel>
                  <TextField
                    name="header.remarks"
                    placeholder="Enter bill remarks..."
                    value={formik.values.header.remarks}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                  />
                </FormControl>
              </Grid>
            </Grid>

            {Boolean(formik.values.header.grnHeaderId) ? (
              <>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="primary">
                    Line Items
                  </Typography>
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%' }}>
                  <Table size="small" sx={{ minWidth: 1400 }}>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell width="12%">Item</TableCell>
                        <TableCell width="12%">Description</TableCell>
                        <TableCell width="12%" sx={{ minWidth: 140 }}>Batch No</TableCell>
                        <TableCell width="6%">Quantity</TableCell>
                        <TableCell width="8%">Unit Price</TableCell>
                        <TableCell width="6%">Discount %</TableCell>
                        <TableCell width="8%">Discount Amount</TableCell>
                        <TableCell width="10%" sx={{ minWidth: 110 }}>Tax %</TableCell>
                        <TableCell width="7%">Tax Amount</TableCell>
                        <TableCell width="10%" sx={{ minWidth: 120 }}>Line Total</TableCell>
                        <TableCell width="10%">Remarks</TableCell>
                        <TableCell width="4%">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formik.values.lineItems.map((line, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ minWidth: 180 }}>
                            <FormControl fullWidth error={Boolean(getFieldError(`lineItems.${index}.itemId`))}>
                              <Select
                                size="small"
                                value={line.itemId}
                                disabled={true}
                                displayEmpty
                                renderValue={(selected) => {
                                  if (!selected) {
                                    return <span style={{ color: "#888" }}>Select Item</span>;
                                  }
                                  const item = items.find((i: any) => String(i.id ?? i._id) === String(selected));
                                  return item ? (item.item_name ?? item.name ?? item.itemName) : String(selected);
                                }}
                              >
                                <MenuItem value="">
                                  <em>Select Item</em>
                                </MenuItem>
                                {items.map((item: any) => (
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
                              placeholder="Item Description"
                              value={line.description}
                              disabled={true}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            <TextField
                              size="small"
                              placeholder="Enter Batch No"
                              value={line.batchNo}
                              onChange={(e) => updateLineItemField(index, "batchNo", e.target.value)}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              placeholder="0"
                              value={line.quantity}
                              disabled={true}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              placeholder="0.00"
                              value={line.unitPrice}
                              disabled={true}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              placeholder="0"
                              value={line.discountPercent}
                              onChange={(e) => updateLineItemField(index, "discountPercent", Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" type="number" placeholder="0.00" value={line.discountAmount} disabled={true} />
                          </TableCell>
                          <TableCell sx={{ minWidth: 110 }}>
                            <TextField
                              size="small"
                              type="number"
                              placeholder="0"
                              value={line.taxPercent}
                              onChange={(e) => updateLineItemField(index, "taxPercent", Number(e.target.value))}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" type="number" placeholder="0.00" value={line.taxAmount} disabled={true} />
                          </TableCell>
                          <TableCell sx={{ minWidth: 120 }}>
                            <TextField size="small" type="number" placeholder="0.00" value={line.lineTotal} disabled={true} fullWidth />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              placeholder="Enter line remarks..."
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
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 3 }} />

                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1.5} fontWeight="bold">
                    Summary Totals
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField label="Subtotal" value={`₹${summary.subtotal.toFixed(2)}`} fullWidth size="small" InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField label="Tax Amount" value={`₹${summary.taxAmount.toFixed(2)}`} fullWidth size="small" InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField label="Discount Amount" value={`₹${summary.discountAmount.toFixed(2)}`} fullWidth size="small" InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField label="Total Amount" value={`₹${summary.totalAmount.toFixed(2)}`} fullWidth size="small" InputProps={{ readOnly: true }} sx={{ '& .MuiInputBase-input': { fontWeight: 'bold', color: 'primary.main' } }} />
                    </Grid>
                  </Grid>
                </Paper>
              </>
            ) : (
              <Box sx={{ mt: 3, p: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300', borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Please select a GRN (Goods Receipt Note) to populate PO details, Vendor, and line items.
                </Typography>
              </Box>
            )}

            <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
              <Button onClick={() => setOpen(false)} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={!canCreatePurchaseInvoice}>
                {isEdit ? "Update" : "Create"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PurchaseInvoiceComp;
