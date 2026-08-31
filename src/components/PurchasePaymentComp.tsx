import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Add, Delete, Edit, Payments, Print, Search, List as ListIcon } from "@mui/icons-material";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import * as Yup from "yup";

import { useGetVendorsQuery } from "../RTK/services/vendorApi";
import { useGetChartOfAccountsQuery } from "../RTK/services/chartOfAccountApi";
import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetClassesQuery } from "../RTK/services/classApi";
import { useGetDepartmentsQuery } from "../RTK/services/departmentApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetPaymentMethodsQuery } from "../RTK/services/paymentMethodApi";
import { useAppSelector } from "../Hooks/Reduxhook/hooks";
import { usePermissions } from "../Hooks/usePermissions";

import {
  useCreatePurchasePaymentMutation,
  useDeletePurchasePaymentMutation,
  useGetGRNsQuery,
  useGetPurchaseInvoicesQuery,
  useGetPurchaseOrdersQuery,
  useGetPurchasePaymentsQuery,
  useGetPurchasePaymentByIdQuery,
  useUpdatePurchasePaymentMutation,
} from "../RTK/services/purchaseApi";

import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";
import ConfirmationDialog from "./Dialog/ConfirmationDialog";
import { GLImpactSubtab } from "./Layout/GLImpactSubtab";

