import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Add, Delete, Edit, Print, Search, List as ListIcon, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
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
  useUpdateDebitNoteMutation,
} from "../RTK/services/debitNoteApi";
import { useGetPurchaseInvoicesQuery } from "../RTK/services/purchaseApi";

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

  const debitNotes = useMemo(() => (Array.isArray(debitNotesData?.result) ? debitNotesData.result : Array.isArray(debitNotesData?.data) ? debitNotesData.data : Array.isArray(debitNotesData) ? debitNotesData : []), [debitNotesData]);
  const invoices = useMemo(() => (Array.isArray(invoicesData?.result) ? invoicesData.result : Array.isArray(invoicesData?.data) ? invoicesData.data : Array.isArray(invoicesData) ? invoicesData : []), [invoicesData]);
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
      amount: Yup.number().positive("Amount must be > 0").required("Amount is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          header: {
            ...values,
            user_id: userId,
          },
          details: [],
        };

        if (isEdit && editId) {
          await updateDebitNote({ id: editId, body: payload }).unwrap();
          toast.success("Debit Note updated successfully.");
        } else {
          await createDebitNote(payload).unwrap();
          toast.success("Debit Note recorded successfully.");
        }
        setViewMode("list");
        setIsEdit(false);
        setEditId(null);
        setSearchParams({});
        formik.resetForm();
        refetchDebitNotes();
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong.");
      }
    },
  });

  useEffect(() => {
    const urlAction = searchParams.get("action");
    const urlId = searchParams.get("id");
    const returnId = searchParams.get("returnId");
    const invoiceId = searchParams.get("invoiceId");

    if (returnId) {
      setViewMode("form");
      setIsEdit(false);
      const retObj = purchaseReturns.find((r: any) => String(r.id) === String(returnId));
      if (retObj) {
        if (retObj.vendorId || retObj.vendor_id) {
          formik.setFieldValue("vendorId", String(retObj.vendorId || retObj.vendor_id));
        }
      }
    } else if (invoiceId) {
      setViewMode("form");
      setIsEdit(false);
      const invObj = invoices.find((i: any) => String(i.id) === String(invoiceId));
      if (invObj) {
        const header = invObj.header || invObj;
        if (header.vendorId || header.vendor_id) {
          formik.setFieldValue("vendorId", String(header.vendorId || header.vendor_id));
        }
        formik.setFieldValue("purchaseInvoiceHeaderId", String(invoiceId));
      }
    } else if (urlAction === "create") {
      setViewMode("form");
      setIsEdit(false);
    } else if (urlId && urlAction === "view") {
      const dn = debitNotes.find((d: any) => String(d.id) === String(urlId));
      if (dn) {
        setSelectedDebitNote(dn);
        setViewMode("view");
      }
    }
  }, [searchParams, debitNotes, purchaseReturns, invoices]);

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

      formik.setValues({
        debitNoteNumber: header.debitNoteNumber ?? header.debit_note_number ?? "",
        vendorId: String(header.vendorId ?? header.vendor_id ?? ""),
        purchaseInvoiceHeaderId: String(header.purchaseInvoiceHeaderId ?? header.purchase_invoice_header_id ?? ""),
        debitNoteDate: formatDate(header.debitNoteDate ?? header.debit_note_date) || new Date().toISOString().slice(0, 10),
        amount: Number(header.amount ?? 0),
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

    const vendorObj = vendors.find((v: any) => String(v.id) === String(activeHeader.vendorId || activeHeader.vendor_id));
    const vendorName = getVendorDisplayName(vendorObj);
    const subsidiaryName = activeHeader.subsidiary?.subsidiary_name || subsidiaries.find((s: any) => String(s.id) === String(activeHeader.subsidiary_id))?.subsidiary_name || "—";
    const classNameVal = activeHeader.class?.class_name || classesList.find((c: any) => String(c.id) === String(activeHeader.class_id))?.class_name || "—";
    const deptNameVal = activeHeader.department?.department_name || departmentsList.find((d: any) => String(d.id) === String(activeHeader.department_id))?.department_name || "—";
    const locNameVal = activeHeader.location?.city_name || citiesList.find((c: any) => String(c.id) === String(activeHeader.location_id))?.city_name || "—";
    const currencyObj = currencies.find((c: any) => String(c.id) === String(activeHeader.currency_id));
    const accountObj = accounts.find((a: any) => String(a.id) === String(activeHeader.accountId || activeHeader.account_id));

    const totalAmount = Number(activeHeader.amount || 0);

    const dnNoStr = activeHeader.debitNoteNumber || activeHeader.debit_note_number || `DN-${selectedDebitNote?.id || "NEW"}`;

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
                        entries={[
                          {
                            accountCode: accountObj?.account_number || "2100",
                            accountName: accountObj?.account_name || "Accounts Payable (AP)",
                            debit: totalAmount,
                            credit: 0,
                            memo: `Debit AP - Vendor Credit #${dnNoStr}`,
                          },
                          {
                            accountCode: "2200",
                            accountName: "Accrued Purchases / Vendor Return Clearing",
                            debit: 0,
                            credit: totalAmount,
                            memo: `Apply Credit adjustment for ${vendorName}`,
                          },
                        ]}
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
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">ACCOUNT</span>
                      <span className="text-xs font-semibold text-slate-900">{accountObj?.account_name || "Purchase Returns / AP"}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">REASON</span>
                      <span className="text-xs text-slate-800">{activeHeader.reason || "—"}</span>
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
                        CREDIT AMOUNT (₹) <span className="text-amber-600">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        name="amount"
                        value={formik.values.amount}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`h-7 text-xs border rounded-xs px-2 text-right font-mono focus:outline-none focus:border-sky-500 ${
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
                  </>
                )}
              </RecordSection>
            </div>

            {/* Summary Card */}
            <div className="w-full lg:w-64 self-start">
              <div className="border border-slate-300 rounded-xs overflow-hidden shadow-2xs">
                <div className="bg-[#78a4b7] text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                  Credit Summary
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                    <span className="uppercase text-[11px]">NET CREDIT</span>
                    <span className="text-emerald-700">₹{totalAmount.toFixed(2)}</span>
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
    const dnNoStr = String(note.debitNoteNumber || note.debit_note_number || `DN-${note.id}`).toLowerCase();
    const vName = getVendorDisplayName(note.vendor).toLowerCase();
    return dnNoStr.includes(term) || vName.includes(term);
  });

  return (
    <div className="flex flex-col space-y-3 p-4 bg-[#f3f6f9] min-h-screen font-sans text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-300">
        <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Debit Notes (Vendor Credits)</h1>
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <button onClick={() => setViewMode("list")} className="text-sky-700 hover:underline cursor-pointer flex items-center space-x-1">
            <ListIcon className="!w-3.5 !h-3.5" />
            <span>List</span>
          </button>
          <span className="text-slate-300">|</span>
          <button onClick={() => setViewMode("list")} className="text-sky-700 hover:underline cursor-pointer flex items-center space-x-1">
            <Search className="!w-3.5 !h-3.5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Button Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded-xs shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-xs">
          <span className="uppercase text-[10px] font-bold text-slate-500">VIEW</span>
          <select className="h-7 px-3 text-xs bg-white border border-slate-300 rounded-xs font-medium focus:outline-none focus:border-sky-600">
            <option>All Debit Notes</option>
          </select>
          {canCreate("debit_note") && (
            <button
              type="button"
              onClick={() => {
                setViewMode("form");
                setIsEdit(false);
                setEditId(null);
                formik.resetForm();
                setSearchParams({ action: "create" });
              }}
              className="bg-[#0070d2] hover:bg-blue-700 text-white font-bold text-xs px-4 py-1.5 rounded-xs border border-blue-800 shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Add className="!w-4 !h-4" />
              <span>+ New Debit Note</span>
            </button>
          )}
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
              <th className="p-2 border-r border-slate-300 w-24">INTERNAL ID</th>
              <th className="p-2 border-r border-slate-300 min-w-[130px]">DEBIT NOTE NUMBER</th>
              <th className="p-2 border-r border-slate-300 min-w-[180px]">VENDOR</th>
              <th className="p-2 border-r border-slate-300 w-28">DATE</th>
              <th className="p-2 border-r border-slate-300 w-28 text-right">AMOUNT (₹)</th>
              <th className="p-2 border-r border-slate-300 w-28 text-center">STATUS</th>
              <th className="p-2 w-20 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredNotes.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-medium italic">
                  {searchTerm ? "No matching debit notes found." : "No Debit Notes found. Click '+ New Debit Note' to create one."}
                </td>
              </tr>
            ) : (
              filteredNotes.map((note: any) => {
                const dnNoStr = note.debitNoteNumber || note.debit_note_number || `DN-${note.id}`;
                const vendorName = getVendorDisplayName(note.vendor);

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
                      {note.debitNoteDate || note.debit_note_date ? new Date(note.debitNoteDate || note.debit_note_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                      ₹{Number(note.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
