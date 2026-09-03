import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Add, Delete, Edit, Payments, Print, Search, List as ListIcon, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import * as Yup from "yup";

import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";
import { useGetVendorsQuery } from "../RTK/services/vendorApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetClassesQuery } from "../RTK/services/classApi";
import { useGetDepartmentsQuery } from "../RTK/services/departmentApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetUOMsQuery } from "../RTK/services/uomApi";
import { useGetChartOfAccountsQuery } from "../RTK/services/chartOfAccountApi";
import { useGetPaymentMethodsQuery } from "../RTK/services/paymentMethodApi";
import { useGetPaymentTermsQuery } from "../RTK/services/paymentTermApi";
import { useAppSelector } from "../Hooks/Reduxhook/hooks";
import { usePermissions } from "../Hooks/usePermissions";

import {
  useCreatePurchaseInvoiceMutation,
  useDeletePurchaseInvoiceMutation,
  useGetDebitNotesQuery,
  useGetGRNsQuery,
  useGetPurchaseInvoiceByIdQuery,
  useGetPurchaseInvoicesQuery,
  useGetPurchaseOrdersQuery,
  useGetPurchasePaymentsQuery,
  useGetPurchaseReturnsQuery,
  useLazyGetGRNByIdQuery,
  useLazyGetPurchaseOrderByIdQuery,
  useUpdatePurchaseInvoiceMutation,
} from "../RTK/services/purchaseApi";

import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";
import { GLImpactSubtab } from "./Layout/GLImpactSubtab";
import ConfirmationDialog from "./Dialog/ConfirmationDialog";

