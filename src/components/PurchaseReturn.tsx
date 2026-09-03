import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Add, Delete, Edit, Print, Search, List as ListIcon, KeyboardArrowDown, KeyboardArrowUp, AssignmentReturn, LocalShipping, ReceiptLong } from "@mui/icons-material";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import * as Yup from "yup";

import { useGetVendorsQuery } from "../RTK/services/vendorApi";
import { useGetChartOfAccountsQuery } from "../RTK/services/chartOfAccountApi";
import { useGetDebitNotesQuery } from "../RTK/services/debitNoteApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetClassesQuery } from "../RTK/services/classApi";
import { useGetDepartmentsQuery } from "../RTK/services/departmentApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";
import { useGetUOMsQuery } from "../RTK/services/uomApi";
import { useAppSelector } from "../Hooks/Reduxhook/hooks";
import { usePermissions } from "../Hooks/usePermissions";

import { useGetInventoryQuery } from "../RTK/services/inventoryApi";
import {
  useCreatePurchaseReturnMutation,
  useDeletePurchaseReturnMutation,
  useGetPurchaseReturnsQuery,
  useGetPurchaseReturnByIdQuery,
  useLazyGetPurchaseReturnByIdQuery,
  useUpdatePurchaseReturnMutation,
  useUpdatePurchaseReturnStatusMutation,
  useGetPurchaseInvoicesQuery,
  useLazyGetPurchaseInvoiceByIdQuery,
  useGetPurchasePaymentsQuery,
  useLazyGetPurchasePaymentByIdQuery,
  useGetPurchaseOrdersQuery,
  useLazyGetPurchaseOrderByIdQuery,
  useGetGRNsQuery,
  useLazyGetGRNByIdQuery,
} from "../RTK/services/purchaseApi";

import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";
import { GLImpactSubtab, type GLEntry } from "./Layout/GLImpactSubtab";
import ConfirmationDialog from "./Dialog/ConfirmationDialog";

interface PurchaseReturnLineForm {
  itemId: string;
  description?: string;
  location_id?: string;
  orderedQty?: number;
  onHand?: number;
  uom_id?: string;
  returnQty: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  lineTotal: number;
  remarks: string;
}

const emptyLineItem = (): PurchaseReturnLineForm => ({
  itemId: "",
  description: "",
  location_id: "",
  orderedQty: 0,
  onHand: 0,
  uom_id: "",
  returnQty: 1,
  unitPrice: 0,
  discountPercent: 0,
  discountAmount: 0,
  taxPercent: 0,
  taxAmount: 0,
  lineTotal: 0,
  remarks: "",
});

const isDecimalAllowedForUOM = (uomObj: any) => {
  if (!uomObj) return true;
  const name = String(uomObj.uom_name || uomObj.name || uomObj.uom_symbol || "").toUpperCase();
  const integerUOMs = ["EACH", "PCS", "PIECE", "PIECES", "NOS", "NUMBER", "NUMBERS", "BOX", "BOXES", "UNIT", "UNITS", "SET", "SETS", "PACK", "PACKS", "BAG", "BAGS", "BOTTLE", "BOTTLES", "CAN", "CANS", "DRUM", "DRUMS", "CARTON", "CARTONS"];
  return !integerUOMs.some((u) => name.includes(u));
};

