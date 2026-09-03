import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Add, Delete, Edit, Search, List as ListIcon, KeyboardArrowDown, KeyboardArrowUp, ReceiptLong, LocalShipping, AssignmentReturn } from "@mui/icons-material";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import * as Yup from "yup";

import { useGetVendorsQuery } from "../RTK/services/vendorApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetClassesQuery } from "../RTK/services/classApi";
import { useGetDepartmentsQuery } from "../RTK/services/departmentApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";
import { useGetChartOfAccountsQuery } from "../RTK/services/chartOfAccountApi";
import { useAppSelector } from "../Hooks/Reduxhook/hooks";
import { usePermissions } from "../Hooks/usePermissions";

import {
  useCreateDebitNoteMutation,
  useDeleteDebitNoteMutation,
  useGetDebitNotesQuery,
  useLazyGetDebitNotesQuery,
  useGetDebitNoteByIdQuery,
  useLazyGetDebitNoteByIdQuery,
  useUpdateDebitNoteMutation,
} from "../RTK/services/debitNoteApi";
import { useGetPurchaseInvoicesQuery,
  useLazyGetPurchaseInvoiceByIdQuery,
  useGetPurchaseReturnsQuery,
  useLazyGetPurchaseReturnByIdQuery } from "../RTK/services/purchaseApi";

import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";
import { GLImpactSubtab } from "./Layout/GLImpactSubtab";
import ConfirmationDialog from "./Dialog/ConfirmationDialog";