interface PurchaseInvoiceLineForm {
  invoiceHeaderId: string;
  poLineId: string;
  grnLineId: string;
  itemId: string;
  uom_id?: string;
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
  uom_id: "",
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

const calculateLine = (line: PurchaseInvoiceLineForm) => {
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

const isDecimalAllowedForUOM = (uomObj: any) => {
  if (!uomObj) return true;
  const name = String(uomObj.uom_name || uomObj.name || uomObj.uom_symbol || "").toUpperCase();
  const integerUOMs = ["EACH", "PCS", "PIECE", "PIECES", "NOS", "NUMBER", "NUMBERS", "BOX", "BOXES", "UNIT", "UNITS", "SET", "SETS", "PACK", "PACKS", "BAG", "BAGS", "BOTTLE", "BOTTLES", "CAN", "CANS", "DRUM", "DRUMS", "CARTON", "CARTONS"];
  return !integerUOMs.some((u) => name.includes(u));
};

const PurchaseInvoiceComp: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const userId = currentUser?.id ?? "";

  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const urlId = searchParams.get("id");
  const urlAction = searchParams.get("action");
  const shouldFetchSingle = Boolean(urlId && (urlAction === "view" || urlAction === "edit"));

  const { data: singleInvoiceData, isLoading: isSingleLoading } = useGetPurchaseInvoiceByIdQuery(urlId || "", {
    skip: !shouldFetchSingle,
  });

  // Eager Queries
  const { data: purchaseInvoicesData, refetch: refetchInvoices } = useGetPurchaseInvoicesQuery({ page: 1, limit: 50 });
  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery({ page: 1, limit: 100 });
  const { data: grnsData } = useGetGRNsQuery({ page: 1, limit: 100 });
  const { data: vendorsData } = useGetVendorsQuery({ page: 1, option: true });
  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 1000 });
  const { data: subsidiariesData } = useGetSubsidiariesQuery(undefined);
  const { data: classesData } = useGetClassesQuery(undefined);
  const { data: departmentsData } = useGetDepartmentsQuery(undefined);
  const { data: citiesData } = useGetCitiesQuery(undefined);
  const { data: currenciesData } = useGetCurrenciesQuery(undefined);
  const { data: uomsData } = useGetUOMsQuery(undefined);
  const { data: chartOfAccountsData } = useGetChartOfAccountsQuery(undefined);
  const { data: paymentMethodsData } = useGetPaymentMethodsQuery({ page: 1, limit: 100 });
  const { data: paymentTermsData } = useGetPaymentTermsQuery();
  const { data: paymentsData } = useGetPurchasePaymentsQuery({});
  const { data: returnsData } = useGetPurchaseReturnsQuery({});
  const { data: debitNotesData } = useGetDebitNotesQuery({});

  const [createPurchaseInvoice, { isLoading: isCreating }] = useCreatePurchaseInvoiceMutation();
  const [updatePurchaseInvoice, { isLoading: isUpdating }] = useUpdatePurchaseInvoiceMutation();
  const [deletePurchaseInvoice] = useDeletePurchaseInvoiceMutation();
  const [triggerGetGRNById] = useLazyGetGRNByIdQuery();
  const [triggerGetPOById] = useLazyGetPurchaseOrderByIdQuery();

  const purchaseInvoices = Array.isArray(purchaseInvoicesData?.result) ? purchaseInvoicesData.result : [];
  const purchaseOrders = Array.isArray(purchaseOrdersData?.result) ? purchaseOrdersData.result : [];
  const grns = Array.isArray(grnsData?.result) ? grnsData.result : [];
  const vendors = Array.isArray(vendorsData?.result) ? vendorsData.result : [];
  const items = Array.isArray(itemsData?.result) ? itemsData.result : [];
  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : [];
  const classesList = Array.isArray(classesData?.result) ? classesData.result : [];
  const departmentsList = Array.isArray(departmentsData?.result) ? departmentsData.result : [];
  const citiesList = Array.isArray(citiesData?.result) ? citiesData.result : [];
  const currencies = Array.isArray(currenciesData?.result) ? currenciesData.result : [];
  const uoms = Array.isArray(uomsData?.result) ? uomsData.result : [];
  const chartOfAccounts = Array.isArray(chartOfAccountsData?.result) ? chartOfAccountsData.result : [];
  const paymentMethods = Array.isArray(paymentMethodsData?.result) ? paymentMethodsData.result : [];
  const paymentTerms = Array.isArray(paymentTermsData?.result) ? paymentTermsData.result : [];
  const purchasePayments = Array.isArray(paymentsData?.result) ? paymentsData.result : Array.isArray(paymentsData?.data) ? paymentsData.data : Array.isArray(paymentsData) ? paymentsData : [];
  const purchaseReturns = Array.isArray(returnsData?.result) ? returnsData.result : Array.isArray(returnsData?.data) ? returnsData.data : Array.isArray(returnsData) ? returnsData : [];
  const debitNotes = Array.isArray(debitNotesData?.result) ? debitNotesData.result : Array.isArray(debitNotesData?.data) ? debitNotesData.data : Array.isArray(debitNotesData) ? debitNotesData : [];

  const formik = useFormik({
    initialValues: {
      header: {
        invoiceNumber: "",
        invoiceType: "REGULAR",
        vendorInvoiceNumber: "",
        poHeaderId: "",
        grnHeaderId: "",
        vendorId: "",
        account_id: "",
        terms_id: "",
        payment_method_id: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        currency_id: "",
        currency: "INR",
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        subsidiary_id: "",
        class_id: "",
        department_id: "",
        location_id: "",
        status: "DRAFT",
        remarks: "",
        user_id: userId,
      },
      lineItems: [makeLineItem(userId)],
    },
    validationSchema: Yup.object({
      header: Yup.object({
        vendorId: Yup.string().required("Vendor is required"),
        invoiceDate: Yup.date().required("Invoice Date is required"),
        dueDate: Yup.date().required("Due Date is required"),
        location_id: Yup.string().required("Location / City is required"),
      }),
      lineItems: Yup.array().of(
        Yup.object({
          itemId: Yup.string().required("Item is required"),
          quantity: Yup.number().min(0.01, "Qty must be > 0").required("Qty is required"),
          unitPrice: Yup.number().min(0, "Price must be >= 0").required("Unit price is required"),
        })
      ).min(1, "At least one item line is required"),
    }),
    onSubmit: async (values) => {
      try {
        for (let i = 0; i < values.lineItems.length; i++) {
          const line = values.lineItems[i];
          const uomObj = uoms.find((u: any) => String(u.id) === String(line.uom_id));
          if (uomObj && !isDecimalAllowedForUOM(uomObj) && Number(line.quantity) % 1 !== 0) {
            toast.error(`Quantity for line ${i + 1} (${uomObj.uom_name}) must be a whole number.`);
            return;
          }
        }

        const payload = {
          header: { ...values.header, user_id: userId },
          lineItems: values.lineItems.map((line) => {
            const calc = calculateLine(line);
            return {
              ...line,
              user_id: userId,
              quantity: calc.quantity,
              unitPrice: calc.unitPrice,
              discountPercent: calc.discountPercent,
              discountAmount: calc.discountAmount,
              taxPercent: calc.taxPercent,
              taxAmount: calc.taxAmount,
              lineTotal: calc.lineTotal,
            };
          }),
        };

        if (isEdit && editId) {
          const res: any = await updatePurchaseInvoice({ id: editId, body: payload }).unwrap();
          toast.success("Vendor Bill updated successfully.");
          const updatedRecord = res?.result || res?.data || res;
          setSelectedInvoice(updatedRecord || { header: payload.header, lineItems: payload.lineItems, id: editId });
          setViewMode("view");
          setIsEdit(false);
          setEditId(null);
          setSearchParams({ id: String(editId), action: "view" });
        } else {
          const res: any = await createPurchaseInvoice(payload).unwrap();
          toast.success("Vendor Bill created successfully.");
          const createdRecord = res?.result || res?.data || res;
          const createdId = createdRecord?.header?.id || createdRecord?.id;
          setSelectedInvoice(createdRecord || { header: payload.header, lineItems: payload.lineItems, id: createdId });
          setViewMode("view");
          setIsEdit(false);
          setEditId(null);
          if (createdId) {
            setSearchParams({ id: String(createdId), action: "view" });
          }
        }
        formik.resetForm();
        refetchInvoices();
      } catch (error: any) {
        toast.error(error?.data?.message || "Failed to save Vendor Bill.");
      }
    },
  });

  // Auto-select Subsidiary, Currency, Account, and Terms directly from Vendor when Vendor is selected
  useEffect(() => {
    const selectedVendorId = formik.values.header.vendorId;
    if (!selectedVendorId) return;

    const vObj = vendors.find((v: any) => String(v.id) === String(selectedVendorId));
    if (!vObj) return;

    // 1. Auto-select Subsidiary directly from Vendor
    const subId = vObj.subsidiary_id || vObj.subsidiaryId || vObj.primary_subsidiary_id || vObj.subsidiary?.id;
    if (subId) {
      formik.setFieldValue("header.subsidiary_id", String(subId));
    }

    // 2. Auto-select Currency directly from Vendor
    const currId = vObj.currency_id || vObj.currencyId || vObj.currency?.id;
    if (currId) {
      formik.setFieldValue("header.currency_id", String(currId));
      const currObj = currencies.find((c: any) => String(c.id) === String(currId));
      if (currObj) {
        formik.setFieldValue("header.currency", currObj.currency_code || currObj.currency_symbol || currObj.currency_name || "INR");
      }
    } else if (vObj.currency_code || vObj.currency) {
      formik.setFieldValue("header.currency", vObj.currency_code || vObj.currency || "INR");
    }

    // 3. Auto-select Account (Payables Account) directly from Vendor
    const accId = vObj.default_payables_account_id || vObj.account_id || vObj.opening_balance_account_id || vObj.default_payment_account_id;
    if (accId) {
      formik.setFieldValue("header.account_id", String(accId));
    } else if (chartOfAccounts.length > 0 && !formik.values.header.account_id) {
      const apAcc = chartOfAccounts.find((a: any) =>
        String(a.account_name || "").toLowerCase().includes("payable") ||
        String(a.account_number || "").startsWith("20") ||
        String(a.account_number || "").startsWith("21")
      ) || chartOfAccounts[0];
      if (apAcc) {
        formik.setFieldValue("header.account_id", String(apAcc.id));
      }
    }

    // 4. Auto-select Payment Terms directly from Vendor
    const termsId = vObj.terms_id || vObj.termsId || vObj.terms?.id;
    if (termsId) {
      formik.setFieldValue("header.terms_id", String(termsId));
    } else if (vObj.terms?.name) {
      const foundTerm = paymentTerms.find((pt: any) => pt.name === vObj.terms.name);
      if (foundTerm) {
        formik.setFieldValue("header.terms_id", String(foundTerm.id));
      }
    }

    // 5. Auto-select Payment Method directly from Vendor
    const pmId = vObj.default_payment_method_id || vObj.payment_method_id || vObj.paymentMethodId;
    if (pmId) {
      formik.setFieldValue("header.payment_method_id", String(pmId));
    }
  }, [formik.values.header.vendorId, vendors, currencies, chartOfAccounts]);

  const getNextBillNumber = useCallback(() => {
    const maxNum = purchaseInvoices.reduce((max: number, inv: any) => {
      const numStr = String(inv.invoiceNumber || inv.invoice_number || inv.vendorInvoiceNumber || inv.vendor_invoice_number || "");
      const match = numStr.match(/VB-\d{4}-(\d+)/);
      if (match) {
        return Math.max(max, parseInt(match[1], 10));
      }
      return max;
    }, 0);
    const nextSeq = Math.max(purchaseInvoices.length, maxNum) + 1;
    return `VB-${new Date().getFullYear()}-${String(nextSeq).padStart(4, "0")}`;
  }, [purchaseInvoices]);

  // Auto-generate Vendor Bill Number if empty or if currently set to an existing invoice number
  useEffect(() => {
    if (viewMode === "form" && !isEdit) {
      const curNum = formik.values.header.vendorInvoiceNumber || formik.values.header.invoiceNumber;
      const isDuplicate = curNum && purchaseInvoices.some((inv: any) => {
        const invNo = inv.invoiceNumber || inv.invoice_number || inv.vendorInvoiceNumber || inv.vendor_invoice_number;
        return String(invNo).trim().toUpperCase() === String(curNum).trim().toUpperCase();
      });

      if (!curNum || isDuplicate) {
        const generatedBillNo = getNextBillNumber();
        formik.setFieldValue("header.vendorInvoiceNumber", generatedBillNo);
        formik.setFieldValue("header.invoiceNumber", generatedBillNo);
      }
    }
  }, [viewMode, isEdit, getNextBillNumber, purchaseInvoices]);

  // Auto-populate all details (PO, Vendor, Items, Location, Memo, Subsidiary) when GRN is selected
  const lastProcessedGrnIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    const selectedGrnId = formik.values.header.grnHeaderId;
    if (!selectedGrnId || isEdit) return;

    if (lastProcessedGrnIdRef.current === String(selectedGrnId)) return;
    lastProcessedGrnIdRef.current = String(selectedGrnId);

    // Trigger API call for GRN
    triggerGetGRNById(selectedGrnId)
      .unwrap()
      .then(async (grnRes: any) => {
        const grnObj = grnRes?.result || grnRes?.data || grnRes;
        if (!grnObj) return;

        const poId = grnObj.purchaseOrderId || grnObj.po_header_id || grnObj.purchaseOrder?.id;
        if (poId) {
          formik.setFieldValue("header.poHeaderId", String(poId));
        }

        let poObj = grnObj.purchaseOrder;
        if (poId && (!poObj || !poObj.purchaseOrderLines)) {
          try {
            const poRes = await triggerGetPOById(poId).unwrap();
            poObj = poRes?.result || poRes?.data || poRes;
          } catch (e) {
            // fallback
          }
        }

        const vendorId = grnObj.vendor_id || grnObj.vendorId || poObj?.vendor_id || poObj?.vendorId;
        if (vendorId) {
          formik.setFieldValue("header.vendorId", String(vendorId));
        }

        const grnMemo = grnObj.memo || grnObj.remarks || grnObj.comment;
        if (grnMemo) {
          formik.setFieldValue("header.remarks", grnMemo);
        }

        const grnLoc = poObj?.city_id || poObj?.cityId || poObj?.location_id || poObj?.locationId || grnObj.location_id || grnObj.locationId || grnObj.city_id || grnObj.godownId || grnObj.warehouseId;
        if (grnLoc) {
          formik.setFieldValue("header.location_id", String(grnLoc));
        }

        if (poObj) {
          const subId = poObj.subsidiary_id || poObj.subsidiaryId;
          if (subId) formik.setFieldValue("header.subsidiary_id", String(subId));
          const classId = poObj.class_id || poObj.classId;
          if (classId) formik.setFieldValue("header.class_id", String(classId));
          const deptId = poObj.department_id || poObj.departmentId;
          if (deptId) formik.setFieldValue("header.department_id", String(deptId));
        }

        const grnLines = grnObj.lineItems || grnObj.grnDetails || grnObj.details || grnObj.line_items || [];
        const poLines = poObj?.lineItems || poObj?.purchaseOrderLines || poObj?.line_items || poObj?.details || [];

        if (Array.isArray(grnLines) && grnLines.length > 0) {
          const mappedLines = grnLines.map((gLine: any) => {
            const matchedPoLine = poLines.find(
              (pol: any) => String(pol.id) === String(gLine.purchaseOrderLineId || gLine.po_line_id)
            ) || poLines.find(
              (pol: any) => String(pol.itemId || pol.item_id) === String(gLine.itemId || gLine.item_id)
            );

            const itemId = String(gLine.itemId ?? gLine.item_id ?? matchedPoLine?.itemId ?? matchedPoLine?.item_id ?? "");
            const itemObj = items.find((i: any) => String(i.id) === String(itemId));
            const uomId = String(gLine.uom_id ?? gLine.uomId ?? matchedPoLine?.uom_id ?? itemObj?.uom_id ?? "");

            const quantity = Number(
              gLine.acceptedQty ?? gLine.accepted_quantity ?? gLine.receivedQty ?? gLine.received_quantity ?? gLine.orderedQty ?? 1
            );

            const unitPrice = Number(
              gLine.purchaseOrderLine?.rate ??
              gLine.rate ??
              gLine.unitPrice ??
              gLine.unit_price ??
              matchedPoLine?.rate ??
              matchedPoLine?.unitPrice ??
              matchedPoLine?.unit_price ??
              matchedPoLine?.price ??
              itemObj?.purchase_price ??
              itemObj?.cost_price ??
              itemObj?.default_rate ??
              0
            );

            const discountPercent = Number(
              matchedPoLine?.discount_percent ??
              matchedPoLine?.discountPercent ??
              gLine.discount_percent ??
              gLine.discountPercent ??
              0
            );
            const taxPercent = Number(
              matchedPoLine?.tax_rate ??
              matchedPoLine?.taxRate ??
              matchedPoLine?.tax_percent ??
              matchedPoLine?.taxPercent ??
              gLine.purchaseOrderLine?.tax_rate ??
              gLine.purchaseOrderLine?.taxRate ??
              gLine.purchaseOrderLine?.tax_percent ??
              gLine.purchaseOrderLine?.taxPercent ??
              gLine.tax_rate ??
              gLine.taxRate ??
              gLine.tax_percent ??
              gLine.taxPercent ??
              itemObj?.hsnSacCode?.taxPercentage ??
              itemObj?.hsnSac?.taxPercentage ??
              0
            );

            const baseLine: PurchaseInvoiceLineForm = {
              invoiceHeaderId: "",
              poLineId: String(gLine.purchaseOrderLineId || gLine.po_line_id || matchedPoLine?.id || ""),
              grnLineId: String(gLine.id || ""),
              itemId,
              uom_id: uomId,
              description: gLine.item?.item_name || itemObj?.item_name || gLine.remarks || "",
              batchNo: gLine.batchNo || "",
              quantity,
              unitPrice,
              discountPercent,
              discountAmount: 0,
              taxPercent,
              taxAmount: 0,
              lineTotal: 0,
              user_id: userId,
              remarks: gLine.remarks || "",
            };

            const calc = calculateLine(baseLine);
            return { ...baseLine, ...calc };
          });

          formik.setFieldValue("lineItems", mappedLines);
        }
      })
      .catch((err: any) => {
        console.error("Failed to fetch GRN by ID:", err);
      });
  }, [formik.values.header.grnHeaderId, isEdit, items, userId]);

  // Auto-populate all details (Vendor, Items, Location, Memo, Subsidiary) when Purchase Order is selected directly (and no GRN is selected)
  const lastProcessedPoIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    const selectedPoId = formik.values.header.poHeaderId;
    const selectedGrnId = formik.values.header.grnHeaderId;
    if (!selectedPoId || selectedGrnId || isEdit) return;

    if (lastProcessedPoIdRef.current === String(selectedPoId)) return;
    lastProcessedPoIdRef.current = String(selectedPoId);

    // Trigger API call for PO
    triggerGetPOById(selectedPoId)
      .unwrap()
      .then((poRes: any) => {
        const poObj = poRes?.result || poRes?.data || poRes;
        if (!poObj) return;

        const vendorId = poObj.vendor_id || poObj.vendorId || poObj.vendor?.id;
        if (vendorId) {
          formik.setFieldValue("header.vendorId", String(vendorId));
        }

        const poMemo = poObj.memo || poObj.remarks;
        if (poMemo) {
          formik.setFieldValue("header.remarks", poMemo);
        }

        const poLoc = poObj.city_id || poObj.cityId || poObj.location_id || poObj.locationId || poObj.location?.id || poObj.city?.id;
        if (poLoc) {
          formik.setFieldValue("header.location_id", String(poLoc));
        }

        const subId = poObj.subsidiary_id || poObj.subsidiaryId;
        if (subId) formik.setFieldValue("header.subsidiary_id", String(subId));
        const classId = poObj.class_id || poObj.classId;
        if (classId) formik.setFieldValue("header.class_id", String(classId));
        const deptId = poObj.department_id || poObj.departmentId;
        if (deptId) formik.setFieldValue("header.department_id", String(deptId));

        const currId = poObj.currency_id || poObj.currencyId;
        if (currId) {
          formik.setFieldValue("header.currency_id", String(currId));
        }

        const poLines = poObj.purchaseOrderLines || poObj.lineItems || poObj.line_items || poObj.details || [];
        if (Array.isArray(poLines) && poLines.length > 0) {
          const mappedLines = poLines.map((poLine: any) => {
            const itemId = String(poLine.itemId ?? poLine.item_id ?? poLine.item?.id ?? "");
            const itemObj = items.find((i: any) => String(i.id) === String(itemId));
            const uomId = String(poLine.uom_id ?? poLine.uomId ?? itemObj?.uom_id ?? "");

            const quantity = Number(poLine.quantity ?? poLine.qty ?? 1);
            const unitPrice = Number(poLine.rate ?? poLine.unitPrice ?? poLine.unit_price ?? itemObj?.purchase_price ?? itemObj?.cost_price ?? itemObj?.default_rate ?? 0);
            const discountPercent = Number(poLine.discount_percent ?? poLine.discountPercent ?? 0);
            const taxPercent = Number(
              poLine.tax_rate ??
              poLine.taxRate ??
              poLine.tax_percent ??
              poLine.taxPercent ??
              poLine.hsnSac?.taxPercentage ??
              poLine.hsnSacCode?.taxPercentage ??
              itemObj?.hsnSacCode?.taxPercentage ??
              itemObj?.hsnSac?.taxPercentage ??
              0
            );

            const baseLine: PurchaseInvoiceLineForm = {
              invoiceHeaderId: "",
              poLineId: String(poLine.id || ""),
              grnLineId: "",
              itemId,
              uom_id: uomId,
              description: poLine.item?.item_name || itemObj?.item_name || poLine.remarks || "",
              batchNo: poLine.batchNo || "",
              quantity,
              unitPrice,
              discountPercent,
              discountAmount: 0,
              taxPercent,
              taxAmount: 0,
              lineTotal: 0,
              user_id: userId,
              remarks: poLine.remarks || "",
            };

            const calc = calculateLine(baseLine);
            return { ...baseLine, ...calc };
          });

          formik.setFieldValue("lineItems", mappedLines);
        }
      })
      .catch((err: any) => {
        console.error("Failed to fetch PO by ID:", err);
      });
  }, [formik.values.header.poHeaderId, formik.values.header.grnHeaderId, items, isEdit, userId]);

  // Sync state with URL search params (Single Bill View / PO / GRN link support)
  useEffect(() => {
    const urlPoId = searchParams.get("poId") || searchParams.get("po_id");
    const urlGrnId = searchParams.get("grnId") || searchParams.get("grn_id");
    const currentAction = searchParams.get("action");
    const currentId = searchParams.get("id");

    if (urlGrnId) {
      formik.setFieldValue("header.grnHeaderId", urlGrnId);
      setViewMode("form");
      setIsEdit(false);
    } else if (urlPoId) {
      formik.setFieldValue("header.poHeaderId", urlPoId);
      setViewMode("form");
      setIsEdit(false);
    } else if (currentAction === "create") {
      setViewMode("form");
      setIsEdit(false);
    } else if (currentId && currentAction === "view") {
      if (singleInvoiceData) {
        const inv = singleInvoiceData.result || singleInvoiceData.data || singleInvoiceData;
        if (inv) {
          setSelectedInvoice(inv);
          setViewMode("view");
        }
      } else {
        const inv = purchaseInvoices.find((i: any) => String(i.id) === String(currentId));
        if (inv) {
          setSelectedInvoice(inv);
          setViewMode("view");
        }
      }
    } else if (currentId && currentAction === "edit") {
      const inv = (singleInvoiceData?.result || singleInvoiceData?.data || singleInvoiceData) || purchaseInvoices.find((i: any) => String(i.id) === String(currentId));
      if (inv && (!isEdit || String(editId) !== String(currentId))) {
        handleEdit(currentId, inv);
      }
    }
  }, [searchParams, singleInvoiceData]);

  const updateLineItem = (index: number, key: keyof PurchaseInvoiceLineForm, value: any) => {
    const updated = [...formik.values.lineItems];
    let newValue = value;

    if (key === "quantity" && newValue !== "") {
      if (Number(newValue) < 0) newValue = 0;
      const uomObj = uoms.find((u: any) => String(u.id) === String(updated[index].uom_id));
      if (uomObj && !isDecimalAllowedForUOM(uomObj)) {
        if (typeof newValue === "string" && (newValue.includes(".") || newValue.includes(","))) {
          const intPart = newValue.split(".")[0].split(",")[0];
          newValue = intPart === "" ? "" : Math.floor(Number(intPart)) || 0;
          toast.error(`Quantity for UOM '${uomObj.uom_name}' cannot contain decimals.`);
        } else if (Number(newValue) % 1 !== 0) {
          newValue = Math.floor(Number(newValue)) || 0;
          toast.error(`Quantity for UOM '${uomObj.uom_name}' cannot contain decimals.`);
        }
      }
    }

    if (key === "unitPrice" && newValue !== "") {
      if (Number(newValue) < 0) newValue = 0;
    }

    if (key === "discountPercent" && newValue !== "") {
      if (Number(newValue) < 0) newValue = 0;
      if (Number(newValue) > 100) newValue = 100;
    }

    const nextLine = { ...updated[index], [key]: newValue };

    if (key === "itemId") {
      const foundItem = items.find((i: any) => String(i.id) === String(newValue));
      if (foundItem) {
        nextLine.unitPrice = Number(foundItem.purchase_price || foundItem.cost_price || foundItem.default_rate || 0);
        nextLine.uom_id = String(foundItem.uom_id || "");
        const itemTax = Number(
          foundItem.hsnSacCode?.taxPercentage ??
          foundItem.hsnSac?.taxPercentage ??
          foundItem.tax_rate ??
          foundItem.taxRate ??
          foundItem.taxPercentage ??
          0
        );
        nextLine.taxPercent = itemTax;

        if (!formik.values.header.location_id && foundItem.location_id) {
          formik.setFieldValue("header.location_id", String(foundItem.location_id));
        }
      }
    }

    const calc = calculateLine(nextLine);
    updated[index] = { ...nextLine, ...calc };
    formik.setFieldValue("lineItems", updated);
  };

  const addLine = () => {
    formik.setFieldValue("lineItems", [...formik.values.lineItems, makeLineItem(userId)]);
  };

  const removeLine = (index: number) => {
    if (formik.values.lineItems.length <= 1) return;
    const updated = [...formik.values.lineItems];
    updated.splice(index, 1);
    formik.setFieldValue("lineItems", updated);
  };

  const totals = useMemo(() => {
    return formik.values.lineItems.reduce(
      (acc, line) => {
        const calc = calculateLine(line);
        acc.gross += calc.quantity * calc.unitPrice;
        acc.discount += calc.discountAmount;
        acc.tax += calc.taxAmount;
        acc.total += calc.lineTotal;
        return acc;
      },
      { gross: 0, discount: 0, tax: 0, total: 0 }
    );
  }, [formik.values.lineItems]);

  const handleEdit = (id: number | string, preloadedInv?: any) => {
    if (!canUpdate("purchase_invoice")) {
      toast.error("No permission to edit Vendor Bill");
      return;
    }
    const inv = preloadedInv || purchaseInvoices.find((item: any) => String(item.id) === String(id)) || selectedInvoice;
    if (!inv) return;

    const header = inv.header || inv;
    const invStatus = String(header.status || "").toUpperCase();

    const hasPayments = purchasePayments.some((p: any) => {
      const pBillId = String(p.purchaseInvoiceHeaderId || p.purchase_invoice_header_id || p.invoiceId || p.invoice_id || p.billId || "");
      const lines = p.lines || p.purchasePaymentLines || p.details || [];
      const hasLineMatch = Array.isArray(lines) && lines.some((pl: any) => String(pl.purchaseInvoiceHeaderId || pl.invoiceId || pl.billId) === String(id));
      return (pBillId === String(id) || hasLineMatch) && String(p.status || "").toUpperCase() !== "CANCELLED";
    });
    const hasReturn = purchaseReturns.some((pr: any) => {
      const prBillId = String(pr.purchaseInvoiceHeaderId || pr.purchase_invoice_header_id || pr.purchase_invoice_id || pr.billId || pr.invoiceId || "");
      return prBillId === String(id) && String(pr.status || "").toUpperCase() !== "CANCELLED";
    });

    if (invStatus !== "DRAFT" || hasPayments || hasReturn) {
      toast.error("Cannot edit a Vendor Bill that is approved, paid, or has an authorized return.");
      return;
    }
    const lines = inv.lineItems || inv.purchaseInvoiceLines || [];
    const formatDate = (val: any) => (val && String(val).length >= 10 ? String(val).slice(0, 10) : "");

    const linkedGrn = grns.find((g: any) => String(g.id) === String(header.grnHeaderId || header.grn_header_id));
    const poId = header.poHeaderId || header.po_header_id || header.purchase_order_id || linkedGrn?.purchaseOrderId || linkedGrn?.po_header_id;
    const linkedPo = purchaseOrders.find((p: any) => String(p.id) === String(poId));
    const vendorObj = vendors.find((v: any) => String(v.id) === String(header.vendorId || header.vendor_id || linkedGrn?.vendor_id || linkedPo?.vendor_id));

    const firstLineItemWithLoc = lines.map((l: any) => items.find((itm: any) => String(itm.id) === String(l.itemId || l.item_id))).find((itm: any) => itm?.location_id || itm?.city_id);

    const resolvedLocationId = String(
      header.location_id ||
      header.city_id ||
      header.locationId ||
      header.cityId ||
      header.location?.id ||
      header.city?.id ||
      linkedPo?.city_id ||
      linkedPo?.location_id ||
      linkedPo?.cityId ||
      linkedPo?.locationId ||
      linkedGrn?.location_id ||
      linkedGrn?.city_id ||
      linkedGrn?.locationId ||
      linkedGrn?.warehouseId ||
      linkedGrn?.godownId ||
      firstLineItemWithLoc?.location_id ||
      firstLineItemWithLoc?.city_id ||
      vendorObj?.city_id ||
      vendorObj?.location_id ||
      (citiesList.length > 0 ? citiesList[0].id : "")
    );

    const resolvedSubsidiaryId = String(
      header.subsidiary_id ||
      header.subsidiaryId ||
      header.subsidiary?.id ||
      linkedPo?.subsidiary_id ||
      linkedPo?.subsidiaryId ||
      vendorObj?.primary_subsidiary_id ||
      vendorObj?.subsidiary_id ||
      (subsidiaries.length > 0 ? subsidiaries[0].id : "")
    );

    const resolvedClassId = String(
      header.class_id ||
      header.classId ||
      header.class?.id ||
      linkedPo?.class_id ||
      linkedPo?.classId ||
      ""
    );

    const resolvedDeptId = String(
      header.department_id ||
      header.departmentId ||
      header.department?.id ||
      linkedPo?.department_id ||
      linkedPo?.departmentId ||
      ""
    );

    formik.setValues({
      header: {
        invoiceNumber: header.invoiceNumber || header.invoice_number || "",
        invoiceType: header.invoiceType || header.invoice_type || "REGULAR",
        vendorInvoiceNumber: header.vendorInvoiceNumber || header.vendor_invoice_number || "",
        poHeaderId: String(header.poHeaderId || header.purchase_order_id || ""),
        grnHeaderId: String(header.grnHeaderId || header.grn_header_id || ""),
        vendorId: String(header.vendorId || header.vendor_id || ""),
        account_id: String(header.account_id || header.accountId || ""),
        terms_id: String(header.terms_id || header.termsId || ""),
        payment_method_id: String(header.payment_method_id || header.paymentMethodId || ""),
        invoiceDate: formatDate(header.invoiceDate || header.invoice_date) || new Date().toISOString().split("T")[0],
        dueDate: formatDate(header.dueDate || header.due_date) || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        currency_id: String(header.currency_id || header.currencyId || ""),
        currency: header.currency || "INR",
        subtotal: Number(header.subtotal || 0),
        taxAmount: Number(header.taxAmount || 0),
        discountAmount: Number(header.discountAmount || 0),
        totalAmount: Number(header.totalAmount || 0),
        paidAmount: Number(header.paidAmount || 0),
        balanceAmount: Number(header.balanceAmount || 0),
        subsidiary_id: resolvedSubsidiaryId,
        class_id: resolvedClassId,
        department_id: resolvedDeptId,
        location_id: resolvedLocationId,
        status: header.status || "DRAFT",
        remarks: header.remarks || "",
        user_id: header.user_id || userId,
      },
      lineItems: lines.length
        ? lines.map((l: any) => ({
          invoiceHeaderId: String(l.invoiceHeaderId || id),
          poLineId: String(l.poLineId || ""),
          grnLineId: String(l.grnLineId || ""),
          itemId: String(l.itemId || l.item_id || ""),
          uom_id: String(l.uom_id || l.uomId || ""),
          description: l.description || "",
          batchNo: l.batchNo || "",
          quantity: Number(l.quantity || 1),
          unitPrice: Number(l.unitPrice || l.unit_price || 0),
          discountPercent: Number(l.discountPercent || 0),
          discountAmount: Number(l.discountAmount || 0),
          taxPercent: Number(l.taxPercent || 0),
          taxAmount: Number(l.taxAmount || 0),
          lineTotal: Number(l.lineTotal || 0),
          user_id: l.user_id || userId,
          remarks: l.remarks || "",
        }))
        : [makeLineItem(userId)],
    });

    setEditId(id);
    setIsEdit(true);
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleView = (id: number | string) => {
    const inv = purchaseInvoices.find((item: any) => String(item.id) === String(id));
    if (inv) {
      setSelectedInvoice(inv);
    }
    setViewMode("view");
    setSearchParams({ id: String(id), action: "view" });
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await deletePurchaseInvoice(invoiceToDelete.id).unwrap();
      toast.success("Vendor Bill deleted successfully.");
      refetchInvoices();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete Vendor Bill.");
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  if (!canRead("purchase_invoice")) {
    return <div className="p-8 text-center text-red-600 font-bold">Access Denied: You do not have permission to view Vendor Bills.</div>;
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
    const activeHeader = isView ? selectedInvoice?.header || selectedInvoice || {} : formik.values.header;
    const activeLines = isView ? selectedInvoice?.lineItems || selectedInvoice?.purchaseInvoiceLines || [] : formik.values.lineItems;

    const vendorObj = vendors.find((v: any) => String(v.id) === String(activeHeader.vendorId || activeHeader.vendor_id));
    const vendorName = getVendorDisplayName(vendorObj);
    const subsidiaryName = activeHeader.subsidiary?.subsidiary_name || subsidiaries.find((s: any) => String(s.id) === String(activeHeader.subsidiary_id))?.subsidiary_name || "—";
    const classNameVal = activeHeader.class?.class_name || classesList.find((c: any) => String(c.id) === String(activeHeader.class_id))?.class_name || "—";
    const deptNameVal = activeHeader.department?.department_name || departmentsList.find((d: any) => String(d.id) === String(activeHeader.department_id))?.department_name || "—";
    const locNameVal = activeHeader.location?.city_name || citiesList.find((c: any) => String(c.id) === String(activeHeader.location_id))?.city_name || "—";
    const currencyObj = currencies.find((c: any) => String(c.id) === String(activeHeader.currency_id));

    const viewSubtotal = activeLines.reduce((acc: number, l: any) => acc + (Number(l.quantity || 0) * Number(l.unitPrice || l.unit_price || 0)), 0);
    const viewDiscountTotal = activeLines.reduce((acc: number, l: any) => acc + Number(l.discountAmount || l.discount_amount || ((Number(l.quantity || 0) * Number(l.unitPrice || l.unit_price || 0) * Number(l.discountPercent || l.discount_percent || 0)) / 100) || 0), 0);
    const viewTaxTotal = activeLines.reduce((acc: number, l: any) => acc + Number(l.taxAmount || l.tax_amount || 0), 0);
    const viewGrandTotal = activeLines.reduce((acc: number, l: any) => acc + Number(l.lineTotal || l.line_total || 0), 0);

    const billNoStr = activeHeader.invoiceNumber || activeHeader.invoice_number || `INV-${selectedInvoice?.id || "NEW"}`;
    const activeBillTotal = isView ? viewGrandTotal : totals.total;

    const isDraftBill = String(activeHeader.status || (selectedInvoice?.header || selectedInvoice)?.status || "").toUpperCase() === "DRAFT";

    const currentBillId = String(selectedInvoice?.id || selectedInvoice?.header?.id || activeHeader?.id || "");

    const totalPaidForBill = purchasePayments
      .filter((p: any) => {
        const pBillId = String(p.purchaseInvoiceHeaderId || p.purchase_invoice_header_id || p.invoiceId || p.invoice_id || p.billId || "");
        const lines = p.lines || p.purchasePaymentLines || p.details || [];
        const hasLineMatch = Array.isArray(lines) && lines.some((pl: any) => String(pl.purchaseInvoiceHeaderId || pl.invoiceId || pl.billId) === currentBillId);
        return (pBillId === currentBillId || hasLineMatch) && String(p.status || "").toUpperCase() !== "CANCELLED";
      })
      .reduce((sum: number, p: any) => sum + Number(p.paymentAmount || p.amount || p.totalAmount || 0), 0);

    const isPaymentCompleted =
      String(activeHeader.status || "").toUpperCase() === "PAID" ||
      (Number(activeHeader.balanceAmount || 0) <= 0 && Number(activeHeader.paidAmount || 0) > 0) ||
      (totalPaidForBill > 0 && totalPaidForBill >= activeBillTotal);

    const matchingReturn = purchaseReturns.find((pr: any) => {
      const prBillId = String(pr.purchaseInvoiceHeaderId || pr.purchase_invoice_header_id || pr.purchase_invoice_id || pr.billId || pr.invoiceId || "");
      return prBillId === currentBillId && String(pr.status || "").toUpperCase() !== "CANCELLED";
    });
    const isReturnCompleted = Boolean(matchingReturn);

    const matchingDebitNote = debitNotes.find((dn: any) => {
      const dnBillId = String(dn.purchaseInvoiceHeaderId || dn.purchase_invoice_header_id || dn.invoiceId || dn.billId || "");
      const dnReturnId = String(dn.purchase_return_id || dn.purchaseReturnId || dn.returnId || "");
      const isLinkedThroughReturn = matchingReturn && dnReturnId === String(matchingReturn.id);
      return (dnBillId === currentBillId || isLinkedThroughReturn) && String(dn.status || "").toUpperCase() !== "CANCELLED";
    });

    const isVendorCreditCompleted = Boolean(
      matchingDebitNote ||
      (matchingReturn && String(matchingReturn.status || "").toUpperCase() === "RETURNED")
    );

    if (isView && isSingleLoading && !selectedInvoice) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-600">Loading Vendor Bill #{urlId}...</span>
        </div>
      );
    }

    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Vendor Bill (Purchase Invoice)"
          subtitle={isView ? `Bill #${billNoStr} ${vendorName}` : isEdit ? `Edit Vendor Bill #${formik.values.header.invoiceNumber}` : "New Vendor Bill"}
          mode={isView ? "view" : "edit"}
          onSave={() => formik.handleSubmit()}
          onEdit={
            selectedInvoice &&
              String((selectedInvoice.header || selectedInvoice).status || "").toUpperCase() === "DRAFT" &&
              !isPaymentCompleted &&
              !isReturnCompleted &&
              !isVendorCreditCompleted &&
              canUpdate("purchase_invoice")
              ? () => handleEdit(selectedInvoice.id || selectedInvoice.header?.id)
              : undefined
          }
          onBack={() => { setViewMode("list"); setSearchParams({}); }}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
          customActions={
            isView && selectedInvoice && !isDraftBill && (!isPaymentCompleted || !isReturnCompleted || !isVendorCreditCompleted) ? (
              <div className="flex items-center space-x-1.5">
                {!isPaymentCompleted && (
                  <button
                    type="button"
                    onClick={() => navigate(`/purchase-payment?billId=${selectedInvoice.id || selectedInvoice.header?.id}`)}
                    className="bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <span>Make Payment</span>
                  </button>
                )}
                {!isReturnCompleted && (
                  <button
                    type="button"
                    onClick={() => navigate(`/purchase-return?billId=${selectedInvoice.id || selectedInvoice.header?.id}`)}
                    className="bg-red-700 hover:bg-red-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    Authorize Return
                  </button>
                )}
                {!isVendorCreditCompleted && (
                  <button
                    type="button"
                    onClick={() => navigate(`/debit-note?invoiceId=${selectedInvoice.id || selectedInvoice.header?.id}`)}
                    className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    Debit Note
                  </button>
                )}
              </div>
            ) : undefined
          }
          isSaving={isCreating || isUpdating}
          subTabs={[
            {
              id: "items",
              label: `Line Items (${activeLines.length})`,
              content: (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-slate-300 rounded-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#1d3e4c] text-white font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 border-r border-slate-400 w-10 text-center">#</th>
                          <th className="p-2 border-r border-slate-400 min-w-[180px]">ITEM *</th>
                          <th className="p-2 border-r border-slate-400 min-w-[160px]">DESCRIPTION</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">QTY *</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">UNIT PRICE (₹) *</th>
                          <th className="p-2 border-r border-slate-400 w-20 text-right">DISCOUNT %</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">DISCOUNT AMT (₹)</th>
                          <th className="p-2 border-r border-slate-400 w-20 text-right">TAX %</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">TAX AMT (₹)</th>
                          <th className="p-2 border-r border-slate-400 w-28 text-right">TOTAL (₹)</th>
                          {!isView && <th className="p-2 w-10 text-center">ACTION</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {activeLines.map((line: any, idx: number) => {
                          const itemObj = items.find((i: any) => String(i.id) === String(line.itemId || line.item_id));
                          const selectedUom = uoms.find((u: any) => String(u.id) === String(line.uom_id || itemObj?.uom_id));
                          const allowsDecimals = isDecimalAllowedForUOM(selectedUom);
                          const lineDesc = line.description || itemObj?.item_desc || itemObj?.description || itemObj?.item_name || "—";

                          if (isView) {
                            const lQty = Number(line.quantity || 0);
                            const lPrice = Number(line.unitPrice || line.unit_price || 0);
                            const lDiscount = Number(line.discountAmount || line.discount_amount || ((lQty * lPrice * Number(line.discountPercent || 0)) / 100));
                            const lTax = Number(line.taxAmount || line.tax_amount || 0);
                            const lTotal = Number(line.lineTotal || line.line_total || (lQty * lPrice - lDiscount + lTax));

                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                                <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{line.item?.item_name || itemObj?.item_name || `Item #${line.itemId}`}</td>
                                <td className="p-2 border-r border-slate-200 text-slate-700">{lineDesc}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold">{lQty}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono">₹{lPrice.toFixed(2)}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono">{line.discountPercent || 0}%</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700 bg-slate-50">₹{lDiscount.toFixed(2)}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono">{line.taxPercent || 0}%</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono">₹{lTax.toFixed(2)}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">₹{lTotal.toFixed(2)}</td>
                              </tr>
                            );
                          }

                          const isPoLinked = Boolean(formik.values.header.poHeaderId || formik.values.header.grnHeaderId || line.poLineId || line.grnLineId);

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                              <td className="p-1.5 border-r border-slate-200">
                                <select
                                  disabled={isPoLinked}
                                  value={line.itemId}
                                  onChange={(e) => updateLineItem(idx, "itemId", e.target.value)}
                                  className={`w-full h-7 px-2 text-xs border border-slate-300 rounded-xs font-medium text-slate-800 ${isPoLinked ? "bg-slate-100 cursor-not-allowed" : "bg-white focus:outline-none focus:border-sky-500"
                                    }`}
                                >
                                  <option value="">Select Item...</option>
                                  {items.map((i: any) => (
                                    <option key={i.id} value={i.id}>
                                      {i.item_code ? `${i.item_code} - ${i.item_name}` : i.item_name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={lineDesc}
                                  disabled={true}
                                  placeholder="Item Description"
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs bg-slate-100 text-slate-700 font-medium cursor-not-allowed"
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  disabled={isPoLinked}
                                  step={allowsDecimals ? "any" : "1"}
                                  min={allowsDecimals ? "0.01" : "1"}
                                  value={line.quantity}
                                  onKeyDown={(e) => {
                                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+" || (!allowsDecimals && (e.key === "." || e.key === ","))) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                                  className={`w-full h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono font-bold text-slate-800 ${isPoLinked ? "bg-slate-100 cursor-not-allowed" : "bg-white focus:outline-none focus:border-sky-500"
                                    }`}
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  disabled={true}
                                  step="any"
                                  min="0"
                                  value={line.unitPrice}
                                  onKeyDown={(e) => {
                                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono bg-slate-100 font-semibold text-slate-800 cursor-not-allowed"
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  max="100"
                                  value={line.discountPercent}
                                  onKeyDown={(e) => {
                                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => updateLineItem(idx, "discountPercent", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono focus:outline-none focus:border-sky-500"
                                />
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700 bg-slate-50">
                                ₹{Number(line.discountAmount || 0).toFixed(2)}
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <div className="flex items-center justify-end space-x-1 bg-slate-100 border border-slate-200 rounded-xs px-2 py-1 text-xs text-slate-700 select-none">
                                  <span className="font-mono font-semibold">{Number(line.taxPercent || 0)}%</span>
                                  <span className="text-[10px] text-amber-800 bg-amber-100 px-1 py-0.2 rounded-xs font-bold" title="Tax Rate is strictly locked from Purchase Order">🔒</span>
                                </div>
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700 bg-slate-50">
                                ₹{Number(line.taxAmount || 0).toFixed(2)}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900 bg-slate-50">
                                ₹{Number(line.lineTotal || 0).toFixed(2)}
                              </td>
                              <td className="p-1.5 text-center">
                                {formik.values.lineItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeLine(idx)}
                                    className="text-red-500 hover:text-red-700 cursor-pointer"
                                  >
                                    <Delete className="!w-4 !h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* {!isView && (
                    <button
                      type="button"
                      onClick={addLine}
                      className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xs transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Add className="!w-4 !h-4" />
                      <span>Add Bill Line</span>
                    </button>
                  )} */}
                </div>
              ),
            },
            {
              id: "billing",
              label: "Billing",
              content: (
                <RecordSection title="Billing Information" defaultOpen={true}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                    {/* Left Column: Terms, Incoterm, Vendor Select */}
                    <div className="space-y-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[11px] font-semibold text-[#475569] uppercase">TERMS</label>
                        {isView ? (
                          <span className="text-xs font-semibold text-slate-800">
                            {paymentTerms.find((pt: any) => String(pt.id) === String(activeHeader.terms_id))?.name || activeHeader.terms_id || "—"}
                          </span>
                        ) : (
                          <select
                            name="header.terms_id"
                            value={formik.values.header.terms_id || ""}
                            onChange={formik.handleChange}
                            className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                          >
                            <option value="">Select Terms...</option>
                            {paymentTerms.map((pt: any) => (
                              <option key={pt.id} value={pt.id}>
                                {pt.name || pt.term_name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[11px] font-semibold text-[#475569] uppercase">PAYMENT METHOD</label>
                        {isView ? (
                          <span className="text-xs font-semibold text-slate-800">
                            {paymentMethods.find((pm: any) => String(pm.id) === String(activeHeader.payment_method_id))?.payment_method_name || activeHeader.payment_method_id || "—"}
                          </span>
                        ) : (
                          <select
                            name="header.payment_method_id"
                            value={formik.values.header.payment_method_id || ""}
                            onChange={formik.handleChange}
                            className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                          >
                            <option value="">Select Payment Method...</option>
                            {paymentMethods.map((pm: any) => (
                              <option key={pm.id} value={pm.id}>
                                {pm.payment_method_name || pm.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[11px] font-semibold text-[#475569] uppercase">VENDOR SELECT</label>
                        {isView ? (
                          <span className="text-xs font-semibold text-slate-800">{vendorName}</span>
                        ) : (
                          <select
                            name="header.vendorId"
                            value={formik.values.header.vendorId || ""}
                            onChange={formik.handleChange}
                            className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                          >
                            <option value="">Select Vendor...</option>
                            {vendors.map((v: any) => (
                              <option key={v.id} value={v.id}>
                                {getVendorDisplayName(v)}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Vendor Address Box */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">VENDOR</label>
                      <div className="relative bg-slate-100 border border-slate-300 rounded-xs p-3 min-h-[110px] text-xs font-mono text-slate-700 whitespace-pre-wrap">
                        {vendorObj ? (
                          <>
                            <div className="font-bold text-slate-900 mb-1">{vendorName}</div>
                            {vendorObj.address && <div>{vendorObj.address}</div>}
                            {vendorObj.city?.city_name && <div>{vendorObj.city.city_name}</div>}
                            {vendorObj.phone && <div>Ph: {vendorObj.phone}</div>}
                            {vendorObj.email && <div>Email: {vendorObj.email}</div>}
                            {vendorObj.gstin && <div>GSTIN: {vendorObj.gstin}</div>}
                            {!vendorObj.address && !vendorObj.phone && !vendorObj.email && (
                              <div className="italic text-slate-500">Address information on file for {vendorName}</div>
                            )}
                          </>
                        ) : (
                          <span className="italic text-slate-400">Select a vendor to display billing address details...</span>
                        )}
                      </div>
                    </div>
                  </div>
                </RecordSection>
              ),
            },
            ...(isView && !isDraftBill
              ? [
                {
                  id: "gl_impact",
                  label: "GL Impact",
                  content: (() => {
                    const isGRNLinked = Boolean(activeHeader.grnHeaderId || activeHeader.grn_header_id || activeHeader.poHeaderId || activeHeader.po_header_id);
                    const rawSubtotal = Number(activeHeader.subtotal || activeHeader.sub_total || totals.gross || (activeBillTotal - (activeHeader.taxAmount || 0)));
                    const discountAmt = Number(activeHeader.discountAmount || activeHeader.discount_amount || totals.discount || 0);
                    const netSubtotal = Number(Math.max(0, rawSubtotal - discountAmt).toFixed(2));
                    const taxAmt = Number(activeHeader.taxAmount || activeHeader.tax_amount || totals.tax || 0);
                    const finalPayable = Number((netSubtotal + taxAmt).toFixed(2));

                    const entries: any[] = [
                      // 1. Combined DEBIT: Accrued Purchases / Inventory Asset (Net of Trade Discount)
                      {
                        accountCode: isGRNLinked ? "2200" : "1100",
                        accountName: isGRNLinked ? "Accrued Purchases (GRNI Clearing)" : "Purchase Expense / Inventory Asset",
                        debit: netSubtotal,
                        credit: 0,
                        memo: isGRNLinked ? `Clear GRN Accrual Liability - Bill #${billNoStr}` : `Purchase Inward Subtotal - Bill #${billNoStr}`,
                      },
                      // 2. Combined DEBIT: GST (Input Tax Credit)
                      ...(taxAmt > 0 ? [{
                        accountCode: "5010",
                        accountName: "Input GST",
                        debit: taxAmt,
                        credit: 0,
                        memo: `Input GST Credit - Bill #${billNoStr}`,
                      }] : []),
                      // 3. Combined CREDIT: Accounts Payable (Vendor Payables)
                      {
                        accountCode: "2100",
                        accountName: "Accounts Payable (Vendor Payables)",
                        debit: 0,
                        credit: finalPayable,
                        memo: `Vendor Payable Liability - ${vendorName}`,
                      },
                    ];

                    return <GLImpactSubtab documentNumber={billNoStr} entries={entries} />;
                  })(),
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
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">VENDOR BILL NUMBER</span>
                      <span className="text-xs font-bold text-slate-900">{activeHeader.vendorInvoiceNumber || activeHeader.vendor_invoice_number || activeHeader.invoiceNumber || activeHeader.invoice_number || `VB-${selectedInvoice?.id}`}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">CREATED FROM GRN</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {grns.find((g: any) => String(g.id) === String(activeHeader.grnHeaderId || activeHeader.grn_header_id))?.grnNo || activeHeader.grnHeaderId || "—"}
                      </span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">VENDOR</span>
                      <span className="text-xs font-bold text-sky-700">{vendorName}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">ACCOUNT</span>
                      <span className="text-xs font-bold text-slate-900">
                        {chartOfAccounts.find((a: any) => String(a.id) === String(activeHeader.account_id))?.account_name
                          ? `${chartOfAccounts.find((a: any) => String(a.id) === String(activeHeader.account_id))?.account_number || ""} ${chartOfAccounts.find((a: any) => String(a.id) === String(activeHeader.account_id))?.account_name}`
                          : "2001 Accounts Payable"}
                      </span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">BILL DATE</span>
                      <span className="text-xs text-slate-800">{activeHeader.invoiceDate || activeHeader.invoice_date ? new Date(activeHeader.invoiceDate || activeHeader.invoice_date).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">DUE DATE</span>
                      <span className="text-xs text-slate-800">{activeHeader.dueDate || activeHeader.due_date ? new Date(activeHeader.dueDate || activeHeader.due_date).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">CURRENCY</span>
                      <span className="text-xs font-bold text-slate-900">{formik.values.header.currency || currencyObj?.currency_code || "INR"}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">MEMO</span>
                      <span className="text-xs font-semibold text-slate-800">{activeHeader.remarks || "—"}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">STATUS</span>
                      <div>
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${String(activeHeader.status || "").toUpperCase() === "DRAFT"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          }`}>
                          {String(activeHeader.status || "").toUpperCase() === "POSTED" ? "APPROVED" : activeHeader.status || "DRAFT"}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-[#475569] uppercase">VENDOR BILL NUMBER</label>
                        {!isEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              const newNum = getNextBillNumber();
                              formik.setFieldValue("header.vendorInvoiceNumber", newNum);
                              formik.setFieldValue("header.invoiceNumber", newNum);
                            }}
                            className="text-[10px] text-sky-700 hover:text-sky-900 font-semibold cursor-pointer underline"
                          >
                            ↻ Generate New
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        name="header.vendorInvoiceNumber"
                        disabled={true}
                        placeholder="Auto-generated Bill Number..."
                        value={formik.values.header.vendorInvoiceNumber || formik.values.header.invoiceNumber || ""}
                        className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 font-mono text-slate-700 font-bold cursor-not-allowed"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        VENDOR <span className="text-amber-600">*</span>
                      </label>
                      <select
                        name="header.vendorId"
                        value={formik.values.header.vendorId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${formik.touched.header?.vendorId && formik.errors.header?.vendorId ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
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
                        ACCOUNT <span className="text-amber-600">*</span>
                      </label>
                      <select
                        name="header.account_id"
                        value={formik.values.header.account_id || ""}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-mono"
                      >
                        <option value="">Select Account...</option>
                        {chartOfAccounts.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.account_number ? `${acc.account_number} ` : ""}{acc.account_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        BILL DATE <span className="text-amber-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="header.invoiceDate"
                        value={formik.values.header.invoiceDate}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        DUE DATE <span className="text-amber-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="header.dueDate"
                        value={formik.values.header.dueDate}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">CURRENCY</label>
                      <select
                        name="header.currency_id"
                        disabled={true}
                        value={formik.values.header.currency_id || ""}
                        onChange={(e) => {
                          formik.handleChange(e);
                          const cObj = currencies.find((c: any) => String(c.id) === String(e.target.value));
                          if (cObj) {
                            formik.setFieldValue("header.currency", cObj.currency_code || cObj.currency_symbol || cObj.currency_name || "INR");
                          }
                        }}
                        className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 text-slate-700 cursor-not-allowed"
                      >
                        <option value="">Select Currency...</option>
                        {currencies.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.currency_code || c.code} - {c.currency_name || c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">STATUS</label>
                      <select
                        name="header.status"
                        value={formik.values.header.status || "DRAFT"}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-semibold uppercase text-slate-800"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="POSTED">POSTED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">MEMO</label>
                      <input
                        type="text"
                        name="header.remarks"
                        disabled={true}
                        placeholder="Auto-populated memo..."
                        value={formik.values.header.remarks || ""}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 text-slate-700 cursor-not-allowed"
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
                  Bill Summary
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-semibold text-slate-700">SUBTOTAL</span>
                    <span>₹{(isView ? viewSubtotal : totals.gross).toFixed(2)}</span>
                  </div>
                  {(isView ? viewDiscountTotal : totals.discount) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>DISCOUNT TOTAL</span>
                      <span>-₹{(isView ? viewDiscountTotal : totals.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-1.5">
                    <span className="font-semibold text-slate-700">TAX TOTAL</span>
                    <span>₹{(isView ? viewTaxTotal : totals.tax).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 text-sm">
                    <span>TOTAL</span>
                    <span>₹{(isView ? viewGrandTotal : totals.total).toFixed(2)}</span>
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
              </>
            ) : (
              <>
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">SUBSIDIARY</label>
                  <select
                    name="header.subsidiary_id"
                    value={formik.values.header.subsidiary_id || ""}
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
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">
                    LOCATION / CITY <span className="text-amber-600">*</span>
                  </label>
                  <select
                    name="header.location_id"
                    value={formik.values.header.location_id || ""}
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
              </>
            )}
          </RecordSection>
        </RecordPageLayout>
      </form>
    );
  }

  // ── RENDER 2: DATAGRID LIST VIEW MODE ──
  const filteredInvoices = purchaseInvoices.filter((inv: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const invNoStr = String(inv.invoiceNumber || inv.invoice_number || `INV-${inv.id}`).toLowerCase();
    const vName = getVendorDisplayName(inv.vendor).toLowerCase();
    return invNoStr.includes(term) || vName.includes(term);
  });

  return (
    <div className="flex flex-col space-y-3 p-4 bg-[#f3f6f9] min-h-screen font-sans text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-300">
        <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Vendor Bills (Purchase Invoices)</h1>
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
            <option>All Vendor Bills</option>
          </select>
          {canCreate("purchase_invoice") && (
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
              <span>+ New Vendor Bill</span>
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
                placeholder="Search Bill #, Vendor..."
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
              <th className="p-2 border-r border-slate-300 min-w-[130px]">BILL NUMBER</th>
              <th className="p-2 border-r border-slate-300 min-w-[180px]">VENDOR</th>
              <th className="p-2 border-r border-slate-300 w-28">BILL DATE</th>
              <th className="p-2 border-r border-slate-300 w-28">DUE DATE</th>
              <th className="p-2 w-28 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-medium italic">
                  {searchTerm ? "No matching vendor bills found." : "No Vendor Bills found. Click '+ New Vendor Bill' to create one."}
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv: any) => {
                const invNoStr = inv.invoiceNumber || inv.invoice_number || `INV-${inv.id}`;
                const vendorName = getVendorDisplayName(inv.vendor);

                const isDraft = String(inv.status || "").toUpperCase() === "DRAFT";
                const hasPayments = purchasePayments.some((p: any) => {
                  const pBillId = String(p.purchaseInvoiceHeaderId || p.purchase_invoice_header_id || p.invoiceId || p.invoice_id || p.billId || "");
                  const lines = p.lines || p.purchasePaymentLines || p.details || [];
                  const hasLineMatch = Array.isArray(lines) && lines.some((pl: any) => String(pl.purchaseInvoiceHeaderId || pl.invoiceId || pl.billId) === String(inv.id));
                  return (pBillId === String(inv.id) || hasLineMatch) && String(p.status || "").toUpperCase() !== "CANCELLED";
                });
                const hasReturn = purchaseReturns.some((pr: any) => {
                  const prBillId = String(pr.purchaseInvoiceHeaderId || pr.purchase_invoice_header_id || pr.purchase_invoice_id || pr.billId || pr.invoiceId || "");
                  return prBillId === String(inv.id) && String(pr.status || "").toUpperCase() !== "CANCELLED";
                });
                const isEditable = isDraft && !hasPayments && !hasReturn && canUpdate("purchase_invoice");

                return (
                  <tr key={inv.id} className="hover:bg-sky-50/50 transition-colors">
                    <td className="p-2 border-r border-slate-200 text-center font-semibold space-x-1">
                      {isEditable ? (
                        <button onClick={() => handleEdit(inv.id)} className="text-sky-700 hover:underline cursor-pointer">
                          Edit
                        </button>
                      ) : (
                        <span className="text-slate-300 select-none cursor-not-allowed" title="Cannot edit approved, paid, or returned bill">
                          Edit
                        </span>
                      )}
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleView(inv.id)} className="text-sky-700 hover:underline cursor-pointer">
                        View
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">{inv.id}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-sky-800">
                      <button onClick={() => handleView(inv.id)} className="hover:underline text-left cursor-pointer">
                        {invNoStr}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{vendorName}</td>
                    <td className="p-2 border-r border-slate-200 text-slate-700">
                      {inv.invoiceDate || inv.invoice_date ? new Date(inv.invoiceDate || inv.invoice_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-slate-700">
                      {inv.dueDate || inv.due_date ? new Date(inv.dueDate || inv.due_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                        String(inv.status || "").toUpperCase() === "DRAFT"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}>
                        {String(inv.status || "").toUpperCase() === "POSTED" ? "APPROVED" : inv.status || "DRAFT"}
                      </span>
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
        title="Delete Vendor Bill"
        message="Are you sure you want to delete this vendor bill? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default PurchaseInvoiceComp;