export default function PurchaseReturnComp() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const userId = currentUser?.id ?? "";

  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [selectedReturnId, setSelectedReturnId] = useState<number | string | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const pendingActionRef = useRef<"fulfill" | "credit" | null>(null);

  const urlId = searchParams.get("id");
  const urlAction = searchParams.get("action");
  const effectiveReturnId = selectedReturnId || (urlId && (urlAction === "view" || urlAction === "edit") ? urlId : null);

  // Eager Queries
  const { data: purchaseReturnsData, refetch: refetchReturns } = useGetPurchaseReturnsQuery({ page: 1, limit: 50 });
  const { data: debitNotesData } = useGetDebitNotesQuery({ page: 1, limit: 500 });
  const { data: singleReturnData, isLoading: isLoadingSingleReturn } = useGetPurchaseReturnByIdQuery(effectiveReturnId!, { skip: !effectiveReturnId });
  const { data: vendorsData } = useGetVendorsQuery({ page: 1, option: true });
  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 1000 });
  const { data: subsidiariesData } = useGetSubsidiariesQuery(undefined);
  const { data: classesData } = useGetClassesQuery(undefined);
  const { data: departmentsData } = useGetDepartmentsQuery(undefined);
  const { data: citiesData } = useGetCitiesQuery(undefined);
  const { data: currenciesData } = useGetCurrenciesQuery(undefined);
  const { data: uomsData } = useGetUOMsQuery(undefined);
  const { data: chartOfAccountsData } = useGetChartOfAccountsQuery(undefined);
  const { data: purchaseInvoicesData } = useGetPurchaseInvoicesQuery(undefined);
  const { data: purchasePaymentsData } = useGetPurchasePaymentsQuery(undefined);
  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery(undefined);
  const { data: grnsData } = useGetGRNsQuery({ page: 1, limit: 100 });
  const { data: inventoryData } = useGetInventoryQuery({ page: 1, limit: 1000 });

  const grnsList = useMemo(() => {
    return Array.isArray(grnsData?.result) ? grnsData.result : Array.isArray(grnsData?.data) ? grnsData.data : Array.isArray(grnsData) ? grnsData : [];
  }, [grnsData]);

  const inventoryItems = useMemo(() => {
    return Array.isArray(inventoryData?.result?.inventory)
      ? inventoryData.result.inventory
      : Array.isArray(inventoryData?.result?.items)
        ? inventoryData.result.items
        : Array.isArray(inventoryData?.result)
          ? inventoryData.result
          : Array.isArray(inventoryData?.data)
            ? inventoryData.data
            : Array.isArray(inventoryData)
              ? inventoryData
              : [];
  }, [inventoryData]);

  const onHandMap = useMemo(() => {
    const map: Record<string, number> = {};
    inventoryItems.forEach((inv: any) => {
      const itemId = String(inv.item_id || inv.itemId || inv.item?.id || "");
      if (itemId) {
        map[itemId] = (map[itemId] || 0) + Number(inv.qty ?? inv.quantity ?? 0);
      }
    });
    return map;
  }, [inventoryItems]);

  const itemLocationMap = useMemo(() => {
    const map: Record<string, string> = {};
    inventoryItems.forEach((inv: any) => {
      const itemId = String(inv.item_id || inv.itemId || inv.item?.id || "");
      const locId = String(inv.location_id || inv.locationId || inv.location?.id || inv.warehouse_id || inv.city_id || "");
      if (itemId && locId && !map[itemId]) {
        map[itemId] = locId;
      }
    });
    return map;
  }, [inventoryItems]);

  const [createPurchaseReturn, { isLoading: isCreating }] = useCreatePurchaseReturnMutation();
  const [updatePurchaseReturn, { isLoading: isUpdating }] = useUpdatePurchaseReturnMutation();
  const [deletePurchaseReturn] = useDeletePurchaseReturnMutation();
  const [updatePurchaseReturnStatus] = useUpdatePurchaseReturnStatusMutation();
  const [triggerGetPurchaseReturnById] = useLazyGetPurchaseReturnByIdQuery();
  const [triggerGetPaymentById] = useLazyGetPurchasePaymentByIdQuery();
  const [triggerGetInvoiceById] = useLazyGetPurchaseInvoiceByIdQuery();
  const [triggerGetGRNById] = useLazyGetGRNByIdQuery();
  const [triggerGetPOById] = useLazyGetPurchaseOrderByIdQuery();

  const handleAuthorizeReturn = async (id: number | string) => {
    try {
      const res = await updatePurchaseReturnStatus({ id, body: { status: "AUTHORIZED" } }).unwrap();
      toast.success("Purchase Return Authorization has been AUTHORIZED.");
      refetchReturns();
      const updated = res?.result || res?.data || res;
      if (updated) {
        setSelectedReturn(updated);
      } else if (selectedReturn) {
        setSelectedReturn({
          ...selectedReturn,
          header: { ...(selectedReturn.header || selectedReturn), status: "AUTHORIZED" },
          status: "AUTHORIZED",
        });
      }
      setSelectedReturnId(id);
      setViewMode("view");
      setIsEdit(false);
      setSearchParams({ action: "view", id: String(id) });
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to authorize Purchase Return.");
    }
  };

  const purchaseReturns = useMemo(() => (Array.isArray(purchaseReturnsData?.result) ? purchaseReturnsData.result : Array.isArray(purchaseReturnsData?.data) ? purchaseReturnsData.data : []), [purchaseReturnsData]);
  const purchaseInvoices = useMemo(() => (Array.isArray(purchaseInvoicesData?.result) ? purchaseInvoicesData.result : Array.isArray(purchaseInvoicesData?.data) ? purchaseInvoicesData.data : []), [purchaseInvoicesData]);
  const invoices = purchaseInvoices;
  const purchasePayments = useMemo(() => (Array.isArray(purchasePaymentsData?.result) ? purchasePaymentsData.result : Array.isArray(purchasePaymentsData?.data) ? purchasePaymentsData.data : []), [purchasePaymentsData]);
  const purchaseOrders = useMemo(() => (Array.isArray(purchaseOrdersData?.result) ? purchaseOrdersData.result : Array.isArray(purchaseOrdersData?.data) ? purchaseOrdersData.data : []), [purchaseOrdersData]);
  const vendors = useMemo(() => (Array.isArray(vendorsData?.result) ? vendorsData.result : Array.isArray(vendorsData?.data) ? vendorsData.data : []), [vendorsData]);
  const items = useMemo(() => (Array.isArray(itemsData?.result) ? itemsData.result : Array.isArray(itemsData?.data) ? itemsData.data : []), [itemsData]);
  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : [];
  const classesList = Array.isArray(classesData?.result) ? classesData.result : [];
  const departmentsList = Array.isArray(departmentsData?.result) ? departmentsData.result : [];
  const citiesList = Array.isArray(citiesData?.result) ? citiesData.result : [];
  const currencies = Array.isArray(currenciesData?.result) ? currenciesData.result : [];
  const uoms = Array.isArray(uomsData?.result) ? uomsData.result : [];
  const accounts = useMemo(() => (Array.isArray(chartOfAccountsData?.result) ? chartOfAccountsData.result : []), [chartOfAccountsData]);
  const debitNotes = useMemo(() => (Array.isArray(debitNotesData?.result?.rows) ? debitNotesData.result.rows : Array.isArray(debitNotesData?.result) ? debitNotesData.result : Array.isArray(debitNotesData?.data) ? debitNotesData.data : []), [debitNotesData]);

  const formik = useFormik({
    initialValues: {
      header: {
        returnNumber: "",
        vendorId: "",
        purchaseInvoiceHeaderId: "",
        purchaseOrderId: "",
        purchasePaymentHeaderId: "",
        returnDate: new Date().toISOString().slice(0, 10),
        subsidiary_id: "",
        class_id: "",
        department_id: "",
        location_id: "",
        currency_id: "",
        reason: "",
        remarks: "",
        status: "DRAFT",
        user_id: userId,
      },
      lineItems: [emptyLineItem()],
    },
    validationSchema: Yup.object().shape({
      header: Yup.object({
        vendorId: Yup.string().required("Vendor is required"),
        returnDate: Yup.string().required("Return date is required"),
      }),
      lineItems: Yup.array().of(
        Yup.object({
          itemId: Yup.string().required("Item is required"),
          returnQty: Yup.number().positive("Qty must be > 0").required("Qty is required"),
        })
      ).min(1, "At least one item is required"),
    }),
    onSubmit: async (values) => {
      try {
        for (let i = 0; i < values.lineItems.length; i++) {
          const line = values.lineItems[i];
          const rQty = Number(line.returnQty) || 0;
          const maxQty = Number(line.orderedQty) || 0;

          if (maxQty > 0 && rQty > maxQty) {
            toast.error(`Line ${i + 1}: Return Quantity (${rQty}) cannot exceed Ordered Quantity (${maxQty}).`);
            return;
          }

          const uomObj = uoms.find((u: any) => String(u.id) === String(line.uom_id));
          if (uomObj && !isDecimalAllowedForUOM(uomObj) && rQty % 1 !== 0) {
            toast.error(`Return Quantity for line ${i + 1} (${uomObj.uom_name || uomObj.name || "unit"}) must be a whole number.`);
            return;
          }
        }

        const payload = {
          header: {
            ...values.header,
            user_id: userId,
          },
          lineItems: values.lineItems.map((line) => ({
            ...line,
            lineTotal: Number((Number(line.returnQty || 0) * Number(line.unitPrice || 0)).toFixed(2)),
          })),
        };

        let savedId = editId;
        if (isEdit && editId) {
          await updatePurchaseReturn({ id: editId, body: payload }).unwrap();
          toast.success("Purchase Return updated successfully.");
        } else {
          const res = await createPurchaseReturn(payload).unwrap();
          toast.success("Purchase Return recorded successfully.");
          savedId = res?.result?.header?.id || res?.data?.header?.id || res?.result?.id || res?.id;
        }
        refetchReturns();

        const action = pendingActionRef.current;
        pendingActionRef.current = null;

        if (action === "fulfill" && savedId) {
          navigate(`/return-fulfillment?returnId=${savedId}`);
        } else if (action === "credit" && savedId) {
          navigate(`/debit-note?returnId=${savedId}`);
        } else if (savedId) {
          setSelectedReturnId(savedId);
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

  useEffect(() => {
    const urlAction = searchParams.get("action");
    const urlId = searchParams.get("id");
    const grnIdParam = searchParams.get("grnId") || searchParams.get("grn_id");
    const billIdParam = searchParams.get("billId");
    const paymentIdParam = searchParams.get("paymentId");
    const poIdParam = searchParams.get("poId");

    if (grnIdParam) {
      triggerGetGRNById(grnIdParam)
        .unwrap()
        .then(async (res: any) => {
          const grn = res?.result || res?.data || res;
          if (grn) {
            const header = grn.header ?? grn;
            const grnLines = grn.grnLines || grn.lineItems || grn.lines || grn.details || [];
            const vId = String(header.vendorId || header.vendor_id || "");
            const vObj = vendors.find((v: any) => String(v.id) === vId);

            const poId = header.purchaseOrderId || header.purchase_order_id || header.po_header_id;
            let linkedPo: any = null;
            if (poId) {
              try {
                const poRes = await triggerGetPOById(poId).unwrap();
                linkedPo = poRes?.result || poRes?.data || poRes;
              } catch (e) { }
            }
            if (!linkedPo && vId) {
              linkedPo = purchaseOrders.find((p: any) => String(p.vendorId || p.vendor_id || p.header?.vendorId) === vId);
            }
            const poH = linkedPo?.header ?? linkedPo;

            const subId = String(poH?.subsidiary_id || poH?.subsidiaryId || header.subsidiary_id || header.subsidiaryId || vObj?.primary_subsidiary_id || vObj?.subsidiary_id || subsidiaries[0]?.id || "");
            const classId = String(poH?.class_id || poH?.classId || header.class_id || header.classId || vObj?.class_id || classesList[0]?.id || "");
            const deptId = String(poH?.department_id || poH?.departmentId || header.department_id || header.departmentId || vObj?.department_id || departmentsList[0]?.id || "");
            const primaryAddr = vObj?.addressBook?.find((a: any) => a.default_billing) || vObj?.addressBook?.[0];
            const locId = String(poH?.location_id || poH?.city_id || poH?.cityId || header.location_id || header.city_id || primaryAddr?.city_id || vObj?.city_id || citiesList[0]?.id || "");
            const currId = String(poH?.currency_id || poH?.currencyId || header.currency_id || header.currencyId || vObj?.currency_id || currencies[0]?.id || "");

            const mappedLines = grnLines.map((l: any) => {
              const itemObj = items.find((i: any) => String(i.id) === String(l.itemId || l.item_id));
              const qty = Number(l.acceptedQty ?? l.accepted_quantity ?? l.receivedQty ?? l.received_quantity ?? l.quantity ?? 1);
              const price = Number(l.unitPrice || l.unit_price || l.rate || itemObj?.purchase_price || itemObj?.cost_price || 0);
              const itemLoc = itemLocationMap[String(l.itemId || l.item_id)] || l.locationId || l.location_id || locId;
              const lTot = qty * price;
              return {
                itemId: String(l.itemId || l.item_id || ""),
                description: String(l.description || itemObj?.item_desc || itemObj?.description || itemObj?.item_name || ""),
                location_id: String(itemLoc),
                orderedQty: qty,
                onHand: onHandMap[String(l.itemId || l.item_id)] ?? 0,
                uom_id: String(l.uom_id || itemObj?.uom_id || ""),
                returnQty: qty,
                unitPrice: price,
                discountPercent: 0,
                discountAmount: 0,
                taxPercent: 0,
                taxAmount: 0,
                lineTotal: Number(lTot.toFixed(2)),
                remarks: l.remarks || `Return from GRN #${header.grnNumber || header.grnNo || grn.id}`,
              };
            });

            formik.setValues({
              header: {
                returnNumber: `RET-GRN-${grn.id}`,
                vendorId: vId,
                purchaseInvoiceHeaderId: "",
                purchaseOrderId: poId ? String(poId) : (header.purchaseOrderId ? String(header.purchaseOrderId) : ""),
                purchasePaymentHeaderId: "",
                returnDate: new Date().toISOString().slice(0, 10),
                subsidiary_id: subId,
                class_id: classId,
                department_id: deptId,
                location_id: locId,
                currency_id: currId,
                reason: `Return against GRN #${header.grnNumber || header.grnNo || grn.id}`,
                remarks: `Auto-populated from GRN #${header.grnNumber || header.grnNo || grn.id}`,
                status: "DRAFT",
                user_id: userId,
              },
              lineItems: mappedLines.length > 0 ? mappedLines : [emptyLineItem()],
            });
            setViewMode("form");
            setIsEdit(false);
          }
        })
        .catch((err: any) => {
          console.error("Failed to fetch GRN by ID for return:", err);
        });
    } else if (billIdParam) {
      triggerGetInvoiceById(billIdParam)
        .unwrap()
        .then(async (res: any) => {
          const inv = res?.result || res?.data || res;
          if (inv) {
            const header = inv.header ?? inv;
            const invLines = inv.purchaseInvoiceLines || inv.lines || inv.details || [];
            const vId = String(header.vendorId || header.vendor_id || "");
            const vObj = vendors.find((v: any) => String(v.id) === vId);

            const poId = header.purchaseOrderHeaderId || header.poHeaderId || header.po_header_id || header.purchaseOrderId;
            let linkedPo: any = null;
            if (poId) {
              try {
                const poRes = await triggerGetPOById(poId).unwrap();
                linkedPo = poRes?.result || poRes?.data || poRes;
              } catch (e) { }
            }
            if (!linkedPo && vId) {
              linkedPo = purchaseOrders.find((p: any) => String(p.vendorId || p.vendor_id || p.header?.vendorId) === vId);
            }
            const poH = linkedPo?.header ?? linkedPo;

            const subId = String(poH?.subsidiary_id || poH?.subsidiaryId || header.subsidiary_id || header.subsidiaryId || vObj?.primary_subsidiary_id || vObj?.subsidiary_id || subsidiaries[0]?.id || "");
            const classId = String(poH?.class_id || poH?.classId || header.class_id || header.classId || vObj?.class_id || classesList[0]?.id || "");
            const deptId = String(poH?.department_id || poH?.departmentId || header.department_id || header.departmentId || vObj?.department_id || departmentsList[0]?.id || "");
            const primaryAddr = vObj?.addressBook?.find((a: any) => a.default_billing) || vObj?.addressBook?.[0];
            const locId = String(poH?.location_id || poH?.city_id || poH?.cityId || header.location_id || header.city_id || primaryAddr?.city_id || vObj?.city_id || citiesList[0]?.id || "");
            const currId = String(poH?.currency_id || poH?.currencyId || header.currency_id || header.currencyId || vObj?.currency_id || currencies[0]?.id || "");

            const mappedLines = invLines.map((l: any) => {
              const itemObj = items.find((i: any) => String(i.id) === String(l.itemId || l.item_id));
              const qty = Number(l.quantity || l.qty || 1);
              const price = Number(l.unitPrice || l.unit_price || l.rate || 0);
              const dPct = Number(l.discountPercent || l.discount_percent || 0);
              const dAmt = Number(l.discountAmount || l.discount_amount || 0);
              const tPct = Number(l.taxPercent || l.tax_percent || 0);
              const tAmt = Number(l.taxAmount || l.tax_amount || 0);
              const lTot = Number(l.lineTotal || l.line_total || ((qty * price) - dAmt + tAmt));
              const itemLoc = itemLocationMap[String(l.itemId || l.item_id)] || l.location_id || l.city_id || locId || citiesList[0]?.id || "";

              return {
                itemId: String(l.itemId || l.item_id || ""),
                description: String(l.description || itemObj?.item_desc || itemObj?.description || itemObj?.item_name || ""),
                location_id: String(itemLoc),
                orderedQty: qty,
                onHand: onHandMap[String(l.itemId || l.item_id)] ?? 0,
                uom_id: String(l.uom_id || itemObj?.uom_id || ""),
                returnQty: qty,
                unitPrice: price,
                discountPercent: dPct,
                discountAmount: dAmt,
                taxPercent: tPct,
                taxAmount: tAmt,
                lineTotal: Number(lTot.toFixed(2)),
                remarks: l.remarks || `Return from Bill #${header.invoiceNumber || header.vendorInvoiceNumber || inv.id}`,
              };
            });

            formik.setValues({
              header: {
                returnNumber: `RET-BILL-${inv.id}`,
                vendorId: vId,
                purchaseInvoiceHeaderId: String(inv.id),
                purchaseOrderId: poId ? String(poId) : (poH?.id ? String(poH.id) : ""),
                purchasePaymentHeaderId: "",
                returnDate: new Date().toISOString().slice(0, 10),
                subsidiary_id: subId,
                class_id: classId,
                department_id: deptId,
                location_id: locId,
                currency_id: currId,
                reason: `Return against Purchase Bill #${header.invoiceNumber || inv.id}`,
                remarks: `Auto-populated from Purchase Bill #${header.invoiceNumber || inv.id}`,
                status: "DRAFT",
                user_id: userId,
              },
              lineItems: mappedLines.length > 0 ? mappedLines : [emptyLineItem()],
            });
            setViewMode("form");
            setIsEdit(false);
          }
        })
        .catch((err: any) => {
          console.error("Failed to fetch Invoice by ID for return:", err);
        });
    } else if (paymentIdParam) {
      triggerGetPaymentById(paymentIdParam)
        .unwrap()
        .then(async (payRes: any) => {
          const pay = payRes?.result || payRes?.data || payRes;
          if (pay) {
            const header = pay.header ?? pay;
            const vId = String(header.vendorId || header.vendor_id || header.vendor?.id || "");
            const invId = header.purchaseInvoiceHeaderId || header.purchase_invoice_header_id;
            let invLines: any[] = [];
            if (invId) {
              try {
                const invRes = await triggerGetInvoiceById(invId).unwrap();
                const invObj = invRes?.result || invRes?.data || invRes;
                invLines = invObj?.purchaseInvoiceLines || invObj?.lines || invObj?.details || [];
              } catch (e) {
                // fallback
              }
            }

            const mappedLines = invLines.map((l: any) => {
              const itemObj = items.find((i: any) => String(i.id) === String(l.itemId || l.item_id));
              const qty = Number(l.quantity || l.qty || 1);
              const price = Number(l.unitPrice || l.unit_price || l.rate || 0);
              const dPct = Number(l.discountPercent || l.discount_percent || 0);
              const dAmt = Number(l.discountAmount || l.discount_amount || 0);
              const tPct = Number(l.taxPercent || l.tax_percent || 0);
              const tAmt = Number(l.taxAmount || l.tax_amount || 0);
              const lTot = Number(l.lineTotal || l.line_total || ((qty * price) - dAmt + tAmt));
              const itemLoc = itemLocationMap[String(l.itemId || l.item_id)] || l.location_id || l.city_id || header.location_id || citiesList[0]?.id || "";

              return {
                itemId: String(l.itemId || l.item_id || ""),
                description: String(l.description || itemObj?.item_desc || itemObj?.description || itemObj?.item_name || ""),
                location_id: String(itemLoc),
                orderedQty: qty,
                onHand: onHandMap[String(l.itemId || l.item_id)] ?? 0,
                uom_id: String(l.uom_id || itemObj?.uom_id || ""),
                returnQty: qty,
                unitPrice: price,
                discountPercent: dPct,
                discountAmount: dAmt,
                taxPercent: tPct,
                taxAmount: tAmt,
                lineTotal: Number(lTot.toFixed(2)),
                remarks: l.remarks || `Return from Payment #${header.paymentNumber || pay.id}`,
              };
            });

            const vObj = vendors.find((v: any) => String(v.id) === vId);
            let linkedPoForPay: any = null;
            if (invId) {
              try {
                const invRes = await triggerGetInvoiceById(invId).unwrap();
                const linkedInv = invRes?.result || invRes?.data || invRes;
                const invH = linkedInv?.header ?? linkedInv;
                const poId = invH?.purchaseOrderHeaderId || invH?.poHeaderId || invH?.po_header_id || invH?.purchaseOrderId;
                if (poId) {
                  try {
                    const poRes = await triggerGetPOById(poId).unwrap();
                    linkedPoForPay = poRes?.result || poRes?.data || poRes;
                  } catch (e) { }
                }
              } catch (e) { }
            }
            if (!linkedPoForPay && vId) {
              linkedPoForPay = purchaseOrders.find((p: any) => String(p.vendorId || p.vendor_id || p.header?.vendorId) === vId);
            }
            const poH = linkedPoForPay?.header ?? linkedPoForPay;

            const subId = String(poH?.subsidiary_id || poH?.subsidiaryId || header.subsidiary_id || vObj?.primary_subsidiary_id || vObj?.subsidiary_id || subsidiaries[0]?.id || "");
            const classId = String(poH?.class_id || poH?.classId || header.class_id || vObj?.class_id || classesList[0]?.id || "");
            const deptId = String(poH?.department_id || poH?.departmentId || header.department_id || vObj?.department_id || departmentsList[0]?.id || "");
            const primaryAddr = vObj?.addressBook?.find((a: any) => a.default_billing) || vObj?.addressBook?.[0];
            const locId = String(poH?.location_id || poH?.city_id || poH?.cityId || header.location_id || header.city_id || primaryAddr?.city_id || vObj?.city_id || citiesList[0]?.id || "");
            const currId = String(poH?.currency_id || poH?.currencyId || vObj?.currency_id || currencies.find((c: any) => (c.currency_code || c.code || "").toUpperCase() === (header.currency || "INR").toUpperCase())?.id || currencies[0]?.id || "");

            formik.setValues({
              header: {
                returnNumber: `RET-PAY-${pay.id}`,
                vendorId: vId,
                purchasePaymentHeaderId: String(pay.id),
                purchaseInvoiceHeaderId: invId ? String(invId) : "",
                purchaseOrderId: poH?.id ? String(poH.id) : (linkedPoForPay?.id ? String(linkedPoForPay.id) : ""),
                returnDate: new Date().toISOString().slice(0, 10),
                subsidiary_id: subId,
                class_id: classId,
                department_id: deptId,
                location_id: locId,
                currency_id: currId,
                reason: `Return against Purchase Payment #${header.paymentNumber || pay.id}`,
                remarks: `Auto-populated from Purchase Payment #${header.paymentNumber || pay.id}`,
                status: "DRAFT",
                user_id: userId,
              },
              lineItems: mappedLines.length > 0 ? mappedLines : [emptyLineItem()],
            });
            setViewMode("form");
            setIsEdit(false);
          }
        })
        .catch((err: any) => {
          console.error("Failed to fetch Payment by ID for return:", err);
        });
    } else if (poIdParam) {
      triggerGetPOById(poIdParam)
        .unwrap()
        .then((poRes: any) => {
          const po = poRes?.result || poRes?.data || poRes;
          if (po) {
            const header = po.header ?? po;
            const poLines = po.purchaseOrderLines || po.lines || po.details || [];
            const vId = String(header.vendorId || header.vendor_id || "");

            const mappedLines = poLines.map((l: any) => {
              const itemObj = items.find((i: any) => String(i.id) === String(l.itemId || l.item_id));
              const qty = Number(l.quantity || l.qty || 1);
              const price = Number(l.unitPrice || l.unit_price || l.rate || 0);
              const dPct = Number(l.discountPercent || l.discount_percent || 0);
              const dAmt = Number(l.discountAmount || l.discount_amount || 0);
              const tPct = Number(l.taxPercent || l.tax_percent || 0);
              const tAmt = Number(l.taxAmount || l.tax_amount || 0);
              const lTot = Number(l.lineTotal || l.line_total || ((qty * price) - dAmt + tAmt));
              const itemLoc = itemLocationMap[String(l.itemId || l.item_id)] || l.location_id || l.city_id || header.location_id || header.city_id || citiesList[0]?.id || "";

              return {
                itemId: String(l.itemId || l.item_id || ""),
                description: String(l.description || itemObj?.item_desc || itemObj?.description || itemObj?.item_name || ""),
                location_id: String(itemLoc),
                orderedQty: qty,
                onHand: onHandMap[String(l.itemId || l.item_id)] ?? 0,
                uom_id: String(l.uom_id || itemObj?.uom_id || ""),
                returnQty: qty,
                unitPrice: price,
                discountPercent: dPct,
                discountAmount: dAmt,
                taxPercent: tPct,
                taxAmount: tAmt,
                lineTotal: Number(lTot.toFixed(2)),
                remarks: l.remarks || `Return from PO #${header.poNumber || po.id}`,
              };
            });

            const vObj = vendors.find((v: any) => String(v.id) === vId);
            const poH = header;
            const subId = String(poH.subsidiary_id || poH.subsidiaryId || vObj?.primary_subsidiary_id || vObj?.subsidiary_id || subsidiaries[0]?.id || "");
            const classId = String(poH.class_id || poH.classId || vObj?.class_id || classesList[0]?.id || "");
            const deptId = String(poH.department_id || poH.departmentId || vObj?.department_id || departmentsList[0]?.id || "");
            const primaryAddr = vObj?.addressBook?.find((a: any) => a.default_billing) || vObj?.addressBook?.[0];
            const locId = String(poH.location_id || poH.city_id || poH.cityId || primaryAddr?.city_id || vObj?.city_id || citiesList[0]?.id || "");
            const currId = String(poH.currency_id || poH.currencyId || vObj?.currency_id || currencies[0]?.id || "");

            formik.setValues({
              header: {
                returnNumber: `RET-PO-${po.id}`,
                vendorId: vId,
                purchaseInvoiceHeaderId: "",
                purchaseOrderId: String(po.id),
                purchasePaymentHeaderId: "",
                returnDate: new Date().toISOString().slice(0, 10),
                subsidiary_id: subId,
                class_id: classId,
                department_id: deptId,
                location_id: locId,
                currency_id: currId,
                reason: `Return against Purchase Order #${header.poNumber || po.id}`,
                remarks: `Auto-populated from Purchase Order #${header.poNumber || po.id}`,
                status: "DRAFT",
                user_id: userId,
              },
              lineItems: mappedLines.length > 0 ? mappedLines : [emptyLineItem()],
            });
            setViewMode("form");
            setIsEdit(false);
          }
        })
        .catch((err: any) => {
          console.error("Failed to fetch PO by ID for return:", err);
        });
    } else if (urlAction === "create") {
      setViewMode("form");
      setIsEdit(false);
    } else if (urlId && urlAction === "view") {
      triggerGetPurchaseReturnById(urlId)
        .unwrap()
        .then((res: any) => {
          const ret = res?.result || res?.data || res;
          if (ret) {
            setSelectedReturn(ret);
            setViewMode("view");
          }
        })
        .catch(() => {
          const ret = purchaseReturns.find((r: any) => String(r.id) === String(urlId));
          if (ret) {
            setSelectedReturn(ret);
            setViewMode("view");
          }
        });
    }
  }, [searchParams, items, inventoryItems]);

  // Auto-sync classification & currency whenever vendorId is selected/present in formik
  useEffect(() => {
    if (viewMode === "form") {
      const vId = formik.values.header.vendorId;
      if (vId) {
        const selectedVendor = vendors.find((v: any) => String(v.id) === String(vId));
        const linkedPo = purchaseOrders.find((p: any) => String(p.vendorId || p.vendor_id || p.header?.vendorId) === String(vId));
        const poH = linkedPo?.header ?? linkedPo;

        if (!formik.values.header.subsidiary_id) {
          const subId = poH?.subsidiary_id || poH?.subsidiaryId || selectedVendor?.primary_subsidiary_id || selectedVendor?.primarySubsidiary?.id || selectedVendor?.subsidiary_id || selectedVendor?.subsidiary?.id || subsidiaries[0]?.id;
          if (subId) formik.setFieldValue("header.subsidiary_id", String(subId));
        }

        if (!formik.values.header.class_id) {
          const classId = poH?.class_id || poH?.classId || selectedVendor?.class_id || selectedVendor?.class?.id || classesList[0]?.id;
          if (classId) formik.setFieldValue("header.class_id", String(classId));
        }

        if (!formik.values.header.department_id) {
          const deptId = poH?.department_id || poH?.departmentId || selectedVendor?.department_id || selectedVendor?.department?.id || departmentsList[0]?.id;
          if (deptId) formik.setFieldValue("header.department_id", String(deptId));
        }

        if (!formik.values.header.currency_id) {
          const currId = poH?.currency_id || poH?.currencyId || selectedVendor?.currency_id || selectedVendor?.currency?.id || currencies[0]?.id;
          if (currId) formik.setFieldValue("header.currency_id", String(currId));
        }

        if (!formik.values.header.location_id) {
          const primaryAddr = selectedVendor?.addressBook?.find((a: any) => a.default_billing) || selectedVendor?.addressBook?.[0];
          const locId = poH?.location_id || poH?.city_id || poH?.cityId || primaryAddr?.city_id || primaryAddr?.city?.id || selectedVendor?.city_id || citiesList[0]?.id;
          if (locId) {
            formik.setFieldValue("header.location_id", String(locId));
            const updatedLines = formik.values.lineItems.map((l: any) => ({
              ...l,
              location_id: l.location_id || String(locId),
            }));
            formik.setFieldValue("lineItems", updatedLines);
          }
        }
      }
    }
  }, [formik.values.header.vendorId, viewMode, vendors, purchaseOrders, subsidiaries, classesList, departmentsList, currencies, citiesList]);

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = e.target.value;
    formik.setFieldValue("header.vendorId", vendorId);

    const selectedVendor = vendors.find((v: any) => String(v.id) === String(vendorId));
    if (selectedVendor) {
      const linkedPo = purchaseOrders.find((p: any) => String(p.vendorId || p.vendor_id || p.header?.vendorId) === String(vendorId));
      const poH = linkedPo?.header ?? linkedPo;

      const subId = poH?.subsidiary_id || poH?.subsidiaryId || selectedVendor.primary_subsidiary_id || selectedVendor.primarySubsidiary?.id || selectedVendor.subsidiary_id || selectedVendor.subsidiary?.id || subsidiaries[0]?.id;
      if (subId) formik.setFieldValue("header.subsidiary_id", String(subId));

      const currId = poH?.currency_id || poH?.currencyId || selectedVendor.currency_id || selectedVendor.currency?.id || currencies[0]?.id;
      if (currId) formik.setFieldValue("header.currency_id", String(currId));

      const classId = poH?.class_id || poH?.classId || selectedVendor.class_id || selectedVendor.class?.id || classesList[0]?.id;
      if (classId) formik.setFieldValue("header.class_id", String(classId));

      const deptId = poH?.department_id || poH?.departmentId || selectedVendor.department_id || selectedVendor.department?.id || departmentsList[0]?.id;
      if (deptId) formik.setFieldValue("header.department_id", String(deptId));

      const primaryAddr = selectedVendor.addressBook?.find((a: any) => a.default_billing) || selectedVendor.addressBook?.[0];
      const cityId = poH?.location_id || poH?.city_id || poH?.cityId || primaryAddr?.city_id || primaryAddr?.city?.id || selectedVendor.city_id || selectedVendor.city?.id || citiesList[0]?.id;
      if (cityId) {
        formik.setFieldValue("header.location_id", String(cityId));
        const updatedLines = formik.values.lineItems.map((l: any) => ({
          ...l,
          location_id: l.location_id || String(cityId),
        }));
        formik.setFieldValue("lineItems", updatedLines);
      }
    }
  };

  const fillItemDetails = (idx: number, itemId: string) => {
    const item = items.find((i: any) => String(i.id) === String(itemId));
    const lineItems = [...formik.values.lineItems];
    const rQty = Number(lineItems[idx].returnQty || 1);
    const uPrice = Number(item?.purchase_price || item?.cost_price || item?.default_rate || 0);
    const gross = Number((rQty * uPrice).toFixed(2));
    const dAmt = Number(lineItems[idx].discountAmount || 0);
    const taxable = Math.max(0, Number((gross - dAmt).toFixed(2)));
    const tAmt = Number(lineItems[idx].taxAmount || 0);
    const total = Number((taxable + tAmt).toFixed(2));

    lineItems[idx] = {
      ...lineItems[idx],
      itemId,
      uom_id: String(item?.uom_id || ""),
      unitPrice: uPrice,
      lineTotal: total,
    };
    formik.setFieldValue("lineItems", lineItems);
  };

  const updateLineItemField = (idx: number, field: string, value: any) => {
    const lineItems = [...formik.values.lineItems];
    let newValue = value;

    if (field === "returnQty" && newValue !== "") {
      const maxQty = Number(lineItems[idx].orderedQty ?? 0);
      const inputQty = Number(newValue);

      if (maxQty > 0 && inputQty > maxQty) {
        newValue = maxQty;
        toast.error(`Return Quantity cannot exceed Billed/Ordered Quantity (${maxQty}).`);
      }

      const uomObj = uoms.find((u: any) => String(u.id) === String(lineItems[idx].uom_id));
      if (uomObj && !isDecimalAllowedForUOM(uomObj)) {
        if (typeof newValue === "string" && (newValue.includes(".") || newValue.includes(","))) {
          const intPart = newValue.split(".")[0].split(",")[0];
          newValue = intPart === "" ? "" : Math.floor(Number(intPart)) || 0;
          toast.error(`Quantity for UOM '${uomObj.uom_name || uomObj.name}' cannot contain decimals.`);
        } else if (Number(newValue) % 1 !== 0) {
          newValue = Math.floor(Number(newValue)) || 0;
          toast.error(`Quantity for UOM '${uomObj.uom_name || uomObj.name}' cannot contain decimals.`);
        }
      }
    }

    const updatedLine: any = { ...lineItems[idx], [field]: newValue };
    const rQty = Number(updatedLine.returnQty) || 0;
    const uPrice = Number(updatedLine.unitPrice) || 0;
    const gross = Number((rQty * uPrice).toFixed(2));

    if (field === "discountPercent") {
      const dPct = Number(newValue) || 0;
      updatedLine.discountAmount = Number(((gross * dPct) / 100).toFixed(2));
    } else if (field === "discountAmount") {
      const dAmt = Number(newValue) || 0;
      updatedLine.discountPercent = gross > 0 ? Number(((dAmt / gross) * 100).toFixed(2)) : 0;
    } else if (field === "returnQty" || field === "unitPrice") {
      const dPct = Number(updatedLine.discountPercent) || 0;
      if (dPct > 0) {
        updatedLine.discountAmount = Number(((gross * dPct) / 100).toFixed(2));
      }
    }

    const dAmt = Number(updatedLine.discountAmount) || 0;
    const taxable = Math.max(0, Number((gross - dAmt).toFixed(2)));

    if (field === "taxPercent") {
      const tPct = Number(newValue) || 0;
      updatedLine.taxAmount = Number(((taxable * tPct) / 100).toFixed(2));
    } else if (field === "taxAmount") {
      const tAmt = Number(newValue) || 0;
      updatedLine.taxPercent = taxable > 0 ? Number(((tAmt / taxable) * 100).toFixed(2)) : 0;
    } else if (field === "returnQty" || field === "unitPrice" || field === "discountAmount" || field === "discountPercent") {
      const tPct = Number(updatedLine.taxPercent) || 0;
      if (tPct > 0) {
        updatedLine.taxAmount = Number(((taxable * tPct) / 100).toFixed(2));
      }
    }

    const tAmt = Number(updatedLine.taxAmount) || 0;
    updatedLine.lineTotal = Number((taxable + tAmt).toFixed(2));

    lineItems[idx] = updatedLine;
    formik.setFieldValue("lineItems", lineItems);
  };

  useEffect(() => {
    if (!selectedReturnId || !singleReturnData) return;
    const item = singleReturnData?.result || singleReturnData?.data || singleReturnData;
    if (!item) return;

    const header = item.header ?? item;
    const statusVal = String(header.status || item.status || "DRAFT").toUpperCase();
    const rawLines = item.purchaseReturnLines || item.details || item.lineItems || item.purchase_return_lines || [];

    if (viewMode === "view") {
      setSelectedReturn(item);
    } else if (viewMode === "form" && isEdit) {
      if (statusVal !== "DRAFT") {
        toast.error("Only DRAFT Purchase Returns can be edited.");
        setViewMode("list");
        setSelectedReturnId(null);
        return;
      }

      const formatDate = (val: any) => (val && String(val).length >= 10 ? String(val).slice(0, 10) : "");

      formik.setValues({
        header: {
          returnNumber: header.returnNumber ?? header.return_number ?? "",
          vendorId: String(header.vendorId ?? header.vendor_id ?? ""),
          returnDate: formatDate(header.returnDate ?? header.return_date) || new Date().toISOString().slice(0, 10),
          subsidiary_id: String(header.subsidiary_id ?? ""),
          class_id: String(header.class_id ?? ""),
          department_id: String(header.department_id ?? ""),
          location_id: String(header.location_id ?? header.city_id ?? ""),
          currency_id: String(header.currency_id ?? ""),
          reason: header.reason ?? "",
          remarks: header.remarks ?? "",
          status: statusVal,
          user_id: userId,
        },
        lineItems: rawLines.length > 0
          ? rawLines.map((l: any) => ({
            itemId: String(l.itemId ?? l.item_id ?? ""),
            orderedQty: Number(l.orderedQty ?? l.ordered_quantity ?? l.returnQty ?? l.quantity ?? 1),
            uom_id: String(l.uom_id ?? l.uomId ?? ""),
            returnQty: Number(l.returnQty ?? l.return_quantity ?? l.quantity ?? 1),
            unitPrice: Number(l.unitPrice ?? l.unit_price ?? l.rate ?? 0),
            discountPercent: Number(l.discountPercent ?? l.discount_percent ?? 0),
            discountAmount: Number(l.discountAmount ?? l.discount_amount ?? 0),
            taxPercent: Number(l.taxPercent ?? l.tax_percent ?? 0),
            taxAmount: Number(l.taxAmount ?? l.tax_amount ?? 0),
            lineTotal: Number(l.lineTotal ?? l.line_total ?? 0),
            remarks: l.remarks ?? "",
          }))
          : [emptyLineItem()],
      });
    }
  }, [selectedReturnId, singleReturnData, viewMode, isEdit]);

  const handleEdit = (id: number | string) => {
    if (!canUpdate("purchase_return")) {
      toast.error("No permission to edit Purchase Return");
      return;
    }
    const item = purchaseReturns.find((x: any) => String(x.id) === String(id));
    if (item) {
      const header = item.header ?? item;
      const statusVal = String(header.status || item.status || "DRAFT").toUpperCase();
      if (statusVal !== "DRAFT") {
        toast.error("Only DRAFT Purchase Returns can be edited.");
        return;
      }
    }
    setSelectedReturnId(id);
    setEditId(id);
    setIsEdit(true);
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleView = (id: number | string) => {
    const localItem = purchaseReturns.find((x: any) => String(x.id) === String(id));
    if (localItem) {
      setSelectedReturn(localItem);
    }
    setSelectedReturnId(id);
    setViewMode("view");
    setSearchParams({ id: String(id), action: "view" });
  };

  const confirmDelete = async () => {
    if (!returnToDelete) return;
    const header = returnToDelete.header ?? returnToDelete;
    const statusVal = String(header.status || returnToDelete.status || "DRAFT").toUpperCase();
    if (statusVal !== "DRAFT") {
      toast.error("Only DRAFT Purchase Returns can be deleted.");
      setDeleteDialogOpen(false);
      setReturnToDelete(null);
      return;
    }

    try {
      await deletePurchaseReturn(returnToDelete.id).unwrap();
      toast.success("Purchase Return deleted successfully.");
      refetchReturns();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete Purchase Return.");
    } finally {
      setDeleteDialogOpen(false);
      setReturnToDelete(null);
    }
  };

  if (!canRead("purchase_return")) {
    return <div className="p-8 text-center text-red-600 font-bold">Access Denied: You do not have permission to view Purchase Returns.</div>;
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
        onClick={() => { setViewMode("list"); setIsEdit(false); setSearchParams({}); }}
        className="px-3 py-1 rounded-xs bg-[#244b5a] text-white shadow-2xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
      >
        <AssignmentReturn className="!w-3.5 !h-3.5 text-sky-200" />
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
        onClick={() => navigate("/debit-note")}
        className="px-3 py-1 rounded-xs text-slate-700 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer flex items-center space-x-1"
      >
        <ReceiptLong className="!w-3.5 !h-3.5 text-slate-600" />
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
    const activeHeader = isView ? selectedReturn?.header || selectedReturn || {} : formik.values.header;
    const activeLines = isView ? selectedReturn?.purchaseReturnLines || selectedReturn?.details || selectedReturn?.lineItems || selectedReturn?.purchase_return_lines || [] : formik.values.lineItems;

    const invId = activeHeader?.purchaseInvoiceHeaderId || activeHeader?.purchase_invoice_header_id || activeHeader?.invoiceId;
    const invObj = invId ? (invoices || []).find((i: any) => String(i?.id) === String(invId)) : null;
    const invH = invObj?.header ?? invObj;
    const poId = activeHeader?.purchaseOrderId || activeHeader?.purchase_order_id || activeHeader?.poId || invH?.purchaseOrderHeaderId || invH?.poHeaderId || invH?.po_header_id;
    const poObj = poId ? (purchaseOrders || []).find((p: any) => String(p?.id) === String(poId)) : null;
    const poH = poObj?.header ?? poObj;

    const vendorObj = activeHeader?.vendor || (vendors || []).find((v: any) => String(v?.id) === String(activeHeader?.vendorId || activeHeader?.vendor_id || selectedReturn?.vendorId || poH?.vendorId));
    const vendorName = getVendorDisplayName(vendorObj);
    const subIdVal = activeHeader?.subsidiary_id || poH?.subsidiary_id || poH?.subsidiaryId || invH?.subsidiary_id || vendorObj?.primary_subsidiary_id || vendorObj?.subsidiary_id;
    const subsidiaryName = activeHeader?.subsidiary?.subsidiary_name || (subsidiaries || []).find((s: any) => String(s?.id) === String(subIdVal))?.subsidiary_name || poH?.subsidiary?.subsidiary_name || poH?.subsidiary?.name || "—";
    const classIdVal = activeHeader?.class_id || poH?.class_id || poH?.classId || invH?.class_id || vendorObj?.class_id;
    const classNameVal = activeHeader?.class?.class_name || (classesList || []).find((c: any) => String(c?.id) === String(classIdVal))?.class_name || poH?.class?.class_name || "—";
    const deptIdVal = activeHeader?.department_id || poH?.department_id || poH?.departmentId || invH?.department_id || vendorObj?.department_id;
    const deptNameVal = activeHeader?.department?.department_name || (departmentsList || []).find((d: any) => String(d?.id) === String(deptIdVal))?.department_name || poH?.department?.department_name || "—";
    const locIdVal = activeHeader?.location_id || activeHeader?.city_id || poH?.city_id || poH?.cityId || poH?.location_id || invH?.location_id;
    const locNameVal = activeHeader?.location?.city_name || (citiesList || []).find((c: any) => String(c?.id) === String(locIdVal))?.city_name || poH?.city?.city_name || poH?.city?.name || poH?.location?.city_name || "—";
    const currIdVal = activeHeader?.currency_id || vendorObj?.currency_id;
    const currencyObj = (currencies || []).find((c: any) => String(c?.id) === String(currIdVal));

    const totalSubtotal = activeLines.reduce((acc: number, l: any) => {
      const q = Number(l.returnQty || l.return_quantity || l.quantity || 0);
      const p = Number(l.unitPrice || l.unit_price || 0);
      return acc + (q * p);
    }, 0);

    const totalDiscountAmt = activeLines.reduce((acc: number, l: any) => {
      return acc + Number(l.discountAmount || l.discount_amount || 0);
    }, 0);

    const totalTaxAmt = activeLines.reduce((acc: number, l: any) => {
      return acc + Number(l.taxAmount || l.tax_amount || 0);
    }, 0);

    const totalReturnAmt = activeLines.reduce((acc: number, l: any) => {
      if (l.lineTotal !== undefined && l.lineTotal !== null && Number(l.lineTotal) > 0) return acc + Number(l.lineTotal);
      if (l.line_total !== undefined && l.line_total !== null && Number(l.line_total) > 0) return acc + Number(l.line_total);
      const q = Number(l.returnQty || l.return_quantity || l.quantity || 0);
      const p = Number(l.unitPrice || l.unit_price || 0);
      const d = Number(l.discountAmount || l.discount_amount || 0);
      const t = Number(l.taxAmount || l.tax_amount || 0);
      return acc + (q * p - d + t);
    }, 0);

    const glEntries: GLEntry[] = (() => {
      if (!isView || !selectedReturn) return [];
      const statusVal = String(activeHeader.status || selectedReturn?.status || "").toUpperCase();

      // Step 1: DRAFT or AUTHORIZED -> Non-posting operational document
      if (statusVal === "DRAFT" || statusVal === "AUTHORIZED") {
        return [];
      }

      const entries: GLEntry[] = [];
      const currentPeriod = (activeHeader.returnDate || new Date().toISOString()).slice(0, 7);

      const findAccount = (keywords: string[], typeKeywords: string[], defaultName: string, defaultCode: string) => {
        const byName = accounts.find((a: any) =>
          keywords.some((k) => (a.account_name || a.name || "").toLowerCase().includes(k.toLowerCase()))
        );
        if (byName) return { name: byName.account_name || byName.name, code: byName.account_code || byName.code || defaultCode };

        const byType = accounts.find((a: any) =>
          typeKeywords.some((k) => (a.accountType?.account_type_name || a.account_type || "").toLowerCase().includes(k.toLowerCase()))
        );
        if (byType) return { name: byType.account_name || byType.name, code: byType.account_code || byType.code || defaultCode };

        return { name: defaultName, code: defaultCode };
      };

      const clearingAcc = findAccount(
        ["Purchase Return Clearing", "Return Clearing", "GRNI", "Clearing"],
        ["Asset", "Current Asset", "Liability", "Current Liability"],
        "Purchase Return Clearing Account",
        "2115"
      );

      const apAcc = findAccount(
        ["Accounts Payable", "Trade Creditors", "Creditors", "Payable"],
        ["Accounts Payable", "Current Liability", "Liability"],
        "Accounts Payable",
        "2000"
      );

      const taxAcc = findAccount(
        ["Input Tax", "Input GST", "Tax Receivable", "Tax Credit", "GST Input"],
        ["Tax", "Current Asset", "Asset"],
        "Input Tax Receivable",
        "1400"
      );

      const discAcc = findAccount(
        ["Purchase Discount", "Discount Received", "Discount Income", "Discount"],
        ["Income", "Expense", "Direct Income"],
        "Purchase Discount",
        "4200"
      );

      // ── STEP 2: RETURN FULFILLMENT GL IMPACT ──
      if (["FULFILLED", "PARTIALLY_FULFILLED", "RETURNED"].includes(statusVal)) {
        let fulfillmentSubtotal = 0;
        activeLines.forEach((line: any) => {
          const itemObj = items.find((i: any) => String(i.id) === String(line.itemId || line.item_id));
          const q = Number(line.returnQty || line.return_quantity || line.quantity || 0);
          const p = Number(line.unitPrice || line.unit_price || line.rate || 0);
          const lineGross = Number((q * p).toFixed(2));
          if (lineGross <= 0) return;
          fulfillmentSubtotal += lineGross;

          const invAcc = itemObj?.asset_account_id
            ? accounts.find((a: any) => String(a.id) === String(itemObj.asset_account_id))
            : null;
          const invName = invAcc ? (invAcc.account_name || invAcc.name) : "Inventory Asset Account";
          const invCode = invAcc ? (invAcc.account_code || invAcc.code || "1200") : "1200";

          // CREDIT: Inventory Asset
          entries.push({
            accountCode: invCode,
            accountName: invName,
            debit: 0,
            credit: lineGross,
            postingPeriod: currentPeriod,
            memo: `Step 2 Fulfillment: Stock Outward for ${itemObj?.item_name || line.item?.item_name || "Item"} (Qty: ${q})`
          });
        });

        fulfillmentSubtotal = Number(fulfillmentSubtotal.toFixed(2));
        if (fulfillmentSubtotal > 0) {
          // DEBIT: Purchase Return Clearing
          entries.unshift({
            accountCode: clearingAcc.code,
            accountName: clearingAcc.name,
            debit: fulfillmentSubtotal,
            credit: 0,
            postingPeriod: currentPeriod,
            memo: `Step 2 Fulfillment: Purchase Return Clearing Accrual`
          });
        }
      }

      // ── STEP 3: VENDOR CREDIT GL IMPACT (NO DISCOUNT, GST VISIBLE, BALANCED) ──
      if (statusVal === "RETURNED") {
        const netTotal = totalReturnAmt > 0 ? totalReturnAmt : Number(activeHeader.totalAmount || activeHeader.total_amount || 0);
        const taxAmt = totalTaxAmt > 0 ? totalTaxAmt : Number(activeHeader.taxAmount || activeHeader.tax_amount || 0);
        const clearingCredit = Number((netTotal - (taxAmt > 0 ? taxAmt : 0)).toFixed(2));

        // DEBIT: Accounts Payable (Reduces vendor liability for full credit total)
        entries.push({
          accountCode: apAcc.code,
          accountName: apAcc.name,
          debit: netTotal,
          credit: 0,
          postingPeriod: currentPeriod,
          memo: `Step 3 Vendor Credit: Liability reduction with Vendor`
        });

        // CREDIT: Input Tax (GST) Reversal (if GST exists)
        if (taxAmt > 0) {
          entries.push({
            accountCode: taxAcc.code,
            accountName: taxAcc.name,
            debit: 0,
            credit: taxAmt,
            postingPeriod: currentPeriod,
            memo: `Step 3 Vendor Credit: Input Tax Reversal`
          });
        }

        // CREDIT: Purchase Return Clearing (Offsets step 2 accrual)
        if (clearingCredit > 0) {
          entries.push({
            accountCode: clearingAcc.code,
            accountName: clearingAcc.name,
            debit: 0,
            credit: clearingCredit,
            postingPeriod: currentPeriod,
            memo: `Step 3 Vendor Credit: Purchase Return Clearing offset`
          });
        }
      }

      return entries;
    })();

    const retNoStr = activeHeader.returnNumber || activeHeader.return_number || `RET-${selectedReturn?.id || "NEW"}`;

    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          mode={isView ? "view" : "edit"}
          recordType="Purchase Return Authorization"
          subtitle={isView ? `Return #${retNoStr} ${vendorName}` : isEdit ? `Edit Return #${formik.values.header.returnNumber}` : "New Purchase Return"}
          onSave={() => formik.handleSubmit()}
          onEdit={
            isView && selectedReturn && String(activeHeader.status || "DRAFT").toUpperCase() === "DRAFT" && canUpdate("purchase_return")
              ? () => handleEdit(selectedReturn.id)
              : undefined
          }
          onBack={() => { setViewMode("list"); setSearchParams({}); }}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
          customActions={
            isView && selectedReturn ? (
              <div className="flex items-center space-x-1.5">
                {String(activeHeader.status || selectedReturn.status || "DRAFT").toUpperCase() === "DRAFT" && (
                  <button
                    type="button"
                    onClick={() => handleAuthorizeReturn(selectedReturn.id)}
                    className="bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    Authorize Return
                  </button>
                )}

                {/* Step 2: Return (Item Fulfillment) - Only after Authorization, before full fulfillment */}
                {["AUTHORIZED", "APPROVED", "PARTIALLY_FULFILLED"].includes(String(activeHeader.status || selectedReturn.status || "").toUpperCase()) && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/return-fulfillment?returnId=${selectedReturn.id}`);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    Return (Item Fulfillment)
                  </button>
                )}

                {/* Step 3: Credit (Vendor Credit) - STRICTLY AFTER FULFILLMENT, and REMOVED once completed */}
                {(() => {
                  const matchingDebitNote = debitNotes.find((dn: any) => {
                    const dnReturnId = String(dn.purchase_return_id || dn.purchaseReturnId || dn.returnId || dn.header?.purchaseReturnHeaderId || dn.reason || "");
                    return selectedReturn && (dnReturnId === String(selectedReturn.id) || dnReturnId.includes(String(selectedReturn.id)));
                  });
                  const isVendorCreditDone = Boolean(
                    matchingDebitNote ||
                    String(activeHeader.status || selectedReturn.status || "").toUpperCase() === "RETURNED"
                  );

                  if (String(activeHeader.status || selectedReturn.status || "").toUpperCase() === "FULFILLED" && !isVendorCreditDone) {
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/debit-note?returnId=${selectedReturn.id}`);
                        }}
                        className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <ReceiptLong className="!w-3.5 !h-3.5" />
                        <span>Credit (Vendor Credit)</span>
                      </button>
                    );
                  }

                  if (isVendorCreditDone || String(activeHeader.status || selectedReturn.status || "").toUpperCase() === "RETURNED") {
                    return (
                      <div className="flex items-center space-x-1 bg-teal-50 border border-teal-300 text-teal-800 text-xs px-2.5 py-1 rounded-xs font-semibold">
                        <span>✓ Vendor Credit Completed</span>
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>
            ) : undefined
          }
          isSaving={isCreating || isUpdating}
          subTabs={[
            {
              id: "items",
              label: `Items Returned (${activeLines.length})`,
              content: (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-slate-300 rounded-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#244b5a] text-white font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 border-r border-slate-400 w-10 text-center">#</th>
                          <th className="p-2 border-r border-slate-400 min-w-[180px]">ITEM *</th>
                          <th className="p-2 border-r border-slate-400 min-w-[160px]">DESCRIPTION</th>
                          {/* <th className="p-2 border-r border-slate-400 min-w-[140px]">LOCATION</th> */}
                          <th className="p-2 border-r border-slate-400 w-20 text-right">ON-HAND</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">ORDERED QTY</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">RETURN QTY *</th>
                          <th className="p-2 border-r border-slate-400 w-28 text-right">UNIT PRICE (₹)</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">DISC (₹)</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">TAX (₹)</th>
                          <th className="p-2 border-r border-slate-400 w-28 text-right">TOTAL (₹)</th>
                          <th className="p-2 border-r border-slate-400 min-w-[140px]">REMARKS</th>
                          {!isView && <th className="p-2 w-10 text-center">ACTION</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {activeLines.map((line: any, idx: number) => {
                          const itemObj = items.find((i: any) => String(i.id) === String(line.itemId || line.item_id));
                          const ordQty = Number(line.orderedQty ?? line.returnQty ?? 0);
                          const rQty = Number(line.returnQty ?? 1);
                          const uPrice = Number(line.unitPrice ?? line.unit_price ?? line.rate ?? 0);
                          const dPct = Number(line.discountPercent ?? line.discount_percent ?? 0);
                          const dAmt = Number(line.discountAmount ?? line.discount_amount ?? 0);
                          const tPct = Number(line.taxPercent ?? line.tax_percent ?? 0);
                          const tAmt = Number(line.taxAmount ?? line.tax_amount ?? 0);
                          const lTotal = Number(line.lineTotal ?? line.line_total ?? ((rQty * uPrice) - dAmt + tAmt));
                          const allowsDecimals = isDecimalAllowedForUOM(uoms.find((u: any) => String(u.id) === String(line.uom_id || itemObj?.uom_id)));
                          const lineDesc = line.description || itemObj?.item_desc || itemObj?.description || itemObj?.item_name || "—";
                          const lineOnHand = onHandMap[String(line.itemId || line.item_id)] ?? line.onHand ?? 0;
                          const lineLocId = line.location_id || itemLocationMap[String(line.itemId || line.item_id)] || "";
                          const lineLocName = citiesList.find((c: any) => String(c.id) === String(lineLocId))?.city_name || line.location?.city_name || "—";

                          if (isView) {
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                                <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{line.item?.item_name || itemObj?.item_name || `Item #${line.itemId}`}</td>
                                <td className="p-2 border-r border-slate-200 text-slate-700">{lineDesc}</td>
                                {/* <td className="p-2 border-r border-slate-200 font-medium text-slate-800">{lineLocName}</td> */}
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-slate-700 bg-slate-50">{lineOnHand}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700">{ordQty}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-red-600">{rQty}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono">₹{uPrice.toFixed(2)}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono text-emerald-700">
                                  {dAmt > 0 ? `₹${dAmt.toFixed(2)}${dPct > 0 ? ` (${dPct}%)` : ""}` : "—"}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono text-sky-700">
                                  {tAmt > 0 ? `₹${tAmt.toFixed(2)}${tPct > 0 ? ` (${tPct}%)` : ""}` : "—"}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">₹{lTotal.toFixed(2)}</td>
                                <td className="p-2 border-r border-slate-200 text-slate-700">{line.remarks || "—"}</td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                              <td className="p-1.5 border-r border-slate-200">
                                <select
                                  disabled={true}
                                  value={line.itemId}
                                  onChange={(e) => fillItemDetails(idx, e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs bg-slate-100 font-medium text-slate-800 cursor-not-allowed"
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
                              {/* <td className="p-1.5 border-r border-slate-200">
                                <select
                                  disabled={true}
                                  value={lineLocId}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs bg-slate-100 font-medium text-slate-700 cursor-not-allowed"
                                >
                                  <option value="">Select Location...</option>
                                  {citiesList.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                      {c.city_name || c.name}
                                    </option>
                                  ))}
                                </select>
                              </td> */}
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-slate-700 bg-slate-50">
                                {lineOnHand}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-slate-600 bg-slate-50">
                                {line.orderedQty ?? line.returnQty ?? 0}
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  step={allowsDecimals ? "any" : "1"}
                                  min={allowsDecimals ? "0.01" : "1"}
                                  max={line.orderedQty > 0 ? line.orderedQty : undefined}
                                  value={line.returnQty}
                                  onKeyDown={(e) => {
                                    if (!allowsDecimals && (e.key === "." || e.key === "," || e.key === "e" || e.key === "E" || e.key === "-")) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => updateLineItemField(idx, "returnQty", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono focus:outline-none focus:border-sky-500"
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  disabled={true}
                                  step="any"
                                  min="0"
                                  value={line.unitPrice}
                                  onChange={(e) => updateLineItemField(idx, "unitPrice", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono bg-slate-100 font-medium text-slate-800 cursor-not-allowed"
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="text"
                                  disabled={true}
                                  placeholder="0.00"
                                  value={line.discountAmount !== undefined && line.discountAmount !== null && line.discountAmount !== "" ? Number(line.discountAmount).toFixed(2) : "0.00"}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono bg-slate-100 font-medium text-slate-700 cursor-not-allowed"
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="text"
                                  disabled={true}
                                  placeholder="0.00"
                                  value={line.taxAmount !== undefined && line.taxAmount !== null && line.taxAmount !== "" ? Number(line.taxAmount).toFixed(2) : "0.00"}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono bg-slate-100 font-medium text-slate-700 cursor-not-allowed"
                                />
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900 bg-slate-50">
                                ₹{Number(line.lineTotal || 0).toFixed(2)}
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="text"
                                  placeholder="Reason / Remarks..."
                                  value={line.remarks}
                                  onChange={(e) => updateLineItemField(idx, "remarks", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:border-sky-500 bg-white"
                                />
                              </td>
                              <td className="p-1.5 text-center">
                                {formik.values.lineItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...formik.values.lineItems];
                                      updated.splice(idx, 1);
                                      formik.setFieldValue("lineItems", updated);
                                    }}
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

                  {!isView && (
                    <button
                      type="button"
                      onClick={() => formik.setFieldValue("lineItems", [...formik.values.lineItems, emptyLineItem()])}
                      className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xs transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Add className="!w-4 !h-4" />
                      <span>Add Return Line</span>
                    </button>
                  )}
                </div>
              ),
            },
            ...(isView && glEntries.length > 0
              ? [
                {
                  id: "gl_impact",
                  label: "GL Impact",
                  content: (
                    <GLImpactSubtab
                      documentNumber={retNoStr}
                      entries={glEntries}
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
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">RETURN #</span>
                      <span className="text-xs font-bold text-slate-900">{activeHeader.returnNumber || activeHeader.return_number || `RET-${selectedReturn?.id}`}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">VENDOR</span>
                      <span className="text-xs font-bold text-sky-700">{vendorName}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">RETURN DATE</span>
                      <span className="text-xs text-slate-800">{activeHeader.returnDate || activeHeader.return_date ? new Date(activeHeader.returnDate || activeHeader.return_date).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">STATUS</span>
                      <div>
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${String(activeHeader.status || "DRAFT").toUpperCase() === "DRAFT"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : ["AUTHORIZED", "APPROVED"].includes(String(activeHeader.status || "").toUpperCase())
                            ? "bg-sky-100 text-sky-800 border-sky-200"
                            : String(activeHeader.status || "").toUpperCase() === "PARTIALLY_FULFILLED"
                              ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                              : String(activeHeader.status || "").toUpperCase() === "FULFILLED"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : String(activeHeader.status || "").toUpperCase() === "RETURNED"
                                  ? "bg-teal-100 text-teal-800 border-teal-200"
                                  : "bg-slate-100 text-slate-800 border-slate-200"
                          }`}>
                          {activeHeader.status || "DRAFT"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">REASON</span>
                      <span className="text-xs text-slate-800">{activeHeader.reason || "—"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        VENDOR <span className="text-amber-600">*</span>
                      </label>
                      <select
                        name="header.vendorId"
                        value={formik.values.header.vendorId}
                        onChange={handleVendorChange}
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
                        RETURN DATE <span className="text-amber-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="header.returnDate"
                        value={formik.values.header.returnDate}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        STATUS <span className="text-amber-600">*</span>
                      </label>
                      <select
                        name="header.status"
                        value={formik.values.header.status}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-semibold text-slate-800"
                      >
                        <option value="DRAFT">DRAFT (Non-Posting)</option>
                        <option value="AUTHORIZED">AUTHORIZED (Ready for Fulfillment)</option>
                        <option value="APPROVED">APPROVED</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">RETURN REASON</label>
                      <input
                        type="text"
                        name="header.reason"
                        placeholder="Defective, Damaged, Excess stock..."
                        value={formik.values.header.reason}
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
                  Return Summary
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-semibold text-slate-700 uppercase text-[10px]">ITEMS</span>
                    <span>{activeLines.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-semibold text-slate-700 uppercase text-[10px]">SUBTOTAL</span>
                    <span>₹{totalSubtotal.toFixed(2)}</span>
                  </div>
                  {totalDiscountAmt > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span className="font-semibold uppercase text-[10px]">DISCOUNT</span>
                      <span>-₹{totalDiscountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  {totalTaxAmt > 0 && (
                    <div className="flex justify-between text-sky-700">
                      <span className="font-semibold uppercase text-[10px]">TAX (GST)</span>
                      <span>+₹{totalTaxAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                    <span className="uppercase text-[11px]">NET TOTAL</span>
                    <span className="text-red-700">₹{totalReturnAmt.toFixed(2)}</span>
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
                    disabled={true}
                    name="header.subsidiary_id"
                    value={formik.values.header.subsidiary_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 font-medium text-slate-700 cursor-not-allowed"
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
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-medium text-slate-800"
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
                    disabled={true}
                    name="header.class_id"
                    value={formik.values.header.class_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 font-medium text-slate-700 cursor-not-allowed"
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
                    disabled={true}
                    name="header.department_id"
                    value={formik.values.header.department_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 font-medium text-slate-700 cursor-not-allowed"
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
                  disabled={true}
                  name="header.currency_id"
                  value={formik.values.header.currency_id || ""}
                  onChange={formik.handleChange}
                  className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 font-medium text-slate-700 cursor-not-allowed"
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
  const filteredReturns = purchaseReturns.filter((ret: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const retNoStr = String(ret.returnNumber || ret.return_number || `RET-${ret.id}`).toLowerCase();
    const vName = getVendorDisplayName(ret.vendor).toLowerCase();
    return retNoStr.includes(term) || vName.includes(term);
  });

  return (
    <div className="flex flex-col space-y-3 p-4 bg-[#f3f6f9] min-h-screen font-sans text-slate-800">
      {/* Header with Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 border-b border-slate-300 gap-2">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Purchase Return Authorizations</h1>
        </div>
        <P2PLifecycleNav />
      </div>

      {/* Button Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded-xs shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-xs">
          <span className="uppercase text-[10px] font-bold text-slate-500">VIEW</span>
          <select className="h-7 px-3 text-xs bg-white border border-slate-300 rounded-xs font-medium focus:outline-none focus:border-sky-600">
            <option>All Purchase Returns</option>
          </select>
          {canCreate("purchase_return") && (
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
              <span>+ New Purchase Return</span>
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
                placeholder="Search Return #, Vendor..."
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
              <th className="p-2 border-r border-slate-300 min-w-[130px]">RETURN NUMBER</th>
              <th className="p-2 border-r border-slate-300 min-w-[180px]">VENDOR</th>
              <th className="p-2 border-r border-slate-300 w-28">RETURN DATE</th>
              <th className="p-2 border-r border-slate-300 w-28 text-center">STATUS</th>
              <th className="p-2 w-20 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredReturns.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-medium italic">
                  {searchTerm ? "No matching purchase returns found." : "No Purchase Returns found. Click '+ New Purchase Return' to create one."}
                </td>
              </tr>
            ) : (
              filteredReturns.map((ret: any) => {
                const retHeader = ret.header ?? ret;
                const retNoStr = retHeader.returnNumber || retHeader.return_number || `RET-${ret.id}`;
                const vendorName = getVendorDisplayName(retHeader.vendor || ret.vendor);
                const retStatus = String(retHeader.status || ret.status || "DRAFT").toUpperCase();
                const isDraftReturn = retStatus === "DRAFT";

                return (
                  <tr key={ret.id} className="hover:bg-sky-50/50 transition-colors">
                    <td className="p-2 border-r border-slate-200 text-center font-semibold space-x-1">
                      {canUpdate("purchase_return") ? (
                        isDraftReturn ? (
                          <button onClick={() => handleEdit(ret.id)} className="text-sky-700 hover:underline cursor-pointer">
                            Edit
                          </button>
                        ) : (
                          <span className="text-slate-300 cursor-not-allowed" title="Only DRAFT purchase returns can be edited">Edit</span>
                        )
                      ) : (
                        <span className="text-slate-300">Edit</span>
                      )}
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleView(ret.id)} className="text-sky-700 hover:underline cursor-pointer">
                        View
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">{ret.id}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-sky-800">
                      <button onClick={() => handleView(ret.id)} className="hover:underline text-left cursor-pointer">
                        {retNoStr}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{vendorName}</td>
                    <td className="p-2 border-r border-slate-200 text-slate-700">
                      {retHeader.returnDate || retHeader.return_date ? new Date(retHeader.returnDate || retHeader.return_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center">
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${isDraftReturn
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : retStatus === "AUTHORIZED" || retStatus === "APPROVED"
                          ? "bg-sky-100 text-sky-800 border-sky-200"
                          : retStatus === "PARTIALLY_FULFILLED"
                            ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                            : retStatus === "FULFILLED"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : retStatus === "RETURNED"
                                ? "bg-teal-100 text-teal-800 border-teal-200"
                                : "bg-slate-100 text-slate-800 border-slate-200"
                        }`}>
                        {retHeader.status || "DRAFT"}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {canDelete("purchase_return") && (
                        isDraftReturn ? (
                          <button
                            onClick={() => {
                              setReturnToDelete(ret);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:underline font-semibold cursor-pointer"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-slate-300 cursor-not-allowed" title="Only DRAFT purchase returns can be deleted">Delete</span>
                        )
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
        title="Delete Purchase Return"
        message="Are you sure you want to delete this purchase return authorization? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
