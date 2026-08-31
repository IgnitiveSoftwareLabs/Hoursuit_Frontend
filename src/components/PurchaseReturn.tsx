import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Add, Delete, Edit, Print, Search, List as ListIcon, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import * as Yup from "yup";

import { useGetVendorsQuery } from "../RTK/services/vendorApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetClassesQuery } from "../RTK/services/classApi";
import { useGetDepartmentsQuery } from "../RTK/services/departmentApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";
import { useGetUOMsQuery } from "../RTK/services/uomApi";
import { useAppSelector } from "../Hooks/Reduxhook/hooks";
import { usePermissions } from "../Hooks/usePermissions";

import {
  useCreatePurchaseReturnMutation,
  useDeletePurchaseReturnMutation,
  useGetPurchaseReturnsQuery,
  useGetPurchaseReturnByIdQuery,
  useUpdatePurchaseReturnMutation,
  useUpdatePurchaseReturnStatusMutation,
  useGetPurchaseInvoicesQuery,
  useGetPurchasePaymentsQuery,
  useGetPurchaseOrdersQuery,
} from "../RTK/services/purchaseApi";

import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";
import { GLImpactSubtab } from "./Layout/GLImpactSubtab";
import ConfirmationDialog from "./Dialog/ConfirmationDialog";

interface PurchaseReturnLineForm {
  itemId: string;
  location_id?: string;
  orderedQty?: number;
  uom_id?: string;
  returnQty: number;
  unitPrice: number;
  lineTotal: number;
  remarks: string;
}

