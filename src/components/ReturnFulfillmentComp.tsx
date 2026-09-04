import { useGetJournalEntryByIdQuery } from "../RTK/services/journalEntryApi";
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Add, Delete, Edit, Search, List as ListIcon, KeyboardArrowDown, KeyboardArrowUp, CheckBox, CheckBoxOutlineBlank, ReceiptLong, LocalShipping, AssignmentReturn } from "@mui/icons-material";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import * as Yup from "yup";

import { useGetVendorsQuery } from "../RTK/services/vendorApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetClassesQuery } from "../RTK/services/classApi";
import { useGetDepartmentsQuery } from "../RTK/services/departmentApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetUOMsQuery } from "../RTK/services/uomApi";
import { useGetInventoryQuery } from "../RTK/services/inventoryApi";
import { useGetChartOfAccountsQuery } from "../RTK/services/chartOfAccountApi";
import { useGetDebitNotesQuery } from "../RTK/services/debitNoteApi";
import { useAppSelector } from "../Hooks/Reduxhook/hooks";
import { usePermissions } from "../Hooks/usePermissions";

import {
  useGetPurchaseReturnsQuery,
  useLazyGetPurchaseReturnByIdQuery,
  useGetReturnFulfillmentsQuery,
  useLazyGetReturnFulfillmentByIdQuery,
  useCreateReturnFulfillmentMutation,
  useGetPurchaseOrdersQuery,
  useGetPurchaseInvoicesQuery,
} from "../RTK/services/purchaseApi";

import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";
import { GLImpactSubtab } from "./Layout/GLImpactSubtab";

interface ReturnFulfillmentLineForm {
  purchaseReturnLineId: string;
  itemId: string;
  fulfill: boolean;
  itemDescription?: string;
  uom_id?: string;
  returnQty: number;
  remainingQty: number;
  fulfilledQty: number;
  unitPrice: number;
  warehouseId: string;
  batchNo: string;
  serialNo: string;
  remarks: string;
}

const emptyLineItem = (): ReturnFulfillmentLineForm => ({
  purchaseReturnLineId: "",
  itemId: "",
  fulfill: true,
  itemDescription: "",
  uom_id: "",
  returnQty: 0,
  remainingQty: 0,
  fulfilledQty: 1,
  unitPrice: 0,
  warehouseId: "",
  batchNo: "",
  serialNo: "",
  remarks: "",
});

const isDecimalAllowedForUOM = (uomObj: any) => {
  if (!uomObj) return true;
  const name = String(uomObj.uom_name || uomObj.name || uomObj.uom_symbol || "").toUpperCase();
  const integerUOMs = ["EACH", "PCS", "PIECE", "PIECES", "NOS", "NUMBER", "NUMBERS", "BOX", "BOXES", "UNIT", "UNITS", "SET", "SETS", "PACK", "PACKS", "BAG", "BAGS", "BOTTLE", "BOTTLES", "CAN", "CANS", "DRUM", "DRUMS", "CARTON", "CARTONS"];
  return !integerUOMs.some((u) => name.includes(u));
};