export default function PurchasePaymentComp() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const userId = currentUser?.id ?? "";

  const [isOpen, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any>(null);
  const [selectedPoId, setSelectedPoId] = useState<string>("");

  // Eager Queries
  const { data: paymentsData, refetch: refetchPayments } = useGetPurchasePaymentsQuery({ page: 1, limit: 50 });
  const { data: singlePaymentData } = useGetPurchasePaymentByIdQuery(selectedPaymentId!, { skip: !selectedPaymentId });
  const { data: invoicesData } = useGetPurchaseInvoicesQuery({ page: 1, limit: 100 });
  const { data: grnsData } = useGetGRNsQuery({ page: 1, limit: 100 });
  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery({ page: 1, limit: 100 });
  const { data: vendorsData } = useGetVendorsQuery({ page: 1, option: true });
  const { data: chartOfAccountsData } = useGetChartOfAccountsQuery(undefined);
  const { data: currenciesData } = useGetCurrenciesQuery(undefined);
  const { data: subsidiariesData } = useGetSubsidiariesQuery(undefined);
  const { data: classesData } = useGetClassesQuery(undefined);
  const { data: departmentsData } = useGetDepartmentsQuery(undefined);
  const { data: citiesData } = useGetCitiesQuery(undefined);

  const [createPurchasePayment, { isLoading: isCreating }] = useCreatePurchasePaymentMutation();
  const [updatePurchasePayment, { isLoading: isUpdating }] = useUpdatePurchasePaymentMutation();
  const [deletePurchasePayment] = useDeletePurchasePaymentMutation();

  const payments = useMemo(() => (Array.isArray(paymentsData?.result) ? paymentsData.result : Array.isArray(paymentsData?.data) ? paymentsData.data : Array.isArray(paymentsData) ? paymentsData : []), [paymentsData]);
  const invoices = useMemo(() => (Array.isArray(invoicesData?.result) ? invoicesData.result : Array.isArray(invoicesData?.data) ? invoicesData.data : Array.isArray(invoicesData) ? invoicesData : []), [invoicesData]);
  const grns = useMemo(() => (Array.isArray(grnsData?.result) ? grnsData.result : Array.isArray(grnsData?.data) ? grnsData.data : Array.isArray(grnsData) ? grnsData : []), [grnsData]);
  const purchaseOrders = useMemo(() => (Array.isArray(purchaseOrdersData?.result) ? purchaseOrdersData.result : Array.isArray(purchaseOrdersData?.data) ? purchaseOrdersData.data : Array.isArray(purchaseOrdersData) ? purchaseOrdersData : []), [purchaseOrdersData]);
  const vendors = useMemo(() => (Array.isArray(vendorsData?.result) ? vendorsData.result : Array.isArray(vendorsData?.data) ? vendorsData.data : Array.isArray(vendorsData) ? vendorsData : []), [vendorsData]);
  const bankAccounts = Array.isArray(chartOfAccountsData?.result) ? chartOfAccountsData.result : Array.isArray(chartOfAccountsData?.data) ? chartOfAccountsData.data : Array.isArray(chartOfAccountsData) ? chartOfAccountsData : [];
  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : Array.isArray(subsidiariesData?.data) ? subsidiariesData.data : Array.isArray(subsidiariesData) ? subsidiariesData : [];
  const classesList = Array.isArray(classesData?.result) ? classesData.result : Array.isArray(classesData?.data) ? classesData.data : Array.isArray(classesData) ? classesData : [];
  const departmentsList = Array.isArray(departmentsData?.result) ? departmentsData.result : Array.isArray(departmentsData?.data) ? departmentsData.data : Array.isArray(departmentsData) ? departmentsData : [];
  const citiesList = Array.isArray(citiesData?.result) ? citiesData.result : Array.isArray(citiesData?.data) ? citiesData.data : Array.isArray(citiesData) ? citiesData : [];

  const getVendorDisplayName = (vObj: any) => {
    if (!vObj) return "";
    const code = vObj.entity_id ? `${vObj.entity_id} ` : "";
    const name = vObj.company_name || [vObj.salutation, vObj.first_name, vObj.last_name].filter(Boolean).join(" ");
    return `${code}${name}`.trim();
  };

  const formik = useFormik({
    initialValues: {
      paymentNumber: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      purchaseInvoiceHeaderId: "",
      invoiceNumber: "",
      invoiceDate: "",
      vendorId: "",
      vendorName: "",
      currency: "INR",
      exchangeRate: 1,
      paymentMethodId: "",
      bankAccountId: "",
      referenceNo: "",
      subsidiary_id: "",
      class_id: "",
      department_id: "",
      location_id: "",
      totalAmount: 0,
      remarks: "",
      status: "DRAFT",
    },
    validationSchema: Yup.object().shape({
      vendorId: Yup.string().required("Payee / Vendor is required"),
      paymentDate: Yup.string().required("Payment Date is required"),
      totalAmount: Yup.number().positive("Payment amount must be > 0").required("Payment amount is required"),
      bankAccountId: Yup.string().required("Account is required"),
    }),
    onSubmit: async (values) => {
      try {
        let targetInv = invoices.find((inv: any) => String(inv.id) === String(values.purchaseInvoiceHeaderId));
        if (!targetInv && selectedPoId) {
          targetInv = invoices.find((inv: any) => String(inv.poHeaderId || inv.purchase_order_id || inv.header?.poHeaderId) === String(selectedPoId));
        }
        if (!targetInv && values.vendorId) {
          targetInv = invoices.find((inv: any) => String(inv.vendorId || inv.vendor_id || inv.header?.vendorId) === String(values.vendorId));
        }

        const invHeaderId = targetInv ? Number(targetInv.id) : (values.purchaseInvoiceHeaderId ? Number(values.purchaseInvoiceHeaderId) : null);
        const payAmount = Number(values.totalAmount || 0);

        let linesPayload: any[] = [];
        const invLines = targetInv?.lines || targetInv?.lineItems || targetInv?.purchaseInvoiceLines || [];
        
        if (invLines.length > 0) {
          const invTotal = invLines.reduce((sum: number, l: any) => sum + (Number(l.lineTotal || l.line_total || (Number(l.quantity || 1) * Number(l.unitPrice || l.unit_price || 0))) || 0), 0);

          let allocatedSum = 0;
          linesPayload = invLines.map((l: any, idx: number) => {
            let lineAmt = 0;
            if (idx === invLines.length - 1) {
              lineAmt = Number((payAmount - allocatedSum).toFixed(2));
            } else {
              const rawAmt = invTotal > 0 ? (Number(l.lineTotal || l.line_total || 0) / invTotal) * payAmount : payAmount / invLines.length;
              lineAmt = Number(rawAmt.toFixed(2));
              allocatedSum += lineAmt;
            }
            return {
              purchaseInvoiceLineId: Number(l.id || (idx + 1)),
              amountPaid: lineAmt > 0 ? lineAmt : payAmount,
              remarks: l.remarks || "Invoice payment line allocation",
            };
          });
        }

        if (linesPayload.length === 0) {
          const lineId = invLines?.[0]?.id || targetInv?.id || 1;
          linesPayload = [
            {
              purchaseInvoiceLineId: Number(lineId),
              amountPaid: Number(payAmount.toFixed(2)),
              remarks: "Invoice payment allocation line",
            },
          ];
        }

        const payNum = values.paymentNumber || `PAY-${Date.now().toString().slice(-6)}`;
        const vObj = vendors.find((v: any) => String(v.id) === String(values.vendorId));
        const pmId = values.paymentMethodId || vObj?.payment_method_id || vObj?.paymentMethodId || vObj?.default_payment_method_id || vObj?.paymentMethod?.id || targetInv?.paymentMethodId || targetInv?.payment_method_id || targetInv?.header?.paymentMethodId || targetInv?.header?.payment_method_id || null;

        const linesWithHeader = linesPayload.map((l: any) => ({
          ...l,
          purchaseInvoiceHeaderId: invHeaderId || l.purchaseInvoiceHeaderId || 1,
          purchaseInvoiceLineId: l.purchaseInvoiceLineId || l.id || 1,
        }));

        const payload = {
          ...values,
          paymentMethodId: pmId ? Number(pmId) : null,
          currency: extractCurrencyString(values.currency),
          paymentNumber: payNum,
          purchaseInvoiceHeaderId: invHeaderId,
          user_id: userId,
          lines: linesWithHeader,
          details: linesWithHeader,
          paymentLines: linesWithHeader,
        };

        if (isEdit && editId) {
          await updatePurchasePayment({
            id: editId,
            body: {
              ...payload,
              header: payload,
              paymentLines: linesWithHeader,
              lines: linesWithHeader,
            },
          }).unwrap();
          toast.success("Vendor Payment updated successfully.");
          setOpen(false);
          setViewMode("list");
          setIsEdit(false);
          setEditId(null);
          setSelectedPoId("");
          formik.resetForm();
          refetchPayments();
        } else {
          await createPurchasePayment(payload).unwrap();
          toast.success("Vendor Payment recorded successfully.");
          const poParam = selectedPoId ? `?poId=${selectedPoId}` : "";
          setOpen(false);
          setViewMode("list");
          setIsEdit(false);
          setEditId(null);
          formik.resetForm();
          refetchPayments();
          navigate(`/purchase-return${poParam}`);
        }
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong.");
      }
    },
  });

  React.useEffect(() => {
    const urlPoId = searchParams.get("poId") || searchParams.get("po_id");
    const urlId = searchParams.get("id");
    const urlAction = searchParams.get("action");

    if (urlPoId && purchaseOrders.length > 0) {
      setViewMode("form");
      setOpen(true);
      handlePoChange(urlPoId);
    } else if (urlId && urlAction === "view") {
      handleView(urlId);
    } else if (!urlPoId && !urlId) {
      // Header or direct menu navigation -> Showcase list of all purchase payments
      setOpen(false);
      setViewMode("list");
      setSelectedPaymentId(null);
      setSelectedPoId("");
    }
  }, [searchParams, purchaseOrders]);

  const vendorPOs = useMemo(() => {
    if (!formik.values.vendorId) return [];

    return purchaseOrders.filter((po: any) => {
      // 1. Must match selected Vendor
      const poVendorId = String(po.vendor_id || po.vendorId || po.vendor?.id || "");
      if (poVendorId !== String(formik.values.vendorId)) return false;

      // 2. Must have a GRN created/received for this PO
      const matchingGrn = grns.find((g: any) => {
        const gPoId = String(g.purchaseOrderId || g.purchase_order_id || g.poHeaderId || g.purchaseOrder?.id || "");
        return gPoId === String(po.id);
      });
      if (!matchingGrn) return false;

      // 3. Must have a Vendor Bill / Purchase Invoice completed for this PO or GRN
      const hasBill = invoices.some((inv: any) => {
        const invPoId = String(inv.poHeaderId || inv.purchase_order_id || inv.header?.poHeaderId || "");
        const invGrnId = String(inv.grnHeaderId || inv.header?.grnHeaderId || "");
        return invPoId === String(po.id) || (matchingGrn && invGrnId === String(matchingGrn.id));
      });

      return hasBill;
    });
  }, [purchaseOrders, grns, invoices, formik.values.vendorId]);

  const extractCurrencyString = (c: any) => {
    if (!c) return "INR";
    if (typeof c === "string" || typeof c === "number") return String(c);
    return String(c.currency_code || c.code || c.currency_symbol || c.id || "INR");
  };

  const handleVendorChange = (vId: string) => {
    formik.setFieldValue("vendorId", vId);
    setSelectedPoId("");
    const vObj = vendors.find((v: any) => String(v.id) === String(vId));
    if (vObj) {
      formik.setFieldValue("vendorName", getVendorDisplayName(vObj));
      const subId = vObj.subsidiary_id || vObj.subsidiaryId || vObj.primary_subsidiary_id;
      if (subId) formik.setFieldValue("subsidiary_id", String(subId));
      const curr = extractCurrencyString(vObj.currency || vObj.currency_code || vObj.currency_id || "INR");
      formik.setFieldValue("currency", curr);
      const accId = vObj.default_payables_account_id || vObj.account_id;
      if (accId) formik.setFieldValue("bankAccountId", String(accId));
      const pmId = vObj.payment_method_id || vObj.paymentMethodId || vObj.default_payment_method_id || vObj.paymentMethod?.id;
      if (pmId) formik.setFieldValue("paymentMethodId", String(pmId));
    }
  };

  const handlePoChange = (poId: string) => {
    setSelectedPoId(poId);
    if (!poId) return;

    const poObj = purchaseOrders.find((p: any) => String(p.id) === String(poId));
    if (!poObj) return;

    const vId = poObj.vendor_id || poObj.vendorId || poObj.vendor?.id;
    if (vId && String(formik.values.vendorId) !== String(vId)) {
      handleVendorChange(String(vId));
    }

    const subId = poObj.subsidiary_id || poObj.subsidiaryId;
    if (subId) formik.setFieldValue("subsidiary_id", String(subId));

    const classId = poObj.class_id || poObj.classId;
    if (classId) formik.setFieldValue("class_id", String(classId));

    const deptId = poObj.department_id || poObj.departmentId;
    if (deptId) formik.setFieldValue("department_id", String(deptId));

    const locId = poObj.city_id || poObj.cityId || poObj.location_id || poObj.locationId;
    if (locId) formik.setFieldValue("location_id", String(locId));

    const curr = extractCurrencyString(poObj.currency || poObj.currency_code || poObj.currency_id || "INR");
    formik.setFieldValue("currency", curr);

    const pmId = poObj.payment_method_id || poObj.paymentMethodId || poObj.paymentMethod?.id;
    if (pmId) formik.setFieldValue("paymentMethodId", String(pmId));

    const matchedInv = invoices.find((inv: any) => String(inv.poHeaderId || inv.purchase_order_id || inv.header?.poHeaderId) === String(poObj.id));
    if (matchedInv) {
      const h = matchedInv.header ?? matchedInv;
      formik.setFieldValue("purchaseInvoiceHeaderId", String(matchedInv.id));
      formik.setFieldValue("invoiceNumber", h.invoiceNumber || h.invoice_number || `BILL-${matchedInv.id}`);
      formik.setFieldValue("totalAmount", Number(h.totalAmount || h.total_amount || 0));
      const invPmId = h.paymentMethodId || h.payment_method_id;
      if (invPmId) formik.setFieldValue("paymentMethodId", String(invPmId));
    } else {
      const poLines = poObj.purchaseOrderLines || poObj.lineItems || poObj.line_items || [];
      const poTotal = poLines.reduce((acc: number, l: any) => acc + Number(l.line_total || (Number(l.quantity || 1) * Number(l.rate || 0)) || 0), 0);
      formik.setFieldValue("totalAmount", poTotal > 0 ? poTotal : Number(poObj.total_amount || 0));
      formik.setFieldValue("referenceNo", poObj.purchaseNo || `PO-${poObj.id}`);
    }
  };

  const handleInvoiceChange = (invId: string) => {
    formik.setFieldValue("purchaseInvoiceHeaderId", invId);
    const inv = invoices.find((x: any) => String(x.id) === String(invId));
    if (inv) {
      const header = inv.header ?? inv;
      const vId = header.vendorId ?? header.vendor_id ?? "";
      formik.setFieldValue("invoiceNumber", header.invoiceNumber ?? header.invoice_number ?? "");
      formik.setFieldValue("invoiceDate", header.invoiceDate ?? header.invoice_date ?? "");
      formik.setFieldValue("vendorId", vId);
      const v = vendors.find((v: any) => String(v.id) === String(vId));
      formik.setFieldValue("vendorName", header.vendor?.vendor_name || v?.vendor_name || "");

      const lines = inv.lines || inv.lineItems || [];
      const lineSubtotal = lines.reduce((acc: number, l: any) => acc + (Number(l.quantity || 1) * Number(l.unitPrice || l.unit_price || 0)), 0);
      const lineTax = lines.reduce((acc: number, l: any) => acc + Number(l.taxAmount || l.tax_amount || 0), 0);
      const billTotal = Number(header.totalAmount || header.total_amount || (lineSubtotal + lineTax));
      formik.setFieldValue("totalAmount", billTotal);

      // Auto-fill classification & currency from Vendor primary fields if header lacks them
      const subId = header.subsidiary_id || v?.primary_subsidiary_id || v?.primarySubsidiary?.id || v?.subsidiary_id;
      if (subId) formik.setFieldValue("subsidiary_id", String(subId));
      if (header.class_id) formik.setFieldValue("class_id", String(header.class_id));
      if (header.department_id) formik.setFieldValue("department_id", String(header.department_id));

      const primaryAddr = v?.addressBook?.find((a: any) => a.default_billing) || v?.addressBook?.[0];
      const cityId = header.location_id || primaryAddr?.city_id || primaryAddr?.city?.id || v?.city_id;
      if (cityId) formik.setFieldValue("location_id", String(cityId));

      const curr = header.currency || v?.currency?.currency_code || "INR";
      if (curr) formik.setFieldValue("currency", curr);
    }
  };

  const handleEdit = (id: number | string) => {
    if (!canUpdate("purchase_payment")) {
      toast.error("No permission to edit Vendor Payment");
      return;
    }
    const item = payments.find((x: any) => String(x.id) === String(id)) || singlePaymentData?.result || singlePaymentData?.data;
    if (item) {
      const header = item.header ?? item;
      const statusVal = String(header.status || item.status || "DRAFT").toUpperCase();
      if (statusVal !== "DRAFT") {
        toast.error("Only DRAFT Purchase Payments can be edited.");
        return;
      }

      const formatDate = (val: any) => (val && String(val).length >= 10 ? String(val).slice(0, 10) : "");

      formik.setValues({
        paymentNumber: header.paymentNumber ?? header.payment_number ?? "",
        paymentDate: formatDate(header.paymentDate ?? header.payment_date) || new Date().toISOString().slice(0, 10),
        purchaseInvoiceHeaderId: header.purchaseInvoiceHeaderId ?? header.purchase_invoice_header_id ?? "",
        invoiceNumber: header.invoiceNumber ?? "",
        invoiceDate: formatDate(header.invoiceDate),
        vendorId: header.vendorId ?? header.vendor_id ?? "",
        vendorName: header.vendorName ?? header.vendor?.vendor_name ?? "",
        currency: header.currency ?? "INR",
        exchangeRate: Number(header.exchangeRate ?? 1),
        paymentMethodId: header.paymentMethodId ?? header.payment_method_id ?? "",
        bankAccountId: header.bankAccountId ?? header.bank_account_id ?? "",
        referenceNo: header.referenceNo ?? header.reference_number ?? "",
        subsidiary_id: header.subsidiary_id ?? "",
        class_id: header.class_id ?? "",
        department_id: header.department_id ?? "",
        location_id: header.location_id ?? "",
        totalAmount: Number(header.totalAmount ?? header.amount ?? 0),
        remarks: header.remarks ?? "",
        status: statusVal,
      });
      setEditId(id);
      setIsEdit(true);
      setViewMode("form");
      setOpen(true);
    }
  };

  const handleView = (id: number | string) => {
    setSelectedPaymentId(id);
    const item = payments.find((x: any) => String(x.id) === String(id));
    if (item) {
      setSelectedPayment(item);
    }
    setViewMode("view");
    setOpen(true);
    setSearchParams({ id: String(id), action: "view" });
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    try {
      await deletePurchasePayment(paymentToDelete.id).unwrap();
      toast.success("Vendor Payment deleted successfully");
      refetchPayments();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete Vendor Payment");
    } finally {
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    }
  };

  if (!canRead("purchase_payment")) {
    return <div className="p-8 text-center text-red-600 font-bold">Access Denied: You do not have permission to view Purchase Payments.</div>;
  }

  // ── RENDER 1: CREATE / EDIT FORM OR READ-ONLY VIEW MODE ──
  if (isOpen || viewMode === "form" || viewMode === "view") {
    const isView = viewMode === "view";
    const singlePayment = singlePaymentData?.result || singlePaymentData?.data || singlePaymentData;
    const activePayment = isView ? singlePayment || selectedPayment || {} : {};
    const activeHeader = isView ? activePayment.header ?? activePayment : formik.values;
    const activeLines = isView ? activePayment.paymentLines || activePayment.lines || activePayment.details || [] : [];

    const vendorObj = activeHeader.vendor || vendors.find((v: any) => String(v.id) === String(activeHeader.vendorId || activeHeader.vendor_id));
    const vendorName = getVendorDisplayName(vendorObj) || activeHeader.vendorName || "—";

    const matchedPoId = activeHeader.purchaseInvoice?.poHeaderId || activeHeader.purchase_invoice?.poHeaderId;
    const poObj = purchaseOrders.find((p: any) => String(p.id) === String(matchedPoId));

    const subId = activeHeader.subsidiary_id || activeHeader.vendor?.primary_subsidiary_id || vendorObj?.primary_subsidiary_id || activeHeader.bankAccount?.subsidiary_id || poObj?.subsidiary_id;
    const subsidiaryName = activeHeader.subsidiary?.subsidiary_name || subsidiaries.find((s: any) => String(s.id) === String(subId))?.subsidiary_name || "—";

    const classId = activeHeader.class_id || poObj?.class_id || poObj?.classId;
    const classNameVal = activeHeader.class?.class_name || classesList.find((c: any) => String(c.id) === String(classId))?.class_name || "—";

    const deptId = activeHeader.department_id || poObj?.department_id || poObj?.departmentId;
    const deptNameVal = activeHeader.department?.department_name || departmentsList.find((d: any) => String(d.id) === String(deptId))?.department_name || "—";

    const locId = activeHeader.location_id || poObj?.city_id || poObj?.cityId || poObj?.location_id;
    const locNameVal = activeHeader.location?.city_name || citiesList.find((c: any) => String(c.id) === String(locId))?.city_name || "—";

    const bankAccObj = bankAccounts.find((b: any) => String(b.id) === String(activeHeader.bankAccountId || activeHeader.bank_account_id));

    return (
      <RecordPageLayout
        recordType="Purchase Payment (Vendor Payment)"
        subtitle={isView ? `Payment #${activeHeader.paymentNumber || activeHeader.payment_number || activePayment.id}` : isEdit ? `Edit Payment #${formik.values.paymentNumber}` : "Record Vendor Payment"}
        mode={isView ? "view" : "edit"}
        onSave={() => formik.handleSubmit()}
        onEdit={() => { if (activePayment?.id) handleEdit(activePayment.id); }}
        onBack={() => { setOpen(false); setViewMode("list"); setSelectedPaymentId(null); setSelectedPoId(""); setSearchParams({}); }}
        onCancel={() => { setOpen(false); setViewMode("list"); setSelectedPaymentId(null); setSelectedPoId(""); setSearchParams({}); }}
        onListClick={() => { setOpen(false); setViewMode("list"); setSelectedPaymentId(null); setSelectedPoId(""); setSearchParams({}); }}
        onSearchClick={() => { setOpen(false); setViewMode("list"); setSelectedPaymentId(null); setSelectedPoId(""); setSearchParams({}); }}
        isSaving={isCreating || isUpdating}
        customActions={
          isView && activePayment?.id ? (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => navigate(`/purchase-return?paymentId=${activePayment.id}`)}
                className="bg-red-700 hover:bg-red-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
              >
                Authorize Return
              </button>
            </div>
          ) : undefined
        }
        subTabs={isView ? [
          {
            id: "allocations",
            label: "Payment Allocations",
            badge: activeLines.length,
            content: (
              <div className="overflow-x-auto border border-slate-300 rounded-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#1d3e4c] text-white font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border-r border-slate-400 w-10 text-center">#</th>
                      <th className="p-2 border-r border-slate-400">INVOICE LINE ID</th>
                      <th className="p-2 border-r border-slate-400 text-right">AMOUNT PAID (₹)</th>
                      <th className="p-2">REMARKS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {activeLines.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 italic">No allocation lines recorded.</td>
                      </tr>
                    ) : (
                      activeLines.map((l: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 text-center font-mono text-slate-500 border-r border-slate-200">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-mono text-slate-800">Line #{l.purchaseInvoiceLineId || l.id}</td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">₹{Number(l.amountPaid || 0).toFixed(2)}</td>
                          <td className="p-2 text-slate-600">{l.remarks || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )
          },
          {
            id: "gl_impact",
            label: "GL Impact",
            content: (() => {
              const payAmt = Number(activeHeader.totalAmount || activeHeader.amount || 0);
              const pNoStr = activeHeader.paymentNumber || activeHeader.payment_number || `PAY-${activePayment.id || "NEW"}`;
              const bankAccName = activeHeader.bankAccount?.account_name || bankAccObj?.account_name || "Bank / Cash Account";
              const bankAccCode = activeHeader.bankAccount?.account_number || bankAccObj?.account_number || "1020";

              return (
                <GLImpactSubtab
                  documentNumber={pNoStr}
                  entries={[
                    {
                      accountCode: "2100",
                      accountName: "Accounts Payable (Vendor Payables)",
                      debit: payAmt,
                      credit: 0,
                      memo: `Vendor Payables Settlement - ${vendorName}`,
                    },
                    {
                      accountCode: bankAccCode,
                      accountName: bankAccName,
                      debit: 0,
                      credit: payAmt,
                      memo: `Bank Disbursement - Payment #${pNoStr}`,
                    },
                  ]}
                />
              );
            })()
          }
        ] : undefined}
      >
        {/* SECTION 1: PRIMARY INFORMATION */}
        <RecordSection title="Primary Information" defaultOpen={true}>
          <div className="col-span-full flex flex-col lg:flex-row justify-between items-start gap-6">
            {/* Form Fields Column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 flex-1">
              {isView ? (
                <>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">PAYEE / VENDOR</span>
                    <span className="text-xs font-bold text-slate-900">{vendorName}</span>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">PAYMENT #</span>
                    <span className="text-xs font-bold text-slate-900">{activeHeader.paymentNumber || activeHeader.payment_number || `PAY-${selectedPayment?.id}`}</span>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">PAYMENT DATE</span>
                    <span className="text-xs text-slate-800">{activeHeader.paymentDate || activeHeader.payment_date ? new Date(activeHeader.paymentDate || activeHeader.payment_date).toLocaleDateString() : "—"}</span>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">INVOICE REF #</span>
                    <span className="text-xs font-semibold text-sky-800">{activeHeader.purchaseInvoice?.invoiceNumber || activeHeader.invoiceNumber || (activeHeader.purchaseInvoiceHeaderId ? `BILL-${activeHeader.purchaseInvoiceHeaderId}` : "—")}</span>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">STATUS</span>
                    <div>
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                        String(activeHeader.status || "DRAFT").toUpperCase() === "DRAFT"
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : String(activeHeader.status || "DRAFT").toUpperCase() === "POSTED" || String(activeHeader.status || "").toUpperCase() === "APPROVED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-red-50 text-red-800 border-red-300"
                      }`}>
                        {activeHeader.status || "DRAFT"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      PAYEE / VENDOR <span className="text-amber-600">*</span>
                    </label>
                    <select
                      name="vendorId"
                      value={formik.values.vendorId || ""}
                      onChange={(e) => handleVendorChange(e.target.value)}
                      onBlur={formik.handleBlur}
                      className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                        formik.touched.vendorId && formik.errors.vendorId ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                      }`}
                    >
                      <option value="">-- Select Payee / Vendor --</option>
                      {vendors.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {getVendorDisplayName(v)}
                        </option>
                      ))}
                    </select>
                    {formik.touched.vendorId && formik.errors.vendorId && (
                      <span className="text-[10px] text-red-500">{String(formik.errors.vendorId)}</span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">PURCHASE ORDER</label>
                    <select
                      value={selectedPoId}
                      onChange={(e) => handlePoChange(e.target.value)}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                    >
                      <option value="">-- Select Purchase Order --</option>
                      {vendorPOs.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.purchaseNo || `PO #${p.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      ACCOUNT <span className="text-amber-600">*</span>
                    </label>
                    <select
                      name="bankAccountId"
                      value={formik.values.bankAccountId || ""}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 font-mono ${
                        formik.touched.bankAccountId && formik.errors.bankAccountId ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                      }`}
                    >
                      <option value="">-- Select Account --</option>
                      {bankAccounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.account_number ? `${acc.account_number} - ${acc.account_name}` : acc.account_name}
                        </option>
                      ))}
                    </select>
                    {formik.touched.bankAccountId && formik.errors.bankAccountId && (
                      <span className="text-[10px] text-red-500">{String(formik.errors.bankAccountId)}</span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      PAYMENT AMOUNT (₹) <span className="text-amber-600">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      name="totalAmount"
                      value={formik.values.totalAmount}
                      onChange={formik.handleChange}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-mono font-bold text-sky-800"
                    />
                    {formik.touched.totalAmount && formik.errors.totalAmount && (
                      <span className="text-[10px] text-red-500">{String(formik.errors.totalAmount)}</span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      PAYMENT DATE <span className="text-amber-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="paymentDate"
                      value={formik.values.paymentDate}
                      onChange={formik.handleChange}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">CURRENCY</label>
                    <input
                      type="text"
                      disabled={true}
                      name="currency"
                      value={formik.values.currency || "INR"}
                      className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 font-semibold text-slate-700 cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">EXCHANGE RATE</label>
                    <input
                      type="text"
                      disabled={true}
                      name="exchangeRate"
                      value="1.00"
                      className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 font-mono text-slate-700 cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">STATUS</label>
                    <select
                      name="status"
                      value={formik.values.status || "DRAFT"}
                      onChange={formik.handleChange}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-semibold"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="POSTED">POSTED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">MEMO / REMARKS</label>
                    <input
                      type="text"
                      name="remarks"
                      placeholder="Enter payment memo / remarks..."
                      value={formik.values.remarks}
                      onChange={formik.handleChange}
                      className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Exact NetSuite Right-Corner Summary Box */}
            <div className="w-full lg:w-64 bg-[#dceef2] border border-[#75bac9] rounded-xs overflow-hidden shadow-2xs self-start justify-self-end">
              <div className="bg-[#6fb3c5] text-white px-3 py-1 text-[11px] font-bold tracking-wider uppercase">
                Summary
              </div>
              <div className="p-3 space-y-1.5 text-xs text-slate-800">
                <div className="flex justify-between items-center text-[11px] font-semibold">
                  <span className="text-slate-600 uppercase">VENDOR</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[120px]">{vendorName}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-900 pt-1 border-t border-[#a8d3de]">
                  <span className="uppercase">AMOUNT PAID</span>
                  <span className="font-mono text-sm text-[#1e4856] font-extrabold">₹{Number(activeHeader.totalAmount || activeHeader.amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </RecordSection>

        {/* SECTION 2: CLASSIFICATION */}
        <RecordSection title="Classification" defaultOpen={true}>
          {isView ? (
            <>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">SUBSIDIARY</span>
                <span className="text-xs font-semibold text-slate-800">{subsidiaryName}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">CLASS</span>
                <span className="text-xs font-semibold text-slate-800">{classNameVal}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">DEPARTMENT</span>
                <span className="text-xs font-semibold text-slate-800">{deptNameVal}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">LOCATION</span>
                <span className="text-xs font-semibold text-slate-800">{locNameVal}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">SUBSIDIARY</label>
                <select
                  disabled={true}
                  name="subsidiary_id"
                  value={formik.values.subsidiary_id || ""}
                  onChange={formik.handleChange}
                  className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 text-slate-700 cursor-not-allowed font-medium"
                >
                  <option value="">-- Auto-filled from PO/Vendor --</option>
                  {subsidiaries.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.subsidiary_name || s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">CLASS</label>
                <select
                  disabled={true}
                  name="class_id"
                  value={formik.values.class_id || ""}
                  onChange={formik.handleChange}
                  className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 text-slate-700 cursor-not-allowed font-medium"
                >
                  <option value="">-- Auto-filled from PO --</option>
                  {classesList.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">DEPARTMENT</label>
                <select
                  disabled={true}
                  name="department_id"
                  value={formik.values.department_id || ""}
                  onChange={formik.handleChange}
                  className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 text-slate-700 cursor-not-allowed font-medium"
                >
                  <option value="">-- Auto-filled from PO --</option>
                  {departmentsList.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">LOCATION</label>
                <select
                  disabled={true}
                  name="location_id"
                  value={formik.values.location_id || ""}
                  onChange={formik.handleChange}
                  className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 text-slate-700 cursor-not-allowed font-medium"
                >
                  <option value="">-- Auto-filled from PO --</option>
                  {citiesList.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.city_name || c.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </RecordSection>
      </RecordPageLayout>
    );
  }

  // ── RENDER 2: DATAGRID LIST VIEW MODE ──
  return (
    <div className="flex flex-col space-y-3 p-4 bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* Top Header Title & Action Links */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-300">
        <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Purchase Payments (Vendor Payments)</h1>
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <button
            onClick={() => {
              setOpen(false);
              setViewMode("list");
              setSelectedPaymentId(null);
              setSelectedPoId("");
              setSearchParams({});
            }}
            className="text-sky-700 hover:underline cursor-pointer flex items-center space-x-1"
          >
            <ListIcon className="!w-3.5 !h-3.5" />
            <span>List</span>
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => {
              setOpen(false);
              setViewMode("list");
              setSelectedPaymentId(null);
              setSelectedPoId("");
              setSearchParams({});
            }}
            className="text-sky-700 hover:underline cursor-pointer flex items-center space-x-1"
          >
            <Search className="!w-3.5 !h-3.5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-300 pb-2 bg-white p-3 rounded-xs shadow-2xs">
        <div>
          <p className="text-xs text-slate-500 font-medium">Record and track vendor bill payments and disbursements</p>
        </div>

        {canCreate("purchase_payment") && (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setViewMode("form");
              setIsEdit(false);
              setEditId(null);
              formik.resetForm();
            }}
            className="bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xs border border-blue-800 shadow-2xs transition-colors flex items-center space-x-1"
          >
            <Add className="!w-4 !h-4" />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-300 rounded-xs shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#244b5a] text-white font-bold uppercase text-[10px]">
            <tr>
              <th className="p-2.5 border-r border-slate-400">Payment #</th>
              <th className="p-2.5 border-r border-slate-400">Bill Ref #</th>
              <th className="p-2.5 border-r border-slate-400">Vendor</th>
              <th className="p-2.5 border-r border-slate-400">Payment Date</th>
              <th className="p-2.5 border-r border-slate-400 text-right">Amount Paid</th>
              <th className="p-2.5 border-r border-slate-400 text-center">Status</th>
              <th className="p-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                  No Vendor Payments found. Click "Record Payment" to create one.
                </td>
              </tr>
            ) : (
              payments.map((p: any) => {
                const header = p.header ?? p;
                const amt = Number(header.totalAmount || header.amount || 0);

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 border-r border-slate-200 font-mono text-sky-700 font-semibold">
                      <button onClick={() => handleView(p.id)} className="hover:underline text-left">
                        {header.paymentNumber || header.payment_number || `PAY-${p.id}`}
                      </button>
                    </td>
                    <td className="p-2.5 border-r border-slate-200 font-mono text-slate-700">
                      {header.invoiceNumber || (header.purchase_invoice_header_id ? `BILL-${header.purchase_invoice_header_id}` : "—")}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 font-medium text-slate-900">
                      {header.vendor?.vendor_name || header.vendorName || "—"}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-700">
                      {header.paymentDate || header.payment_date ? new Date(header.paymentDate || header.payment_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                      ₹{amt.toFixed(2)}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        String(header.status || "DRAFT").toUpperCase() === "DRAFT"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : String(header.status || "DRAFT").toUpperCase() === "POSTED" || String(header.status || "").toUpperCase() === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}>
                        {header.status || "DRAFT"}
                      </span>
                    </td>
                    <td className="p-2.5 text-right space-x-2 font-semibold text-[11px]">
                      <button onClick={() => handleView(p.id)} className="text-slate-600 hover:text-sky-700 hover:underline">
                        View
                      </button>
                      <button onClick={() => navigate(`/purchase-return?paymentId=${p.id}`)} className="text-red-600 hover:underline">
                        Return
                      </button>
                      {canUpdate("purchase_payment") && (
                        String(header.status || "DRAFT").toUpperCase() === "DRAFT" ? (
                          <button onClick={() => handleEdit(p.id)} className="text-sky-600 hover:underline">
                            Edit
                          </button>
                        ) : (
                          <span className="text-slate-300 cursor-not-allowed" title="Only DRAFT payments can be edited">Edit</span>
                        )
                      )}
                      {canDelete("purchase_payment") && (
                        <button
                          onClick={() => {
                            setPaymentToDelete(p);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Vendor Payment"
        message="Are you sure you want to delete this payment? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}