export default function DebitNoteComp() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const userId = currentUser?.id ?? "";

  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [selectedDebitNote, setSelectedDebitNote] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Eager Queries
  const { data: debitNotesData, refetch: refetchDebitNotes } = useGetDebitNotesQuery({ page: 1, limit: 50 });
  const { data: invoicesData } = useGetPurchaseInvoicesQuery({ page: 1, limit: 100 });
  const { data: purchaseReturnsData, refetch: refetchPurchaseReturns } = useGetPurchaseReturnsQuery({ page: 1, limit: 100 });
  const { data: vendorsData } = useGetVendorsQuery({ page: 1, option: true });
  const { data: chartOfAccountsData } = useGetChartOfAccountsQuery(undefined);
  const { data: subsidiariesData } = useGetSubsidiariesQuery(undefined);
  const { data: classesData } = useGetClassesQuery(undefined);
  const { data: departmentsData } = useGetDepartmentsQuery(undefined);
  const { data: citiesData } = useGetCitiesQuery(undefined);
  const { data: currenciesData } = useGetCurrenciesQuery(undefined);

  const [createDebitNote, { isLoading: isCreating }] = useCreateDebitNoteMutation();
  const [updateDebitNote, { isLoading: isUpdating }] = useUpdateDebitNoteMutation();
  const [deleteDebitNote] = useDeleteDebitNoteMutation();
  const [triggerGetPurchaseReturnById] = useLazyGetPurchaseReturnByIdQuery();
  const [triggerGetInvoiceById] = useLazyGetPurchaseInvoiceByIdQuery();
  const [triggerGetDebitNoteById] = useLazyGetDebitNoteByIdQuery();

  const debitNotes = useMemo(() => (Array.isArray(debitNotesData?.result) ? debitNotesData.result : Array.isArray(debitNotesData?.data) ? debitNotesData.data : Array.isArray(debitNotesData?.result?.rows) ? debitNotesData.result.rows : Array.isArray(debitNotesData) ? debitNotesData : []), [debitNotesData]);
  const invoices = useMemo(() => (Array.isArray(invoicesData?.result) ? invoicesData.result : Array.isArray(invoicesData?.data) ? invoicesData.data : Array.isArray(invoicesData) ? invoicesData : []), [invoicesData]);
  const purchaseReturns = useMemo(() => (Array.isArray(purchaseReturnsData?.result) ? purchaseReturnsData.result : Array.isArray(purchaseReturnsData?.data) ? purchaseReturnsData.data : Array.isArray(purchaseReturnsData) ? purchaseReturnsData : []), [purchaseReturnsData]);
  const vendors = useMemo(() => (Array.isArray(vendorsData?.result) ? vendorsData.result : Array.isArray(vendorsData?.data) ? vendorsData.data : Array.isArray(vendorsData) ? vendorsData : []), [vendorsData]);
  const accounts = Array.isArray(chartOfAccountsData?.result) ? chartOfAccountsData.result : Array.isArray(chartOfAccountsData?.data) ? chartOfAccountsData.data : Array.isArray(chartOfAccountsData) ? chartOfAccountsData : [];
  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : Array.isArray(subsidiariesData?.data) ? subsidiariesData.data : Array.isArray(subsidiariesData) ? subsidiariesData : [];
  const classesList = Array.isArray(classesData?.result) ? classesData.result : Array.isArray(classesData?.data) ? classesData.data : Array.isArray(classesData) ? classesData : [];
  const departmentsList = Array.isArray(departmentsData?.result) ? departmentsData.result : Array.isArray(departmentsData?.data) ? departmentsData.data : Array.isArray(departmentsData) ? departmentsData : [];
  const citiesList = Array.isArray(citiesData?.result) ? citiesData.result : Array.isArray(citiesData?.data) ? citiesData.data : Array.isArray(citiesData) ? citiesData : [];
  const currencies = Array.isArray(currenciesData?.result) ? currenciesData.result : Array.isArray(currenciesData?.data) ? currenciesData.data : Array.isArray(currenciesData) ? currenciesData : [];

  const formik = useFormik({
    initialValues: {
      debitNoteNumber: "",
      vendorId: "",
      purchaseInvoiceHeaderId: "",
      debitNoteDate: new Date().toISOString().slice(0, 10),
      subtotal: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxPercent: 0,
      taxAmount: 0,
      amount: 0,
      accountId: "",
      subsidiary_id: "",
      class_id: "",
      department_id: "",
      location_id: "",
      currency_id: "",
      reason: "",
      remarks: "",
      status: "APPROVED",
      user_id: userId,
    },
    validationSchema: Yup.object().shape({
      vendorId: Yup.string().required("Vendor is required"),
      debitNoteDate: Yup.string().required("Date is required"),
      amount: Yup.number().min(0, "Amount must be >= 0").required("Amount is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          header: {
            ...values,
            subtotal: Number(values.subtotal || 0),
            discount_amount: Number(values.discountAmount || 0),
            tax_amount: Number(values.taxAmount || 0),
            total_amount: Number(values.amount || 0),
            user_id: userId,
          },
          subtotal: Number(values.subtotal || 0),
          discount_amount: Number(values.discountAmount || 0),
          tax_amount: Number(values.taxAmount || 0),
          total_amount: Number(values.amount || 0),
          amount: Number(values.amount || 0),
          details: [],
          lines: [],
        };

        let savedId = editId;
        if (isEdit && editId) {
          const res = await updateDebitNote({ id: editId, body: payload }).unwrap();
          toast.success("Vendor Credit updated successfully.");
          savedId = res?.result?.id || res?.data?.id || res?.result?.header?.id || res?.data?.header?.id || editId;
        } else {
          const res = await createDebitNote(payload).unwrap();
          toast.success("Vendor Credit recorded successfully.");
          savedId = res?.result?.id || res?.data?.id || res?.result?.header?.id || res?.data?.header?.id || res?.id;
        }
        if (refetchDebitNotes) refetchDebitNotes();
        if (savedId) {
          setSelectedDebitNote({ id: savedId, header: payload.header, ...payload });
          setViewMode("view");
          setIsEdit(false);
          setEditId(null);
          setSearchParams({ action: "view", id: String(savedId) });
        } else {
          setViewMode("list");
          setIsEdit(false);
          setEditId(null);
          setSearchParams({});
        }
        formik.resetForm();
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong.");
      }
    },
  });

  const handleSubtotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0;
    formik.setFieldValue("subtotal", val);
    const disc = Number(formik.values.discountAmount) || 0;
    const tax = Number(formik.values.taxAmount) || 0;
    const net = Math.max(0, Number((val - disc + tax).toFixed(2)));
    formik.setFieldValue("amount", net);
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const disc = Number(e.target.value) || 0;
    formik.setFieldValue("discountAmount", disc);
    const sub = Number(formik.values.subtotal) || 0;
    const tax = Number(formik.values.taxAmount) || 0;
    const net = Math.max(0, Number((sub - disc + tax).toFixed(2)));
    formik.setFieldValue("amount", net);
  };

  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tax = Number(e.target.value) || 0;
    formik.setFieldValue("taxAmount", tax);
    const sub = Number(formik.values.subtotal) || 0;
    const disc = Number(formik.values.discountAmount) || 0;
    const net = Math.max(0, Number((sub - disc + tax).toFixed(2)));
    formik.setFieldValue("amount", net);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const net = Number(e.target.value) || 0;
    formik.setFieldValue("amount", net);
    if (!formik.values.subtotal || Number(formik.values.subtotal) === 0) {
      formik.setFieldValue("subtotal", net);
    }
  };

  useEffect(() => {
    const urlAction = searchParams.get("action");
    const urlId = searchParams.get("id");
    const returnId = searchParams.get("returnId");
    const invoiceId = searchParams.get("invoiceId");

    if (returnId) {
      setViewMode("form");
      setIsEdit(false);

      triggerGetPurchaseReturnById(returnId)
        .unwrap()
        .then((res: any) => {
          const retObj = res?.result || res?.data || res;
          if (!retObj) return;

          const header = retObj.header || retObj;
          const statusVal = String(header.status || retObj.status || "").toUpperCase();
          if (statusVal !== "FULFILLED" && statusVal !== "RETURNED") {
            toast.error(`Purchase Return #${header.returnNumber || header.return_number || returnId} must be FULFILLED before creating a Vendor Credit.`);
            setViewMode("list");
            setSearchParams({});
            return;
          }

          if (header.vendorId || header.vendor_id) {
            formik.setFieldValue("vendorId", String(header.vendorId || header.vendor_id));
          }
          if (header.purchaseInvoiceHeaderId || header.purchase_invoice_header_id) {
            formik.setFieldValue("purchaseInvoiceHeaderId", String(header.purchaseInvoiceHeaderId || header.purchase_invoice_header_id));
          }

          const retLines = retObj.details || retObj.lineItems || retObj.purchaseReturnLines || retObj.purchase_return_lines || [];
          let subtotal = Number(header.subtotal || 0);
          let discountAmount = Number(header.discountAmount || header.discount_amount || 0);
          let taxAmount = Number(header.taxAmount || header.tax_amount || 0);
          let totalAmt = Number(header.totalAmount || header.total_amount || 0);

          if (retLines.length > 0) {
            if (subtotal === 0) {
              subtotal = retLines.reduce((acc: number, l: any) => {
                const q = Number(l.returnQty || l.return_quantity || l.quantity || 0);
                const p = Number(l.unitPrice || l.unit_price || l.rate || 0);
                return acc + (q * p);
              }, 0);
            }
            if (discountAmount === 0) {
              discountAmount = retLines.reduce((acc: number, l: any) => acc + Number(l.discountAmount || l.discount_amount || 0), 0);
            }
            if (taxAmount === 0) {
              taxAmount = retLines.reduce((acc: number, l: any) => acc + Number(l.taxAmount || l.tax_amount || 0), 0);
            }
            if (totalAmt === 0) {
              totalAmt = Number((subtotal - discountAmount + taxAmount).toFixed(2));
            }
          }

          formik.setFieldValue("subtotal", Number(subtotal.toFixed(2)));
          formik.setFieldValue("discountAmount", Number(discountAmount.toFixed(2)));
          formik.setFieldValue("taxAmount", Number(taxAmount.toFixed(2)));
          const finalNet = totalAmt > 0 ? totalAmt : Math.max(0, Number((subtotal - discountAmount + taxAmount).toFixed(2)));
          formik.setFieldValue("amount", finalNet);

          if (header.subsidiary_id || header.subsidiaryId) {
            formik.setFieldValue("subsidiary_id", String(header.subsidiary_id || header.subsidiaryId));
          }
          if (header.class_id || header.classId) {
            formik.setFieldValue("class_id", String(header.class_id || header.classId));
          }
          if (header.department_id || header.departmentId) {
            formik.setFieldValue("department_id", String(header.department_id || header.departmentId));
          }
          if (header.currency_id || header.currencyId) {
            formik.setFieldValue("currency_id", String(header.currency_id || header.currencyId));
          }
          formik.setFieldValue("reason", `Vendor Credit against Return Authorization #${header.returnNumber || header.return_number || returnId}`);
        })
        .catch((err: any) => {
          console.error("Failed to fetch Return by ID for vendor credit:", err);
        });
    } else if (invoiceId) {
      setViewMode("form");
      setIsEdit(false);

      triggerGetInvoiceById(invoiceId)
        .unwrap()
        .then((res: any) => {
          const invObj = res?.result || res?.data || res;
          if (!invObj) return;

          const header = invObj.header || invObj;
          if (header.vendorId || header.vendor_id) {
            formik.setFieldValue("vendorId", String(header.vendorId || header.vendor_id));
          }
          formik.setFieldValue("purchaseInvoiceHeaderId", String(invoiceId));

          const sub = Number(header.subtotal || 0);
          const disc = Number(header.discountAmount || header.discount_amount || 0);
          const tax = Number(header.taxAmount || header.tax_amount || 0);
          const total = Number(header.totalAmount || header.total_amount || 0);

          formik.setFieldValue("subtotal", Number(sub.toFixed(2)));
          formik.setFieldValue("discountAmount", Number(disc.toFixed(2)));
          formik.setFieldValue("taxAmount", Number(tax.toFixed(2)));
          formik.setFieldValue("amount", total > 0 ? total : Math.max(0, Number((sub - disc + tax).toFixed(2))));
        })
        .catch((err: any) => {
          console.error("Failed to fetch Invoice by ID for vendor credit:", err);
        });
    } else if (urlAction === "create") {
      toast.error("Vendor Credits must be initiated from a fulfilled Purchase Return or Invoice.");
      setViewMode("list");
      setSearchParams({});
    } else if (urlId && urlAction === "view") {
      triggerGetDebitNoteById(urlId)
        .unwrap()
        .then((res: any) => {
          const dn = res?.result || res?.data || res;
          if (dn) {
            setSelectedDebitNote(dn);
            setViewMode("view");
          }
        })
        .catch(() => {
          const dn = debitNotes.find((d: any) => String(d.id) === String(urlId));
          if (dn) {
            setSelectedDebitNote(dn);
            setViewMode("view");
          }
        });
    }
  }, [searchParams]);

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = e.target.value;
    formik.setFieldValue("vendorId", vendorId);

    const selectedVendor = vendors.find((v: any) => String(v.id) === String(vendorId));
    if (selectedVendor) {
      const subId = selectedVendor.primary_subsidiary_id ?? selectedVendor.primarySubsidiary?.id ?? selectedVendor.subsidiary_id ?? selectedVendor.subsidiary?.id;
      if (subId) formik.setFieldValue("subsidiary_id", String(subId));

      const currId = selectedVendor.currency_id ?? selectedVendor.currency?.id;
      if (currId) formik.setFieldValue("currency_id", String(currId));

      const primaryAddr = selectedVendor.addressBook?.find((a: any) => a.default_billing) || selectedVendor.addressBook?.[0];
      const cityId = primaryAddr?.city_id ?? primaryAddr?.city?.id ?? selectedVendor.city_id ?? selectedVendor.city?.id;
      if (cityId) formik.setFieldValue("location_id", String(cityId));
    }
  };

  const handleEdit = (id: number | string) => {
    if (!canUpdate("debit_note")) {
      toast.error("No permission to edit Debit Note");
      return;
    }
    const item = debitNotes.find((x: any) => String(x.id) === String(id));
    if (item) {
      const header = item.header ?? item;
      const formatDate = (val: any) => (val && String(val).length >= 10 ? String(val).slice(0, 10) : "");

      const sub = Number(header.subtotal || 0);
      const disc = Number(header.discountAmount || header.discount_amount || 0);
      const tax = Number(header.taxAmount || header.tax_amount || 0);
      const amt = Number(header.amount || header.totalAmount || header.total_amount || 0);

      formik.setValues({
        debitNoteNumber: header.debitNoteNumber ?? header.debit_note_number ?? "",
        vendorId: String(header.vendorId ?? header.vendor_id ?? ""),
        purchaseInvoiceHeaderId: String(header.purchaseInvoiceHeaderId ?? header.purchase_invoice_header_id ?? ""),
        debitNoteDate: formatDate(header.debitNoteDate ?? header.debit_note_date) || new Date().toISOString().slice(0, 10),
        subtotal: sub > 0 ? sub : (amt > 0 ? amt : 0),
        discountPercent: Number(header.discountPercent ?? header.discount_percent ?? 0),
        discountAmount: disc,
        taxPercent: Number(header.taxPercent ?? header.tax_percent ?? 0),
        taxAmount: tax,
        amount: amt > 0 ? amt : Math.max(0, sub - disc + tax),
        accountId: String(header.accountId ?? header.account_id ?? ""),
        subsidiary_id: String(header.subsidiary_id ?? ""),
        class_id: String(header.class_id ?? ""),
        department_id: String(header.department_id ?? ""),
        location_id: String(header.location_id ?? header.city_id ?? ""),
        currency_id: String(header.currency_id ?? ""),
        reason: header.reason ?? "",
        remarks: header.remarks ?? "",
        status: header.status ?? "APPROVED",
        user_id: userId,
      });
      setEditId(id);
      setIsEdit(true);
      setViewMode("form");
      setSearchParams({ id: String(id), action: "edit" });
    }
  };

  const handleView = (id: number | string) => {
    const item = debitNotes.find((x: any) => String(x.id) === String(id));
    if (item) {
      setSelectedDebitNote(item);
      setViewMode("view");
      setSearchParams({ id: String(id), action: "view" });
    }
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    try {
      await deleteDebitNote(noteToDelete.id).unwrap();
      toast.success("Debit Note deleted successfully");
      refetchDebitNotes();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete Debit Note");
    } finally {
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  if (!canRead("debit_note")) {
    return <div className="p-8 text-center text-red-600 font-bold">Access Denied: You do not have permission to view Debit Notes.</div>;
  }

  const helperVendorName = (v: any) => {
    if (!v) return "";
    return v.company_name || [v.salutation, v.first_name, v.last_name].filter(Boolean).join(" ");
  };

  // Lifecycle navigation component
  const P2PLifecycleNav = () => (
    <div className="flex items-center space-x-1.5 bg-slate-200/90 p-1 rounded-sm text-xs font-semibold">
      <button
        type="button"
        onClick={() => navigate("/purchase-return")}
        className="px-3 py-1 rounded-xs text-slate-700 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer flex items-center space-x-1"
      >
        <AssignmentReturn className="!w-3.5 !h-3.5 text-slate-600" />
        <span>Return Authorizations</span>
      </button>
      <button
        type="button"
        onClick={() => navigate("/return-fulfillment")}
        className="px-3 py-1 rounded-xs text-slate-700 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer flex items-center space-x-1"
      >
        <LocalShipping className="!w-3.5 !h-3.5 text-slate-600" />
        <span>Item Fulfillments</span>
      </button>
      <button
        type="button"
        onClick={() => { setViewMode("list"); setIsEdit(false); setSearchParams({}); }}
        className="px-3 py-1 rounded-xs bg-[#244b5a] text-white shadow-2xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
      >
        <ReceiptLong className="!w-3.5 !h-3.5 text-sky-200" />
        <span>Vendor Credits</span>
      </button>
    </div>
  );

  const getVendorDisplayName = (vendorObj: any) => {
    if (!vendorObj) return "—";
    const code = vendorObj.entity_id ? `${vendorObj.entity_id} ` : "";
    const name = helperVendorName(vendorObj);
    return `${code}${name}`.trim() || "—";
  };

  // ── RENDER 1: FORM & VIEW MODE ──
  if (viewMode === "form" || viewMode === "view") {
    const isView = viewMode === "view";
    const activeHeader = isView ? selectedDebitNote?.header || selectedDebitNote || {} : formik.values;

    const returnId = activeHeader.purchase_return_id || activeHeader.purchaseReturnId || activeHeader.returnId;
    const parentReturn = purchaseReturns.find((r: any) => String(r.id) === String(returnId));
    const retH = parentReturn?.header || parentReturn;
    const invId = activeHeader.purchaseInvoiceHeaderId || activeHeader.purchase_invoice_header_id || activeHeader.invoiceId || retH?.purchaseInvoiceHeaderId;
    const parentInvoice = invoices.find((i: any) => String(i.id) === String(invId));
    const invH = parentInvoice?.header ?? parentInvoice;
    const poId = activeHeader.purchaseOrderId || activeHeader.purchase_order_id || retH?.purchaseOrderId || invH?.purchaseOrderHeaderId || invH?.poHeaderId;
    const parentPo = purchaseOrders.find((p: any) => String(p.id) === String(poId));
    const poH = parentPo?.header ?? parentPo;

    const vendorObj = vendors.find((v: any) => String(v.id) === String(activeHeader.vendorId || activeHeader.vendor_id || poH?.vendorId || invH?.vendorId));
    const vendorName = getVendorDisplayName(vendorObj);

    const subIdVal = activeHeader.subsidiary_id || poH?.subsidiary_id || poH?.subsidiaryId || retH?.subsidiary_id || invH?.subsidiary_id || vendorObj?.primary_subsidiary_id;
    const subsidiaryName = activeHeader.subsidiary?.subsidiary_name || subsidiaries.find((s: any) => String(s.id) === String(subIdVal))?.subsidiary_name || poH?.subsidiary?.subsidiary_name || poH?.subsidiary?.name || "—";

    const classIdVal = activeHeader.class_id || poH?.class_id || poH?.classId || retH?.class_id || invH?.class_id;
    const classNameVal = activeHeader.class?.class_name || classesList.find((c: any) => String(c.id) === String(classIdVal))?.class_name || poH?.class?.class_name || "—";

    const deptIdVal = activeHeader.department_id || poH?.department_id || poH?.departmentId || retH?.department_id || invH?.department_id;
    const deptNameVal = activeHeader.department?.department_name || departmentsList.find((d: any) => String(d.id) === String(deptIdVal))?.department_name || poH?.department?.department_name || "—";

    const locIdVal = activeHeader.location_id || activeHeader.city_id || poH?.city_id || poH?.cityId || poH?.location_id || retH?.location_id || invH?.location_id;
    const locNameVal = activeHeader.location?.city_name || citiesList.find((c: any) => String(c.id) === String(locIdVal))?.city_name || poH?.city?.city_name || poH?.city?.name || poH?.location?.city_name || "—";
    const currencyObj = currencies.find((c: any) => String(c.id) === String(activeHeader.currency_id));
    const accountObj = accounts.find((a: any) => String(a.id) === String(activeHeader.accountId || activeHeader.account_id));

    const activeSubtotal = Number(activeHeader.subtotal || 0);
    const activeDiscount = Number(activeHeader.discountAmount || activeHeader.discount_amount || 0);
    const activeTax = Number(activeHeader.taxAmount || activeHeader.tax_amount || 0);
    const totalAmount = Number(activeHeader.amount || activeHeader.totalAmount || activeHeader.total_amount || (activeSubtotal - activeDiscount + activeTax) || 0);
    const resolvedSubtotal = activeSubtotal > 0 ? activeSubtotal : (totalAmount + activeDiscount - activeTax > 0 ? totalAmount + activeDiscount - activeTax : totalAmount);

    const dnNoStr = activeHeader.debitNoteNumber || activeHeader.debit_note_number || `DN-${selectedDebitNote?.id || "NEW"}`;

    const findAccount = (keywords: string[], typeKeywords: string[], defaultName: string, defaultCode: string) => {
      const byName = accounts.find((a: any) =>
        keywords.some((k) => (a.account_name || a.name || "").toLowerCase().includes(k.toLowerCase()))
      );
      if (byName) return { name: byName.account_name || byName.name, code: byName.account_number || byName.account_code || byName.code || defaultCode };

      const byType = accounts.find((a: any) =>
        typeKeywords.some((k) => (a.accountType?.account_type_name || a.account_type || "").toLowerCase().includes(k.toLowerCase()))
      );
      if (byType) return { name: byType.account_name || byType.name, code: byType.account_number || byType.account_code || byType.code || defaultCode };

      return { name: defaultName, code: defaultCode };
    };

    const apAcc = accountObj
      ? { name: accountObj.account_name || accountObj.name, code: accountObj.account_number || accountObj.account_code || "2000" }
      : findAccount(["Accounts Payable", "Trade Creditors", "Creditors", "Payable"], ["Accounts Payable", "Current Liability", "Liability"], "Accounts Payable (AP)", "2000");

    const clearingAcc = findAccount(
      ["Purchase Return Clearing", "Return Clearing", "GRNI", "Accrued Purchases", "Clearing"],
      ["Asset", "Current Asset", "Liability", "Current Liability"],
      "Accrued Purchases / Vendor Return Clearing",
      "2200"
    );

    const taxAcc = findAccount(
      ["Input Tax", "Input GST", "Tax Receivable", "Tax Credit", "GST Input", "Duties & Taxes"],
      ["Tax", "Current Asset", "Asset"],
      "Input Tax (GST) Receivable",
      "1400"
    );

    const discAcc = findAccount(
      ["Purchase Discount", "Discount Received", "Discount Income", "Discount"],
      ["Income", "Expense", "Direct Income"],
      "Purchase Discount / Discount Received",
      "4200"
    );

    const clearingAmount = Number((totalAmount - (activeTax > 0 ? activeTax : 0)).toFixed(2));
    const glImpactEntries = [
      // 1. DEBIT: Accounts Payable (Reduces liability by total net credit amount)
      {
        accountCode: apAcc.code,
        accountName: apAcc.name,
        debit: totalAmount,
        credit: 0,
        memo: `Debit AP - Vendor Credit #${dnNoStr} (${vendorName})`,
      },
      // 2. CREDIT: Input Tax (GST) Reversal (if GST exists)
      ...(activeTax > 0
        ? [
            {
              accountCode: taxAcc.code,
              accountName: taxAcc.name,
              debit: 0,
              credit: activeTax,
              memo: `Input Tax (GST) Reversal - #${dnNoStr}`,
            },
          ]
        : []),
      // 3. CREDIT: Purchase Return Clearing (Offsets fulfillment accrual)
      ...(clearingAmount > 0
        ? [
            {
              accountCode: clearingAcc.code,
              accountName: clearingAcc.name,
              debit: 0,
              credit: clearingAmount,
              memo: `Vendor Return Clearing Offset - #${dnNoStr}`,
            },
          ]
        : []),
    ];

    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Debit Note / Vendor Credit"
          subtitle={isView ? `Debit Note #${dnNoStr} ${vendorName}` : isEdit ? `Edit Debit Note #${formik.values.debitNoteNumber}` : "New Debit Note"}
          mode={isView ? "view" : "edit"}
          onSave={() => formik.handleSubmit()}
          onEdit={() => { if (selectedDebitNote) handleEdit(selectedDebitNote.id); }}
          onBack={() => { setViewMode("list"); setSearchParams({}); }}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
          customActions={
            isView && selectedDebitNote && String(activeHeader.status || activeHeader.document_status || "").toUpperCase() === "DRAFT" ? (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const updatedPayload = {
                        ...selectedDebitNote,
                        header: {
                          ...(selectedDebitNote.header || selectedDebitNote),
                          status: "APPROVED",
                        },
                        status: "APPROVED",
                      };
                      await updateDebitNote({
                        id: selectedDebitNote.id,
                        body: updatedPayload,
                      }).unwrap();
                      toast.success("Vendor Credit approved & posted successfully.");
                      if (refetchDebitNotes) refetchDebitNotes();
                      setSelectedDebitNote({
                        ...selectedDebitNote,
                        header: {
                          ...(selectedDebitNote.header || selectedDebitNote),
                          status: "APPROVED",
                        },
                        status: "APPROVED",
                      });
                      setViewMode("view");
                      setSearchParams({ action: "view", id: String(selectedDebitNote.id) });
                    } catch (err: any) {
                      toast.error(err?.data?.message || "Failed to approve Vendor Credit.");
                    }
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <ReceiptLong className="!w-4 !h-4" />
                  <span>Approve & Post to GL</span>
                </button>
              </div>
            ) : undefined
          }
          isSaving={isCreating || isUpdating}
          subTabs={[
            {
              id: "details",
              label: "Credit Details",
              content: (
                <div className="p-3 space-y-2 bg-slate-50 border border-slate-300 rounded-xs text-xs">
                  <div className="font-semibold text-slate-800">
                    Vendor Credit Application & Allocation Details
                  </div>
                  <div className="text-slate-600">
                    Vendor: <span className="font-bold text-slate-900">{vendorName}</span> | Reason: <span className="font-medium text-slate-800">{activeHeader.reason || "Standard Debit Adjustment"}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Subtotal</span>
                      <span className="font-mono font-bold text-slate-800">₹{resolvedSubtotal.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Discount</span>
                      <span className="font-mono font-bold text-amber-700">₹{activeDiscount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Tax (GST)</span>
                      <span className="font-mono font-bold text-sky-700">₹{activeTax.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Net Credit Total</span>
                      <span className="font-mono font-bold text-emerald-700">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ),
            },
            ...((isView && String(activeHeader.status || "").toUpperCase() !== "DRAFT")
              ? [
                  {
                    id: "gl_impact",
                    label: "GL Impact",
                    content: (
                      <GLImpactSubtab
                        documentNumber={dnNoStr}
                        entries={glImpactEntries}
                      />
                    ),
                  },
                ]
              : []),
          ]}
        >
          {/* PRIMARY INFORMATION + SUMMARY CARD */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <RecordSection title="Primary Information" defaultOpen={true}>
                {isView ? (
                  <>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">DEBIT NOTE #</span>
                      <span className="text-xs font-bold text-slate-900">{activeHeader.debitNoteNumber || activeHeader.debit_note_number || `DN-${selectedDebitNote?.id}`}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">VENDOR</span>
                      <span className="text-xs font-bold text-sky-700">{vendorName}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">DEBIT NOTE DATE</span>
                      <span className="text-xs text-slate-800">{activeHeader.debitNoteDate || activeHeader.debit_note_date ? new Date(activeHeader.debitNoteDate || activeHeader.debit_note_date).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">STATUS</span>
                      <div>
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                          String(activeHeader.status || activeHeader.document_status || "APPROVED").toUpperCase() === "DRAFT"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}>
                          {activeHeader.status || activeHeader.document_status || "APPROVED"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">ACCOUNT</span>
                      <span className="text-xs font-semibold text-slate-900">{accountObj?.account_name || "Purchase Returns / AP"}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">SUBTOTAL (₹)</span>
                      <span className="text-xs font-mono font-semibold text-slate-900">₹{resolvedSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">DISCOUNT AMOUNT (₹)</span>
                      <span className="text-xs font-mono font-semibold text-amber-700">₹{activeDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">TAX AMOUNT (₹)</span>
                      <span className="text-xs font-mono font-semibold text-sky-700">₹{activeTax.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">NET CREDIT AMOUNT (₹)</span>
                      <span className="text-xs font-mono font-bold text-emerald-700">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">REASON</span>
                      <span className="text-xs text-slate-800">{activeHeader.reason || "—"}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">REMARKS</span>
                      <span className="text-xs text-slate-800">{activeHeader.remarks || "—"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">DEBIT NOTE #</label>
                      <input
                        type="text"
                        name="debitNoteNumber"
                        placeholder="Auto-generated if empty"
                        value={formik.values.debitNoteNumber}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        VENDOR <span className="text-amber-600">*</span>
                      </label>
                      <select
                        name="vendorId"
                        value={formik.values.vendorId}
                        onChange={handleVendorChange}
                        onBlur={formik.handleBlur}
                        className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                          formik.touched.vendorId && formik.errors.vendorId ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                        }`}
                      >
                        <option value="">Select Vendor...</option>
                        {vendors.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {getVendorDisplayName(v)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        DEBIT NOTE DATE <span className="text-amber-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="debitNoteDate"
                        value={formik.values.debitNoteDate}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        STATUS <span className="text-amber-600">*</span>
                      </label>
                      <select
                        name="status"
                        value={formik.values.status}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-semibold text-slate-800"
                      >
                        <option value="APPROVED">APPROVED (Posting to GL)</option>
                        <option value="DRAFT">DRAFT (Non-Posting)</option>
                        <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        SUBTOTAL / GROSS (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        name="subtotal"
                        value={formik.values.subtotal}
                        onChange={handleSubtotalChange}
                        className="h-7 text-xs border border-slate-300 rounded-xs px-2 text-right font-mono bg-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        DISCOUNT AMOUNT (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        name="discountAmount"
                        value={formik.values.discountAmount}
                        onChange={handleDiscountChange}
                        className="h-7 text-xs border border-slate-300 rounded-xs px-2 text-right font-mono bg-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        TAX (GST) AMOUNT (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        name="taxAmount"
                        value={formik.values.taxAmount}
                        onChange={handleTaxChange}
                        className="h-7 text-xs border border-slate-300 rounded-xs px-2 text-right font-mono bg-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        NET CREDIT AMOUNT (₹) <span className="text-amber-600">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        name="amount"
                        value={formik.values.amount}
                        onChange={handleAmountChange}
                        onBlur={formik.handleBlur}
                        className={`h-7 text-xs border rounded-xs px-2 text-right font-mono font-bold text-emerald-800 focus:outline-none focus:border-sky-500 ${
                          formik.touched.amount && formik.errors.amount ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                        }`}
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">CREDIT ACCOUNT</label>
                      <select
                        name="accountId"
                        value={formik.values.accountId}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                      >
                        <option value="">Select Account...</option>
                        {accounts.map((a: any) => (
                          <option key={a.id} value={a.id}>
                            {a.account_number ? `${a.account_number} - ${a.account_name}` : a.account_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">REASON</label>
                      <input
                        type="text"
                        name="reason"
                        placeholder="Price adjustment, return credit..."
                        value={formik.values.reason}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">REMARKS</label>
                      <input
                        type="text"
                        name="remarks"
                        placeholder="Internal memo or notes..."
                        value={formik.values.remarks}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </>
                )}
              </RecordSection>
            </div>

            {/* Summary Card */}
            <div className="w-full lg:w-72 self-start">
              <div className="border border-slate-300 rounded-xs overflow-hidden shadow-2xs">
                <div className="bg-[#78a4b7] text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                  Credit Summary
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-700">
                    <span className="uppercase text-[10px] font-semibold text-slate-500">SUBTOTAL</span>
                    <span>₹{resolvedSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {activeDiscount > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span className="uppercase text-[10px] font-semibold text-slate-500">DISCOUNT (-)</span>
                      <span>-₹{activeDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {activeTax > 0 && (
                    <div className="flex justify-between text-sky-700">
                      <span className="uppercase text-[10px] font-semibold text-slate-500">TAX (GST) (+)</span>
                      <span>+₹{activeTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5 text-sm">
                    <span className="uppercase text-[11px]">NET CREDIT</span>
                    <span className="text-emerald-700">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CLASSIFICATION SECTION */}
          <RecordSection title="Classification" defaultOpen={true}>
            {isView ? (
              <>
                <div className="flex flex-col space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">SUBSIDIARY</span>
                  <span className="text-xs font-semibold text-slate-800">{subsidiaryName}</span>
                </div>
                <div className="flex flex-col space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">LOCATION / CITY</span>
                  <span className="text-xs font-semibold text-slate-800">{locNameVal}</span>
                </div>
                <div className="flex flex-col space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">CLASS</span>
                  <span className="text-xs font-semibold text-slate-800">{classNameVal}</span>
                </div>
                <div className="flex flex-col space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">DEPARTMENT</span>
                  <span className="text-xs font-semibold text-slate-800">{deptNameVal}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">SUBSIDIARY</label>
                  <select
                    name="subsidiary_id"
                    value={formik.values.subsidiary_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">Select Subsidiary...</option>
                    {subsidiaries.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.subsidiary_name || s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">LOCATION / CITY</label>
                  <select
                    name="location_id"
                    value={formik.values.location_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">Select Location...</option>
                    {citiesList.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.city_name || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">CLASS</label>
                  <select
                    name="class_id"
                    value={formik.values.class_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">Select Class...</option>
                    {classesList.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.class_name || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">DEPARTMENT</label>
                  <select
                    name="department_id"
                    value={formik.values.department_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">Select Department...</option>
                    {departmentsList.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.department_name || d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </RecordSection>

          {/* INTERCOMPANY MANAGEMENT */}
          <RecordSection title="Intercompany Management" defaultOpen={true}>
            {isView ? (
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">CURRENCY</span>
                <span className="text-xs font-bold text-slate-900">{currencyObj?.currency_code || "INR"}</span>
              </div>
            ) : (
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">CURRENCY</label>
                <select
                  name="currency_id"
                  value={formik.values.currency_id || ""}
                  onChange={formik.handleChange}
                  className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Select Currency...</option>
                  {currencies.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.currency_code || c.code} - {c.currency_name || c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </RecordSection>
        </RecordPageLayout>
      </form>
    );
  }

  // ── RENDER 2: DATAGRID LIST VIEW MODE ──
  const filteredNotes = debitNotes.filter((note: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const dnNoStr = String(note.debitNoteNumber || note.debit_note_number || note.creditNoteNumber || note.credit_note_number || `DN-${note.id}`).toLowerCase();
    const vName = getVendorDisplayName(note.vendor).toLowerCase();
    return dnNoStr.includes(term) || vName.includes(term);
  });

  return (
    <div className="flex flex-col space-y-3 p-4 bg-[#f3f6f9] min-h-screen font-sans text-slate-800">
      {/* Header with Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 border-b border-slate-300 gap-2">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Debit Notes (Vendor Credits)</h1>
        </div>
        <P2PLifecycleNav />
      </div>

      {/* Button Bar without standalone create */}
      <div className="bg-white p-3 border border-slate-300 rounded-xs shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-xs">
          <span className="uppercase text-[10px] font-bold text-slate-500">VIEW</span>
          <select className="h-7 px-3 text-xs bg-white border border-slate-300 rounded-xs font-medium focus:outline-none focus:border-sky-600">
            <option>All Debit Notes</option>
          </select>
        </div>
        <div className="text-xs text-slate-500 italic">
          Vendor Credits are generated directly from fulfilled Purchase Returns or Invoices.
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white border border-slate-300 rounded-xs shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full bg-[#f8fafc] hover:bg-slate-100 px-3 py-1.5 border-b border-slate-300 text-xs font-bold text-slate-700 flex items-center justify-between transition-colors select-none cursor-pointer"
        >
          <div className="flex items-center space-x-1.5 text-[11px] text-[#244b5a]">
            <span>= + FILTERS</span>
          </div>
          {isFilterOpen ? <KeyboardArrowUp className="!w-4 !h-4 text-slate-500" /> : <KeyboardArrowDown className="!w-4 !h-4 text-slate-500" />}
        </button>

        {isFilterOpen && (
          <div className="p-3 bg-slate-50/50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search</label>
              <input
                type="text"
                placeholder="Search Debit Note #, Vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded-xs focus:outline-none focus:border-sky-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* DataGrid Table */}
      <div className="bg-white border border-slate-300 rounded-xs shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#e5eff5] border-b border-slate-300 text-[#244b5a] font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-2 border-r border-slate-300 w-24 text-center">EDIT | VIEW</th>
              <th className="p-2 border-r border-slate-300 w-20">ID</th>
              <th className="p-2 border-r border-slate-300 min-w-[130px]">DEBIT NOTE #</th>
              <th className="p-2 border-r border-slate-300 min-w-[170px]">VENDOR</th>
              <th className="p-2 border-r border-slate-300 w-24">DATE</th>
              <th className="p-2 border-r border-slate-300 w-24 text-right">SUBTOTAL (₹)</th>
              <th className="p-2 border-r border-slate-300 w-24 text-right">DISCOUNT (₹)</th>
              <th className="p-2 border-r border-slate-300 w-24 text-right">TAX (₹)</th>
              <th className="p-2 border-r border-slate-300 w-28 text-right">NET AMOUNT (₹)</th>
              <th className="p-2 border-r border-slate-300 w-24 text-center">STATUS</th>
              <th className="p-2 w-16 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredNotes.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-500 font-medium italic">
                  {searchTerm ? "No matching debit notes found." : "No Debit Notes found. Click '+ New Debit Note' to create one."}
                </td>
              </tr>
            ) : (
              filteredNotes.map((note: any) => {
                const dnNoStr = note.debitNoteNumber || note.debit_note_number || note.creditNoteNumber || note.credit_note_number || `DN-${note.id}`;
                const vendorName = getVendorDisplayName(note.vendor);
                const sub = Number(note.subtotal || 0);
                const disc = Number(note.discountAmount || note.discount_amount || 0);
                const tax = Number(note.taxAmount || note.tax_amount || 0);
                const amt = Number(note.amount || note.totalAmount || note.total_amount || 0);
                const displaySub = sub > 0 ? sub : (amt > 0 ? amt + disc - tax : amt);

                return (
                  <tr key={note.id} className="hover:bg-sky-50/50 transition-colors">
                    <td className="p-2 border-r border-slate-200 text-center font-semibold space-x-1">
                      {canUpdate("debit_note") ? (
                        <button onClick={() => handleEdit(note.id)} className="text-sky-700 hover:underline cursor-pointer">
                          Edit
                        </button>
                      ) : (
                        <span className="text-slate-300">Edit</span>
                      )}
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleView(note.id)} className="text-sky-700 hover:underline cursor-pointer">
                        View
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">{note.id}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-sky-800">
                      <button onClick={() => handleView(note.id)} className="hover:underline text-left cursor-pointer">
                        {dnNoStr}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{vendorName}</td>
                    <td className="p-2 border-r border-slate-200 text-slate-700">
                      {note.debitNoteDate || note.debit_note_date || note.creditDate || note.credit_date ? new Date(note.debitNoteDate || note.debit_note_date || note.creditDate || note.credit_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700">
                      ₹{displaySub.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono text-amber-700">
                      {disc > 0 ? `₹${disc.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono text-sky-700">
                      {tax > 0 ? `₹${tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800">
                      ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center">
                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {note.status || "APPROVED"}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {canDelete("debit_note") && (
                        <button
                          onClick={() => {
                            setNoteToDelete(note);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:underline font-semibold cursor-pointer"
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
        title="Delete Debit Note"
        message="Are you sure you want to delete this debit note? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