const getPostingPeriod = (dateStr: string) => {
  if (!dateStr) return "Sep 2026";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Sep 2026";
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${month} ${year}`;
};

export default function ReturnFulfillmentComp() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canRead, canCreate, canUpdate } = usePermissions();
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const userId = currentUser?.id ?? "";

  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [selectedFulfillment, setSelectedFulfillment] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Eager Queries
  const { data: fulfillmentsData, refetch: refetchFulfillments } = useGetReturnFulfillmentsQuery({ page: 1, limit: 100 });
  const { data: debitNotesData } = useGetDebitNotesQuery({ page: 1, limit: 500 });
  const { data: purchaseReturnsData, refetch: refetchPurchaseReturns } = useGetPurchaseReturnsQuery({ page: 1, limit: 100 });
  const { data: vendorsData } = useGetVendorsQuery({ page: 1, option: true });
  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 1000 });
  const { data: subsidiariesData } = useGetSubsidiariesQuery(undefined);
  const { data: classesData } = useGetClassesQuery(undefined);
  const { data: departmentsData } = useGetDepartmentsQuery(undefined);
  const { data: citiesData } = useGetCitiesQuery(undefined);
  const { data: uomsData } = useGetUOMsQuery(undefined);
  const { data: inventoryData } = useGetInventoryQuery({ page: 1, limit: 1000 });
  const { data: chartOfAccountsData } = useGetChartOfAccountsQuery(undefined);
  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery(undefined);
  const { data: purchaseInvoicesData } = useGetPurchaseInvoicesQuery(undefined);

  const [createReturnFulfillment, { isLoading: isCreating }] = useCreateReturnFulfillmentMutation();
  const activeFulfillmentId = (viewMode === "view" || isEdit) ? (selectedFulfillment?.id || editId) : null;
  const numFulfillmentId = Number(activeFulfillmentId);
  const isValidFulfillmentId = Boolean(activeFulfillmentId && !isNaN(numFulfillmentId) && numFulfillmentId > 0);
  const { data: journalEntryData } = useGetJournalEntryByIdQuery(
    { id: numFulfillmentId || 0, source: "purchasereturnfulfillment" },
    { skip: !isValidFulfillmentId }
  );
  const [triggerGetPurchaseReturnById] = useLazyGetPurchaseReturnByIdQuery();
  const [triggerGetFulfillmentById] = useLazyGetReturnFulfillmentByIdQuery();

  const fulfillments = useMemo(() => (Array.isArray(fulfillmentsData?.result) ? fulfillmentsData.result : Array.isArray(fulfillmentsData?.data) ? fulfillmentsData.data : Array.isArray(fulfillmentsData?.result?.rows) ? fulfillmentsData.result.rows : Array.isArray(fulfillmentsData) ? fulfillmentsData : []), [fulfillmentsData]);
  const purchaseOrders = useMemo(() => (Array.isArray(purchaseOrdersData?.result) ? purchaseOrdersData.result : Array.isArray(purchaseOrdersData?.data) ? purchaseOrdersData.data : Array.isArray(purchaseOrdersData) ? purchaseOrdersData : []), [purchaseOrdersData]);
  const invoices = useMemo(() => (Array.isArray(purchaseInvoicesData?.result) ? purchaseInvoicesData.result : Array.isArray(purchaseInvoicesData?.data) ? purchaseInvoicesData.data : Array.isArray(purchaseInvoicesData) ? purchaseInvoicesData : []), [purchaseInvoicesData]);
  const purchaseReturns = useMemo(() => (Array.isArray(purchaseReturnsData?.result) ? purchaseReturnsData.result : Array.isArray(purchaseReturnsData?.data) ? purchaseReturnsData.data : Array.isArray(purchaseReturnsData) ? purchaseReturnsData : []), [purchaseReturnsData]);
  const vendors = useMemo(() => (Array.isArray(vendorsData?.result) ? vendorsData.result : Array.isArray(vendorsData?.data) ? vendorsData.data : Array.isArray(vendorsData) ? vendorsData : []), [vendorsData]);
  const items = useMemo(() => (Array.isArray(itemsData?.result) ? itemsData.result : Array.isArray(itemsData?.data) ? itemsData.data : Array.isArray(itemsData) ? itemsData : []), [itemsData]);
  const debitNotes = useMemo(() => (Array.isArray(debitNotesData?.result) ? debitNotesData.result : Array.isArray(debitNotesData?.data) ? debitNotesData.data : Array.isArray(debitNotesData?.result?.rows) ? debitNotesData.result.rows : Array.isArray(debitNotesData) ? debitNotesData : []), [debitNotesData]);
  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : Array.isArray(subsidiariesData?.data) ? subsidiariesData.data : Array.isArray(subsidiariesData) ? subsidiariesData : [];
  const classesList = Array.isArray(classesData?.result) ? classesData.result : Array.isArray(classesData?.data) ? classesData.data : Array.isArray(classesData) ? classesData : [];
  const departmentsList = Array.isArray(departmentsData?.result) ? departmentsData.result : Array.isArray(departmentsData?.data) ? departmentsData.data : Array.isArray(departmentsData) ? departmentsData : [];
  const citiesList = Array.isArray(citiesData?.result) ? citiesData.result : Array.isArray(citiesData?.data) ? citiesData.data : Array.isArray(citiesData) ? citiesData : [];
  const cities = citiesList;
  const uoms = Array.isArray(uomsData?.result) ? uomsData.result : Array.isArray(uomsData?.data) ? uomsData.data : Array.isArray(uomsData) ? uomsData : [];
  const accounts = Array.isArray(chartOfAccountsData?.result) ? chartOfAccountsData.result : Array.isArray(chartOfAccountsData?.data) ? chartOfAccountsData.data : Array.isArray(chartOfAccountsData) ? chartOfAccountsData : [];
  const inventoryList = useMemo(() => (
    Array.isArray(inventoryData?.result?.inventory)
      ? inventoryData.result.inventory
      : Array.isArray(inventoryData?.result?.items)
        ? inventoryData.result.items
        : Array.isArray(inventoryData?.result)
          ? inventoryData.result
          : Array.isArray(inventoryData?.data)
            ? inventoryData.data
            : Array.isArray(inventoryData)
              ? inventoryData
              : []
  ), [inventoryData]);

  const formik = useFormik({
    initialValues: {
      header: {
        customForm: "Standard Item Fulfillment",
        fulfillmentNumber: "",
        purchaseReturnHeaderId: "",
        fulfillmentDate: new Date().toISOString().slice(0, 10),
        postingPeriod: getPostingPeriod(new Date().toISOString().slice(0, 10)),
        subsidiary_id: "",
        class_id: "",
        department_id: "",
        location_id: "",
        status: "FULFILLED",
        remarks: "",
        user_id: userId,
      },
      lineItems: [emptyLineItem()],
    },
    validationSchema: Yup.object().shape({
      header: Yup.object({
        purchaseReturnHeaderId: Yup.string().required("Purchase Return Reference is required"),
        fulfillmentDate: Yup.string().required("Fulfillment Date is required"),
        location_id: Yup.string().required("Location is required"),
      }),
      lineItems: Yup.array().of(
        Yup.object({
          fulfilledQty: Yup.number().positive("Qty must be > 0"),
          warehouseId: Yup.string().required("Location is required for each line item"),
        })
      ).min(1, "At least one item line is required"),
    }),
    onSubmit: async (values) => {
      try {
        if (!values.header.purchaseReturnHeaderId) {
          toast.error("Purchase Return Authorization reference is required to fulfill items.");
          return;
        }
        if (!values.header.location_id) {
          toast.error("Location is required.");
          return;
        }

        const activeLines = values.lineItems.filter((l: any) => l.fulfill);
        if (activeLines.length === 0) {
          toast.error("Please mark at least one item line to fulfill.");
          return;
        }

        for (let i = 0; i < activeLines.length; i++) {
          const line = activeLines[i];
          if (!line.warehouseId) {
            toast.error(`Location is required for line ${i + 1}.`);
            return;
          }
          if (Number(line.fulfilledQty) <= 0) {
            toast.error(`Fulfilled Quantity for line ${i + 1} must be greater than zero.`);
            return;
          }
          if (Number(line.fulfilledQty) > Number(line.remainingQty || line.returnQty)) {
            toast.error(`Quantity for line ${i + 1} (${line.fulfilledQty}) exceeds remaining authorized quantity (${line.remainingQty || line.returnQty}).`);
            return;
          }
          const uomObj = uoms.find((u: any) => String(u.id) === String(line.uom_id));
          if (uomObj && !isDecimalAllowedForUOM(uomObj) && Number(line.fulfilledQty) % 1 !== 0) {
            toast.error(`Quantity for line ${i + 1} (${uomObj.uom_name || uomObj.name}) must be a whole number.`);
            return;
          }
        }

        const payload = {
          header: {
            ...values.header,
            location_id: values.header.location_id,
            user_id: userId,
          },
          lineItems: activeLines.map((l: any) => ({
            purchaseReturnLineId: l.purchaseReturnLineId,
            itemId: l.itemId,
            fulfilledQty: Number(l.fulfilledQty),
            unitPrice: Number(l.unitPrice || 0),
            warehouseId: Number(l.warehouseId || values.header.location_id),
            batchNo: l.batchNo || null,
            serialNo: l.serialNo || null,
            remarks: l.remarks || null,
          })),
        };

        const res = await createReturnFulfillment(payload).unwrap();
        toast.success("Item Return Fulfillment saved successfully (Stock Outward recorded).");
        
        refetchFulfillments();
        refetchPurchaseReturns();

        const createdItem = res?.result || res?.data || res;
        const createdId = createdItem?.id;

        if (createdId) {
          setSelectedFulfillment(createdItem);
          setViewMode("view");
          setIsEdit(false);
          setSearchParams({ id: String(createdId), action: "view" });
        } else {
          setSelectedFulfillment({
            id: values.header.fulfillmentNumber || "PRF-NEW",
            header: values.header,
            lineItems: activeLines,
            purchaseReturnHeaderId: values.header.purchaseReturnHeaderId,
          });
          setViewMode("view");
          setIsEdit(false);
        }
      } catch (error: any) {
        toast.error(error?.data?.message || "Failed to record Return Fulfillment.");
      }
    },
  });

  const getOnHandQty = (itemId: number | string, locId?: number | string) => {
    if (!itemId || !inventoryList.length) return 0;
    const matches = inventoryList.filter((inv: any) => {
      const iId = inv.item_id || inv.itemId || inv.item?.id;
      if (String(iId) !== String(itemId)) return false;
      if (locId) {
        const wId = inv.warehouseId || inv.warehouse_id || inv.location_id;
        return String(wId) === String(locId);
      }
      return true;
    });
    if (matches.length > 0) {
      return matches.reduce((sum: number, m: any) => sum + Number(m.qty || 0), 0);
    }
    const itemObj = items.find((i: any) => String(i.id) === String(itemId));
    return Number(itemObj?.current_stock || itemObj?.opening_stock || 0);
  };

  const selectedReturnId = formik.values.header.purchaseReturnHeaderId;

  useEffect(() => {
    const returnId = searchParams.get("returnId");
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (id && (action === "view" || action === "edit")) {
      triggerGetFulfillmentById(id)
        .unwrap()
        .then((res: any) => {
          const f = res?.result || res?.data || res;
          if (f) {
            setSelectedFulfillment(f);
            if (action === "edit") {
              setIsEdit(true);
              setEditId(id);
              setViewMode("form");
            } else {
              setIsEdit(false);
              setEditId(null);
              setViewMode("view");
            }
          }
        })
        .catch(() => {
          const f = fulfillments.find((x: any) => String(x.id) === String(id));
          if (f) {
            setSelectedFulfillment(f);
            if (action === "edit") {
              setIsEdit(true);
              setEditId(id);
              setViewMode("form");
            } else {
              setIsEdit(false);
              setEditId(null);
              setViewMode("view");
            }
          }
        });
    } else if (returnId) {
      setViewMode("form");
      setIsEdit(false);
      setEditId(null);
      formik.setFieldValue("header.purchaseReturnHeaderId", String(returnId));

      triggerGetPurchaseReturnById(returnId)
        .unwrap()
        .then((res: any) => {
          const parentReturn = res?.result || res?.data || res;
          if (!parentReturn) return;

          const pHeader = parentReturn.header || parentReturn;
          const statusVal = String(pHeader.status || parentReturn.status || "").toUpperCase();
          if (statusVal === "DRAFT") {
            toast.error(`Purchase Return #${pHeader.returnNumber || pHeader.return_number || returnId} is in DRAFT status. It must be AUTHORIZED before fulfillment.`);
            setViewMode("list");
            setSearchParams({});
            return;
          }
          if (statusVal === "FULFILLED" || statusVal === "RETURNED") {
            toast.error(`Purchase Return #${pHeader.returnNumber || pHeader.return_number || returnId} is already FULFILLED.`);
            setViewMode("list");
            setSearchParams({});
            return;
          }

          const defaultLocId = String(pHeader.location_id || pHeader.city_id || cities[0]?.id || "");
          if (defaultLocId) formik.setFieldValue("header.location_id", defaultLocId);

          if (pHeader.subsidiary_id) formik.setFieldValue("header.subsidiary_id", String(pHeader.subsidiary_id));
          if (pHeader.class_id) formik.setFieldValue("header.class_id", String(pHeader.class_id));
          if (pHeader.department_id) formik.setFieldValue("header.department_id", String(pHeader.department_id));

          const parentLines = parentReturn.details || parentReturn.lineItems || parentReturn.purchaseReturnLines || parentReturn.purchase_return_lines || [];
          if (parentLines.length > 0) {
            const mapped = parentLines.map((l: any) => {
              const iId = String(l.itemId || l.item_id || "");
              const itemObj = items.find((i: any) => String(i.id) === iId);
              const authorizedQty = Number(l.returnQty || l.return_quantity || l.quantity || 1);
              const alreadyFulfilled = Number(l.fulfilledQty || l.fulfilled_quantity || 0);
              const remaining = Math.max(0, authorizedQty - alreadyFulfilled);
              const uPrice = Number(l.unitPrice || l.unit_price || l.rate || 0);
              const lineLoc = String(l.locationId || l.warehouseId || defaultLocId);

              return {
                purchaseReturnLineId: String(l.id || ""),
                itemId: iId,
                fulfill: true,
                itemDescription: itemObj?.description || itemObj?.item_name || "",
                uom_id: String(l.uom_id || itemObj?.uom_id || ""),
                returnQty: authorizedQty,
                remainingQty: remaining,
                fulfilledQty: remaining > 0 ? remaining : authorizedQty,
                unitPrice: uPrice,
                warehouseId: lineLoc,
                batchNo: l.batchNo || "",
                serialNo: l.serialNo || "",
                remarks: l.remarks || "",
              };
            });
            formik.setFieldValue("lineItems", mapped);
          }
        })
        .catch((err: any) => {
          console.error("Failed to fetch Purchase Return by ID for fulfillment:", err);
        });
    } else if (action === "create" && !returnId) {
      toast.error("Item Fulfillment must be created from an Authorized Purchase Return.");
      setViewMode("list");
      setSearchParams({});
    }
  }, [searchParams, items, cities]);

  useEffect(() => {
    if (viewMode !== "form" || !selectedReturnId || isEdit) return;
    const parentReturn = purchaseReturns.find((r: any) => String(r.id) === String(selectedReturnId));
    if (!parentReturn) return;

    const pHeader = parentReturn.header || parentReturn;
    const statusVal = String(pHeader.status || parentReturn.status || "").toUpperCase();
    if (statusVal === "DRAFT") {
      toast.error(`Purchase Return #${pHeader.returnNumber || pHeader.return_number || selectedReturnId} is in DRAFT status. It must be AUTHORIZED before fulfillment.`);
      setViewMode("list");
      setSearchParams({});
      return;
    }
    if (statusVal === "FULFILLED" || statusVal === "RETURNED") {
      toast.error(`Purchase Return #${pHeader.returnNumber || pHeader.return_number || selectedReturnId} is already FULFILLED.`);
      setViewMode("list");
      setSearchParams({});
      return;
    }

    const defaultLocId = String(pHeader.location_id || pHeader.city_id || cities[0]?.id || "");
    if (defaultLocId) formik.setFieldValue("header.location_id", defaultLocId);

    if (pHeader.subsidiary_id) formik.setFieldValue("header.subsidiary_id", String(pHeader.subsidiary_id));
    if (pHeader.class_id) formik.setFieldValue("header.class_id", String(pHeader.class_id));
    if (pHeader.department_id) formik.setFieldValue("header.department_id", String(pHeader.department_id));

    const parentLines = parentReturn.details || parentReturn.lineItems || parentReturn.purchaseReturnLines || parentReturn.purchase_return_lines || [];
    if (parentLines.length > 0) {
      const mapped = parentLines.map((l: any) => {
        const iId = String(l.itemId || l.item_id || "");
        const itemObj = items.find((i: any) => String(i.id) === iId);
        const authorizedQty = Number(l.returnQty || l.return_quantity || l.quantity || 1);
        const alreadyFulfilled = Number(l.fulfilledQty || l.fulfilled_quantity || 0);
        const remaining = Math.max(0, authorizedQty - alreadyFulfilled);
        const uPrice = Number(l.unitPrice || l.unit_price || l.rate || 0);
        const lineLoc = String(l.locationId || l.warehouseId || defaultLocId);

        return {
          purchaseReturnLineId: String(l.id || ""),
          itemId: iId,
          fulfill: true,
          itemDescription: itemObj?.description || itemObj?.item_name || "",
          uom_id: String(l.uom_id || itemObj?.uom_id || ""),
          returnQty: authorizedQty,
          remainingQty: remaining,
          fulfilledQty: remaining > 0 ? remaining : authorizedQty,
          unitPrice: uPrice,
          warehouseId: lineLoc,
          batchNo: l.batchNo || "",
          serialNo: l.serialNo || "",
          remarks: l.remarks || "",
        };
      });
      formik.setFieldValue("lineItems", mapped);
    }
  }, [selectedReturnId, purchaseReturns, items, cities, viewMode, isEdit]);

  const handleHeaderLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locId = e.target.value;
    formik.setFieldValue("header.location_id", locId);
    const updatedLines = formik.values.lineItems.map((l) => ({
      ...l,
      warehouseId: locId,
    }));
    formik.setFieldValue("lineItems", updatedLines);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    formik.setFieldValue("header.fulfillmentDate", dateVal);
    formik.setFieldValue("header.postingPeriod", getPostingPeriod(dateVal));
  };

  const updateLineItemField = (idx: number, field: string, value: any) => {
    const lineItems = [...formik.values.lineItems];
    let newValue = value;

    if (field === "fulfilledQty" && newValue !== "") {
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

    lineItems[idx] = { ...lineItems[idx], [field]: newValue };
    formik.setFieldValue("lineItems", lineItems);
  };

  const handleMarkAll = () => {
    const updated = formik.values.lineItems.map((l) => ({ ...l, fulfill: true }));
    formik.setFieldValue("lineItems", updated);
  };

  const handleUnmarkAll = () => {
    const updated = formik.values.lineItems.map((l) => ({ ...l, fulfill: false }));
    formik.setFieldValue("lineItems", updated);
  };

  const handleView = (id: number | string) => {
    const item = fulfillments.find((x: any) => String(x.id) === String(id));
    if (item) {
      setSelectedFulfillment(item);
      setViewMode("view");
      setIsEdit(false);
      setSearchParams({ id: String(id), action: "view" });
    }
  };

  const handleEdit = (id: number | string) => {
    const item = fulfillments.find((x: any) => String(x.id) === String(id));
    if (item) {
      setSelectedFulfillment(item);
      const h = item.header || item;
      formik.setValues({
        header: {
          customForm: "Standard Item Fulfillment",
          fulfillmentNumber: h.fulfillmentNumber || "",
          purchaseReturnHeaderId: String(h.purchaseReturnHeaderId || item.purchaseReturnHeaderId || ""),
          fulfillmentDate: h.fulfillmentDate ? new Date(h.fulfillmentDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          postingPeriod: getPostingPeriod(h.fulfillmentDate),
          subsidiary_id: String(h.subsidiary_id || ""),
          class_id: String(h.class_id || ""),
          department_id: String(h.department_id || ""),
          location_id: String(h.location_id || h.warehouseId || ""),
          status: h.status || "FULFILLED",
          remarks: h.remarks || "",
          user_id: userId,
        },
        lineItems: (item.lineItems || item.fulfillmentLines || item.details || []).map((l: any) => ({
          purchaseReturnLineId: String(l.purchaseReturnLineId || ""),
          itemId: String(l.itemId || l.item_id || ""),
          fulfill: true,
          itemDescription: l.itemDescription || l.item?.description || "",
          uom_id: String(l.uom_id || ""),
          returnQty: Number(l.returnQty || l.fulfilledQty || 1),
          remainingQty: Number(l.remainingQty || l.fulfilledQty || 1),
          fulfilledQty: Number(l.fulfilledQty || l.fulfilled_quantity || 1),
          unitPrice: Number(l.unitPrice || l.unit_price || 0),
          warehouseId: String(l.warehouseId || l.location_id || h.location_id || ""),
          batchNo: l.batchNo || "",
          serialNo: l.serialNo || "",
          remarks: l.remarks || "",
        })),
      });
      setIsEdit(true);
      setEditId(id);
      setViewMode("form");
      setSearchParams({ id: String(id), action: "edit" });
    }
  };

  if (!canRead("purchase_return")) {
    return <div className="p-8 text-center text-red-600 font-bold">Access Denied: You do not have permission to view Item Return Fulfillments.</div>;
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
        onClick={() => { setViewMode("list"); setSearchParams({}); }}
        className="px-3 py-1 rounded-xs bg-[#244b5a] text-white shadow-2xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
      >
        <LocalShipping className="!w-3.5 !h-3.5 text-sky-200" />
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

  // ── RENDER 1: FORM & VIEW MODE ──
  if (viewMode === "form" || viewMode === "view") {
    const isView = viewMode === "view";
    const activeHeader = isView ? selectedFulfillment?.header || selectedFulfillment || {} : formik.values.header;
    const activeLines = isView
      ? selectedFulfillment?.lineItems || selectedFulfillment?.fulfillmentLines || selectedFulfillment?.details || []
      : formik.values.lineItems;

    const returnIdVal = activeHeader.purchaseReturnHeaderId || selectedFulfillment?.purchaseReturnHeaderId;
    const parentReturn = purchaseReturns.find((r: any) => String(r.id) === String(returnIdVal));
    const parentReturnHeader = parentReturn?.header || parentReturn;
    const invId = parentReturnHeader?.purchaseInvoiceHeaderId || parentReturnHeader?.purchase_invoice_header_id || parentReturnHeader?.invoiceId;
    const parentInvoice = invoices.find((i: any) => String(i.id) === String(invId));
    const invH = parentInvoice?.header ?? parentInvoice;
    const poId = parentReturnHeader?.purchaseOrderId || parentReturnHeader?.purchase_order_id || invH?.purchaseOrderHeaderId || invH?.poHeaderId || invH?.po_header_id;
    const parentPo = purchaseOrders.find((p: any) => String(p.id) === String(poId));
    const poH = parentPo?.header ?? parentPo;

    const returnNumberStr = parentReturnHeader?.returnNumber || parentReturnHeader?.return_number || (returnIdVal ? `RET-${returnIdVal}` : "—");
    const vendorObj = parentReturnHeader?.vendor || vendors.find((v: any) => String(v.id) === String(parentReturnHeader?.vendorId || parentReturnHeader?.vendor_id || selectedFulfillment?.vendorId || poH?.vendorId));
    const vendorName = getVendorDisplayName(vendorObj);

    const subIdVal = activeHeader.subsidiary_id || poH?.subsidiary_id || poH?.subsidiaryId || parentReturnHeader?.subsidiary_id || invH?.subsidiary_id || vendorObj?.primary_subsidiary_id;
    const subsidiaryName = activeHeader.subsidiary?.subsidiary_name || subsidiaries.find((s: any) => String(s.id) === String(subIdVal))?.subsidiary_name || poH?.subsidiary?.subsidiary_name || poH?.subsidiary?.name || "—";

    const classIdVal = activeHeader.class_id || poH?.class_id || poH?.classId || parentReturnHeader?.class_id || invH?.class_id;
    const classNameVal = activeHeader.class?.class_name || classesList.find((c: any) => String(c.id) === String(classIdVal))?.class_name || poH?.class?.class_name || "—";

    const deptIdVal = activeHeader.department_id || poH?.department_id || poH?.departmentId || parentReturnHeader?.department_id || invH?.department_id;
    const deptNameVal = activeHeader.department?.department_name || departmentsList.find((d: any) => String(d.id) === String(deptIdVal))?.department_name || poH?.department?.department_name || "—";

    const locIdVal = activeHeader.location_id || activeHeader.warehouseId || activeHeader.city_id || poH?.city_id || poH?.cityId || poH?.location_id || parentReturnHeader?.location_id || invH?.location_id;
    const locObj = cities.find((c: any) => String(c.id) === String(locIdVal));
    const locNameVal = locObj?.city_name || locObj?.name || poH?.city?.city_name || poH?.city?.name || poH?.location?.city_name || "—";

    const totalFulfilledQty = activeLines
      .filter((l: any) => isView || l.fulfill)
      .reduce((acc: number, l: any) => acc + Number(l.fulfilledQty || l.fulfilled_quantity || 0), 0);

    const totalFulfilledValue = activeLines
      .filter((l: any) => isView || l.fulfill)
      .reduce((acc: number, l: any) => {
        const q = Number(l.fulfilledQty || l.fulfilled_quantity || 0);
        const p = Number(l.unitPrice || l.unit_price || 0);
        return acc + (q * p);
      }, 0);

    const fNoStr = activeHeader.fulfillmentNumber || selectedFulfillment?.fulfillmentNumber || `PRF-${selectedFulfillment?.id || "To Be Generated"}`;
    const statusStr = String(activeHeader.status || "FULFILLED").toUpperCase();
    const isDraftFulfillment = statusStr === "DRAFT";

    // COA Accounts Resolution for GL Impact
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

    const debitReturnAcc = findAccount(
      ["Vendor Return / Inventory Adjustment", "Vendor Return", "Inventory Adjustment", "Purchase Return Clearing", "Return Clearing", "Adjustment"],
      ["Expense", "Asset", "Current Asset", "Liability"],
      "Vendor Return / Inventory Adjustment",
      "5010"
    );

    const inventoryAssetAcc = findAccount(
      ["Inventory Asset", "Stock Asset", "Inventory", "Finished Goods", "Raw Materials"],
      ["Asset", "Current Asset", "Inventory"],
      "Inventory Asset",
      "1200"
    );

    const backendGlEntries = (Array.isArray(journalEntryData?.result?.lines) && journalEntryData.result.lines.length > 0)
      ? journalEntryData.result.lines.map((l: any) => {
          const isDebit = Number(l.debit_amount || l.debit || 0) > 0;
          const rawName = l.account?.account_name || l.account_name || "—";
          const rawCode = l.account?.account_number || l.account?.account_code || l.account_code || "—";

          let name = rawName;
          let code = rawCode;

          if (isDebit && (rawName.toLowerCase().includes("bank") || rawName.toLowerCase().includes("cash") || rawName === "—" || rawName.toLowerCase().includes("equity"))) {
            name = "Vendor Return / Inventory Adjustment";
            code = "5010";
          } else if (!isDebit && (rawName.toLowerCase().includes("inventory") || rawName === "—")) {
            name = "Inventory Asset";
            code = "1200";
          }

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
      // 1. DEBIT: Vendor Return / Inventory Adjustment
      {
        accountCode: debitReturnAcc.code,
        accountName: debitReturnAcc.name,
        debit: totalFulfilledValue > 0 ? totalFulfilledValue : (totalFulfilledQty * 100),
        credit: 0,
        memo: `Return Fulfillment Outward - Ref #${returnNumberStr}`,
      },
      // 2. CREDIT: Inventory Asset
      {
        accountCode: inventoryAssetAcc.code,
        accountName: inventoryAssetAcc.name,
        debit: 0,
        credit: totalFulfilledValue > 0 ? totalFulfilledValue : (totalFulfilledQty * 100),
        memo: `Deduct Physical Stock Outward - Ref #${fNoStr}`,
      },
    ];

    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Item Fulfillment"
          subtitle={isView ? `Item Fulfillment #${fNoStr}` : "Standard Item Fulfillment"}
          mode={isView ? "view" : "edit"}
          onSave={() => formik.handleSubmit()}
          onEdit={isView && selectedFulfillment && canUpdate("purchase_return") ? () => handleEdit(selectedFulfillment.id) : undefined}
          onBack={() => { setViewMode("list"); setIsEdit(false); setSearchParams({}); }}
          onCancel={() => { setViewMode("list"); setIsEdit(false); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setIsEdit(false); setSearchParams({}); }}
          onSearchClick={() => { setViewMode("list"); setIsEdit(false); setSearchParams({}); }}
          isSaving={isCreating}
          customActions={
            <div className="flex items-center space-x-2">
              {isView && isDraftFulfillment && (
                <button
                  type="button"
                  onClick={() => {
                    handleEdit(selectedFulfillment.id);
                    formik.setFieldValue("header.status", "FULFILLED");
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <LocalShipping className="!w-4 !h-4" />
                  <span>Fulfill (Stock Outward)</span>
                </button>
              )}
              {(() => {
                const currentReturnIdStr = String(returnIdVal || selectedFulfillment?.purchaseReturnHeaderId || selectedFulfillment?.header?.purchaseReturnHeaderId || "");
                const matchingDebitNote = debitNotes.find((dn: any) => {
                  const dnReturnId = String(dn.purchase_return_id || dn.purchaseReturnId || dn.returnId || dn.header?.purchaseReturnHeaderId || dn.reason || "");
                  return currentReturnIdStr && (dnReturnId === currentReturnIdStr || dnReturnId.includes(currentReturnIdStr));
                });
                const isVendorCreditDone = Boolean(
                  matchingDebitNote ||
                  String(parentReturnHeader?.status || parentReturn?.status || "").toUpperCase() === "RETURNED"
                );

                if (isView && currentReturnIdStr && !isDraftFulfillment && String(parentReturnHeader?.status || parentReturn?.status || "").toUpperCase() === "FULFILLED" && !isVendorCreditDone) {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/debit-note?returnId=${currentReturnIdStr}&fulfillmentId=${activeFulfillmentId || activeHeader.id || selectedFulfillment?.id || ""}`);
                      }}
                      className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <ReceiptLong className="!w-4 !h-4" />
                      <span>Credit (Vendor Credit)</span>
                    </button>
                  );
                }

                if (isView && currentReturnIdStr && (isVendorCreditDone || String(parentReturnHeader?.status || parentReturn?.status || "").toUpperCase() === "RETURNED")) {
                  return (
                    <div className="flex items-center space-x-1 bg-teal-50 border border-teal-300 text-teal-800 text-xs px-2.5 py-1 rounded-xs font-semibold">
                      <span>✓ Vendor Credit Completed</span>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          }
          subTabs={[
            {
              id: "items",
              label: `Items (${activeLines.length})`,
              content: (
                <div className="space-y-3">
                  {!isView && (
                    <div className="flex items-center space-x-2 pb-1">
                      <button
                        type="button"
                        onClick={handleMarkAll}
                        className="bg-[#244b5a] hover:bg-[#1a3742] text-white text-[11px] font-semibold px-2.5 py-1 rounded-xs transition-colors cursor-pointer"
                      >
                        Mark All
                      </button>
                      <button
                        type="button"
                        onClick={handleUnmarkAll}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-xs transition-colors cursor-pointer border border-slate-300"
                      >
                        Unmark All
                      </button>
                    </div>
                  )}

                  <div className="overflow-x-auto border border-slate-300 rounded-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#244b5a] text-white font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          {!isView && <th className="p-2 border-r border-slate-400 w-12 text-center">FULFILL</th>}
                          <th className="p-2 border-r border-slate-400 min-w-[140px]">ITEM</th>
                          <th className="p-2 border-r border-slate-400 min-w-[160px]">DESCRIPTION</th>
                          <th className="p-2 border-r border-slate-400 min-w-[150px]">LOCATION *</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">ON HAND</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">REMAINING</th>
                          <th className="p-2 border-r border-slate-400 w-28 text-right">QUANTITY *</th>
                          <th className="p-2 border-r border-slate-400 w-20 text-center">UNITS</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">RATE (₹)</th>
                          <th className="p-2 border-r border-slate-400 w-28 text-right">AMOUNT (₹)</th>
                          <th className="p-2 min-w-[120px]">REMARKS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {activeLines.map((line: any, idx: number) => {
                          const iId = String(line.itemId || line.item_id);
                          const itemObj = items.find((i: any) => String(i.id) === iId);
                          const selectedUom = uoms.find((u: any) => String(u.id) === String(line.uom_id || itemObj?.uom_id));
                          const allowsDecimals = isDecimalAllowedForUOM(selectedUom);
                          const lineLocId = line.warehouseId || line.location_id || formik.values.header.location_id;
                          const onHandVal = getOnHandQty(iId, lineLocId);
                          const rateVal = Number(line.unitPrice ?? line.unit_price ?? line.rate ?? 0);
                          const qtyVal = Number(line.fulfilledQty ?? line.fulfilled_quantity ?? 0);
                          const amountVal = Number((qtyVal * rateVal).toFixed(2));
                          const lineLocObj = cities.find((c: any) => String(c.id) === String(lineLocId));

                          if (isView) {
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                                  {line.item?.item_name || itemObj?.item_name || `Item #${iId}`}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-slate-600">
                                  {line.itemDescription || line.item?.description || itemObj?.description || "—"}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-slate-800 font-medium">
                                  {lineLocObj?.city_name || lineLocObj?.name || "—"}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700">{onHandVal}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-500">{line.remainingQty ?? line.returnQty ?? 0}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-red-700">{qtyVal}</td>
                                <td className="p-2 border-r border-slate-200 text-center font-semibold text-slate-700">{selectedUom?.uom_symbol || selectedUom?.uom_name || "Nos"}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-800">₹{rateVal.toFixed(2)}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800">₹{amountVal.toFixed(2)}</td>
                                <td className="p-2 text-slate-700">{line.remarks || "—"}</td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={idx} className={`hover:bg-sky-50/40 transition-colors ${!line.fulfill ? "opacity-50 bg-slate-50" : ""}`}>
                              {/* Fulfill Checkbox */}
                              <td className="p-2 border-r border-slate-200 text-center">
                                <input
                                  type="checkbox"
                                  checked={Boolean(line.fulfill)}
                                  onChange={(e) => updateLineItemField(idx, "fulfill", e.target.checked)}
                                  className="w-4 h-4 text-sky-600 rounded-xs border-slate-300 focus:ring-sky-500 cursor-pointer"
                                />
                              </td>

                              {/* Item */}
                              <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                                {itemObj?.item_name || `Item #${iId}`}
                              </td>

                              {/* Description */}
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={itemObj?.item_desc || itemObj?.description || itemObj?.item_name || "—"}
                                  disabled={true}
                                  placeholder="Item Description"
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs bg-slate-100 text-slate-700 font-medium cursor-not-allowed"
                                />
                              </td>

                              {/* Location (REQUIRED) */}
                              <td className="p-1.5 border-r border-slate-200 min-w-[150px]">
                                <select
                                  value={line.warehouseId || formik.values.header.location_id || ""}
                                  onChange={(e) => updateLineItemField(idx, "warehouseId", e.target.value)}
                                  className={`w-full h-7 px-2 text-xs border rounded-xs bg-white font-medium text-slate-800 focus:outline-none focus:border-sky-500 ${
                                    !line.warehouseId ? "border-amber-500 bg-amber-50/30" : "border-slate-300"
                                  }`}
                                >
                                  <option value="">Select Location *...</option>
                                  {cities.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                      {c.city_name || c.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* On Hand */}
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-slate-700 bg-slate-50/50">
                                {onHandVal}
                              </td>

                              {/* Remaining */}
                              <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-500">
                                {line.remainingQty ?? line.returnQty ?? 0}
                              </td>

                              {/* Quantity */}
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  step={allowsDecimals ? "any" : "1"}
                                  min={allowsDecimals ? "0.01" : "1"}
                                  max={line.remainingQty || line.returnQty || undefined}
                                  value={line.fulfilledQty}
                                  disabled={!line.fulfill}
                                  onKeyDown={(e) => {
                                    if (!allowsDecimals && (e.key === "." || e.key === "," || e.key === "e" || e.key === "E" || e.key === "-")) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => updateLineItemField(idx, "fulfilledQty", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono font-bold text-red-700 focus:outline-none focus:border-sky-500 bg-white"
                                />
                              </td>

                              {/* Units */}
                              <td className="p-2 border-r border-slate-200 text-center font-semibold text-slate-700">
                                {selectedUom?.uom_symbol || selectedUom?.uom_name || "Nos"}
                              </td>

                              {/* Rate */}
                              <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-800">
                                ₹{rateVal.toFixed(2)}
                              </td>

                              {/* Amount */}
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-800">
                                ₹{amountVal.toFixed(2)}
                              </td>

                              {/* Remarks */}
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  placeholder="Remarks..."
                                  value={line.remarks}
                                  disabled={!line.fulfill}
                                  onChange={(e) => updateLineItemField(idx, "remarks", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:border-sky-500 bg-white"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ),
            },
            ...((isView || totalFulfilledValue > 0)
              ? [
                  {
                    id: "gl_impact",
                    label: "GL Impact",
                    content: (
                      <GLImpactSubtab
                        documentNumber={fNoStr}
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
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">REF. NO.</span>
                      <span className="text-xs font-bold text-slate-900">{fNoStr}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">CREATED FROM</span>
                      <span className="text-xs font-bold text-sky-700">Vendor Return Authorization #{returnNumberStr}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">VENDOR</span>
                      <span className="text-xs font-bold text-slate-900">{vendorName}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">DATE</span>
                      <span className="text-xs text-slate-800">{activeHeader.fulfillmentDate ? new Date(activeHeader.fulfillmentDate).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">POSTING PERIOD</span>
                      <span className="text-xs font-semibold text-slate-800">{getPostingPeriod(activeHeader.fulfillmentDate)}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">STATUS</span>
                      <div>
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                          statusStr === "DRAFT"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}>
                          {statusStr}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">LOCATION</span>
                      <span className="text-xs font-bold text-slate-900">{locNameVal}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">MEMO / REMARK</span>
                      <span className="text-xs text-slate-800">{activeHeader.remarks || "—"}</span>
                    </div>
                  </>
                ) : (
                  <>


                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">REF. NO.</label>
                      <input
                        type="text"
                        name="header.fulfillmentNumber"
                        placeholder="To Be Generated"
                        value={formik.values.header.fulfillmentNumber}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">CREATED FROM</label>
                      <div className="h-7 text-xs bg-sky-50/50 border border-sky-200 rounded-xs px-2 flex items-center font-bold text-sky-800">
                        Vendor Return Authorization #{returnNumberStr}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">VENDOR</label>
                      <div className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 flex items-center font-semibold text-slate-900">
                        {vendorName}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        DATE <span className="text-amber-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="header.fulfillmentDate"
                        value={formik.values.header.fulfillmentDate}
                        onChange={handleDateChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">POSTING PERIOD</label>
                      <input
                        type="text"
                        disabled
                        value={formik.values.header.postingPeriod}
                        className="h-7 text-xs bg-slate-100 border border-slate-300 rounded-xs px-2 text-slate-700 font-semibold"
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
                        <option value="FULFILLED">FULFILLED (Stock Outward)</option>
                        <option value="DRAFT">DRAFT (Non-Posting)</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        LOCATION <span className="text-amber-600">*</span>
                      </label>
                      <select
                        name="header.location_id"
                        value={formik.values.header.location_id}
                        onChange={handleHeaderLocationChange}
                        onBlur={formik.handleBlur}
                        className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                          formik.touched.header?.location_id && formik.errors.header?.location_id ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                        }`}
                      >
                        <option value="">Select Location *...</option>
                        {cities.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.city_name || c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">MEMO / REMARK</label>
                      <input
                        type="text"
                        name="header.remarks"
                        placeholder="Memo notes..."
                        value={formik.values.header.remarks}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </>
                )}
              </RecordSection>

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
                      <div className="h-7 px-2 py-1 bg-slate-100 border border-slate-300 rounded-xs text-xs font-semibold text-slate-800 flex items-center select-none">
                        {subsidiaryName}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        LOCATION <span className="text-amber-600">*</span>
                      </label>
                      <select
                        name="header.location_id"
                        value={formik.values.header.location_id}
                        onChange={handleHeaderLocationChange}
                        onBlur={formik.handleBlur}
                        className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                          formik.touched.header?.location_id && formik.errors.header?.location_id ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                        }`}
                      >
                        <option value="">Select Location *...</option>
                        {cities.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.city_name || c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">CLASS</label>
                      <div className="h-7 px-2 py-1 bg-slate-100 border border-slate-300 rounded-xs text-xs font-semibold text-slate-800 flex items-center select-none">
                        {classNameVal}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">DEPARTMENT</label>
                      <div className="h-7 px-2 py-1 bg-slate-100 border border-slate-300 rounded-xs text-xs font-semibold text-slate-800 flex items-center select-none">
                        {deptNameVal}
                      </div>
                    </div>
                  </>
                )}
              </RecordSection>
            </div>

            {/* Summary Card */}
            <div className="w-full lg:w-72 self-start">
              <div className="border border-slate-300 rounded-xs overflow-hidden shadow-2xs">
                <div className="bg-[#78a4b7] text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                  Fulfillment Summary
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-semibold text-slate-700 uppercase text-[10px]">ITEMS TO FULFILL</span>
                    <span>{activeLines.filter((l: any) => isView || l.fulfill).length} of {activeLines.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="font-semibold text-slate-700 uppercase text-[10px]">TOTAL FULFILLED QTY</span>
                    <span className="font-bold text-red-700">{totalFulfilledQty}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5 text-sm">
                    <span className="uppercase text-[11px]">TOTAL RETURN VALUE</span>
                    <span className="text-emerald-700">₹{totalFulfilledValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RecordPageLayout>
      </form>
    );
  }

  // ── RENDER 2: DATAGRID LIST VIEW MODE ──
  const filteredFulfillments = fulfillments.filter((f: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const fNoStr = String(f.fulfillmentNumber || `PRF-${f.id}`).toLowerCase();
    const retRef = String(f.purchaseReturn?.returnNumber || f.purchaseReturnHeader?.returnNumber || `RET-${f.purchaseReturnHeaderId}`).toLowerCase();
    const vName = getVendorDisplayName(f.vendor || f.purchaseReturnHeader?.vendor).toLowerCase();
    return fNoStr.includes(term) || retRef.includes(term) || vName.includes(term);
  });

  return (
    <div className="flex flex-col space-y-3 p-4 bg-[#f3f6f9] min-h-screen font-sans text-slate-800">
      {/* Header with Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 border-b border-slate-300 gap-2">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Item Fulfillments (Vendor Returns)</h1>
        </div>
        <P2PLifecycleNav />
      </div>

      {/* Button Bar without standalone create */}
      <div className="bg-white p-3 border border-slate-300 rounded-xs shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-xs">
          <span className="uppercase text-[10px] font-bold text-slate-500">VIEW</span>
          <select className="h-7 px-3 text-xs bg-white border border-slate-300 rounded-xs font-medium focus:outline-none focus:border-sky-600">
            <option>All Item Return Fulfillments</option>
          </select>
        </div>
        <div className="text-xs text-slate-500 italic">
          Item Fulfillments are generated directly from authorized Purchase Returns.
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
                placeholder="Search Fulfillment #, Return Reference..."
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
              <th className="p-2 border-r border-slate-300 w-28 text-center">EDIT | VIEW</th>
              <th className="p-2 border-r border-slate-300 w-20">ID</th>
              <th className="p-2 border-r border-slate-300 min-w-[150px]">FULFILLMENT NUMBER</th>
              <th className="p-2 border-r border-slate-300 min-w-[180px]">RETURN REFERENCE</th>
              <th className="p-2 border-r border-slate-300 min-w-[180px]">VENDOR</th>
              <th className="p-2 border-r border-slate-300 w-28">DATE</th>
              <th className="p-2 border-r border-slate-300 w-24 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredFulfillments.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-medium italic">
                  {searchTerm ? "No matching fulfillments found." : "No Return Fulfillments recorded yet. To fulfill, open an Authorized Purchase Return and click 'Return (Item Fulfillment)'."}
                </td>
              </tr>
            ) : (
              filteredFulfillments.map((f: any) => {
                const fNoStr = f.fulfillmentNumber || `PRF-${f.id}`;
                const pHeader = f.purchaseReturnHeader || f.purchaseReturn;
                const retRef = pHeader?.returnNumber || pHeader?.return_number || (f.purchaseReturnHeaderId ? `RET-${f.purchaseReturnHeaderId}` : "—");
                const vName = getVendorDisplayName(f.vendor || pHeader?.vendor);
                const fStatus = String(f.status || "FULFILLED").toUpperCase();

                return (
                  <tr key={f.id} className="hover:bg-sky-50/50 transition-colors">
                    <td className="p-2 border-r border-slate-200 text-center font-semibold space-x-1.5">
                      {canUpdate("purchase_return") ? (
                        <button onClick={() => handleEdit(f.id)} className="text-sky-700 hover:underline cursor-pointer">
                          Edit
                        </button>
                      ) : (
                        <span className="text-slate-300">Edit</span>
                      )}
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleView(f.id)} className="text-sky-700 hover:underline cursor-pointer">
                        View
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">{f.id}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-sky-800">
                      <button onClick={() => handleView(f.id)} className="hover:underline text-left cursor-pointer">
                        {fNoStr}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 text-sky-800 font-medium">{retRef}</td>
                    <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{vName}</td>
                    <td className="p-2 border-r border-slate-200 text-slate-700">
                      {f.fulfillmentDate ? new Date(f.fulfillmentDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center">
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                        fStatus === "DRAFT"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}>
                        {fStatus}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
