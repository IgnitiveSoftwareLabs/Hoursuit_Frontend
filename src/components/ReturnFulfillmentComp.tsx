import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Add, Delete, Edit, Search, List as ListIcon, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
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
import { useAppSelector } from "../Hooks/Reduxhook/hooks";
import { usePermissions } from "../Hooks/usePermissions";

import {
  useGetPurchaseReturnsQuery,
  useGetReturnFulfillmentsQuery,
  useCreateReturnFulfillmentMutation,
} from "../RTK/services/purchaseApi";

import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";
import { GLImpactSubtab } from "./Layout/GLImpactSubtab";

interface ReturnFulfillmentLineForm {
  purchaseReturnLineId: string;
  itemId: string;
  uom_id?: string;
  returnQty: number;
  fulfilledQty: number;
  warehouseId?: string;
  batchNo: string;
  serialNo: string;
  remarks: string;
}

const emptyLineItem = (): ReturnFulfillmentLineForm => ({
  purchaseReturnLineId: "",
  itemId: "",
  uom_id: "",
  returnQty: 0,
  fulfilledQty: 1,
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

export default function ReturnFulfillmentComp() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canRead, canCreate, canUpdate } = usePermissions();
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const userId = currentUser?.id ?? "";

  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [selectedFulfillment, setSelectedFulfillment] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Eager Queries
  const { data: fulfillmentsData, refetch: refetchFulfillments } = useGetReturnFulfillmentsQuery({ page: 1, limit: 50 });
  const { data: purchaseReturnsData } = useGetPurchaseReturnsQuery({ page: 1, limit: 100 });
  const { data: vendorsData } = useGetVendorsQuery({ page: 1, option: true });
  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 1000 });
  const { data: subsidiariesData } = useGetSubsidiariesQuery(undefined);
  const { data: classesData } = useGetClassesQuery(undefined);
  const { data: departmentsData } = useGetDepartmentsQuery(undefined);
  const { data: citiesData } = useGetCitiesQuery(undefined);
  const { data: uomsData } = useGetUOMsQuery(undefined);

  const [createReturnFulfillment, { isLoading: isCreating }] = useCreateReturnFulfillmentMutation();

  const fulfillments = useMemo(() => (Array.isArray(fulfillmentsData?.result) ? fulfillmentsData.result : Array.isArray(fulfillmentsData?.data) ? fulfillmentsData.data : Array.isArray(fulfillmentsData) ? fulfillmentsData : []), [fulfillmentsData]);
  const purchaseReturns = useMemo(() => (Array.isArray(purchaseReturnsData?.result) ? purchaseReturnsData.result : Array.isArray(purchaseReturnsData?.data) ? purchaseReturnsData.data : Array.isArray(purchaseReturnsData) ? purchaseReturnsData : []), [purchaseReturnsData]);
  const vendors = useMemo(() => (Array.isArray(vendorsData?.result) ? vendorsData.result : Array.isArray(vendorsData?.data) ? vendorsData.data : Array.isArray(vendorsData) ? vendorsData : []), [vendorsData]);
  const items = useMemo(() => (Array.isArray(itemsData?.result) ? itemsData.result : Array.isArray(itemsData?.data) ? itemsData.data : Array.isArray(itemsData) ? itemsData : []), [itemsData]);
  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : Array.isArray(subsidiariesData?.data) ? subsidiariesData.data : Array.isArray(subsidiariesData) ? subsidiariesData : [];
  const classesList = Array.isArray(classesData?.result) ? classesData.result : Array.isArray(classesData?.data) ? classesData.data : Array.isArray(classesData) ? classesData : [];
  const departmentsList = Array.isArray(departmentsData?.result) ? departmentsData.result : Array.isArray(departmentsData?.data) ? departmentsData.data : Array.isArray(departmentsData) ? departmentsData : [];
  const citiesList = Array.isArray(citiesData?.result) ? citiesData.result : Array.isArray(citiesData?.data) ? citiesData.data : Array.isArray(citiesData) ? citiesData : [];
  const cities = citiesList;
  const uoms = Array.isArray(uomsData?.result) ? uomsData.result : Array.isArray(uomsData?.data) ? uomsData.data : Array.isArray(uomsData) ? uomsData : [];

  const formik = useFormik({
    initialValues: {
      header: {
        fulfillmentNumber: "",
        purchaseReturnHeaderId: "",
        fulfillmentDate: new Date().toISOString().slice(0, 10),
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
      }),
      lineItems: Yup.array().of(
        Yup.object({
          fulfilledQty: Yup.number().positive("Qty must be > 0").required("Fulfilled Qty is required"),
        })
      ).min(1, "At least one item line is required"),
    }),
    onSubmit: async (values) => {
      try {
        if (!values.header.purchaseReturnHeaderId) {
          toast.error("Purchase Return Authorization reference is required to fulfill items.");
          return;
        }

        for (let i = 0; i < values.lineItems.length; i++) {
          const line = values.lineItems[i];
          const uomObj = uoms.find((u: any) => String(u.id) === String(line.uom_id));
          if (uomObj && !isDecimalAllowedForUOM(uomObj) && Number(line.fulfilledQty) % 1 !== 0) {
            toast.error(`Fulfilled Quantity for line ${i + 1} (${uomObj.uom_name || uomObj.name}) must be a whole number.`);
            return;
          }
        }

        const payload = {
          header: {
            ...values.header,
            user_id: userId,
          },
          lineItems: values.lineItems,
        };

        await createReturnFulfillment(payload).unwrap();
        toast.success("Item Return Fulfillment saved successfully (Stock Outward recorded).");
        setViewMode("list");
        setSearchParams({});
        formik.resetForm();
        refetchFulfillments();
      } catch (error: any) {
        toast.error(error?.data?.message || "Failed to record Return Fulfillment.");
      }
    },
  });

  const selectedReturnId = formik.values.header.purchaseReturnHeaderId;

  useEffect(() => {
    const returnId = searchParams.get("returnId");
    if (returnId) {
      setViewMode("form");
      formik.setFieldValue("header.purchaseReturnHeaderId", String(returnId));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedReturnId) return;
    const parentReturn = purchaseReturns.find((r: any) => String(r.id) === String(selectedReturnId));
    if (!parentReturn) return;

    const statusVal = String(parentReturn.header?.status || parentReturn.status || "").toUpperCase();
    if (statusVal === "DRAFT") {
      toast.error(`Purchase Return #${parentReturn.header?.returnNumber || parentReturn.returnNumber || selectedReturnId} is in DRAFT status. It must be AUTHORIZED before fulfillment.`);
      setViewMode("list");
      setSearchParams({});
      return;
    }
    if (statusVal === "FULFILLED") {
      toast.error(`Purchase Return #${parentReturn.header?.returnNumber || parentReturn.returnNumber || selectedReturnId} is already FULFILLED.`);
      setViewMode("list");
      setSearchParams({});
      return;
    }

    const parentLines = parentReturn.details || parentReturn.lineItems || parentReturn.purchaseReturnLines || [];
    if (parentLines.length > 0) {
      const mapped = parentLines.map((l: any) => {
        const itemObj = items.find((i: any) => String(i.id) === String(l.itemId || l.item_id));
        return {
          purchaseReturnLineId: String(l.id || ""),
          itemId: String(l.itemId || l.item_id || ""),
          uom_id: String(l.uom_id || itemObj?.uom_id || ""),
          returnQty: Number(l.returnQty || l.return_quantity || l.quantity || 1),
          fulfilledQty: Number(l.returnQty || l.return_quantity || l.quantity || 1),
          batchNo: l.batchNo || "",
          serialNo: l.serialNo || "",
          remarks: l.remarks || "",
        };
      });
      formik.setFieldValue("lineItems", mapped);
    }

    if (parentReturn.subsidiary_id) formik.setFieldValue("header.subsidiary_id", String(parentReturn.subsidiary_id));
    if (parentReturn.class_id) formik.setFieldValue("header.class_id", String(parentReturn.class_id));
    if (parentReturn.department_id) formik.setFieldValue("header.department_id", String(parentReturn.department_id));
    if (parentReturn.location_id) formik.setFieldValue("header.location_id", String(parentReturn.location_id));
  }, [selectedReturnId, purchaseReturns, items]);

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

  const handleView = (id: number | string) => {
    const item = fulfillments.find((x: any) => String(x.id) === String(id));
    if (item) {
      setSelectedFulfillment(item);
      setViewMode("view");
      setSearchParams({ id: String(id), action: "view" });
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

  // ── RENDER 1: FORM & VIEW MODE ──
  if (viewMode === "form" || viewMode === "view") {
    const isView = viewMode === "view";
    const activeHeader = isView ? selectedFulfillment?.header || selectedFulfillment || {} : formik.values.header;
    const activeLines = isView ? selectedFulfillment?.lineItems || selectedFulfillment?.fulfillmentLines || [] : formik.values.lineItems;

    const parentReturn = purchaseReturns.find((r: any) => String(r.id) === String(activeHeader.purchaseReturnHeaderId));
    const returnNumberStr = parentReturn?.returnNumber || parentReturn?.return_number || (activeHeader.purchaseReturnHeaderId ? `RET-${activeHeader.purchaseReturnHeaderId}` : "—");
    const vendorName = getVendorDisplayName(parentReturn?.vendor);

    const totalFulfilledQty = activeLines.reduce((acc: number, l: any) => acc + Number(l.fulfilledQty || l.fulfilled_quantity || 0), 0);

    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Item Return Fulfillment"
          subtitle={isView ? `Fulfillment #${selectedFulfillment?.fulfillmentNumber || selectedFulfillment?.id}` : "New Item Return Fulfillment"}
          mode={isView ? "view" : "edit"}
          onSave={() => formik.handleSubmit()}
          onBack={() => { setViewMode("list"); setSearchParams({}); }}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
          isSaving={isCreating}
          subTabs={[
            {
              id: "items",
              label: `Items Fulfilled (${activeLines.length})`,
              content: (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-slate-300 rounded-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#244b5a] text-white font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 border-r border-slate-400 w-10 text-center">#</th>
                          <th className="p-2 border-r border-slate-400 min-w-[180px]">ITEM</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">RETURNED QTY</th>
                          <th className="p-2 border-r border-slate-400 w-28 text-right">FULFILLED QTY *</th>
                          <th className="p-2 border-r border-slate-400 min-w-[160px]">LOCATION / WAREHOUSE *</th>
                          <th className="p-2 border-r border-slate-400 min-w-[110px]">BATCH #</th>
                          <th className="p-2 border-r border-slate-400 min-w-[110px]">SERIAL #</th>
                          <th className="p-2 border-r border-slate-400 min-w-[140px]">REMARKS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {activeLines.map((line: any, idx: number) => {
                          const itemObj = items.find((i: any) => String(i.id) === String(line.itemId || line.item_id));
                          const selectedUom = uoms.find((u: any) => String(u.id) === String(line.uom_id || itemObj?.uom_id));
                          const allowsDecimals = isDecimalAllowedForUOM(selectedUom);

                          if (isView) {
                            const locObj = cities.find((c: any) => String(c.id) === String(line.warehouseId || line.warehouse_id || line.location_id));
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                                <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{line.item?.item_name || itemObj?.item_name || `Item #${line.itemId}`}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono">{line.returnQty ?? 0}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-red-600">{line.fulfilledQty ?? line.fulfilled_quantity ?? 0}</td>
                                <td className="p-2 border-r border-slate-200 text-slate-800 font-medium">{locObj?.city_name || line.warehouseId || "Default Location"}</td>
                                <td className="p-2 border-r border-slate-200 font-mono">{line.batchNo || "—"}</td>
                                <td className="p-2 border-r border-slate-200 font-mono">{line.serialNo || "—"}</td>
                                <td className="p-2 border-r border-slate-200 text-slate-700">{line.remarks || "—"}</td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                              <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                                {itemObj?.item_name || `Item #${line.itemId}`}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-500">{line.returnQty || 0}</td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  step={allowsDecimals ? "any" : "1"}
                                  min={allowsDecimals ? "0.01" : "1"}
                                  value={line.fulfilledQty}
                                  onKeyDown={(e) => {
                                    if (!allowsDecimals && (e.key === "." || e.key === "," || e.key === "e" || e.key === "E" || e.key === "-")) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => updateLineItemField(idx, "fulfilledQty", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono focus:outline-none focus:border-sky-500 bg-white"
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200 min-w-[160px]">
                                <select
                                  value={line.warehouseId || formik.values.header.location_id || ""}
                                  onChange={(e) => updateLineItemField(idx, "warehouseId", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs bg-white font-medium text-slate-800 focus:outline-none focus:border-sky-500"
                                >
                                  <option value="">Select Location / City...</option>
                                  {cities.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                      {c.city_name || c.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="text"
                                  placeholder="Batch #"
                                  value={line.batchNo}
                                  onChange={(e) => updateLineItemField(idx, "batchNo", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs font-mono focus:outline-none focus:border-sky-500 bg-white"
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="text"
                                  placeholder="Serial #"
                                  value={line.serialNo}
                                  onChange={(e) => updateLineItemField(idx, "serialNo", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs font-mono focus:outline-none focus:border-sky-500 bg-white"
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="text"
                                  placeholder="Remarks..."
                                  value={line.remarks}
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
            ...((isView && String(activeHeader.status || "").toUpperCase() !== "DRAFT")
              ? [
                  {
                    id: "gl_impact",
                    label: "GL Impact",
                    content: (
                      <GLImpactSubtab
                        documentNumber={activeHeader.fulfillmentNumber || `PRF-${selectedFulfillment?.id || "NEW"}`}
                        entries={[
                          {
                            accountCode: "2200",
                            accountName: "Accrued Purchases / Clearing",
                            debit: totalFulfilledQty * 100,
                            credit: 0,
                            memo: `Stock Return Outward - Ref #${returnNumberStr}`,
                          },
                          {
                            accountCode: "1100",
                            accountName: "Inventory Asset",
                            debit: 0,
                            credit: totalFulfilledQty * 100,
                            memo: `Deduct Physical Stock Outward`,
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
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">FULFILLMENT #</span>
                      <span className="text-xs font-bold text-slate-900">{activeHeader.fulfillmentNumber || `PRF-${selectedFulfillment?.id}`}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">PURCHASE RETURN REFERENCE</span>
                      <span className="text-xs font-semibold text-sky-700">{returnNumberStr}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">VENDOR</span>
                      <span className="text-xs font-bold text-slate-900">{vendorName}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">FULFILLMENT DATE</span>
                      <span className="text-xs text-slate-800">{activeHeader.fulfillmentDate ? new Date(activeHeader.fulfillmentDate).toLocaleDateString() : "—"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">FULFILLMENT #</label>
                      <input
                        type="text"
                        name="header.fulfillmentNumber"
                        placeholder="Auto-generated if empty"
                        value={formik.values.header.fulfillmentNumber}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        PURCHASE RETURN AUTHORIZATION <span className="text-amber-600">*</span>
                      </label>
                      <select
                        name="header.purchaseReturnHeaderId"
                        value={formik.values.header.purchaseReturnHeaderId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                          formik.touched.header?.purchaseReturnHeaderId && formik.errors.header?.purchaseReturnHeaderId ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                        }`}
                      >
                        <option value="">Select Purchase Return Authorization...</option>
                        {purchaseReturns
                          .filter((r: any) => {
                            const st = String(r.header?.status || r.status || "").toUpperCase();
                            return st === "AUTHORIZED" || st === "APPROVED" || st === "PARTIALLY_FULFILLED";
                          })
                          .map((r: any) => {
                            const rHeader = r.header ?? r;
                            const rNoStr = rHeader.returnNumber || rHeader.return_number || `RET-${r.id}`;
                            const vName = getVendorDisplayName(rHeader.vendor || r.vendor);
                            return (
                              <option key={r.id} value={r.id}>
                                {rNoStr} — {vName} ({rHeader.status || "AUTHORIZED"})
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        FULFILLMENT DATE <span className="text-amber-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="header.fulfillmentDate"
                        value={formik.values.header.fulfillmentDate}
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
                  Fulfillment Summary
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-semibold text-slate-700 uppercase text-[10px]">ITEMS</span>
                    <span>{activeLines.length}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                    <span className="uppercase text-[11px]">TOTAL FULFILLED</span>
                    <span className="text-red-700">{totalFulfilledQty}</span>
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
    return fNoStr.includes(term);
  });

  return (
    <div className="flex flex-col space-y-3 p-4 bg-[#f3f6f9] min-h-screen font-sans text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-300">
        <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Item Return Fulfillments</h1>
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
            <option>All Item Return Fulfillments</option>
          </select>
          {canCreate("purchase_return") && (
            <button
              type="button"
              onClick={() => {
                setViewMode("form");
                formik.resetForm();
                setSearchParams({ action: "create" });
              }}
              className="bg-[#0070d2] hover:bg-blue-700 text-white font-bold text-xs px-4 py-1.5 rounded-xs border border-blue-800 shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Add className="!w-4 !h-4" />
              <span>+ New Return Fulfillment</span>
            </button>
          )}
        </div>
      </div>

      {/* DataGrid Table */}
      <div className="bg-white border border-slate-300 rounded-xs shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#e5eff5] border-b border-slate-300 text-[#244b5a] font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-2 border-r border-slate-300 w-20 text-center">VIEW</th>
              <th className="p-2 border-r border-slate-300 w-24">INTERNAL ID</th>
              <th className="p-2 border-r border-slate-300 min-w-[140px]">FULFILLMENT NUMBER</th>
              <th className="p-2 border-r border-slate-300 min-w-[150px]">RETURN REFERENCE</th>
              <th className="p-2 border-r border-slate-300 w-28">DATE</th>
              <th className="p-2 border-r border-slate-300 w-28 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredFulfillments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 font-medium italic">
                  No Return Fulfillments found. Click '+ New Return Fulfillment' to record stock outward.
                </td>
              </tr>
            ) : (
              filteredFulfillments.map((f: any) => {
                const fNoStr = f.fulfillmentNumber || `PRF-${f.id}`;
                const retRef = f.purchaseReturn?.returnNumber || (f.purchaseReturnHeaderId ? `RET-${f.purchaseReturnHeaderId}` : "—");

                return (
                  <tr key={f.id} className="hover:bg-sky-50/50 transition-colors">
                    <td className="p-2 border-r border-slate-200 text-center font-semibold">
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
                    <td className="p-2 border-r border-slate-200 text-slate-700">
                      {f.fulfillmentDate ? new Date(f.fulfillmentDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center">
                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {f.status || "FULFILLED"}
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
