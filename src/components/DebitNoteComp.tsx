import { useGetJournalEntryByIdQuery } from "../RTK/services/journalEntryApi";
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Add, Delete, Edit, Search, List as ListIcon, KeyboardArrowDown, KeyboardArrowUp, ReceiptLong, LocalShipping, AssignmentReturn, AccountBalance, Payment, CheckCircle, Close, ArrowForward } from "@mui/icons-material";
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
  useApplyVendorCreditToBillsMutation,
  useGetOpenBillsForVendorQuery,
  useGetVendorCreditApplicationsQuery,
} from "../RTK/services/debitNoteApi";
import {
  useGetPurchaseInvoicesQuery,
  useLazyGetPurchaseInvoiceByIdQuery,
  useGetPurchaseReturnsQuery,
  useLazyGetPurchaseReturnByIdQuery,
  useGetPurchaseOrdersQuery,
} from "../RTK/services/purchaseApi";

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
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyBillAmounts, setApplyBillAmounts] = useState<{ [billId: number]: number }>({});
  const [applyRemarks, setApplyRemarks] = useState("");
  const [applyError, setApplyError] = useState("");
  const [sourceLines, setSourceLines] = useState<any[]>([]);

  // Eager Queries
  const { data: debitNotesData, refetch: refetchDebitNotes } = useGetDebitNotesQuery({ page: 1, limit: 50 });
  const { data: invoicesData } = useGetPurchaseInvoicesQuery({ page: 1, limit: 100 });
  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery(undefined);
  const { data: purchaseReturnsData, refetch: refetchPurchaseReturns } = useGetPurchaseReturnsQuery({ page: 1, limit: 100 });
  const { data: vendorsData } = useGetVendorsQuery({ page: 1, option: true });
  const { data: chartOfAccountsData } = useGetChartOfAccountsQuery(undefined);
  const { data: subsidiariesData } = useGetSubsidiariesQuery(undefined);
  const { data: classesData } = useGetClassesQuery(undefined);
  const { data: departmentsData } = useGetDepartmentsQuery(undefined);
  const { data: citiesData } = useGetCitiesQuery(undefined);
  const { data: currenciesData } = useGetCurrenciesQuery(undefined);

  const [createDebitNote, { isLoading: isCreating }] = useCreateDebitNoteMutation();
  const activeDebitNoteId = (viewMode === "view" || isEdit) ? (selectedDebitNote?.id || editId) : null;
  const numDebitNoteId = Number(activeDebitNoteId);
  const isValidDebitNoteId = Boolean(activeDebitNoteId && !isNaN(numDebitNoteId) && numDebitNoteId > 0);
  const { data: journalEntryData } = useGetJournalEntryByIdQuery(
    { id: numDebitNoteId || 0, source: "vendorcredit" },
    { skip: !isValidDebitNoteId }
  );
  const [updateDebitNote, { isLoading: isUpdating }] = useUpdateDebitNoteMutation();
  const [deleteDebitNote] = useDeleteDebitNoteMutation();
  const [applyVendorCredit, { isLoading: isApplyingCredit }] = useApplyVendorCreditToBillsMutation();

  const selectedVendorId = selectedDebitNote?.vendorId || selectedDebitNote?.vendor_id || selectedDebitNote?.vendor?.id;
  const { data: openBillsData, refetch: refetchOpenBills } = useGetOpenBillsForVendorQuery(selectedVendorId || 0, {
    skip: !selectedVendorId || !isApplyModalOpen,
  });
  const { data: applicationsData, refetch: refetchApplications } = useGetVendorCreditApplicationsQuery(selectedDebitNote?.id || 0, {
    skip: !selectedDebitNote?.id || viewMode !== "view",
  });

  const openBills = Array.isArray(openBillsData?.result) ? openBillsData.result : [];
  const appliedBills = Array.isArray(applicationsData?.result?.billApplies) ? applicationsData.result.billApplies : [];
  const creditRefunds = Array.isArray(applicationsData?.result?.refunds) ? applicationsData.result.refunds : [];

  const [triggerGetPurchaseReturnById] = useLazyGetPurchaseReturnByIdQuery();
  const [triggerGetInvoiceById] = useLazyGetPurchaseInvoiceByIdQuery();
  const [triggerGetDebitNoteById] = useLazyGetDebitNoteByIdQuery();

  const debitNotes = useMemo(() => (Array.isArray(debitNotesData?.result) ? debitNotesData.result : Array.isArray(debitNotesData?.data) ? debitNotesData.data : Array.isArray(debitNotesData?.result?.rows) ? debitNotesData.result.rows : Array.isArray(debitNotesData) ? debitNotesData : []), [debitNotesData]);
  const invoices = useMemo(() => (Array.isArray(invoicesData?.result) ? invoicesData.result : Array.isArray(invoicesData?.data) ? invoicesData.data : Array.isArray(invoicesData) ? invoicesData : []), [invoicesData]);
  const purchaseOrders = useMemo(() => (Array.isArray(purchaseOrdersData?.result) ? purchaseOrdersData.result : Array.isArray(purchaseOrdersData?.data) ? purchaseOrdersData.data : Array.isArray(purchaseOrdersData) ? purchaseOrdersData : []), [purchaseOrdersData]);
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
        const lineItems = sourceLines.length > 0
          ? sourceLines.map((l: any) => ({
              purchaseReturnLineId: l.id || l.purchaseReturnLineId || null,
              itemId: Number(l.itemId || l.item_id || l.ItemMasterId || 1),
              creditQty: Number(l.returnQty || l.return_quantity || l.fulfilledQty || l.quantity || 1),
              unitPrice: Number(l.unitPrice || l.unit_price || l.rate || 0),
              discountPercent: Number(l.discountPercent || l.discount_percent || 0),
              discountAmount: Number(l.discountAmount || l.discount_amount || 0),
              taxPercent: Number(l.taxPercent || l.tax_percent || 0),
              taxAmount: Number(l.taxAmount || l.tax_amount || 0),
              totalAmount: Number(l.totalAmount || l.total_amount || 0),
              remarks: l.remarks || null,
            }))
          : [
              {
                itemId: 1,
                creditQty: 1,
                unitPrice: Number(values.subtotal || values.amount || 0),
                discountPercent: Number(values.discountPercent || 0),
                discountAmount: Number(values.discountAmount || 0),
                taxPercent: Number(values.taxPercent || 0),
                taxAmount: Number(values.taxAmount || 0),
                totalAmount: Number(values.amount || 0),
                remarks: values.reason || values.remarks || null,
              },
            ];

        const payload = {
          header: {
            ...values,
            vendorId: Number(values.vendorId),
            creditNoteNumber: values.debitNoteNumber || undefined,
            creditDate: values.debitNoteDate,
            subtotal: Number(values.subtotal || 0),
            discountAmount: Number(values.discountAmount || 0),
            discount_amount: Number(values.discountAmount || 0),
            taxAmount: Number(values.taxAmount || 0),
            tax_amount: Number(values.taxAmount || 0),
            totalAmount: Number(values.amount || 0),
            total_amount: Number(values.amount || 0),
            purchaseReturnHeaderId: searchParams.get("returnId") ? Number(searchParams.get("returnId")) : undefined,
            fulfillmentHeaderId: searchParams.get("fulfillmentId") ? Number(searchParams.get("fulfillmentId")) : undefined,
            purchaseInvoiceHeaderId: values.purchaseInvoiceHeaderId ? Number(values.purchaseInvoiceHeaderId) : undefined,
            user_id: userId,
          },
          lineItems,
          lines: lineItems,
          details: lineItems,
          subtotal: Number(values.subtotal || 0),
          discount_amount: Number(values.discountAmount || 0),
          tax_amount: Number(values.taxAmount || 0),
          total_amount: Number(values.amount || 0),
          amount: Number(values.amount || 0),
        };

        let savedId = editId;
        if (isEdit && editId) {
          const res = await updateDebitNote({ id: editId, body: payload }).unwrap();
          toast.success("Vendor Credit updated successfully.");
          savedId = res?.result?.id || res?.data?.id || res?.result?.header?.id || res?.data?.header?.id || editId;
        } else {
          const res = await createDebitNote(payload).unwrap();
          toast.success("Vendor Credit recorded successfully.");
          savedId = res?.result?.header?.id || res?.result?.id || res?.data?.id || res?.data?.header?.id || res?.id;
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

  const autofillClassAndDepartment = (subId: string) => {
    if (!subId) {
      formik.setFieldValue("class_id", "");
      formik.setFieldValue("department_id", "");
      return;
    }

    const matchingClasses = classesList.filter(
      (c: any) => String(c.subsidiary_id ?? c.subsidiaryId ?? c.subsidiary?.id ?? "") === String(subId)
    );
    if (matchingClasses.length > 0) {
      formik.setFieldValue("class_id", String(matchingClasses[0].id));
    } else {
      const fallbackClass = classesList.find((c: any) => !c.subsidiary_id && !c.subsidiaryId && !c.subsidiary?.id);
      formik.setFieldValue("class_id", fallbackClass ? String(fallbackClass.id) : (classesList[0]?.id ? String(classesList[0].id) : ""));
    }

    const matchingDepts = departmentsList.filter(
      (d: any) => String(d.subsidiary_id ?? d.subsidiaryId ?? d.subsidiary?.id ?? "") === String(subId)
    );
    if (matchingDepts.length > 0) {
      formik.setFieldValue("department_id", String(matchingDepts[0].id));
    } else {
      const fallbackDept = departmentsList.find((d: any) => !d.subsidiary_id && !d.subsidiaryId && !d.subsidiary?.id);
      formik.setFieldValue("department_id", fallbackDept ? String(fallbackDept.id) : (departmentsList[0]?.id ? String(departmentsList[0].id) : ""));
    }
  };

  const handleSubsidiaryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subId = e.target.value;
    formik.setFieldValue("subsidiary_id", subId);
    autofillClassAndDepartment(subId);
  };

  const availableClasses = useMemo(() => {
    const subId = formik.values.subsidiary_id;
    if (!subId) return classesList;
    const matching = classesList.filter(
      (c: any) => String(c.subsidiary_id ?? c.subsidiaryId ?? c.subsidiary?.id ?? "") === String(subId)
    );
    return matching.length > 0 ? matching : classesList;
  }, [classesList, formik.values.subsidiary_id]);

  const availableDepartments = useMemo(() => {
    const subId = formik.values.subsidiary_id;
    if (!subId) return departmentsList;
    const matching = departmentsList.filter(
      (d: any) => String(d.subsidiary_id ?? d.subsidiaryId ?? d.subsidiary?.id ?? "") === String(subId)
    );
    return matching.length > 0 ? matching : departmentsList;
  }, [departmentsList, formik.values.subsidiary_id]);

  useEffect(() => {
    const urlAction = searchParams.get("action");
    const urlId = searchParams.get("id");
    const returnId = searchParams.get("returnId");
    const fulfillmentId = searchParams.get("fulfillmentId");
    const invoiceId = searchParams.get("invoiceId");

    if (returnId || fulfillmentId) {
      const activeRefId = returnId || fulfillmentId;
      setViewMode("form");
      setIsEdit(false);

      triggerGetPurchaseReturnById(activeRefId)
        .unwrap()
        .then((res: any) => {
          const retObj = res?.result || res?.data || res;
          if (!retObj) return;

          const header = retObj.header || retObj;
          const statusVal = String(header.status || retObj.status || "").toUpperCase();
          if (statusVal !== "FULFILLED" && statusVal !== "RETURNED" && statusVal !== "AUTHORIZED") {
            toast.error(`Purchase Return #${header.returnNumber || header.return_number || activeRefId} must be authorized/fulfilled before creating a Vendor Credit.`);
          }

          const vendorIdVal = header.vendorId || header.vendor_id;
          const selectedVendor = vendors.find((v: any) => String(v.id) === String(vendorIdVal));
          if (vendorIdVal) {
            formik.setFieldValue("vendorId", String(vendorIdVal));
          }
          if (header.purchaseInvoiceHeaderId || header.purchase_invoice_header_id) {
            formik.setFieldValue("purchaseInvoiceHeaderId", String(header.purchaseInvoiceHeaderId || header.purchase_invoice_header_id));
          }

          const retLines = retObj.details || retObj.lineItems || retObj.purchaseReturnLines || retObj.purchase_return_lines || [];
          setSourceLines(retLines);
          let subtotal = Number(header.subtotal || 0);
          let discountAmount = Number(header.discountAmount || header.discount_amount || 0);
          let taxAmount = Number(header.taxAmount || header.tax_amount || 0);
          let totalAmt = Number(header.totalAmount || header.total_amount || 0);

          if (retLines.length > 0) {
            if (subtotal === 0) {
              subtotal = retLines.reduce((acc: number, l: any) => {
                const q = Number(l.returnQty || l.return_quantity || l.fulfilledQty || l.quantity || 0);
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

          const subId = header.subsidiary_id || header.subsidiaryId || selectedVendor?.primary_subsidiary_id || selectedVendor?.subsidiary_id;
          if (subId) {
            const strSubId = String(subId);
            formik.setFieldValue("subsidiary_id", strSubId);

            const classIdFromRet = header.class_id || header.classId;
            if (classIdFromRet) {
              formik.setFieldValue("class_id", String(classIdFromRet));
            } else {
              const matchClass = classesList.find((c: any) => String(c.subsidiary_id ?? c.subsidiaryId ?? "") === strSubId);
              if (matchClass) formik.setFieldValue("class_id", String(matchClass.id));
              else autofillClassAndDepartment(strSubId);
            }

            const deptIdFromRet = header.department_id || header.departmentId;
            if (deptIdFromRet) {
              formik.setFieldValue("department_id", String(deptIdFromRet));
            } else {
              const matchDept = departmentsList.find((d: any) => String(d.subsidiary_id ?? d.subsidiaryId ?? "") === strSubId);
              if (matchDept) formik.setFieldValue("department_id", String(matchDept.id));
            }
          }

          const locId = header.location_id || header.city_id || selectedVendor?.city_id;
          if (locId) formik.setFieldValue("location_id", String(locId));

          const currId = header.currency_id || header.currencyId || selectedVendor?.currency_id;
          if (currId) formik.setFieldValue("currency_id", String(currId));

          const apAcc = selectedVendor?.default_payables_account_id || selectedVendor?.account_id;
          if (apAcc) formik.setFieldValue("accountId", String(apAcc));

          formik.setFieldValue("reason", `Vendor Credit against Return Authorization #${header.returnNumber || header.return_number || activeRefId}`);
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
          const vendorIdVal = header.vendorId || header.vendor_id;
          const selectedVendor = vendors.find((v: any) => String(v.id) === String(vendorIdVal));
          if (vendorIdVal) {
            formik.setFieldValue("vendorId", String(vendorIdVal));
          }
          const invLines = invObj.details || invObj.lineItems || invObj.purchaseInvoiceLines || invObj.purchase_invoice_lines || [];
          setSourceLines(invLines);
          formik.setFieldValue("purchaseInvoiceHeaderId", String(invoiceId));

          const sub = Number(header.subtotal || 0);
          const disc = Number(header.discountAmount || header.discount_amount || 0);
          const tax = Number(header.taxAmount || header.tax_amount || 0);
          const total = Number(header.totalAmount || header.total_amount || 0);

          formik.setFieldValue("subtotal", Number(sub.toFixed(2)));
          formik.setFieldValue("discountAmount", Number(disc.toFixed(2)));
          formik.setFieldValue("taxAmount", Number(tax.toFixed(2)));
          formik.setFieldValue("amount", total > 0 ? total : Math.max(0, Number((sub - disc + tax).toFixed(2))));

          const subId = header.subsidiary_id || header.subsidiaryId || selectedVendor?.primary_subsidiary_id || selectedVendor?.subsidiary_id;
          if (subId) {
            const strSubId = String(subId);
            formik.setFieldValue("subsidiary_id", strSubId);
            if (header.class_id) formik.setFieldValue("class_id", String(header.class_id));
            else autofillClassAndDepartment(strSubId);
            if (header.department_id) formik.setFieldValue("department_id", String(header.department_id));
          }
          if (header.location_id || header.city_id) formik.setFieldValue("location_id", String(header.location_id || header.city_id));
          if (header.currency_id) formik.setFieldValue("currency_id", String(header.currency_id));
          if (selectedVendor?.default_payables_account_id) formik.setFieldValue("accountId", String(selectedVendor.default_payables_account_id));
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
  }, [searchParams, vendors, classesList, departmentsList]);

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = e.target.value;
    formik.setFieldValue("vendorId", vendorId);

    const selectedVendor = vendors.find((v: any) => String(v.id) === String(vendorId));
    if (selectedVendor) {
      const subId = selectedVendor.primary_subsidiary_id ?? selectedVendor.primarySubsidiary?.id ?? selectedVendor.subsidiary_id ?? selectedVendor.subsidiary?.id;
      if (subId) {
        const strSubId = String(subId);
        formik.setFieldValue("subsidiary_id", strSubId);
        autofillClassAndDepartment(strSubId);
      }

      const currId = selectedVendor.currency_id ?? selectedVendor.currency?.id;
      if (currId) formik.setFieldValue("currency_id", String(currId));

      const primaryAddr = selectedVendor.addressBook?.find((a: any) => a.default_billing) || selectedVendor.addressBook?.[0];
      const cityId = primaryAddr?.city_id ?? primaryAddr?.city?.id ?? selectedVendor.city_id ?? selectedVendor.city?.id;
      if (cityId) formik.setFieldValue("location_id", String(cityId));

      const apAcc = selectedVendor.default_payables_account_id || selectedVendor.account_id;
      if (apAcc) formik.setFieldValue("accountId", String(apAcc));
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
      const status = String(header.status || "").toUpperCase();
      if (status !== "DRAFT") {
        toast.error(`Cannot edit Vendor Credit with status "${header.status || status}". Only DRAFT records can be edited.`);
        return;
      }
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
        status: header.status ?? "DRAFT",
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
    const status = String(noteToDelete.status || noteToDelete.header?.status || "").toUpperCase();
    if (status !== "DRAFT") {
      toast.error(`Cannot delete Vendor Credit with status "${status}". Only DRAFT records can be deleted.`);
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
      return;
    }
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

    const creditTotalAmt = totalAmount;
    const creditAppliedAmt = appliedBills.reduce((sum: number, b: any) => sum + Number(b.appliedAmount || 0), 0);
    const creditRefundedAmt = creditRefunds.reduce((sum: number, r: any) => sum + Number(r.refundAmount || 0), 0);
    const creditAvailableAmt = Math.max(0, Number((creditTotalAmt - creditAppliedAmt - creditRefundedAmt).toFixed(2)));

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
      : findAccount(["Accounts Payable", "Trade Creditors", "Creditors", "Payable"], ["Accounts Payable", "Current Liability", "Liability"], "Accounts Payable", "2000");

    const inventoryAcc = findAccount(
      ["Inventory", "Inventory Asset", "Stock Asset", "Vendor Return"],
      ["Asset", "Current Asset", "Inventory"],
      "Inventory",
      "1200"
    );

    const taxAcc = findAccount(
      ["Input GST", "Input Tax", "Tax Receivable", "Tax Credit", "GST Input", "Duties & Taxes"],
      ["Tax", "Current Asset", "Asset"],
      "Input GST",
      "1400"
    );

    const inventoryAmount = Number((totalAmount - (activeTax > 0 ? activeTax : 0)).toFixed(2));
    const backendGlEntries = (Array.isArray(journalEntryData?.result?.lines) && journalEntryData.result.lines.length > 0)
      ? journalEntryData.result.lines.map((l: any) => {
          const isTaxLine = (l.narration || "").toLowerCase().includes("gst") || (l.narration || "").toLowerCase().includes("tax");
          const rawName = l.account?.account_name || l.account_name || "—";
          const rawCode = l.account?.account_number || l.account?.account_code || l.account_code || "—";
          const name = isTaxLine && (rawName.toLowerCase().includes("equity") || rawName.toLowerCase().includes("bank") || rawName === "—")
            ? "Input GST"
            : rawName;
          const code = isTaxLine && (rawName.toLowerCase().includes("equity") || rawName.toLowerCase().includes("bank") || rawName === "—")
            ? "1400"
            : rawCode;

          return {
            accountCode: code,
            accountName: name,
            debit: Number(l.debit_amount || l.debit || 0),
            credit: Number(l.credit_amount || l.credit || 0),
            postingPeriod: (journalEntryData.result.entry_date || "").slice(0, 7) || undefined,
            memo: l.narration || l.memo || journalEntryData.result.narration || "GL Impact Entry",
          };
        })
      : [];

    const previewGlEntries = [
      // 1. DEBIT: Accounts Payable (Reduces vendor liability by total amount)
      {
        accountCode: apAcc.code,
        accountName: apAcc.name,
        debit: totalAmount,
        credit: 0,
        memo: `Debit Accounts Payable - Vendor Credit #${dnNoStr} (${vendorName})`,
      },
      // 2. CREDIT: Inventory (Inventory Value Reduction)
      ...(inventoryAmount > 0
        ? [
            {
              accountCode: inventoryAcc.code,
              accountName: inventoryAcc.name,
              debit: 0,
              credit: inventoryAmount,
              memo: `Inventory Reversal - #${dnNoStr}`,
            },
          ]
        : []),
      // 3. CREDIT: Input GST (GST Reversal)
      ...(activeTax > 0
        ? [
            {
              accountCode: taxAcc.code,
              accountName: taxAcc.name,
              debit: 0,
              credit: activeTax,
              memo: `Input GST Reversal - #${dnNoStr}`,
            },
          ]
        : []),
    ];

    const isRecordDraft = String(activeHeader.status || activeHeader.document_status || "").toUpperCase() === "DRAFT";

    return (
      <>
        <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Debit Note / Vendor Credit"
          subtitle={isView ? `Debit Note #${dnNoStr} ${vendorName}` : isEdit ? `Edit Debit Note #${formik.values.debitNoteNumber}` : "New Debit Note"}
          mode={isView ? "view" : "edit"}
          onSave={() => formik.handleSubmit()}
          onEdit={isRecordDraft && canUpdate("debit_note") ? () => { if (selectedDebitNote) handleEdit(selectedDebitNote.id); } : undefined}
          onBack={() => { setViewMode("list"); setSearchParams({}); }}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
          customActions={
            isView && selectedDebitNote ? (
              <div className="flex items-center space-x-2">
                {String(activeHeader.status || activeHeader.document_status || "").toUpperCase() === "DRAFT" ? (
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
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setApplyBillAmounts({});
                        setApplyRemarks("");
                        setApplyError("");
                        setIsApplyModalOpen(true);
                      }}
                      disabled={creditAvailableAmt <= 0.01}
                      className={`text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center space-x-1.5 ${
                        creditAvailableAmt > 0.01
                          ? "bg-sky-700 hover:bg-sky-800 text-white"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <Payment className="!w-4 !h-4" />
                      <span>Apply to Bills</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const vId = selectedVendorId || formik.values.vendorId || activeHeader.vendorId || activeHeader.vendor_id || (selectedDebitNote?.vendor?.id);
                        navigate(`/vendor-refund?debitNoteId=${selectedDebitNote.id || activeHeader.id}&vendorId=${vId || ""}`);
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <AccountBalance className="!w-4 !h-4" />
                      <span>Vendor Refund</span>
                    </button>
                  </>
                )}
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
            ...((isView)
              ? [
                  {
                    id: "applications",
                    label: `Bill Applications & Refunds (${appliedBills.length + creditRefunds.length})`,
                    content: (
                      <div className="space-y-4 text-xs">
                        {/* Applied Bills */}
                        <div className="bg-white border border-slate-200 rounded-xs p-3 space-y-2">
                          <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Applied Purchase Bills</span>
                          {appliedBills.length === 0 ? (
                            <div className="text-slate-400 italic text-center py-3">No Purchase Bills applied against this credit note yet.</div>
                          ) : (
                            <table className="w-full text-left text-xs border border-slate-200">
                              <thead className="bg-[#1d3e4c] text-white text-[10px] uppercase font-bold">
                                <tr>
                                  <th className="p-2 border-r border-slate-400">Bill / Invoice #</th>
                                  <th className="p-2 border-r border-slate-400">Invoice Date</th>
                                  <th className="p-2 border-r border-slate-400 text-right">Invoice Total (₹)</th>
                                  <th className="p-2 border-r border-slate-400 text-right">Amount Applied (₹)</th>
                                  <th className="p-2 border-r border-slate-400 text-right">Remaining Due (₹)</th>
                                  <th className="p-2 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 font-mono">
                                {appliedBills.map((app: any, i: number) => (
                                  <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-2 border-r border-slate-200 font-bold text-sky-800">{app.purchaseInvoice?.invoiceNumber || `INV-#${app.purchaseInvoiceId}`}</td>
                                    <td className="p-2 border-r border-slate-200">{app.purchaseInvoice?.invoiceDate ? new Date(app.purchaseInvoice.invoiceDate).toLocaleDateString() : "—"}</td>
                                    <td className="p-2 border-r border-slate-200 text-right font-sans">₹{Number(app.purchaseInvoice?.totalAmount || 0).toFixed(2)}</td>
                                    <td className="p-2 border-r border-slate-200 text-right font-bold text-emerald-700">₹{Number(app.appliedAmount || 0).toFixed(2)}</td>
                                    <td className="p-2 border-r border-slate-200 text-right font-sans">₹{Number(app.purchaseInvoice?.balanceAmount || 0).toFixed(2)}</td>
                                    <td className="p-2 text-center font-sans">
                                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                        {app.purchaseInvoice?.status || "APPLIED"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>

                        {/* Refunds */}
                        <div className="bg-white border border-slate-200 rounded-xs p-3 space-y-2">
                          <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Vendor Refunds Processed</span>
                          {creditRefunds.length === 0 ? (
                            <div className="text-slate-400 italic text-center py-3">No Vendor Refunds processed for this credit note.</div>
                          ) : (
                            <table className="w-full text-left text-xs border border-slate-200">
                              <thead className="bg-[#1d3e4c] text-white text-[10px] uppercase font-bold">
                                <tr>
                                  <th className="p-2 border-r border-slate-400">Refund #</th>
                                  <th className="p-2 border-r border-slate-400">Refund Date</th>
                                  <th className="p-2 border-r border-slate-400 text-right">Refund Amount (₹)</th>
                                  <th className="p-2 border-r border-slate-400">Bank Account</th>
                                  <th className="p-2 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 font-mono">
                                {creditRefunds.map((ref: any, i: number) => (
                                  <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-2 border-r border-slate-200 font-bold text-sky-800">{ref.refundNumber}</td>
                                    <td className="p-2 border-r border-slate-200">{ref.refundDate ? new Date(ref.refundDate).toLocaleDateString() : "—"}</td>
                                    <td className="p-2 border-r border-slate-200 text-right font-bold text-emerald-700">₹{Number(ref.refundAmount || 0).toFixed(2)}</td>
                                    <td className="p-2 border-r border-slate-200 font-sans">{ref.bankAccount?.account_name || "Bank Account"}</td>
                                    <td className="p-2 text-center font-sans">
                                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                        {ref.status || "POSTED"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: "gl_impact",
                    label: "GL Impact",
                    content: (
                      <GLImpactSubtab
                        documentNumber={dnNoStr}
                        entries={backendGlEntries.length > 0 ? backendGlEntries : previewGlEntries}
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
                        disabled={true}
                        className="h-7 text-xs border border-slate-300 rounded-xs px-2 text-right font-mono bg-slate-100 text-slate-600 cursor-not-allowed focus:outline-none"
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
                        disabled={true}
                        className="h-7 text-xs border border-slate-300 rounded-xs px-2 text-right font-mono bg-slate-100 text-slate-600 cursor-not-allowed focus:outline-none"
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
                    onChange={handleSubsidiaryChange}
                    disabled={true}
                    className="h-7 text-xs bg-slate-100 text-slate-600 border border-slate-300 rounded-xs px-2 cursor-not-allowed focus:outline-none"
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
                    disabled={true}
                    className="h-7 text-xs bg-slate-100 text-slate-600 border border-slate-300 rounded-xs px-2 cursor-not-allowed focus:outline-none"
                  >
                    <option value="">Select Class...</option>
                    {availableClasses.map((c: any) => (
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
                    disabled={true}
                    className="h-7 text-xs bg-slate-100 text-slate-600 border border-slate-300 rounded-xs px-2 cursor-not-allowed focus:outline-none"
                  >
                    <option value="">Select Department...</option>
                    {availableDepartments.map((d: any) => (
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

      {/* APPLY TO BILLS MODAL */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xs border border-slate-300 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="bg-[#1d3e4c] text-white p-3 flex items-center justify-between font-bold">
              <span>Apply Vendor Credit #{dnNoStr} to Open Purchase Bills</span>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-slate-300 hover:text-white cursor-pointer">
                <Close className="!w-5 !h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Credit Status Summary */}
              <div className="bg-slate-50 p-3 rounded-xs border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div>
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Total Credit</div>
                  <div className="font-bold text-slate-800">₹{creditTotalAmt.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Already Applied</div>
                  <div className="font-bold text-sky-800">₹{creditAppliedAmt.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-bold">Already Refunded</div>
                  <div className="font-bold text-amber-800">₹{creditRefundedAmt.toFixed(2)}</div>
                </div>
                <div className="bg-emerald-100/60 p-1.5 rounded-xs border border-emerald-300">
                  <div className="text-[10px] text-emerald-800 font-sans uppercase font-bold">Available to Apply</div>
                  <div className="font-extrabold text-emerald-800 text-sm">₹{creditAvailableAmt.toFixed(2)}</div>
                </div>
              </div>

              {applyError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-800 p-2.5 rounded-xs">
                  {applyError}
                </div>
              )}

              {/* Open Bills Table */}
              <div>
                <div className="font-bold text-slate-700 uppercase text-[11px] mb-2">Select Purchase Bills to Apply Credit</div>
                {openBills.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 italic bg-slate-50 border border-slate-200 rounded-xs">
                    No open/unpaid purchase bills found for {vendorName}.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border border-slate-300 rounded-xs border-collapse">
                    <thead className="bg-[#e5eff5] text-[#1d3e4c] font-bold text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5 border-r border-slate-300 w-10 text-center">APPLY</th>
                        <th className="p-2.5 border-r border-slate-300">BILL / INVOICE #</th>
                        <th className="p-2.5 border-r border-slate-300">DATE</th>
                        <th className="p-2.5 border-r border-slate-300 text-right">TOTAL AMOUNT (₹)</th>
                        <th className="p-2.5 border-r border-slate-300 text-right">PAID (₹)</th>
                        <th className="p-2.5 border-r border-slate-300 text-right">DUE BALANCE (₹)</th>
                        <th className="p-2.5 text-right w-40">AMOUNT TO APPLY (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {openBills.map((bill: any) => {
                        const due = Number(bill.dueAmount || bill.balanceAmount || 0);
                        const currentAppliedVal = applyBillAmounts[bill.id] || 0;
                        const isChecked = currentAppliedVal > 0;

                        return (
                          <tr key={bill.id} className="hover:bg-sky-50/40">
                            <td className="p-2.5 border-r border-slate-200 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const totalOtherApplied = Object.entries(applyBillAmounts)
                                      .filter(([id]) => Number(id) !== bill.id)
                                      .reduce((sum, [, val]) => sum + Number(val || 0), 0);
                                    const maxCanApply = Math.min(due, Math.max(0, creditAvailableAmt - totalOtherApplied));
                                    setApplyBillAmounts((prev) => ({ ...prev, [bill.id]: Number(maxCanApply.toFixed(2)) }));
                                  } else {
                                    setApplyBillAmounts((prev) => {
                                      const next = { ...prev };
                                      delete next[bill.id];
                                      return next;
                                    });
                                  }
                                }}
                              />
                            </td>
                            <td className="p-2.5 border-r border-slate-200 font-bold text-sky-800">{bill.invoiceNumber}</td>
                            <td className="p-2.5 border-r border-slate-200 font-sans">{bill.invoiceDate ? new Date(bill.invoiceDate).toLocaleDateString() : "—"}</td>
                            <td className="p-2.5 border-r border-slate-200 text-right">₹{Number(bill.totalAmount || 0).toFixed(2)}</td>
                            <td className="p-2.5 border-r border-slate-200 text-right">₹{Number(bill.paidAmount || 0).toFixed(2)}</td>
                            <td className="p-2.5 border-r border-slate-200 text-right font-bold text-amber-800">₹{due.toFixed(2)}</td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={due}
                                value={applyBillAmounts[bill.id] !== undefined ? applyBillAmounts[bill.id] : ""}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setApplyBillAmounts((prev) => ({ ...prev, [bill.id]: val }));
                                }}
                                className="w-full p-1 border border-slate-300 rounded-xs text-right font-bold focus:border-sky-600 outline-none"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Remarks / Memo</label>
                <input
                  type="text"
                  value={applyRemarks}
                  onChange={(e) => setApplyRemarks(e.target.value)}
                  placeholder="e.g. Applied against outstanding bills"
                  className="w-full p-2 border border-slate-300 rounded-xs outline-none focus:border-sky-600"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-3 border-t border-slate-300 flex items-center justify-between">
              <div className="font-mono">
                <span className="text-slate-600 font-sans font-bold text-xs uppercase mr-2">Total Applying Now:</span>
                <span className="text-base font-extrabold text-emerald-800">
                  ₹{Object.values(applyBillAmounts).reduce((sum, val) => sum + Number(val || 0), 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-300 rounded-xs text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setApplyError("");
                    const totalNow = Object.values(applyBillAmounts).reduce((sum, val) => sum + Number(val || 0), 0);
                    if (totalNow <= 0) {
                      setApplyError("Please specify an amount to apply on at least one bill.");
                      return;
                    }
                    if (totalNow > creditAvailableAmt) {
                      setApplyError(`Total applying (₹${totalNow.toFixed(2)}) exceeds available credit of ₹${creditAvailableAmt.toFixed(2)}.`);
                      return;
                    }

                    const billApplications = Object.entries(applyBillAmounts)
                      .filter(([, amt]) => Number(amt) > 0)
                      .map(([invoiceId, amt]) => ({
                        purchaseInvoiceId: Number(invoiceId),
                        amountToApply: Number(amt),
                      }));

                    try {
                      const creditIdToApply = Number(selectedDebitNote?.id || activeHeader?.id);
                      await applyVendorCredit({
                        vendorCreditId: creditIdToApply,
                        billApplications,
                        remarks: applyRemarks,
                      }).unwrap();
                      toast.success("Vendor credit applied successfully!");
                      setIsApplyModalOpen(false);
                      if (refetchDebitNotes) refetchDebitNotes();
                      if (refetchApplications) refetchApplications();
                    } catch (err: any) {
                      setApplyError(err?.data?.message || err?.message || "Failed to apply vendor credit");
                    }
                  }}
                  disabled={isApplyingCredit}
                  className="px-5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs font-bold transition-colors shadow-xs cursor-pointer disabled:bg-slate-300"
                >
                  {isApplyingCredit ? "Applying..." : "Confirm & Apply Credit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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

                const isRowDraft = String(note.status || "").toUpperCase() === "DRAFT";

                return (
                  <tr key={note.id} className="hover:bg-sky-50/50 transition-colors">
                    <td className="p-2 border-r border-slate-200 text-center font-semibold space-x-1">
                      {isRowDraft && canUpdate("debit_note") ? (
                        <button onClick={() => handleEdit(note.id)} className="text-sky-700 hover:underline cursor-pointer">
                          Edit
                        </button>
                      ) : (
                        <span className="text-slate-300 select-none cursor-not-allowed" title="Only DRAFT records can be edited">Edit</span>
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
                      {isRowDraft && canDelete("debit_note") ? (
                        <button
                          onClick={() => {
                            setNoteToDelete(note);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:underline font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-slate-300 select-none text-[11px]" title="Only DRAFT records can be deleted">—</span>
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
        message="Are you sure you want to delete this DRAFT debit note? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