const emptyLineItem = (): PurchaseReturnLineForm => ({
  itemId: "",
  location_id: "",
  orderedQty: 0,
  uom_id: "",
  returnQty: 1,
  unitPrice: 0,
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

  // Eager Queries
  const { data: purchaseReturnsData, refetch: refetchReturns } = useGetPurchaseReturnsQuery({ page: 1, limit: 50 });
  const { data: singleReturnData } = useGetPurchaseReturnByIdQuery(selectedReturnId!, { skip: !selectedReturnId });
  const { data: vendorsData } = useGetVendorsQuery({ page: 1, option: true });
  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 1000 });
  const { data: subsidiariesData } = useGetSubsidiariesQuery(undefined);
  const { data: classesData } = useGetClassesQuery(undefined);
  const { data: departmentsData } = useGetDepartmentsQuery(undefined);
  const { data: citiesData } = useGetCitiesQuery(undefined);
  const { data: currenciesData } = useGetCurrenciesQuery(undefined);
  const { data: uomsData } = useGetUOMsQuery(undefined);
  const { data: purchaseInvoicesData } = useGetPurchaseInvoicesQuery(undefined);
  const { data: purchasePaymentsData } = useGetPurchasePaymentsQuery(undefined);
  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery(undefined);

  const [createPurchaseReturn, { isLoading: isCreating }] = useCreatePurchaseReturnMutation();
  const [updatePurchaseReturn, { isLoading: isUpdating }] = useUpdatePurchaseReturnMutation();
  const [deletePurchaseReturn] = useDeletePurchaseReturnMutation();
  const [updatePurchaseReturnStatus] = useUpdatePurchaseReturnStatusMutation();

  const handleAuthorizeReturn = async (id: number | string) => {
    try {
      await updatePurchaseReturnStatus({ id, body: { status: "AUTHORIZED" } }).unwrap();
      toast.success("Purchase Return Authorization has been AUTHORIZED.");
      refetchReturns();
      if (selectedReturnId) {
        setSelectedReturnId(null);
        setTimeout(() => setSelectedReturnId(id), 50);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to authorize Purchase Return.");
    }
  };

  const purchaseReturns = useMemo(() => (Array.isArray(purchaseReturnsData?.result) ? purchaseReturnsData.result : Array.isArray(purchaseReturnsData?.data) ? purchaseReturnsData.data : Array.isArray(purchaseReturnsData) ? purchaseReturnsData : []), [purchaseReturnsData]);
  const purchaseInvoices = useMemo(() => (Array.isArray(purchaseInvoicesData?.result) ? purchaseInvoicesData.result : Array.isArray(purchaseInvoicesData?.data) ? purchaseInvoicesData.data : Array.isArray(purchaseInvoicesData) ? purchaseInvoicesData : []), [purchaseInvoicesData]);
  const purchasePayments = useMemo(() => (Array.isArray(purchasePaymentsData?.result) ? purchasePaymentsData.result : Array.isArray(purchasePaymentsData?.data) ? purchasePaymentsData.data : Array.isArray(purchasePaymentsData) ? purchasePaymentsData : []), [purchasePaymentsData]);
  const purchaseOrders = useMemo(() => (Array.isArray(purchaseOrdersData?.result) ? purchaseOrdersData.result : Array.isArray(purchaseOrdersData?.data) ? purchaseOrdersData.data : Array.isArray(purchaseOrdersData) ? purchaseOrdersData : []), [purchaseOrdersData]);
  const vendors = useMemo(() => (Array.isArray(vendorsData?.result) ? vendorsData.result : Array.isArray(vendorsData?.data) ? vendorsData.data : Array.isArray(vendorsData) ? vendorsData : []), [vendorsData]);
  const items = useMemo(() => (Array.isArray(itemsData?.result) ? itemsData.result : Array.isArray(itemsData?.data) ? itemsData.data : Array.isArray(itemsData) ? itemsData : []), [itemsData]);
  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : Array.isArray(subsidiariesData?.data) ? subsidiariesData.data : Array.isArray(subsidiariesData) ? subsidiariesData : [];
  const classesList = Array.isArray(classesData?.result) ? classesData.result : Array.isArray(classesData?.data) ? classesData.data : Array.isArray(classesData) ? classesData : [];
  const departmentsList = Array.isArray(departmentsData?.result) ? departmentsData.result : Array.isArray(departmentsData?.data) ? departmentsData.data : Array.isArray(departmentsData) ? departmentsData : [];
  const citiesList = Array.isArray(citiesData?.result) ? citiesData.result : Array.isArray(citiesData?.data) ? citiesData.data : Array.isArray(citiesData) ? citiesData : [];
  const currencies = Array.isArray(currenciesData?.result) ? currenciesData.result : Array.isArray(currenciesData?.data) ? currenciesData.data : Array.isArray(currenciesData) ? currenciesData : [];
  const uoms = Array.isArray(uomsData?.result) ? uomsData.result : Array.isArray(uomsData?.data) ? uomsData.data : Array.isArray(uomsData) ? uomsData : [];

  const formik = useFormik({
    initialValues: {
      header: {
        returnNumber: "",
        vendorId: "",
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
            toast.error(`Return Quantity for line ${i + 1} (${uomObj.uom_name || uomObj.name}) must be a whole number.`);
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

        if (isEdit && editId) {
          await updatePurchaseReturn({ id: editId, body: payload }).unwrap();
          toast.success("Purchase Return updated successfully.");
        } else {
          await createPurchaseReturn(payload).unwrap();
          toast.success("Purchase Return recorded successfully.");
        }
        setViewMode("list");
        setIsEdit(false);
        setEditId(null);
        setSearchParams({});
        formik.resetForm();
        refetchReturns();
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong.");
      }
    },
  });

  useEffect(() => {
    const urlAction = searchParams.get("action");
    const urlId = searchParams.get("id");
    const billIdParam = searchParams.get("billId");
    const paymentIdParam = searchParams.get("paymentId");
    const poIdParam = searchParams.get("poId");

    if (billIdParam) {
      const inv = purchaseInvoices.find((x: any) => String(x.id) === String(billIdParam));
      if (inv) {
        const header = inv.header ?? inv;
        const invLines = inv.purchaseInvoiceLines || inv.lines || inv.details || [];
        const vId = String(header.vendorId || header.vendor_id || "");
        const subId = String(header.subsidiary_id || header.vendor?.primary_subsidiary_id || "");
        const classId = String(header.class_id || "");
        const deptId = String(header.department_id || "");
        const locId = String(header.location_id || header.city_id || "");
        const currId = String(header.currency_id || "");

        const mappedLines = invLines.map((l: any) => {
          const itemObj = items.find((i: any) => String(i.id) === String(l.itemId || l.item_id));
          const qty = Number(l.quantity || l.qty || 1);
          const price = Number(l.unitPrice || l.unit_price || l.rate || 0);
          return {
            itemId: String(l.itemId || l.item_id || ""),
            location_id: String(l.location_id || l.city_id || locId || citiesList[0]?.id || ""),
            orderedQty: qty,
            uom_id: String(l.uom_id || itemObj?.uom_id || ""),
            returnQty: qty,
            unitPrice: price,
            lineTotal: Number((qty * price).toFixed(2)),
            remarks: l.remarks || `Return from Bill #${header.invoiceNumber || header.vendorInvoiceNumber || inv.id}`,
          };
        });

        formik.setValues({
          header: {
            returnNumber: `RET-BILL-${inv.id}`,
            vendorId: vId,
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
    } else if (paymentIdParam) {
      const pay = purchasePayments.find((x: any) => String(x.id) === String(paymentIdParam));
      if (pay) {
        const header = pay.header ?? pay;
        const vId = String(header.vendorId || header.vendor_id || header.vendor?.id || "");
        const matchedInv = purchaseInvoices.find((i: any) => String(i.id) === String(header.purchaseInvoiceHeaderId || header.purchase_invoice_header_id));
        const invLines = matchedInv ? (matchedInv.purchaseInvoiceLines || matchedInv.lines || matchedInv.details || []) : [];

        const mappedLines = invLines.map((l: any) => {
          const itemObj = items.find((i: any) => String(i.id) === String(l.itemId || l.item_id));
          const qty = Number(l.quantity || l.qty || 1);
          const price = Number(l.unitPrice || l.unit_price || l.rate || 0);
          return {
            itemId: String(l.itemId || l.item_id || ""),
            location_id: String(l.location_id || l.city_id || header.location_id || citiesList[0]?.id || ""),
            orderedQty: qty,
            uom_id: String(l.uom_id || itemObj?.uom_id || ""),
            returnQty: qty,
            unitPrice: price,
            lineTotal: Number((qty * price).toFixed(2)),
            remarks: l.remarks || `Return from Payment #${header.paymentNumber || pay.id}`,
          };
        });

        formik.setValues({
          header: {
            returnNumber: `RET-PAY-${pay.id}`,
            vendorId: vId,
            returnDate: new Date().toISOString().slice(0, 10),
            subsidiary_id: String(header.subsidiary_id || ""),
            class_id: String(header.class_id || ""),
            department_id: String(header.department_id || ""),
            location_id: String(header.location_id || ""),
            currency_id: String(header.currency_id || ""),
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
    } else if (poIdParam) {
      const po = purchaseOrders.find((x: any) => String(x.id) === String(poIdParam));
      if (po) {
        const header = po.header ?? po;
        const poLines = po.purchaseOrderLines || po.lines || po.details || [];
        const vId = String(header.vendorId || header.vendor_id || "");

        const mappedLines = poLines.map((l: any) => {
          const itemObj = items.find((i: any) => String(i.id) === String(l.itemId || l.item_id));
          const qty = Number(l.quantity || l.qty || 1);
          const price = Number(l.unitPrice || l.unit_price || l.rate || 0);
          return {
            itemId: String(l.itemId || l.item_id || ""),
            location_id: String(l.location_id || l.city_id || header.location_id || header.city_id || citiesList[0]?.id || ""),
            orderedQty: qty,
            uom_id: String(l.uom_id || itemObj?.uom_id || ""),
            returnQty: qty,
            unitPrice: price,
            lineTotal: Number((qty * price).toFixed(2)),
            remarks: l.remarks || `Return from PO #${header.poNumber || po.id}`,
          };
        });

        formik.setValues({
          header: {
            returnNumber: `RET-PO-${po.id}`,
            vendorId: vId,
            returnDate: new Date().toISOString().slice(0, 10),
            subsidiary_id: String(header.subsidiary_id || ""),
            class_id: String(header.class_id || ""),
            department_id: String(header.department_id || ""),
            location_id: String(header.location_id || header.city_id || ""),
            currency_id: String(header.currency_id || ""),
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
    } else if (urlAction === "create") {
      setViewMode("form");
      setIsEdit(false);
    } else if (urlId && urlAction === "view") {
      const ret = purchaseReturns.find((r: any) => String(r.id) === String(urlId));
      if (ret) {
        setSelectedReturn(ret);
        setViewMode("view");
      }
    }
  }, [searchParams, purchaseReturns, purchaseInvoices, purchasePayments, purchaseOrders, items]);

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = e.target.value;
    formik.setFieldValue("header.vendorId", vendorId);

    const selectedVendor = vendors.find((v: any) => String(v.id) === String(vendorId));
    if (selectedVendor) {
      const subId = selectedVendor.primary_subsidiary_id ?? selectedVendor.primarySubsidiary?.id ?? selectedVendor.subsidiary_id ?? selectedVendor.subsidiary?.id ?? subsidiaries[0]?.id;
      if (subId) formik.setFieldValue("header.subsidiary_id", String(subId));

      const currId = selectedVendor.currency_id ?? selectedVendor.currency?.id ?? currencies[0]?.id;
      if (currId) formik.setFieldValue("header.currency_id", String(currId));

      const classId = selectedVendor.class_id ?? selectedVendor.class?.id ?? classesList[0]?.id;
      if (classId) formik.setFieldValue("header.class_id", String(classId));

      const deptId = selectedVendor.department_id ?? selectedVendor.department?.id ?? departmentsList[0]?.id;
      if (deptId) formik.setFieldValue("header.department_id", String(deptId));

      const primaryAddr = selectedVendor.addressBook?.find((a: any) => a.default_billing) || selectedVendor.addressBook?.[0];
      const cityId = primaryAddr?.city_id ?? primaryAddr?.city?.id ?? selectedVendor.city_id ?? selectedVendor.city?.id ?? citiesList[0]?.id;
      if (cityId) {
        formik.setFieldValue("header.location_id", String(cityId));
        // Set location for line items if empty
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
    lineItems[idx] = {
      ...lineItems[idx],
      itemId,
      uom_id: String(item?.uom_id || ""),
      unitPrice: Number(item?.purchase_price || item?.cost_price || item?.default_rate || 0),
      lineTotal: Number((Number(lineItems[idx].returnQty || 1) * Number(item?.purchase_price || item?.cost_price || 0)).toFixed(2)),
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

    const updatedLine = { ...lineItems[idx], [field]: newValue };
    const rQty = Number(updatedLine.returnQty) || 0;
    const uPrice = Number(updatedLine.unitPrice) || 0;
    updatedLine.lineTotal = Number((rQty * uPrice).toFixed(2));

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

    const vendorObj = activeHeader.vendor || vendors.find((v: any) => String(v.id) === String(activeHeader.vendorId || activeHeader.vendor_id || selectedReturn?.vendorId));
    const vendorName = getVendorDisplayName(vendorObj);
    const subIdVal = activeHeader.subsidiary_id || vendorObj?.primary_subsidiary_id || vendorObj?.subsidiary_id;
    const subsidiaryName = activeHeader.subsidiary?.subsidiary_name || subsidiaries.find((s: any) => String(s.id) === String(subIdVal))?.subsidiary_name || "—";
    const classIdVal = activeHeader.class_id || vendorObj?.class_id;
    const classNameVal = activeHeader.class?.class_name || classesList.find((c: any) => String(c.id) === String(classIdVal))?.class_name || "—";
    const deptIdVal = activeHeader.department_id || vendorObj?.department_id;
    const deptNameVal = activeHeader.department?.department_name || departmentsList.find((d: any) => String(d.id) === String(deptIdVal))?.department_name || "—";
    const locIdVal = activeHeader.location_id || activeHeader.city_id;
    const locNameVal = activeHeader.location?.city_name || citiesList.find((c: any) => String(c.id) === String(locIdVal))?.city_name || "—";
    const currIdVal = activeHeader.currency_id || vendorObj?.currency_id;
    const currencyObj = currencies.find((c: any) => String(c.id) === String(currIdVal));

    const totalReturnAmt = activeLines.reduce((acc: number, l: any) => {
      const q = Number(l.returnQty || l.return_quantity || l.quantity || 0);
      const p = Number(l.unitPrice || l.unit_price || 0);
      return acc + (q * p);
    }, 0);

    const retNoStr = activeHeader.returnNumber || activeHeader.return_number || `RET-${selectedReturn?.id || "NEW"}`;

    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
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
                {String(activeHeader.status || selectedReturn?.status || "DRAFT").toUpperCase() === "DRAFT" && (
                  <button
                    type="button"
                    onClick={() => handleAuthorizeReturn(selectedReturn.id)}
                    className="bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    Authorize Return
                  </button>
                )}
                {["AUTHORIZED", "APPROVED", "PARTIALLY_FULFILLED"].includes(String(activeHeader.status || selectedReturn?.status || "").toUpperCase()) && (
                  <button
                    type="button"
                    onClick={() => navigate(`/return-fulfillment?returnId=${selectedReturn.id}`)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    Fulfill Return
                  </button>
                )}
                {String(activeHeader.status || selectedReturn?.status || "").toUpperCase() === "FULFILLED" && (
                  <button
                    type="button"
                    disabled={true}
                    className="bg-slate-200 text-slate-500 text-xs font-semibold px-3 py-1 rounded-xs cursor-not-allowed border border-slate-300"
                    title="Purchase return is already fulfilled"
                  >
                    Fulfilled
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/debit-note?returnId=${selectedReturn.id}`)}
                  className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Debit Note
                </button>
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
                          <th className="p-2 border-r border-slate-400 w-24 text-right">ORDERED QTY</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">RETURN QTY *</th>
                          <th className="p-2 border-r border-slate-400 w-28 text-right">UNIT PRICE (₹)</th>
                          <th className="p-2 border-r border-slate-400 w-28 text-right">LINE TOTAL (₹)</th>
                          <th className="p-2 border-r border-slate-400 min-w-[150px]">REMARKS</th>
                          {!isView && <th className="p-2 w-10 text-center">ACTION</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {activeLines.map((line: any, idx: number) => {
                          const itemObj = items.find((i: any) => String(i.id) === String(line.itemId || line.item_id));
                          const selectedUom = uoms.find((u: any) => String(u.id) === String(line.uom_id || itemObj?.uom_id));
                          const allowsDecimals = isDecimalAllowedForUOM(selectedUom);

                          if (isView) {
                            const rQty = Number(line.returnQty || line.return_quantity || line.quantity || 0);
                            const ordQty = Number(line.orderedQty ?? line.returnQty ?? 0);
                            const uPrice = Number(line.unitPrice || line.unit_price || 0);
                            const lTotal = Number(line.lineTotal || line.line_total || (rQty * uPrice));

                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                                <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{line.item?.item_name || itemObj?.item_name || `Item #${line.itemId}`}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700">{ordQty}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-red-600">{rQty}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono">₹{uPrice.toFixed(2)}</td>
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
            ...(isView
              ? [
                  {
                    id: "gl_impact",
                    label: "GL Impact",
                    content: (() => {
                      const retLines = activeHeader.returnLines || activeHeader.lines || activeHeader.details || [];
                      const entries: any[] = [];
                      let totalDebitSum = 0;

                      retLines.forEach((l: any) => {
                        const itemObj = itemsList.find((i: any) => String(i.id) === String(l.itemId || l.item_id || l.item?.id)) || l.item;
                        const itemName = itemObj?.item_name || l.item_name || `Item #${l.itemId || l.id}`;
                        const qty = Number(l.quantity || 0);
                        const unitPrice = Number(l.unitPrice || l.unit_price || l.rate || 0);
                        const lineAmt = Number((qty * unitPrice).toFixed(2));

                        if (lineAmt > 0) {
                          totalDebitSum += lineAmt;
                          entries.push({
                            accountCode: itemObj?.asset_account?.account_number || "1100",
                            accountName: itemObj?.asset_account?.account_name || `Inventory Asset - ${itemName}`,
                            debit: 0,
                            credit: lineAmt,
                            memo: `Return Outward: ${itemName} (Qty: ${qty} @ ₹${unitPrice})`,
                          });
                        }
                      });

                      const finalTotal = totalDebitSum > 0 ? Number(totalDebitSum.toFixed(2)) : Number((totalReturnAmt || 0).toFixed(2));
                      if (entries.length === 0 && finalTotal > 0) {
                        entries.push({
                          accountCode: "1100",
                          accountName: "Inventory Asset / Return Outward",
                          debit: 0,
                          credit: finalTotal,
                          memo: `Return Outward #${retNoStr}`,
                        });
                      }

                      entries.unshift({
                        accountCode: "2100",
                        accountName: "Accounts Payable (Vendor Return Settlement)",
                        debit: finalTotal,
                        credit: 0,
                        memo: `Vendor Return Debit Note - #${retNoStr}`,
                      });

                      return <GLImpactSubtab documentNumber={retNoStr} entries={entries} />;
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
                        className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                          formik.touched.header?.vendorId && formik.errors.header?.vendorId ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
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
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                    <span className="uppercase text-[11px]">TOTAL RETURN</span>
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
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-300">
        <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Purchase Return Authorizations</h1>
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
                      <span className="text-slate-300">|</span>
                      {retStatus === "DRAFT" ? (
                        <button onClick={() => handleAuthorizeReturn(ret.id)} className="text-sky-700 font-bold hover:underline cursor-pointer" title="Authorize Purchase Return">
                          Authorize
                        </button>
                      ) : retStatus === "FULFILLED" ? (
                        <span className="text-slate-300 cursor-not-allowed font-normal" title="Purchase return is already fulfilled">Fulfill</span>
                      ) : (
                        <button onClick={() => navigate(`/return-fulfillment?returnId=${ret.id}`)} className="text-emerald-700 font-bold hover:underline cursor-pointer">
                          Fulfill
                        </button>
                      )}
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
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                        isDraftReturn
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : retStatus === "FULFILLED" || retStatus === "APPROVED" || retStatus === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-red-100 text-red-800 border-red-200"
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
