import { useGetJournalEntryByIdQuery } from "../RTK/services/journalEntryApi";
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Add, Search, List as ListIcon } from "@mui/icons-material";
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
import { useAppSelector } from "../Hooks/Reduxhook/hooks";
import { usePermissions } from "../Hooks/usePermissions";

import {
  useCreatePurchasePaymentMutation,
  useDeletePurchasePaymentMutation,
  useGetPurchaseInvoicesQuery,
  useGetPurchaseInvoiceByIdQuery,
  useLazyGetPurchaseInvoiceByIdQuery,
  useGetPurchaseOrdersQuery,
  useLazyGetPurchaseOrderByIdQuery,
  useGetPurchasePaymentsQuery,
  useGetPurchasePaymentByIdQuery,
  useLazyGetPurchasePaymentByIdQuery,
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
  const [appliedBillIds, setAppliedBillIds] = useState<string[]>([]);
  const [billPaymentAmounts, setBillPaymentAmounts] = useState<Record<string, number>>({});
  const [billSearchTerm, setBillSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const urlBillId = searchParams.get("billId") || searchParams.get("invoiceId");
  const urlId = searchParams.get("id");
  const urlAction = searchParams.get("action");

  const effectivePaymentId = selectedPaymentId || (urlId ? urlId : null);

  // Queries
  const { data: paymentsData, refetch: refetchPayments } = useGetPurchasePaymentsQuery({ page: 1, limit: 50 });
  const { data: singlePaymentData, isLoading: isSingleLoading } = useGetPurchasePaymentByIdQuery(effectivePaymentId!, { skip: !effectivePaymentId });
  const { data: invoicesData } = useGetPurchaseInvoicesQuery({ page: 1, limit: 100 });
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
  const [triggerGetInvoiceById] = useLazyGetPurchaseInvoiceByIdQuery();

  const payments = useMemo(() => (Array.isArray(paymentsData?.result) ? paymentsData.result : []), [paymentsData]);
  const invoices = useMemo(() => (Array.isArray(invoicesData?.result) ? invoicesData.result : []), [invoicesData]);
  const purchaseOrders = useMemo(() => (Array.isArray(purchaseOrdersData?.result) ? purchaseOrdersData.result : []), [purchaseOrdersData]);
  const vendors = useMemo(() => (Array.isArray(vendorsData?.result) ? vendorsData.result : []), [vendorsData]);
  const bankAccounts = Array.isArray(chartOfAccountsData?.result) ? chartOfAccountsData.result : [];
  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : [];
  const classesList = Array.isArray(classesData?.result) ? classesData.result : [];
  const departmentsList = Array.isArray(departmentsData?.result) ? departmentsData.result : [];
  const citiesList = Array.isArray(citiesData?.result) ? citiesData.result : [];

  // Filter 1: A/P Accounts (type contains Payable)
  const payableAccounts = useMemo(() => {
    const filtered = bankAccounts.filter((acc: any) => {
      const typeName = String(acc.accountType?.account_type_name || "").toLowerCase();
      const accName = String(acc.account_name || "").toLowerCase();
      return typeName.includes("payable") || accName.includes("payable") || accName.includes("a/p");
    });
    return filtered.length > 0 ? filtered : bankAccounts;
  }, [bankAccounts]);

  // Filter 2: Bank / Cash Accounts (type contains Bank/Cash)
  const bankAccountsList = useMemo(() => {
    const filtered = bankAccounts.filter((acc: any) => {
      const typeName = String(acc.accountType?.account_type_name || "").toLowerCase();
      const accName = String(acc.account_name || "").toLowerCase();
      return (
        typeName.includes("bank") ||
        typeName.includes("cash") ||
        accName.includes("bank") ||
        accName.includes("cash") ||
        accName.includes("checking") ||
        accName.includes("savings")
      );
    });
    return filtered.length > 0 ? filtered : bankAccounts;
  }, [bankAccounts]);

  const getVendorDisplayName = (vObj: any) => {
    if (!vObj) return "";
    const code = vObj.entity_id ? `${vObj.entity_id} ` : "";
    const name = vObj.company_name || [vObj.salutation, vObj.first_name, vObj.last_name].filter(Boolean).join(" ");
    return `${code}${name}`.trim();
  };

  const extractCurrencyString = (c: any) => {
    if (!c) return "INR";
    if (typeof c === "string" || typeof c === "number") return String(c);
    return String(c.currency_code || c.code || c.currency_symbol || c.id || "INR");
  };

  const currentPeriod = useMemo(() => new Date().toLocaleString("default", { month: "short", year: "numeric" }), []);

  const formik = useFormik({
    initialValues: {
      paymentNumber: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      purchaseInvoiceHeaderId: "",
      invoiceNumber: "",
      invoiceDate: "",
      vendorId: "",
      vendorName: "",
      apAccountId: "",
      bankAccountId: "",
      currency: "INR",
      exchangeRate: 1,
      paymentMethodId: "",
      referenceNo: "",
      chequeNo: "",
      memo: "",
      remarks: "",
      postingPeriod: currentPeriod,
      subsidiary_id: "",
      class_id: "",
      department_id: "",
      location_id: "",
      totalAmount: 0,
      status: "DRAFT",
    },
    validationSchema: Yup.object().shape({
      vendorId: Yup.string().required("Payee / Vendor is required"),
      paymentDate: Yup.string().required("Payment Date is required"),
      totalAmount: Yup.number().min(0, "Payment amount must be >= 0").required("Payment amount is required"),
      bankAccountId: Yup.string().required("Bank Account is required"),
      status: Yup.string().required("Status is required"),
    }),
    onSubmit: async (values) => {
      try {
        let linesPayload: any[] = [];
        const checkedBillIds = appliedBillIds.length > 0
          ? appliedBillIds
          : (values.purchaseInvoiceHeaderId ? [String(values.purchaseInvoiceHeaderId)] : []);

        const payAmount = Number(values.totalAmount || 0);

        for (const bId of checkedBillIds) {
          const invObj = invoices.find((inv: any) => String(inv.id) === String(bId));
          const invH = invObj?.header ?? invObj;
          const invDue = Number(invH?.balanceAmount !== undefined ? invH.balanceAmount : (invH?.totalAmount || invH?.total_amount || 0));
          const allocatedBillPay = billPaymentAmounts[bId] !== undefined ? billPaymentAmounts[bId] : (payAmount > 0 ? payAmount : invDue);

          const invLines = invObj?.purchaseInvoiceLines || invObj?.lines || invObj?.lineItems || [];
          if (invLines.length > 0) {
            const invTotal = invLines.reduce((sum: number, l: any) => sum + (Number(l.lineTotal || l.line_total || (Number(l.quantity || 1) * Number(l.unitPrice || l.unit_price || 0))) || 0), 0);

            let allocatedLineSum = 0;
            invLines.forEach((l: any, idx: number) => {
              let lineAmt = 0;
              if (idx === invLines.length - 1) {
                lineAmt = Number((allocatedBillPay - allocatedLineSum).toFixed(2));
              } else {
                const rawAmt = invTotal > 0 ? (Number(l.lineTotal || l.line_total || 0) / invTotal) * allocatedBillPay : allocatedBillPay / invLines.length;
                lineAmt = Number(rawAmt.toFixed(2));
                allocatedLineSum += lineAmt;
              }
              linesPayload.push({
                purchaseInvoiceHeaderId: Number(bId),
                purchaseInvoiceLineId: Number(l.id || (idx + 1)),
                amountPaid: lineAmt > 0 ? lineAmt : allocatedBillPay,
                remarks: l.remarks || `Bill #${invH?.invoiceNumber || bId} payment allocation`,
              });
            });
          } else {
            linesPayload.push({
              purchaseInvoiceHeaderId: Number(bId),
              purchaseInvoiceLineId: 1,
              amountPaid: Number(allocatedBillPay.toFixed(2)),
              remarks: `Bill #${invH?.invoiceNumber || bId} payment allocation`,
            });
          }
        }

        if (linesPayload.length === 0) {
          linesPayload.push({
            purchaseInvoiceHeaderId: values.purchaseInvoiceHeaderId ? Number(values.purchaseInvoiceHeaderId) : 1,
            purchaseInvoiceLineId: 1,
            amountPaid: Number(payAmount.toFixed(2)),
            remarks: "Payment allocation line",
          });
        }

        const calculatedFinalTotal = Number(linesPayload.reduce((sum, l) => sum + Number(l.amountPaid || 0), 0).toFixed(2));
        const finalPayAmount = calculatedFinalTotal > 0 ? calculatedFinalTotal : payAmount;

        const targetInvId = checkedBillIds.length > 0 ? Number(checkedBillIds[0]) : (values.purchaseInvoiceHeaderId ? Number(values.purchaseInvoiceHeaderId) : null);
        const targetInv = invoices.find((inv: any) => String(inv.id) === String(targetInvId));

        const payNum = values.paymentNumber || `PAY-${Date.now().toString().slice(-6)}`;
        const vObj = vendors.find((v: any) => String(v.id) === String(values.vendorId));
        const pmId = values.paymentMethodId || vObj?.payment_method_id || vObj?.paymentMethodId || vObj?.default_payment_method_id || vObj?.paymentMethod?.id || targetInv?.paymentMethodId || targetInv?.payment_method_id || targetInv?.header?.paymentMethodId || targetInv?.header?.payment_method_id || null;

        const payload = {
          paymentNumber: payNum,
          paymentDate: values.paymentDate,
          vendorId: Number(values.vendorId),
          paymentMethodId: pmId ? Number(pmId) : null,
          bankAccountId: values.bankAccountId ? Number(values.bankAccountId) : null,
          apAccountId: values.apAccountId ? Number(values.apAccountId) : null,
          totalAmount: finalPayAmount,
          currency: extractCurrencyString(values.currency),
          exchangeRate: Number(values.exchangeRate || 1),
          referenceNo: values.chequeNo || values.referenceNo || null,
          status: values.status || "DRAFT",
          remarks: values.memo || values.remarks || null,
          purchaseInvoiceHeaderId: targetInvId,
          subsidiary_id: values.subsidiary_id ? Number(values.subsidiary_id) : null,
          class_id: values.class_id ? Number(values.class_id) : null,
          department_id: values.department_id ? Number(values.department_id) : null,
          location_id: values.location_id ? Number(values.location_id) : null,
          user_id: userId,
          paymentLines: linesPayload,
          lines: linesPayload,
          details: linesPayload,
        };

        if (isEdit && editId) {
          const res: any = await updatePurchasePayment({
            id: editId,
            body: {
              ...payload,
              header: payload,
              paymentLines: linesPayload,
              lines: linesPayload,
            },
          }).unwrap();
          toast.success("Vendor Payment updated successfully.");
          const updatedRecord = res?.result || res?.data || res;
          setSelectedPayment(updatedRecord || { header: payload, paymentLines: linesPayload, id: editId });
          setSelectedPaymentId(editId);
          setViewMode("view");
          setIsEdit(false);
          setEditId(null);
          setSearchParams({ id: String(editId), action: "view" });
          formik.resetForm();
          refetchPayments();
        } else {
          const res: any = await createPurchasePayment(payload).unwrap();
          toast.success("Vendor Payment recorded successfully.");
          const createdRecord = res?.result || res?.data || res;
          const createdId = createdRecord?.header?.id || createdRecord?.id;
          setSelectedPayment(createdRecord || { header: payload, paymentLines: linesPayload, id: createdId });
          setSelectedPaymentId(createdId);
          setViewMode("view");
          setIsEdit(false);
          setEditId(null);
          if (createdId) {
            setSearchParams({ id: String(createdId), action: "view" });
          }
          formik.resetForm();
          refetchPayments();
        }
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong.");
      }
    },
  });

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

  // Vendor's Bills List for Apply tab
  const vendorBills = useMemo(() => {
    if (!formik.values.vendorId) return [];
    return invoices.filter((inv: any) => {
      const invVId = String(inv.vendorId || inv.vendor_id || inv.header?.vendorId || inv.vendor?.id || "");
      return invVId === String(formik.values.vendorId);
    });
  }, [invoices, formik.values.vendorId]);

  const filteredVendorBills = useMemo(() => {
    if (!billSearchTerm.trim()) return vendorBills;
    const term = billSearchTerm.toLowerCase().trim();
    return vendorBills.filter((b: any) => {
      const h = b.header ?? b;
      const invNo = String(h.invoiceNumber || h.invoice_number || `INV-${b.id}`).toLowerCase();
      return invNo.includes(term);
    });
  }, [vendorBills, billSearchTerm]);

  const toggleApplyBill = (billId: string | number) => {
    const idStr = String(billId);
    let nextApplied: string[];
    const nextAmounts = { ...billPaymentAmounts };

    if (appliedBillIds.includes(idStr)) {
      nextApplied = appliedBillIds.filter((id) => id !== idStr);
      delete nextAmounts[idStr];
    } else {
      nextApplied = [...appliedBillIds, idStr];
      const appliedBill = vendorBills.find((b: any) => String(b.id) === idStr);
      const h = appliedBill?.header ?? appliedBill;
      const bal = Number(h?.balanceAmount !== undefined ? h.balanceAmount : (h?.totalAmount || h?.total_amount || 0));
      nextAmounts[idStr] = bal > 0 ? bal : Number(h?.totalAmount || h?.total_amount || 0);
    }
    setAppliedBillIds(nextApplied);
    setBillPaymentAmounts(nextAmounts);

    const total = nextApplied.reduce((sum: number, id: string) => {
      const bAmt = nextAmounts[id] !== undefined ? nextAmounts[id] : 0;
      return sum + Number(bAmt);
    }, 0);

    formik.setFieldValue("totalAmount", Number(total.toFixed(2)));
    if (nextApplied.length > 0) {
      formik.setFieldValue("purchaseInvoiceHeaderId", nextApplied[0]);
      const appliedBill = vendorBills.find((b: any) => String(b.id) === String(nextApplied[0]));
      if (appliedBill) {
        const h = appliedBill.header ?? appliedBill;
        formik.setFieldValue("memo", `Payment for Bill #${h.invoiceNumber || h.invoice_number || appliedBill.id}`);
      }
    } else {
      formik.setFieldValue("purchaseInvoiceHeaderId", "");
    }
  };

  const handleBillPaymentAmountChange = (billIdStr: string, value: string, maxAmt: number) => {
    let numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0) numVal = 0;
    if (numVal > maxAmt && maxAmt > 0) {
      toast.error(`Payment cannot exceed the due amount of ₹${maxAmt.toFixed(2)}`);
      numVal = maxAmt;
    }
    const nextAmounts = { ...billPaymentAmounts, [billIdStr]: numVal };
    setBillPaymentAmounts(nextAmounts);

    const newTotal = appliedBillIds.reduce((sum, id) => {
      const bAmt = nextAmounts[id] !== undefined ? nextAmounts[id] : 0;
      return sum + Number(bAmt);
    }, 0);
    formik.setFieldValue("totalAmount", Number(newTotal.toFixed(2)));
  };

  const markAllBills = () => {
    const allIds = vendorBills.map((b: any) => String(b.id));
    const nextAmounts: Record<string, number> = {};
    let total = 0;
    vendorBills.forEach((b: any) => {
      const h = b.header ?? b;
      const bal = Number(h.balanceAmount !== undefined ? h.balanceAmount : (h.totalAmount || h.total_amount || 0));
      const amt = bal > 0 ? bal : Number(h.totalAmount || h.total_amount || 0);
      nextAmounts[String(b.id)] = amt;
      total += amt;
    });
    setAppliedBillIds(allIds);
    setBillPaymentAmounts(nextAmounts);
    formik.setFieldValue("totalAmount", Number(total.toFixed(2)));
    if (allIds.length > 0) {
      formik.setFieldValue("purchaseInvoiceHeaderId", allIds[0]);
      formik.setFieldValue("memo", `Settlement for ${allIds.length} bills`);
    }
  };

  const unmarkAllBills = () => {
    setAppliedBillIds([]);
    setBillPaymentAmounts({});
    formik.setFieldValue("totalAmount", 0);
    formik.setFieldValue("purchaseInvoiceHeaderId", "");
  };

  // Auto-populate vendor fields upon vendor selection
  const handleVendorChange = (vId: string) => {
    formik.setFieldValue("vendorId", vId);

    const vObj = vendors.find((v: any) => String(v.id) === String(vId));
    if (vObj) {
      formik.setFieldValue("vendorName", getVendorDisplayName(vObj));

      const subId = vObj.subsidiary_id || vObj.subsidiaryId || vObj.primary_subsidiary_id || vObj.primarySubsidiary?.id;
      if (subId) {
        const strSubId = String(subId);
        formik.setFieldValue("subsidiary_id", strSubId);
        autofillClassAndDepartment(strSubId);
      } else {
        const clsId = vObj.class_id || vObj.classId;
        if (clsId) formik.setFieldValue("class_id", String(clsId));

        const deptId = vObj.department_id || vObj.departmentId;
        if (deptId) formik.setFieldValue("department_id", String(deptId));
      }

      const curr = extractCurrencyString(vObj.currency || vObj.currency_code || vObj.currency_id || "INR");
      formik.setFieldValue("currency", curr);

      const locId = vObj.location_id || vObj.city_id || vObj.primaryAddress?.city_id || vObj.addressBook?.[0]?.city_id;
      if (locId) formik.setFieldValue("location_id", String(locId));

      const apAcc = vObj.default_payables_account_id || vObj.account_id || payableAccounts[0]?.id;
      if (apAcc) formik.setFieldValue("apAccountId", String(apAcc));

      if (bankAccountsList.length > 0 && !formik.values.bankAccountId) {
        formik.setFieldValue("bankAccountId", String(bankAccountsList[0].id));
      }

      formik.setFieldValue("memo", `Vendor Payment - ${getVendorDisplayName(vObj)}`);

      // Find first unpaid bill for this vendor
      const vendorOpenBills = invoices.filter((inv: any) => String(inv.vendorId || inv.vendor_id || inv.header?.vendorId) === String(vId));
      if (vendorOpenBills.length > 0) {
        const firstBill = vendorOpenBills[0];
        const h = firstBill.header ?? firstBill;
        setAppliedBillIds([String(firstBill.id)]);
        const bal = Number(h.balanceAmount !== undefined ? h.balanceAmount : (h.totalAmount || h.total_amount || 0));
        const amt = bal > 0 ? bal : Number(h.totalAmount || h.total_amount || 0);
        setBillPaymentAmounts({ [String(firstBill.id)]: amt });
        formik.setFieldValue("totalAmount", amt);
        formik.setFieldValue("purchaseInvoiceHeaderId", String(firstBill.id));
        formik.setFieldValue("invoiceNumber", h.invoiceNumber || h.invoice_number || `BILL-${firstBill.id}`);
        formik.setFieldValue("invoiceDate", h.invoiceDate || h.invoice_date || "");
        formik.setFieldValue("memo", `Payment for Bill #${h.invoiceNumber || h.invoice_number || firstBill.id}`);
      } else {
        setAppliedBillIds([]);
        setBillPaymentAmounts({});
        formik.setFieldValue("totalAmount", 0);
        formik.setFieldValue("purchaseInvoiceHeaderId", "");
      }
    }
  };

  const handleInvoiceChange = (invId: string) => {
    formik.setFieldValue("purchaseInvoiceHeaderId", invId);
    setAppliedBillIds([String(invId)]);

    // Trigger API call for Purchase Invoice
    triggerGetInvoiceById(invId)
      .unwrap()
      .then((res: any) => {
        const inv = res?.result || res?.data || res;
        if (inv) {
          const header = inv.header ?? inv;
          const vId = header.vendorId ?? header.vendor_id ?? "";
          if (vId) {
            handleVendorChange(String(vId));
          }

          formik.setFieldValue("invoiceNumber", header.invoiceNumber ?? header.invoice_number ?? "");
          formik.setFieldValue("invoiceDate", header.invoiceDate ?? header.invoice_date ?? "");
          const billTotal = Number(header.balanceAmount !== undefined ? header.balanceAmount : (header.totalAmount || header.total_amount || 0));
          const amt = billTotal > 0 ? billTotal : Number(header.totalAmount || header.total_amount || 0);
          setBillPaymentAmounts({ [String(inv.id || invId)]: amt });
          formik.setFieldValue("totalAmount", amt);

          const subId = header.subsidiary_id || header.subsidiaryId || header.subsidiary?.id;
          if (subId) {
            const strSubId = String(subId);
            formik.setFieldValue("subsidiary_id", strSubId);

            const classIdFromInv = header.class_id || header.classId;
            if (classIdFromInv) {
              formik.setFieldValue("class_id", String(classIdFromInv));
            } else {
              const matchClass = classesList.find((c: any) => String(c.subsidiary_id ?? c.subsidiaryId ?? "") === strSubId);
              if (matchClass) formik.setFieldValue("class_id", String(matchClass.id));
              else autofillClassAndDepartment(strSubId);
            }

            const deptIdFromInv = header.department_id || header.departmentId;
            if (deptIdFromInv) {
              formik.setFieldValue("department_id", String(deptIdFromInv));
            } else {
              const matchDept = departmentsList.find((d: any) => String(d.subsidiary_id ?? d.subsidiaryId ?? "") === strSubId);
              if (matchDept) formik.setFieldValue("department_id", String(matchDept.id));
            }
          }

          if (header.location_id || header.city_id) formik.setFieldValue("location_id", String(header.location_id || header.city_id));
          if (header.currency) formik.setFieldValue("currency", extractCurrencyString(header.currency));
          formik.setFieldValue("memo", `Payment for Bill #${header.invoiceNumber || header.invoice_number || inv.id || invId}`);
        }
      })
      .catch(() => {
        const inv = invoices.find((x: any) => String(x.id) === String(invId));
        if (inv) {
          const header = inv.header ?? inv;
          const vId = header.vendorId ?? header.vendor_id ?? "";
          if (vId) {
            handleVendorChange(String(vId));
          }

          formik.setFieldValue("invoiceNumber", header.invoiceNumber ?? header.invoice_number ?? "");
          formik.setFieldValue("invoiceDate", header.invoiceDate ?? header.invoice_date ?? "");
          const billTotal = Number(header.balanceAmount !== undefined ? header.balanceAmount : (header.totalAmount || header.total_amount || 0));
          const amt = billTotal > 0 ? billTotal : Number(header.totalAmount || header.total_amount || 0);
          setBillPaymentAmounts({ [String(inv.id)]: amt });
          formik.setFieldValue("totalAmount", amt);

          const subId = header.subsidiary_id || header.subsidiaryId || header.subsidiary?.id;
          if (subId) {
            const strSubId = String(subId);
            formik.setFieldValue("subsidiary_id", strSubId);

            const classIdFromInv = header.class_id || header.classId;
            if (classIdFromInv) {
              formik.setFieldValue("class_id", String(classIdFromInv));
            } else {
              const matchClass = classesList.find((c: any) => String(c.subsidiary_id ?? c.subsidiaryId ?? "") === strSubId);
              if (matchClass) formik.setFieldValue("class_id", String(matchClass.id));
              else autofillClassAndDepartment(strSubId);
            }

            const deptIdFromInv = header.department_id || header.departmentId;
            if (deptIdFromInv) {
              formik.setFieldValue("department_id", String(deptIdFromInv));
            } else {
              const matchDept = departmentsList.find((d: any) => String(d.subsidiary_id ?? d.subsidiaryId ?? "") === strSubId);
              if (matchDept) formik.setFieldValue("department_id", String(matchDept.id));
            }
          }

          if (header.location_id || header.city_id) formik.setFieldValue("location_id", String(header.location_id || header.city_id));
          if (header.currency) formik.setFieldValue("currency", extractCurrencyString(header.currency));
          formik.setFieldValue("memo", `Payment for Bill #${header.invoiceNumber || header.invoice_number || inv.id}`);
        }
      });
  };

  // URL Query Params Synchronization
  useEffect(() => {
    if (urlBillId) {
      setViewMode("form");
      setOpen(true);
      setIsEdit(false);
      handleInvoiceChange(urlBillId);
    } else if (urlId && (urlAction === "view" || urlAction === "edit")) {
      setSelectedPaymentId(urlId);
      setOpen(true);
      if (urlAction === "view") {
        setViewMode("view");
      } else {
        setViewMode("form");
        setIsEdit(true);
        setEditId(urlId);
      }
    } else if (!urlBillId && !urlId && viewMode === "list") {
      setOpen(false);
      setSelectedPaymentId(null);
    }
  }, [urlBillId, urlId, urlAction]);

  // Sync single GET API data when retrieved
  const fetchedSinglePayment = singlePaymentData?.result || singlePaymentData?.data || singlePaymentData;

  useEffect(() => {
    if (fetchedSinglePayment && (String(fetchedSinglePayment.id) === String(urlId) || String(fetchedSinglePayment.id) === String(selectedPaymentId))) {
      setSelectedPayment(fetchedSinglePayment);
      if (urlAction === "edit" || (isEdit && String(editId) === String(fetchedSinglePayment.id))) {
        const header = fetchedSinglePayment.header ?? fetchedSinglePayment;
        const formatDate = (val: any) => (val && String(val).length >= 10 ? String(val).slice(0, 10) : "");
        formik.setValues({
          paymentNumber: header.paymentNumber ?? header.payment_number ?? "",
          paymentDate: formatDate(header.paymentDate ?? header.payment_date) || new Date().toISOString().slice(0, 10),
          purchaseInvoiceHeaderId: header.purchaseInvoiceHeaderId ?? header.purchase_invoice_header_id ?? "",
          invoiceNumber: header.invoiceNumber ?? "",
          invoiceDate: formatDate(header.invoiceDate),
          vendorId: String(header.vendorId ?? header.vendor_id ?? ""),
          vendorName: header.vendorName ?? header.vendor?.company_name ?? header.vendor?.vendor_name ?? "",
          apAccountId: String(header.apAccountId ?? header.ap_account_id ?? payableAccounts[0]?.id ?? ""),
          bankAccountId: String(header.bankAccountId ?? header.bank_account_id ?? ""),
          currency: header.currency ?? "INR",
          exchangeRate: Number(header.exchangeRate ?? 1),
          paymentMethodId: String(header.paymentMethodId ?? header.payment_method_id ?? ""),
          referenceNo: header.referenceNo ?? header.reference_number ?? "",
          chequeNo: header.chequeNo ?? header.referenceNo ?? "",
          memo: header.remarks ?? header.memo ?? "",
          remarks: header.remarks ?? "",
          postingPeriod: header.postingPeriod || currentPeriod,
          subsidiary_id: String(header.subsidiary_id ?? header.vendor?.primary_subsidiary_id ?? ""),
          class_id: String(header.class_id ?? ""),
          department_id: String(header.department_id ?? ""),
          location_id: String(header.location_id ?? ""),
          totalAmount: Number(header.totalAmount ?? header.amount ?? 0),
          status: String(header.status || "DRAFT").toUpperCase(),
        });
      }
    }
  }, [fetchedSinglePayment, urlId, urlAction, isEdit, editId, selectedPaymentId]);

  const handleEdit = (id: number | string) => {
    if (!canUpdate("purchase_payment")) {
      toast.error("No permission to edit Vendor Payment");
      return;
    }
    const item = payments.find((x: any) => String(x.id) === String(id)) || selectedPayment;
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
        vendorId: String(header.vendorId ?? header.vendor_id ?? ""),
        vendorName: header.vendorName ?? header.vendor?.vendor_name ?? "",
        apAccountId: String(header.apAccountId ?? header.ap_account_id ?? payableAccounts[0]?.id ?? ""),
        bankAccountId: String(header.bankAccountId ?? header.bank_account_id ?? ""),
        currency: header.currency ?? "INR",
        exchangeRate: Number(header.exchangeRate ?? 1),
        paymentMethodId: String(header.paymentMethodId ?? header.payment_method_id ?? ""),
        referenceNo: header.referenceNo ?? header.reference_number ?? "",
        chequeNo: header.chequeNo ?? header.referenceNo ?? "",
        memo: header.remarks ?? header.memo ?? "",
        remarks: header.remarks ?? "",
        postingPeriod: header.postingPeriod || currentPeriod,
        subsidiary_id: String(header.subsidiary_id ?? ""),
        class_id: String(header.class_id ?? ""),
        department_id: String(header.department_id ?? ""),
        location_id: String(header.location_id ?? ""),
        totalAmount: Number(header.totalAmount ?? header.amount ?? 0),
        status: statusVal,
      });

      const pLines = item.paymentLines || item.lines || item.details || [];
      const billId = header.purchaseInvoiceHeaderId ?? header.purchase_invoice_header_id;
      if (billId) {
        setAppliedBillIds([String(billId)]);
        setBillPaymentAmounts({ [String(billId)]: Number(header.totalAmount ?? header.amount ?? 0) });
      } else if (pLines.length > 0) {
        const bIds = Array.from(new Set(pLines.map((l: any) => String(l.purchaseInvoiceHeaderId || l.invoiceHeaderId)).filter(Boolean))) as string[];
        setAppliedBillIds(bIds);
        const amounts: Record<string, number> = {};
        pLines.forEach((l: any) => {
          const bId = String(l.purchaseInvoiceHeaderId || l.invoiceHeaderId || "");
          if (bId) {
            amounts[bId] = (amounts[bId] || 0) + Number(l.amountPaid || 0);
          }
        });
        setBillPaymentAmounts(amounts);
      }

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

    const linkedInv = activePayment.purchaseInvoice || invoices.find((i: any) => String(i.id) === String(activePayment.purchaseInvoiceHeaderId || activeHeader.purchaseInvoiceHeaderId));
    const invH = linkedInv?.header ?? linkedInv;
    const poId = invH?.purchaseOrderHeaderId || invH?.poHeaderId || invH?.po_header_id || invH?.purchaseOrderId || activePayment.purchaseOrderHeaderId;
    const linkedPo = purchaseOrders.find((p: any) => String(p.id) === String(poId));
    const poH = linkedPo?.header ?? linkedPo;

    const vendorObj = activeHeader.vendor || vendors.find((v: any) => String(v.id) === String(activeHeader.vendorId || activeHeader.vendor_id || poH?.vendorId || invH?.vendorId));
    const vendorName = getVendorDisplayName(vendorObj) || activeHeader.vendorName || "—";

    const subId = activeHeader.subsidiary_id || poH?.subsidiary_id || poH?.subsidiaryId || invH?.subsidiary_id || activeHeader.vendor?.primary_subsidiary_id || vendorObj?.primary_subsidiary_id;
    const subsidiaryName = activeHeader.subsidiary?.subsidiary_name || subsidiaries.find((s: any) => String(s.id) === String(subId))?.subsidiary_name || poH?.subsidiary?.subsidiary_name || poH?.subsidiary?.name || "—";

    const classId = activeHeader.class_id || poH?.class_id || poH?.classId || invH?.class_id;
    const classNameVal = activeHeader.class?.class_name || classesList.find((c: any) => String(c.id) === String(classId))?.class_name || poH?.class?.class_name || "—";

    const deptId = activeHeader.department_id || poH?.department_id || poH?.departmentId || invH?.department_id;
    const deptNameVal = activeHeader.department?.department_name || departmentsList.find((d: any) => String(d.id) === String(deptId))?.department_name || poH?.department?.department_name || "—";

    const locId = activeHeader.location_id || activeHeader.city_id || poH?.city_id || poH?.cityId || poH?.location_id || invH?.location_id;
    const locNameVal = activeHeader.location?.city_name || citiesList.find((c: any) => String(c.id) === String(locId))?.city_name || poH?.city?.city_name || poH?.city?.name || poH?.location?.city_name || "—";

    const bankAccObj = activeHeader.bankAccount || bankAccounts.find((b: any) => String(b.id) === String(activeHeader.bankAccountId || activeHeader.bank_account_id));
    const apAccObj = activeHeader.apAccount || payableAccounts.find((a: any) => String(a.id) === String(activeHeader.apAccountId || activeHeader.ap_account_id));

    const isDraft = String(activeHeader.status || "DRAFT").toUpperCase() === "DRAFT";

    // Payee Address Formatted String
    const formattedAddress = (() => {
      const v = vendorObj;
      if (!v) return "No vendor address found.";
      const defaultAddr = v.addressBook?.find((a: any) => a.default_billing) || v.addressBook?.[0];
      if (defaultAddr) {
        return [
          defaultAddr.addressee || getVendorDisplayName(v),
          defaultAddr.address_line_1 || defaultAddr.address1,
          defaultAddr.address_line_2 || defaultAddr.address2,
          [defaultAddr.city, defaultAddr.state, defaultAddr.zip || defaultAddr.pincode].filter(Boolean).join(", "),
          defaultAddr.country || "India",
        ]
          .filter(Boolean)
          .join("\n");
      }
      if (v.billing_address) return v.billing_address;
      return [
        getVendorDisplayName(v),
        v.address_line_1,
        v.address_line_2,
        [v.city, v.state, v.pincode].filter(Boolean).join(", "),
        v.country || "India",
      ]
        .filter(Boolean)
        .join("\n");
    })();

    // Bills to show in Apply Tab
    const billsToDisplay = (() => {
      if (!isView) return filteredVendorBills;
      if (activePayment?.purchaseInvoice) {
        return [activePayment.purchaseInvoice];
      }
      if (activePayment?.paymentLines && activePayment.paymentLines.length > 0) {
        const invFromLines = activePayment.paymentLines
          .map((l: any) => l.purchaseInvoice || l.purchaseInvoiceLine?.purchaseInvoice || invoices.find((inv: any) => String(inv.id) === String(l.purchaseInvoiceHeaderId || l.purchaseInvoiceLineId)))
          .filter(Boolean);
        if (invFromLines.length > 0) return invFromLines;
      }
      if (activePayment?.purchaseInvoiceHeaderId) {
        const inv = invoices.find((inv: any) => String(inv.id) === String(activePayment.purchaseInvoiceHeaderId));
        if (inv) return [inv];
        return [
          {
            id: activePayment.purchaseInvoiceHeaderId,
            invoiceNumber: activePayment.referenceNo || `BILL-${activePayment.purchaseInvoiceHeaderId}`,
            dueDate: activePayment.paymentDate,
            totalAmount: activePayment.totalAmount,
            currency: activePayment.currency || "INR",
          },
        ];
      }
      return filteredVendorBills;
    })();

    if (isView && isSingleLoading && !activePayment?.id) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-600">Loading Vendor Payment #{urlId}...</span>
        </div>
      );
    }

    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Bill Payment"
          subtitle={isView ? `Payment #${activeHeader.paymentNumber || activeHeader.payment_number || activePayment.id}` : isEdit ? `Edit Payment #${formik.values.paymentNumber}` : "Bill Payment"}
          mode={isView ? "view" : "edit"}
          onSave={() => formik.handleSubmit()}
          onEdit={isDraft && canUpdate("purchase_payment") && activePayment?.id ? () => handleEdit(activePayment.id) : undefined}
          onBack={() => { setOpen(false); setViewMode("list"); setSelectedPaymentId(null); setSearchParams({}); }}
          onCancel={() => { setOpen(false); setViewMode("list"); setSelectedPaymentId(null); setSearchParams({}); }}
          onListClick={() => { setOpen(false); setViewMode("list"); setSelectedPaymentId(null); setSearchParams({}); }}
          onSearchClick={() => { setOpen(false); setViewMode("list"); setSelectedPaymentId(null); setSearchParams({}); }}
          isSaving={isCreating || isUpdating}
          customActions={
            isView && activePayment?.id && !isDraft ? (
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
          subTabs={[
            {
              id: "apply",
              label: "Apply",
              content: (
                <div className="space-y-3">
                  {/* Select Item Filter & Toolbar */}
                  {!isView && (
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 border border-slate-300 rounded-xs">
                      <div className="flex items-center space-x-2">
                        <label className="text-[11px] font-bold text-slate-600 uppercase">SELECT ITEM</label>
                        <input
                          type="text"
                          placeholder="Search Bill #..."
                          value={billSearchTerm}
                          onChange={(e) => setBillSearchTerm(e.target.value)}
                          className="h-7 w-48 px-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={markAllBills}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1 rounded-xs border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                        >
                          Mark All
                        </button>
                        <button
                          type="button"
                          onClick={unmarkAllBills}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1 rounded-xs border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                        >
                          Unmark All
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Apply Bills Data Grid */}
                  <div className="overflow-x-auto border border-slate-300 rounded-xs bg-white">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead className="bg-[#e5eff5] border-b border-slate-300 text-[#244b5a] font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-2 border-r border-slate-300 w-12 text-center">APPLY</th>
                          <th className="p-2 border-r border-slate-300 w-28">DATE DUE</th>
                          <th className="p-2 border-r border-slate-300 w-20">TYPE</th>
                          <th className="p-2 border-r border-slate-300 min-w-[140px]">REF NO</th>
                          <th className="p-2 border-r border-slate-300 text-right w-28">ORIG. AMT</th>
                          <th className="p-2 border-r border-slate-300 text-right w-28">AMT. DUE</th>
                          <th className="p-2 border-r border-slate-300 w-24 text-center">CURRENCY</th>
                          <th className="p-2 text-right w-36">PAYMENT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {billsToDisplay.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-6 text-center text-slate-500 font-medium italic">
                              {formik.values.vendorId ? "No open bills found for this vendor." : "Select a Payee / Vendor above to view and apply bills."}
                            </td>
                          </tr>
                        ) : (
                          billsToDisplay.map((bill: any) => {
                            const h = bill.header ?? bill;
                            const billIdStr = String(bill.id);
                            const isApplied = isView ? true : appliedBillIds.includes(billIdStr);
                            const origAmt = Number(h.totalAmount || h.total_amount || 0);
                            const amtDue = Number(h.balanceAmount !== undefined ? h.balanceAmount : origAmt);
                            const billNumber = h.invoiceNumber || h.invoice_number || `BILL-${bill.id}`;
                            const dueDateStr = h.dueDate || h.due_date ? new Date(h.dueDate || h.due_date).toLocaleDateString() : "—";

                            const matchedLine = activePayment?.paymentLines?.find(
                              (l: any) => String(l.purchaseInvoiceHeaderId) === billIdStr || String(l.purchaseInvoiceLine?.invoiceHeaderId) === billIdStr
                            );
                            const linePayAmt = isView
                              ? (matchedLine ? Number(matchedLine.amountPaid || 0) : Number(activeHeader.totalAmount || activeHeader.amount || amtDue))
                              : (billPaymentAmounts[billIdStr] !== undefined ? billPaymentAmounts[billIdStr] : (amtDue > 0 ? amtDue : origAmt));

                            return (
                              <tr key={bill.id} className={isApplied ? "bg-sky-50/70" : "hover:bg-slate-50"}>
                                <td className="p-2 text-center border-r border-slate-200">
                                  <input
                                    type="checkbox"
                                    disabled={isView}
                                    checked={isApplied}
                                    onChange={() => toggleApplyBill(bill.id)}
                                    className="w-4 h-4 text-sky-600 rounded-xs border-slate-300 cursor-pointer"
                                  />
                                </td>
                                <td className="p-2 border-r border-slate-200 text-slate-700">{dueDateStr}</td>
                                <td className="p-2 border-r border-slate-200 font-semibold text-slate-800">Bill</td>
                                <td className="p-2 border-r border-slate-200 font-mono font-bold text-sky-800">
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/purchase-invoice?id=${bill.id}&action=view`)}
                                    className="hover:underline cursor-pointer"
                                  >
                                    {billNumber}
                                  </button>
                                </td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700">
                                  ₹{origAmt.toFixed(2)}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                                  ₹{amtDue.toFixed(2)}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-600">
                                  {h.currency || "INR"}
                                </td>
                                <td className="p-2 text-right font-mono font-extrabold text-sky-900">
                                  {isView ? (
                                    isApplied ? `₹${linePayAmt.toFixed(2)}` : "0.00"
                                  ) : isApplied ? (
                                    <div className="flex items-center justify-end space-x-1">
                                      <span className="text-slate-500 text-xs font-semibold">₹</span>
                                      <input
                                        type="number"
                                        step="any"
                                        min="0.01"
                                        max={amtDue > 0 ? amtDue : undefined}
                                        value={billPaymentAmounts[billIdStr] !== undefined ? billPaymentAmounts[billIdStr] : (amtDue > 0 ? amtDue : "")}
                                        onChange={(e) => handleBillPaymentAmountChange(billIdStr, e.target.value, amtDue > 0 ? amtDue : origAmt)}
                                        className="w-28 h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono font-bold text-sky-900 bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 font-normal">0.00</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ),
            },
            {
              id: "payee_address",
              label: "Payee Address",
              content: (
                <div className="p-4 bg-white border border-slate-300 rounded-xs max-w-xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Payee Address Line</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xs text-slate-800 font-mono text-xs whitespace-pre-line leading-relaxed shadow-2xs">
                    {formattedAddress}
                  </div>
                </div>
              ),
            },
            ...(isView && !isDraft
              ? [
                {
                  id: "gl_impact",
                  label: "GL Impact",
                  content: (() => {
                    const payAmt = Number(activeHeader.totalAmount || activeHeader.amount || 0);
                    const pNoStr = activeHeader.paymentNumber || activeHeader.payment_number || `PAY-${activePayment.id || "NEW"}`;
                    const bankAccName = activeHeader.bankAccount?.account_name || bankAccObj?.account_name || "BOI";
                    const bankAccCode = activeHeader.bankAccount?.account_number || bankAccObj?.account_number || "200000";
                    const apAccName = activeHeader.apAccount?.account_name || apAccObj?.account_name || "Accounts Payables - Vendor";
                    const apAccCode = activeHeader.apAccount?.account_number || apAccObj?.account_number || "200002";

                    // Linked Bill & PO Lookup
                    const linkedInv = activePayment.purchaseInvoice || invoices.find((i: any) => String(i.id) === String(activePayment.purchaseInvoiceHeaderId || activeHeader.purchaseInvoiceHeaderId));
                    const invH = linkedInv?.header ?? linkedInv;
                    const poId = invH?.purchaseOrderHeaderId || invH?.poHeaderId || invH?.po_id || activePayment.purchaseOrderHeaderId;
                    const linkedPo = purchaseOrders.find((p: any) => String(p.id) === String(poId));
                    const poH = linkedPo?.header ?? linkedPo;
                    const poNumber = poH?.orderNumber || poH?.po_number || poH?.poNumber || (poId ? `PO-${poId}` : "");

                    const lineItems = linkedInv?.lines || linkedInv?.lineItems || linkedInv?.purchaseInvoiceLines || linkedPo?.items || linkedPo?.lines || [];

                    let taxAmt = Number(invH?.taxAmount ?? invH?.tax_amount ?? poH?.taxAmount ?? poH?.tax_amount ?? 0);
                    let discountAmt = Number(invH?.discountAmount ?? invH?.discount_amount ?? poH?.discountAmount ?? poH?.discount_amount ?? 0);
                    let subtotalAmt = Number(invH?.subtotal ?? invH?.sub_total ?? poH?.subtotal ?? 0);

                    if (taxAmt === 0 && lineItems.length > 0) {
                      taxAmt = lineItems.reduce((sum: number, l: any) => sum + Number(l.taxAmount || l.tax_amount || 0), 0);
                    }
                    if (discountAmt === 0 && lineItems.length > 0) {
                      discountAmt = lineItems.reduce((sum: number, l: any) => sum + Number(l.discountAmount || l.discount_amount || 0), 0);
                    }
                    if (subtotalAmt === 0 && lineItems.length > 0) {
                      subtotalAmt = lineItems.reduce((sum: number, l: any) => sum + (Number(l.quantity || 1) * Number(l.unitPrice || l.unit_price || 0)), 0);
                    }

                    // If subtotal is still 0, calculate based on payment amount, tax & discount
                    if (subtotalAmt === 0) {
                      subtotalAmt = Number((payAmt + discountAmt - taxAmt).toFixed(2));
                    }

                    const postingPeriod = activeHeader.postingPeriod || currentPeriod;
                    const entries: any[] = [
                      {
                        accountCode: apAccCode,
                        accountName: apAccName,
                        debit: payAmt,
                        credit: 0,
                        postingPeriod,
                        memo: `Vendor Payables Settlement - ${vendorName}`,
                      },
                      {
                        accountCode: bankAccCode,
                        accountName: bankAccName,
                        debit: 0,
                        credit: payAmt,
                        postingPeriod,
                        memo: `Bank Disbursement - Payment #${pNoStr}`,
                      },
                    ];

                    return (
                      <GLImpactSubtab
                        documentNumber={pNoStr}
                        entries={entries}
                      />
                    );
                  })(),
                },
              ]
              : []),
          ]}
        >
          {/* SECTION 1: PRIMARY INFORMATION */}
          <RecordSection title="Primary Information" defaultOpen={true}>
            <div className="col-span-full space-y-4">
              {/* Row 1: A/P Account (Full Width Filtered Dropdown) */}
              <div className="w-full sm:w-80">
                <label className="text-[11px] font-semibold text-[#475569] uppercase block mb-1">
                  A/P ACCOUNT <span className="text-amber-600">*</span>
                </label>
                {isView ? (
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {apAccObj ? `${apAccObj.account_number ? `${apAccObj.account_number} ` : ""}${apAccObj.account_name}` : "2001 Accounts Payable"}
                  </span>
                ) : (
                  <select
                    name="apAccountId"
                    value={formik.values.apAccountId || (payableAccounts[0]?.id ? String(payableAccounts[0].id) : "")}
                    onChange={formik.handleChange}
                    className="h-7 w-full text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-mono font-medium"
                  >
                    {payableAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number ? `${acc.account_number} ` : ""}{acc.account_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Row 2: 3-Column Clean NetSuite Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-200">
                {/* Column 1 (Left): Transaction #, Payee, Account, Amount */}
                <div className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">TRANSACTION NUMBER</label>
                    <input
                      type="text"
                      disabled={true}
                      value={isView ? (activeHeader.paymentNumber || `PAY-${activePayment.id}`) : "To Be Generated"}
                      className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 font-mono text-slate-600 font-semibold cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      PAYEE <span className="text-amber-600">*</span>
                    </label>
                    {isView ? (
                      <span className="text-xs font-bold text-sky-800">{vendorName}</span>
                    ) : (
                      <select
                        name="vendorId"
                        value={formik.values.vendorId || ""}
                        onChange={(e) => handleVendorChange(e.target.value)}
                        onBlur={formik.handleBlur}
                        className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${formik.touched.vendorId && formik.errors.vendorId ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                          }`}
                      >
                        <option value="">-- Select Payee / Vendor --</option>
                        {vendors.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {getVendorDisplayName(v)}
                          </option>
                        ))}
                      </select>
                    )}
                    {formik.touched.vendorId && formik.errors.vendorId && (
                      <span className="text-[10px] text-red-500">{String(formik.errors.vendorId)}</span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      ACCOUNT <span className="text-amber-600">*</span>
                    </label>
                    {isView ? (
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {bankAccObj ? `${bankAccObj.account_number ? `${bankAccObj.account_number} - ` : ""}${bankAccObj.account_name}` : "Bank Account"}
                      </span>
                    ) : (
                      <select
                        name="bankAccountId"
                        value={formik.values.bankAccountId || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 font-mono ${formik.touched.bankAccountId && formik.errors.bankAccountId ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                          }`}
                      >
                        <option value="">-- Select Bank Account --</option>
                        {bankAccountsList.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.account_number ? `${acc.account_number} - ` : ""}{acc.account_name}
                          </option>
                        ))}
                      </select>
                    )}
                    {formik.touched.bankAccountId && formik.errors.bankAccountId && (
                      <span className="text-[10px] text-red-500">{String(formik.errors.bankAccountId)}</span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      AMOUNT <span className="text-amber-600">*</span>
                    </label>
                    {isView ? (
                      <span className="text-sm font-extrabold text-sky-900 font-mono">
                        ₹{Number(activeHeader.totalAmount || activeHeader.amount || 0).toFixed(2)}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="any"
                        name="totalAmount"
                        value={formik.values.totalAmount}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-mono font-bold text-sky-900"
                      />
                    )}
                  </div>
                </div>

                {/* Column 2 (Middle): Currency, Exchange Rate, Date, Posting Period */}
                <div className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      CURRENCY <span className="text-amber-600">*</span>
                    </label>
                    {isView ? (
                      <span className="text-xs font-bold text-slate-900">{formik.values.currency || "INR"}</span>
                    ) : (
                      <select
                        name="currency"
                        disabled={true}
                        value={formik.values.currency || "INR"}
                        className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 font-bold text-slate-700 cursor-not-allowed"
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      EXCHANGE RATE <span className="text-amber-600">*</span>
                    </label>
                    {isView ? (
                      <span className="text-xs font-mono font-semibold text-slate-900">
                        {Number(activeHeader.exchangeRate || 1).toFixed(4)}
                      </span>
                    ) : (
                      <input
                        type="number"
                        step="any"
                        min="0.000001"
                        name="exchangeRate"
                        value={formik.values.exchangeRate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      DATE <span className="text-amber-600">*</span>
                    </label>
                    {isView ? (
                      <span className="text-xs text-slate-800">
                        {activeHeader.paymentDate ? new Date(activeHeader.paymentDate).toLocaleDateString() : "—"}
                      </span>
                    ) : (
                      <input
                        type="date"
                        name="paymentDate"
                        value={formik.values.paymentDate}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                      />
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">POSTING PERIOD</label>
                    <input
                      type="text"
                      disabled={true}
                      value={formik.values.postingPeriod || currentPeriod}
                      className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 font-semibold text-slate-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Column 3 (Right): Cheque #, Memo, Status */}
                <div className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">CHEQUE #</label>
                    <input
                      type="text"
                      name="chequeNo"
                      disabled={isView}
                      placeholder="Cheque / Ref number..."
                      value={formik.values.chequeNo}
                      onChange={formik.handleChange}
                      className={`h-7 text-xs border border-slate-300 rounded-xs px-2 font-mono ${isView ? "bg-slate-100 cursor-not-allowed" : "bg-white focus:outline-none focus:border-sky-500"
                        }`}
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">MEMO</label>
                    <input
                      type="text"
                      name="memo"
                      disabled={isView}
                      placeholder="Enter memo / remarks..."
                      value={formik.values.memo}
                      onChange={formik.handleChange}
                      className={`h-7 text-xs border border-slate-300 rounded-xs px-2 ${isView ? "bg-slate-100 cursor-not-allowed" : "bg-white focus:outline-none focus:border-sky-500"
                        }`}
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-semibold text-[#475569] uppercase">
                      STATUS <span className="text-amber-600">*</span>
                    </label>
                    {isView ? (
                      <div>
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${String(activeHeader.status || "DRAFT").toUpperCase() === "DRAFT"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : String(activeHeader.status || "").toUpperCase() === "POSTED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-red-50 text-red-800 border-red-300"
                          }`}>
                          {activeHeader.status || "DRAFT"}
                        </span>
                      </div>
                    ) : (
                      <select
                        name="status"
                        value={formik.values.status || "DRAFT"}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-bold"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="POSTED">POSTED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    )}
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
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">
                    SUBSIDIARY <span className="text-amber-600">*</span>
                  </label>
                  <select
                    name="subsidiary_id"
                    value={formik.values.subsidiary_id || ""}
                    onChange={handleSubsidiaryChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-medium"
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
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">CLASS</label>
                  <select
                    name="class_id"
                    value={formik.values.class_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-medium"
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
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">LOCATION</label>
                  <select
                    name="location_id"
                    value={formik.values.location_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-medium"
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
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">DEPARTMENT</label>
                  <select
                    name="department_id"
                    value={formik.values.department_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-medium"
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
        </RecordPageLayout>
      </form>
    );
  }

  // ── RENDER 2: DATAGRID LIST VIEW MODE ──
  const filteredPayments = payments.filter((item: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const pNo = String(item.paymentNumber || item.payment_number || `PAY-${item.id}`).toLowerCase();
    const vName = getVendorDisplayName(item.vendor).toLowerCase();
    return pNo.includes(term) || vName.includes(term);
  });

  return (
    <div className="flex flex-col space-y-3 p-4 bg-[#f3f6f9] min-h-screen font-sans text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-300">
        <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Bill Payments (Vendor Payments)</h1>
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
            <option>All Bill Payments</option>
          </select>
          {canCreate("purchase_payment") && (
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                setViewMode("form");
                setIsEdit(false);
                setEditId(null);
                formik.resetForm();
                setAppliedBillIds([]);
                setSearchParams({ action: "create" });
              }}
              className="bg-[#0070d2] hover:bg-blue-700 text-white font-bold text-xs px-4 py-1.5 rounded-xs border border-blue-800 shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Add className="!w-4 !h-4" />
              <span>+ New Bill Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* DataGrid Table */}
      <div className="bg-white border border-slate-300 rounded-xs shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#e5eff5] border-b border-slate-300 text-[#244b5a] font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-2 border-r border-slate-300 w-24 text-center">EDIT | VIEW</th>
              <th className="p-2 border-r border-slate-300 w-24">INTERNAL ID</th>
              <th className="p-2 border-r border-slate-300 min-w-[130px]">PAYMENT #</th>
              <th className="p-2 border-r border-slate-300 min-w-[180px]">PAYEE / VENDOR</th>
              <th className="p-2 border-r border-slate-300 w-28">PAYMENT DATE</th>
              <th className="p-2 border-r border-slate-300 text-right w-28">AMOUNT (₹)</th>
              <th className="p-2 w-28 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-medium italic">
                  {searchTerm ? "No matching payments found." : "No Bill Payments found. Click '+ New Bill Payment' to create one."}
                </td>
              </tr>
            ) : (
              filteredPayments.map((item: any) => {
                const h = item.header ?? item;
                const pNoStr = h.paymentNumber || h.payment_number || `PAY-${item.id}`;
                const vendorName = getVendorDisplayName(item.vendor);
                const isDraft = String(h.status || "DRAFT").toUpperCase() === "DRAFT";

                return (
                  <tr key={item.id} className="hover:bg-sky-50/50 transition-colors">
                    <td className="p-2 border-r border-slate-200 text-center font-semibold space-x-1">
                      {isDraft && canUpdate("purchase_payment") ? (
                        <button onClick={() => handleEdit(item.id)} className="text-sky-700 hover:underline cursor-pointer">
                          Edit
                        </button>
                      ) : (
                        <span className="text-slate-300 select-none cursor-not-allowed" title="Only Draft payments can be edited">
                          Edit
                        </span>
                      )}
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleView(item.id)} className="text-sky-700 hover:underline cursor-pointer">
                        View
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">{item.id}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-sky-800">
                      <button onClick={() => handleView(item.id)} className="hover:underline text-left cursor-pointer">
                        {pNoStr}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{vendorName}</td>
                    <td className="p-2 border-r border-slate-200 text-slate-700">
                      {h.paymentDate || h.payment_date ? new Date(h.paymentDate || h.payment_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                      ₹{Number(h.totalAmount || h.amount || 0).toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${isDraft ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}>
                        {h.status || "DRAFT"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {deleteDialogOpen && (
        <ConfirmationDialog
          open={deleteDialogOpen}
          title="Delete Bill Payment"
          message="Are you sure you want to delete this bill payment?"
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteDialogOpen(false);
            setPaymentToDelete(null);
          }}
        />
      )}
    </div>
  );
}