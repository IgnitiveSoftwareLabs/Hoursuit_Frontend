// Touch trigger for Vite HMR
import React, { useMemo, useState } from "react";

import {
  Add,
  Assessment,
  Cancel,
  CheckCircleOutline,
  Delete,
  Edit,
  LocalShipping,
  ReceiptLong,
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
  useCreateReturnFulfillmentMutation,
  useCreateVendorCreditMutation,
  useGetReturnFulfillmentsQuery,
  useGetVendorCreditsQuery,
} from "../RTK/services/purchaseApi";
import { useGetJournalEntryByIdQuery } from "../RTK/services/journalEntryApi";

const STATUS_OPTIONS = ["DRAFT", "AUTHORIZED", "APPROVED", "PARTIALLY_FULFILLED", "FULFILLED", "RETURNED", "CANCELLED"] as const;
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

  const canReadPurchaseReturn = canRead("purchase_return") || canRead("purchase");
  const canCreatePurchaseReturn = canCreate("purchase_return") || canCreate("purchase");

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<any>(null);

  const { data: purchaseReturnsData } = useGetPurchaseReturnsQuery({ page: 1, limit: 20 });
  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery({ page: 1, limit: 50 }, { skip: !isOpen });
  const { data: purchaseInvoicesData } = useGetPurchaseInvoicesQuery({ page: 1, limit: 50 }, { skip: !isOpen });
  const { data: grnsData } = useGetGRNsQuery({ page: 1, limit: 50 }, { skip: !isOpen });
  const { data: vendorsData } = useGetVendorsQuery({ option: true }, { skip: !isOpen });

  const [createPurchaseReturn] = useCreatePurchaseReturnMutation();
  const [updatePurchaseReturn] = useUpdatePurchaseReturnMutation();
  const [updatePurchaseReturnStatus] = useUpdatePurchaseReturnStatusMutation();
  const [deletePurchaseReturn] = useDeletePurchaseReturnMutation();

  const [createReturnFulfillment] = useCreateReturnFulfillmentMutation();
  const [createVendorCredit] = useCreateVendorCreditMutation();

  const [fulfillmentModalOpen, setFulfillmentModalOpen] = useState(false);
  const [vendorCreditModalOpen, setVendorCreditModalOpen] = useState(false);
  const [selectedReturnForAction, setSelectedReturnForAction] = useState<any>(null);
  const [fulfillmentLines, setFulfillmentLines] = useState<any[]>([]);
  const [vendorCreditLines, setVendorCreditLines] = useState<any[]>([]);
  const [fulfillmentDate, setFulfillmentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [creditDate, setCreditDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const handleOpenFulfillment = (record: any) => {
    setSelectedReturnForAction(record);
    const lines = (record.lineItems || record.purchaseReturnLines || []).map((line: any) => ({
      purchaseReturnLineId: line.id,
      itemId: line.itemId,
      authorizedQty: Number(line.returnQty || 0),
      fulfilledQty: Number(line.returnQty || 0),
      unitPrice: Number(line.unitPrice || 0),
      batchNo: line.batchNo || "",
    }));
    setFulfillmentLines(lines);
    setFulfillmentDate(new Date().toISOString().split("T")[0]);
    setFulfillmentModalOpen(true);
  };

  const handleOpenVendorCredit = (record: any) => {
    setSelectedReturnForAction(record);
    const lines = (record.lineItems || record.purchaseReturnLines || []).map((line: any) => ({
      purchaseReturnLineId: line.id,
      itemId: line.itemId,
      authorizedQty: Number(line.returnQty || 0),
      creditQty: Number(line.returnQty || 0),
      unitPrice: Number(line.unitPrice || 0),
    }));
    setVendorCreditLines(lines);
    setCreditDate(new Date().toISOString().split("T")[0]);
    setVendorCreditModalOpen(true);
  };

  const handleSubmitFulfillment = async () => {
    if (!selectedReturnForAction?.id) return;
    try {
      await createReturnFulfillment({
        header: {
          purchaseReturnHeaderId: selectedReturnForAction.id,
          fulfillmentDate,
          fulfillmentNumber: `PRF-${Date.now()}`,
        },
        lineItems: fulfillmentLines.map(l => ({
          purchaseReturnLineId: l.purchaseReturnLineId,
          itemId: l.itemId,
          fulfilledQty: Number(l.fulfilledQty),
          unitPrice: Number(l.unitPrice),
          batchNo: l.batchNo || null
        }))
      }).unwrap();
      toast.success("Return Fulfillment created and stock reduced successfully");
      setFulfillmentModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create return fulfillment");
    }
  };

  const handleSubmitVendorCredit = async () => {
    if (!selectedReturnForAction?.id) return;
    try {
      await createVendorCredit({
        header: {
          purchaseReturnHeaderId: selectedReturnForAction.id,
          vendorId: selectedReturnForAction.vendorId,
          creditDate,
          creditNoteNumber: `VC-${Date.now()}`,
        },
        lineItems: vendorCreditLines.map(l => ({
          purchaseReturnLineId: l.purchaseReturnLineId,
          itemId: l.itemId,
          creditQty: Number(l.creditQty),
          unitPrice: Number(l.unitPrice),
        }))
      }).unwrap();
      toast.success("Vendor Credit note issued successfully");
      setVendorCreditModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to issue vendor credit");
    }
  };
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [glModalOpen, setGlModalOpen] = useState(false);
  const [selectedReturnForGl, setSelectedReturnForGl] = useState<any>(null);

  const { data: journalData, isLoading: isJournalLoading } = useGetJournalEntryByIdQuery(
    {
      id: Number(selectedReturnForGl?.id ?? 0),
      source: "PURCHASE_RETURN",
    },
    {
      skip: !glModalOpen || !selectedReturnForGl?.id,
    }
  );

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

  // Derive items dynamically from associated P2P document lines instead of making API calls
  const items = useMemo(() => {
    const itemMap = new Map<string | number, any>();

    // 1. From Purchase Invoices
    purchaseInvoices.forEach((inv: any) => {
      const lines = inv.purchaseInvoiceLines ?? inv.invoice_lines ?? [];
      lines.forEach((line: any) => {
        if (line.item && (line.item.id || line.item._id)) {
          const id = String(line.item.id || line.item._id);
          if (!itemMap.has(id)) itemMap.set(id, line.item);
        }
      });
    });

    // 2. From GRNs
    grns.forEach((grn: any) => {
      const lines = grn.lineItems ?? grn.grnLines ?? [];
      lines.forEach((line: any) => {
        if (line.item && (line.item.id || line.item._id)) {
          const id = String(line.item.id || line.item._id);
          if (!itemMap.has(id)) itemMap.set(id, line.item);
        }
      });
    });

    // 3. From Purchase Orders
    purchaseOrders.forEach((po: any) => {
      const lines = po.purchaseOrderLines ?? po.lineItems ?? [];
      lines.forEach((line: any) => {
        if (line.item && (line.item.id || line.item._id)) {
          const id = String(line.item.id || line.item._id);
          if (!itemMap.has(id)) itemMap.set(id, line.item);
        }
      });
    });

    return Array.from(itemMap.values());
  }, [purchaseInvoices, grns, purchaseOrders]);

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
        returnNumber: Yup.string().nullable(),
        vendorId: Yup.string().required("Vendor is required"),
        grnHeaderId: Yup.string().nullable(),
        purchaseOrderHeaderId: Yup.string().nullable(),
        purchaseInvoiceHeaderId: Yup.string().nullable(),
        returnDate: Yup.date().required("Return Date is required"),
        status: Yup.string().nullable(),
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
            returnNumber: values.header.returnNumber || undefined,
            vendorId: Number(values.header.vendorId),
            grnHeaderId: values.header.grnHeaderId ? Number(values.header.grnHeaderId) : null,
            purchaseOrderHeaderId: values.header.purchaseOrderHeaderId ? Number(values.header.purchaseOrderHeaderId) : null,
            purchaseInvoiceHeaderId: values.header.purchaseInvoiceHeaderId ? Number(values.header.purchaseInvoiceHeaderId) : null,
            returnDate: values.header.returnDate,
            status: values.header.status || "DRAFT",
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

  const getFieldError = (field: string) => {
    const error = field.split(".").reduce((obj: any, key: string) => obj?.[key], formik.errors);
    const touched = field.split(".").reduce((obj: any, key: string) => obj?.[key], formik.touched);
    return touched && error ? String(error) : "";
  };

  const handleInvoiceChange = (e: any) => {
    const invId = e.target.value;
    formik.handleChange(e);

    if (!invId) return;

    const inv = purchaseInvoices.find((i: any) => String(i.id ?? i._id) === String(invId));
    if (!inv) return;

    // 1. Auto-select Vendor
    const vId = inv.vendorId ?? inv.vendor_id ?? inv.vendor?.id;
    if (vId) {
      formik.setFieldValue("header.vendorId", String(vId));
    }

    // 2. Auto-select Purchase Order
    const poId = inv.poHeaderId ?? inv.po_header_id ?? inv.purchaseOrderHeaderId ?? inv.purchase_order_header_id;
    if (poId) {
      formik.setFieldValue("header.purchaseOrderHeaderId", String(poId));
    }

    // 3. Auto-select GRN
    const gId = inv.grnHeaderId ?? inv.grn_header_id;
    if (gId) {
      formik.setFieldValue("header.grnHeaderId", String(gId));
    }

    // 4. Auto-populate Line Items from Invoice
    const rawLines = inv.purchaseInvoiceLines ?? inv.invoice_lines ?? inv.lines ?? [];
    if (Array.isArray(rawLines) && rawLines.length > 0) {
      const populatedLines = rawLines.map((line: any) => ({
        returnHeaderId: "",
        grnLineId: line.grnLineId ? String(line.grnLineId) : line.grn_line_id ? String(line.grn_line_id) : "",
        itemId: String(line.itemId ?? line.item_id ?? line.item?.id ?? ""),
        batchNo: line.batchNo ?? line.batch_no ?? "",
        returnQty: Number(line.quantity ?? line.qty ?? 0),
        rejectedQty: 0,
        damagedQty: 0,
        unitPrice: Number(line.unitPrice ?? line.unit_price ?? line.rate ?? 0),
        reason: "",
        remarks: "",
      }));
      formik.setFieldValue("lineItems", populatedLines);
      toast.success(`Auto-filled ${rawLines.length} item(s) from Invoice #${inv.invoiceNumber || inv.id}`);
    }
  };

  const handleGrnChange = (e: any) => {
    const grnId = e.target.value;
    formik.handleChange(e);

    if (!grnId) return;

    const grn = grns.find((g: any) => String(g.id ?? g._id) === String(grnId));
    if (!grn) return;

    const poId = grn.purchaseOrderId ?? grn.purchase_order_id ?? grn.poHeaderId;
    if (poId) {
      formik.setFieldValue("header.purchaseOrderHeaderId", String(poId));
      const associatedPo = purchaseOrders.find((p: any) => String(p.id ?? p._id) === String(poId));
      if (associatedPo?.vendor_id || associatedPo?.vendorId) {
        formik.setFieldValue("header.vendorId", String(associatedPo.vendor_id || associatedPo.vendorId));
      }
    }

    const rawLines = grn.grnLines ?? grn.lineItems ?? grn.lines ?? [];
    if (Array.isArray(rawLines) && rawLines.length > 0) {
      const populatedLines = rawLines.map((line: any) => ({
        returnHeaderId: "",
        grnLineId: String(line.id ?? line.grnLineId ?? ""),
        itemId: String(line.itemId ?? line.item_id ?? line.item?.id ?? ""),
        batchNo: line.batchNo ?? line.batch_no ?? "",
        returnQty: Number(line.acceptedQty ?? line.receivedQty ?? line.orderedQty ?? 0),
        rejectedQty: Number(line.rejectedQty ?? 0),
        damagedQty: Number(line.damagedQty ?? 0),
        unitPrice: Number(line.unitPrice ?? line.unit_price ?? line.rate ?? 0),
        reason: "",
        remarks: "",
      }));
      formik.setFieldValue("lineItems", populatedLines);
      toast.success(`Auto-filled ${rawLines.length} item(s) from GRN #${grn.grnNo || grn.id}`);
    }
  };

  const handlePoChange = (e: any) => {
    const poId = e.target.value;
    formik.handleChange(e);

    if (!poId) return;

    const po = purchaseOrders.find((p: any) => String(p.id ?? p._id) === String(poId));

    // 1. Auto-select Vendor from PO
    const vId = po?.vendorId ?? po?.vendor_id ?? po?.vendor?.id;
    if (vId) {
      formik.setFieldValue("header.vendorId", String(vId));
    }

    // 2. Auto-select associated GRN (if any)
    const grn = grns.find((g: any) =>
      String(g.poHeaderId ?? g.purchaseOrderHeaderId ?? g.purchase_order_header_id ?? g.purchaseOrderId ?? g.po_id) === String(poId)
    );
    if (grn) {
      formik.setFieldValue("header.grnHeaderId", String(grn.id ?? grn._id));
      if (!vId && (grn.vendorId || grn.vendor_id)) {
        formik.setFieldValue("header.vendorId", String(grn.vendorId || grn.vendor_id));
      }
    }

    // 3. Auto-select associated Purchase Invoice (if any)
    const inv = purchaseInvoices.find((i: any) =>
      String(i.poHeaderId ?? i.purchaseOrderHeaderId ?? i.purchase_order_header_id) === String(poId) ||
      (grn && String(i.grnHeaderId ?? i.grn_header_id) === String(grn.id ?? grn._id))
    );
    if (inv) {
      formik.setFieldValue("header.purchaseInvoiceHeaderId", String(inv.id ?? inv._id));
      if (!vId && (inv.vendorId || inv.vendor_id)) {
        formik.setFieldValue("header.vendorId", String(inv.vendorId || inv.vendor_id));
      }
    }

    // 4. Auto-populate Line Items from GRN -> Invoice -> PO
    let rawLines: any[] = [];
    let lineSource = "";

    if (grn && Array.isArray(grn.grnLines || grn.lineItems || grn.lines) && (grn.grnLines || grn.lineItems || grn.lines).length > 0) {
      rawLines = grn.grnLines || grn.lineItems || grn.lines;
      lineSource = `GRN #${grn.grnNo || grn.grnNumber || grn.id}`;
    } else if (inv && Array.isArray(inv.purchaseInvoiceLines || inv.invoice_lines || inv.lines) && (inv.purchaseInvoiceLines || inv.invoice_lines || inv.lines).length > 0) {
      rawLines = inv.purchaseInvoiceLines || inv.invoice_lines || inv.lines;
      lineSource = `Invoice #${inv.invoiceNumber || inv.id}`;
    } else if (po && Array.isArray(po.purchaseOrderLines || po.lines) && (po.purchaseOrderLines || po.lines).length > 0) {
      rawLines = po.purchaseOrderLines || po.lines;
      lineSource = `PO #${po.purchaseNo || po.orderNumber || po.id}`;
    }

    if (rawLines.length > 0) {
      const populatedLines = rawLines.map((line: any) => ({
        returnHeaderId: "",
        grnLineId: String(line.id || line.grnLineId || line.grn_line_id || ""),
        itemId: String(line.itemId ?? line.item_id ?? line.item?.id ?? ""),
        batchNo: line.batchNo ?? line.batch_no ?? "",
        returnQty: Number(line.acceptedQty ?? line.receivedQty ?? line.quantity ?? line.qty ?? 0),
        rejectedQty: 0,
        damagedQty: 0,
        unitPrice: Number(line.unitPrice ?? line.unit_price ?? line.rate ?? 0),
        reason: "",
        remarks: "",
      }));
      formik.setFieldValue("lineItems", populatedLines);
      toast.success(`Auto-selected GRN, Invoice & Vendor, populated ${rawLines.length} item(s) from ${lineSource}`);
    }
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
    const lineSource = record?.purchaseReturnLines ?? record?.returnLines ?? record?.lineItems ?? record?.line_items ?? [];

    formik.setValues({
      header: {
        returnNumber: header?.returnNumber ?? header?.return_number ?? "",
        vendorId: String(header?.vendorId ?? header?.vendor_id ?? ""),
        grnHeaderId: String(header?.grnHeaderId ?? header?.grn_header_id ?? ""),
        purchaseOrderHeaderId: String(header?.purchaseOrderHeaderId ?? header?.purchase_order_header_id ?? ""),
        purchaseInvoiceHeaderId: String(header?.purchaseInvoiceHeaderId ?? header?.purchase_invoice_header_id ?? ""),
        returnDate: header?.returnDate ? String(header.returnDate).slice(0, 10) : new Date().toISOString().split("T")[0],
        status: header?.status ?? "DRAFT",
        reason: header?.reason ?? "",
        remarks: header?.remarks ?? "",
        user_id: header?.user_id ?? userId,
      },
      lineItems: Array.isArray(lineSource) && lineSource.length
        ? lineSource.map((line: any) => ({
          returnHeaderId: String(line?.returnHeaderId ?? line?.return_header_id ?? header?.id ?? ""),
          grnLineId: String(line?.grnLineId ?? line?.grn_line_id ?? ""),
          itemId: String(line?.itemId ?? line?.item_id ?? line?.item?.id ?? ""),
          batchNo: line?.batchNo ?? line?.batch_no ?? "",
          returnQty: Number(line?.returnQty ?? line?.return_qty ?? line?.quantity ?? 0),
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
    if (status === "AUTHORIZED" || status === "APPROVED") color = "warning";
    if (status === "PARTIALLY_FULFILLED") color = "info";
    if (status === "FULFILLED" || status === "RETURNED") color = "success";
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
                <TableCell sx={{ fontWeight: "bold" }}>Return Number</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Purchase Invoice</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>PO #</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>GRN #</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Vendor</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Return Date</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseReturns.map((ret: any) => {
                const invoiceNumber =
                  ret.purchaseInvoiceHeader?.invoiceNumber ||
                  ret.purchaseInvoice?.invoiceNumber ||
                  (ret.purchaseInvoiceHeaderId ? `INV-${ret.purchaseInvoiceHeaderId}` : "-");

                const poNumber =
                  ret.purchaseOrderHeader?.purchaseNo ||
                  ret.purchaseOrder?.purchaseNo ||
                  (ret.purchaseOrderHeaderId ? `PO-${ret.purchaseOrderHeaderId}` : "-");

                const grnNumber =
                  ret.grnHeader?.grnNo ||
                  ret.grn?.grnNo ||
                  (ret.grnHeaderId ? `GRN-${ret.grnHeaderId}` : "-");

                const vendorName =
                  ret.vendor?.vendor_name ||
                  ret.vendor?.name ||
                  getVendorName(ret.vendorId);

                return (
                  <TableRow key={ret.id ?? ret.returnNumber ?? ret._id}>
                    <TableCell sx={{ fontWeight: "bold" }}>{ret.returnNumber || "-"}</TableCell>
                    <TableCell>{invoiceNumber}</TableCell>
                    <TableCell>{poNumber}</TableCell>
                    <TableCell>{grnNumber}</TableCell>
                    <TableCell>{vendorName}</TableCell>
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

                        {ret.status !== "DRAFT" && ret.status !== "CANCELLED" && (
                          <IconButton
                            size="small"
                            color="secondary"
                            title="GL Impact"
                            onClick={() => {
                              setSelectedReturnForGl(ret);
                              setGlModalOpen(true);
                            }}
                          >
                            <Assessment fontSize="small" />
                          </IconButton>
                        )}

                        {/* DRAFT -> Edit / Authorize / Delete */}
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
                              onClick={() => handleStatusChange(ret.id, "AUTHORIZED")}
                            >
                              Authorize
                            </Button>
                            {(canDelete("purchase_return") || canDelete("purchase")) && (
                              <IconButton size="small" color="error" onClick={() => handleDeleteRequest(ret)} aria-label="Delete purchase return">
                                <Delete fontSize="small" />
                              </IconButton>
                            )}
                          </>
                        )}

                        {/* AUTHORIZED / APPROVED / PARTIALLY_FULFILLED -> Fulfill Return & Issue Vendor Credit */}
                        {(ret.status === "AUTHORIZED" || ret.status === "APPROVED" || ret.status === "PARTIALLY_FULFILLED") && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<LocalShipping />}
                              onClick={() => handleOpenFulfillment(ret)}
                            >
                              Fulfill Return
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleOpenVendorCredit(ret)}
                            >
                              Vendor Credit
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

                        {/* FULFILLED / RETURNED -> Issue Vendor Credit */}
                        {(ret.status === "FULFILLED" || ret.status === "RETURNED") && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleOpenVendorCredit(ret)}
                          >
                            Issue Vendor Credit
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
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
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Vendor</Typography>
                <Typography fontWeight="bold">
                  {selectedReturn.vendor?.vendor_name || selectedReturn.vendor?.name || getVendorName(selectedReturn.vendorId)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Return Date</Typography>
                <Typography fontWeight="bold">{selectedReturn.returnDate?.slice(0, 10)}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box>{getStatusChip(selectedReturn.status)}</Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Purchase Invoice</Typography>
                <Typography fontWeight="bold">
                  {selectedReturn.purchaseInvoiceHeader?.invoiceNumber ||
                    selectedReturn.purchaseInvoice?.invoiceNumber ||
                    (selectedReturn.purchaseInvoiceHeaderId ? `INV-${selectedReturn.purchaseInvoiceHeaderId}` : "-")}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">PO Ref</Typography>
                <Typography fontWeight="bold">
                  {selectedReturn.purchaseOrderHeader?.purchaseNo ||
                    selectedReturn.purchaseOrder?.purchaseNo ||
                    (selectedReturn.purchaseOrderHeaderId ? `PO-${selectedReturn.purchaseOrderHeaderId}` : "-")}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">GRN Ref</Typography>
                <Typography fontWeight="bold">
                  {selectedReturn.grnHeader?.grnNo ||
                    selectedReturn.grn?.grnNo ||
                    (selectedReturn.grnHeaderId ? `GRN-${selectedReturn.grnHeaderId}` : "-")}
                </Typography>
              </Grid>
              {selectedReturn.reason && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Reason</Typography>
                  <Typography>{selectedReturn.reason}</Typography>
                </Grid>
              )}
              {selectedReturn.remarks && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Remarks</Typography>
                  <Typography>{selectedReturn.remarks}</Typography>
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
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

      <Dialog
        open={isOpen}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth={formik.values.header.purchaseInvoiceHeaderId ? "xl" : "md"}
      >
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: "1px solid #e2e8f0" }}>
          {isEdit ? "Edit Purchase Return" : "Create Purchase Return"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
            {/* Purchase Invoice Header Selection */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                mb: 3,
                backgroundColor: "#f8fafc",
                borderColor: "#e2e8f0",
                borderRadius: 2,
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <ReceiptLong color="primary" />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Select Purchase Invoice
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a purchase invoice to automatically load vendor, PO, GRN, and line item details for the return.
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth error={Boolean(getFieldError("header.purchaseInvoiceHeaderId"))}>
                    <FormLabel sx={{ fontWeight: 600, mb: 0.5 }}>Purchase Invoice *</FormLabel>
                    <Select
                      name="header.purchaseInvoiceHeaderId"
                      value={formik.values.header.purchaseInvoiceHeaderId}
                      onChange={handleInvoiceChange}
                      onBlur={formik.handleBlur}
                      displayEmpty
                      size="small"
                      disabled={isEdit}
                      renderValue={(selected) => {
                        if (!selected) return <span style={{ color: "#888" }}>Select Purchase Invoice</span>;
                        const inv = purchaseInvoices.find((i: any) => String(i.id ?? i._id) === String(selected));
                        return inv?.invoiceNumber ?? inv?.invoice_number ?? `INV-${selected}`;
                      }}
                    >
                      <MenuItem value="">
                        <em>Select Purchase Invoice</em>
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
              </Grid>
            </Paper>

            {Boolean(formik.values.header.purchaseInvoiceHeaderId) && (
              <>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                  Return Header Details
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>

                  {/* Vendor */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth error={Boolean(getFieldError("header.vendorId"))}>
                      <FormLabel sx={{ fontWeight: 500, mb: 0.5 }}>Vendor</FormLabel>
                      <Select
                        name="header.vendorId"
                        value={formik.values.header.vendorId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        displayEmpty
                        size="small"
                        disabled
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

                  {/* Purchase Order */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth error={Boolean(getFieldError("header.purchaseOrderHeaderId"))}>
                      <FormLabel sx={{ fontWeight: 500, mb: 0.5 }}>Purchase Order</FormLabel>
                      <Select
                        name="header.purchaseOrderHeaderId"
                        value={formik.values.header.purchaseOrderHeaderId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        displayEmpty
                        size="small"
                        disabled
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

                  {/* GRN */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth error={Boolean(getFieldError("header.grnHeaderId"))}>
                      <FormLabel sx={{ fontWeight: 500, mb: 0.5 }}>GRN</FormLabel>
                      <Select
                        name="header.grnHeaderId"
                        value={formik.values.header.grnHeaderId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        displayEmpty
                        size="small"
                        disabled
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

                  {/* Return Date */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth error={Boolean(getFieldError("header.returnDate"))}>
                      <FormLabel sx={{ fontWeight: 500, mb: 0.5 }}>Return Date *</FormLabel>
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

                  {/* Reason */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                      <FormLabel sx={{ fontWeight: 500, mb: 0.5 }}>Reason</FormLabel>
                      <TextField
                        name="header.reason"
                        placeholder="Enter return reason"
                        value={formik.values.header.reason}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        size="small"
                      />
                    </FormControl>
                  </Grid>

                  {/* Remarks */}
                  <Grid size={{ xs: 12, md: 12 }}>
                    <FormControl fullWidth>
                      <FormLabel sx={{ fontWeight: 500, mb: 0.5 }}>Remarks</FormLabel>
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
                </Grid>

                <Divider sx={{ my: 2.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight="bold">Line Items</Typography>
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%', borderRadius: 2 }}>
                  <Table size="small" sx={{ minWidth: 1400 }}>
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                      <TableRow>
                        <TableCell width="18%" sx={{ fontWeight: "bold" }}>Item</TableCell>
                        <TableCell width="12%" sx={{ fontWeight: "bold" }}>Batch No</TableCell>
                        <TableCell width="10%" sx={{ fontWeight: "bold" }}>Return Qty</TableCell>
                        <TableCell width="10%" sx={{ fontWeight: "bold" }}>Rejected Qty</TableCell>
                        <TableCell width="10%" sx={{ fontWeight: "bold" }}>Damaged Qty</TableCell>
                        <TableCell width="10%" sx={{ fontWeight: "bold" }}>Unit Price</TableCell>
                        <TableCell width="10%" sx={{ fontWeight: "bold" }}>Line Amount</TableCell>
                        <TableCell width="10%" sx={{ fontWeight: "bold" }}>Reason</TableCell>
                        <TableCell width="10%" sx={{ fontWeight: "bold" }}>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formik.values.lineItems.map((line, index) => {
                        const lineAmount = (Number(line.returnQty) || 0) * (Number(line.unitPrice) || 0);
                        return (
                          <TableRow key={index}>
                            <TableCell sx={{ minWidth: 180 }}>
                              <FormControl fullWidth error={Boolean(getFieldError(`lineItems.${index}.itemId`))}>
                                <Select
                                  size="small"
                                  value={line.itemId}
                                  onChange={(e) => updateLineItemField(index, "itemId", e.target.value)}
                                  disabled
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
                                disabled
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
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            <Box display="flex" justifyContent="flex-end" gap={2} mt={3} pt={2} borderTop="1px solid #e2e8f0">
              <Button onClick={() => setOpen(false)} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={!canCreatePurchaseReturn || !formik.values.header.purchaseInvoiceHeaderId}>
                {isEdit ? "Update Return" : "Create Return"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* GL Impact Modal */}
      <Dialog open={glModalOpen} onClose={() => setGlModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>GL Impact - Purchase Return Vouchers</DialogTitle>
        <DialogContent dividers>
          {isJournalLoading ? (
            <Typography>Loading accounting entries...</Typography>
          ) : journalData?.result?.lines?.length ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell>Description / Memo</TableCell>
                    <TableCell align="right">Debit (DR)</TableCell>
                    <TableCell align="right">Credit (CR)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {journalData.result.lines.map((line: any, idx: number) => (
                    <TableRow key={line.id || idx}>
                      <TableCell>
                        <strong>
                          {line.account ? `${line.account.account_number} - ${line.account.account_name}` : line.account_name || `Account #${line.account_id}`}
                        </strong>
                      </TableCell>
                      <TableCell>{line.narration || line.memo || "-"}</TableCell>
                      <TableCell align="right" sx={{ color: Number(line.debit_amount || line.debit) > 0 ? "success.main" : "text.secondary", fontWeight: Number(line.debit_amount || line.debit) > 0 ? "bold" : "normal" }}>
                        {Number(line.debit_amount || line.debit || 0) > 0 ? `₹${Number(line.debit_amount || line.debit).toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell align="right" sx={{ color: Number(line.credit_amount || line.credit) > 0 ? "error.main" : "text.secondary", fontWeight: Number(line.credit_amount || line.credit) > 0 ? "bold" : "normal" }}>
                        {Number(line.credit_amount || line.credit || 0) > 0 ? `₹${Number(line.credit_amount || line.credit).toLocaleString()}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell colSpan={2} align="right">
                      <strong>Total</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>₹{Number(journalData.result.total_debit || 0).toLocaleString()}</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>₹{Number(journalData.result.total_credit || 0).toLocaleString()}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">
              Purchase Return Authorization is a non-posting operational document. GL entries occur upon Return Fulfillment (DR Purchase Return Clearing / CR Inventory Asset) and Vendor Credit posting (DR Accounts Payable / CR Purchase Return Clearing).
            </Typography>
          )}
        </DialogContent>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => setGlModalOpen(false)}>Close</Button>
        </Box>
      </Dialog>

      {/* Return Fulfillment Modal */}
      <Dialog open={fulfillmentModalOpen} onClose={() => setFulfillmentModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>
          Physical Return Fulfillment - {selectedReturnForAction?.returnNumber}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Executing this return fulfillment will physically reduce inventory stock and post GL entry (DR Purchase Return Clearing, CR Inventory Asset).
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormLabel>Fulfillment Date</FormLabel>
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  value={fulfillmentDate}
                  onChange={(e) => setFulfillmentDate(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: "grey.100" }}>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Authorized Qty</TableCell>
                  <TableCell align="right">Fulfilled Qty</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell>Batch No</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fulfillmentLines.map((line, idx) => {
                  const itemName = items.find((it: any) => String(it.id) === String(line.itemId))?.itemName || line.itemId;
                  return (
                    <TableRow key={idx}>
                      <TableCell>{itemName}</TableCell>
                      <TableCell align="right">{line.authorizedQty}</TableCell>
                      <TableCell align="right" sx={{ width: 130 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={line.fulfilledQty}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFulfillmentLines((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, fulfilledQty: val } : item))
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">₹{Number(line.unitPrice || 0).toFixed(2)}</TableCell>
                      <TableCell sx={{ width: 140 }}>
                        <TextField
                          size="small"
                          value={line.batchNo}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFulfillmentLines((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, batchNo: val } : item))
                            );
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button onClick={() => setFulfillmentModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleSubmitFulfillment}>
            Confirm & Fulfill Return
          </Button>
        </Box>
      </Dialog>

      {/* Vendor Credit Modal */}
      <Dialog open={vendorCreditModalOpen} onClose={() => setVendorCreditModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>
          Issue Vendor Credit Note - {selectedReturnForAction?.returnNumber}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Issuing a Vendor Credit Note decreases Accounts Payable liability and clears the Purchase Return Clearing account (DR Accounts Payable, CR Purchase Return Clearing).
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormLabel>Credit Date</FormLabel>
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  value={creditDate}
                  onChange={(e) => setCreditDate(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: "grey.100" }}>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Authorized Return Qty</TableCell>
                  <TableCell align="right">Credit Qty</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total Credit Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendorCreditLines.map((line, idx) => {
                  const itemName = items.find((it: any) => String(it.id) === String(line.itemId))?.itemName || line.itemId;
                  const totalLineCredit = (Number(line.creditQty) || 0) * (Number(line.unitPrice) || 0);
                  return (
                    <TableRow key={idx}>
                      <TableCell>{itemName}</TableCell>
                      <TableCell align="right">{line.authorizedQty}</TableCell>
                      <TableCell align="right" sx={{ width: 130 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={line.creditQty}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVendorCreditLines((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, creditQty: val } : item))
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">₹{Number(line.unitPrice || 0).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        ₹{totalLineCredit.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button onClick={() => setVendorCreditModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSubmitVendorCredit}>
            Issue Vendor Credit
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default PurchaseReturnComp;
