import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Add, Delete, Edit, Search, List as ListIcon, Print, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useGetItemsQuery } from "../RTK/services/itemApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetClassesQuery } from "../RTK/services/classApi";
import { useGetDepartmentsQuery } from "../RTK/services/departmentApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetUOMsQuery } from "../RTK/services/uomApi";
import { useGetTransportationModesQuery } from "../RTK/services/transportationModeApi";
import { useGetInventoryQuery } from "../RTK/services/inventoryApi";
import { usePermissions } from "../Hooks/usePermissions";
import {
  useGetPurchaseOrdersQuery,
  useGetGRNsQuery,
  useCreateGRNMutation,
  useDeleteGRNMutation,
  useUpdateGRNMutation,
  useUpdateGRNStatusMutation,
} from "../RTK/services/purchaseApi";

import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";
import { GLImpactSubtab } from "./Layout/GLImpactSubtab";
import ConfirmationDialog from "./Dialog/ConfirmationDialog";

const createDefaultLineItem = () => ({
  purchaseOrderLineId: "",
  itemId: "",
  uom_id: "",
  locationId: "",
  onHand: 0,
  orderedQty: 0,
  receivedQty: 1,
  acceptedQty: 1,
  rejectedQty: 0,
  manufacturingDate: "",
  expiryDate: "",
  qcRequired: false,
  status: "PENDING",
  remarks: "",
});

const isDecimalAllowedForUOM = (uomObj: any) => {
  if (!uomObj) return true;
  const name = String(uomObj.uom_name || uomObj.name || uomObj.uom_symbol || "").toUpperCase();
  const integerUOMs = ["EACH", "PCS", "PIECE", "PIECES", "NOS", "NUMBER", "NUMBERS", "BOX", "BOXES", "UNIT", "UNITS", "SET", "SETS", "PACK", "PACKS", "BAG", "BAGS", "BOTTLE", "BOTTLES", "CAN", "CANS", "DRUM", "DRUMS", "CARTON", "CARTONS"];
  return !integerUOMs.some((u) => name.includes(u));
};

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

const GRNComp: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();

  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [selectedGRN, setSelectedGRN] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [grnToDelete, setGrnToDelete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Eager Queries
  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery({ page: 1, limit: 100 });
  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 1000 });
  const { data: subsidiariesData } = useGetSubsidiariesQuery(undefined);
  const { data: classesData } = useGetClassesQuery(undefined);
  const { data: departmentsData } = useGetDepartmentsQuery(undefined);
  const { data: citiesData } = useGetCitiesQuery(undefined);
  const { data: uomsData } = useGetUOMsQuery(undefined);
  const { data: transportationModesData } = useGetTransportationModesQuery(undefined);
  const { data: inventoryData } = useGetInventoryQuery({ limit: 1000 });
  const { data: grnsData, refetch: refetchGRNs } = useGetGRNsQuery({ page: 1, limit: 50 });

  const purchaseOrders = useMemo(() => (Array.isArray(purchaseOrdersData?.result) ? purchaseOrdersData.result : Array.isArray(purchaseOrdersData?.data) ? purchaseOrdersData.data : Array.isArray(purchaseOrdersData) ? purchaseOrdersData : []), [purchaseOrdersData]);
  const items = Array.isArray(itemsData?.result) ? itemsData.result : Array.isArray(itemsData?.data) ? itemsData.data : Array.isArray(itemsData) ? itemsData : [];
  const grns = Array.isArray(grnsData?.result) ? grnsData.result : Array.isArray(grnsData?.data) ? grnsData.data : Array.isArray(grnsData) ? grnsData : [];
  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : Array.isArray(subsidiariesData?.data) ? subsidiariesData.data : Array.isArray(subsidiariesData) ? subsidiariesData : [];
  const classesList = Array.isArray(classesData?.result) ? classesData.result : Array.isArray(classesData?.data) ? classesData.data : Array.isArray(classesData) ? classesData : [];
  const departmentsList = Array.isArray(departmentsData?.result) ? departmentsData.result : Array.isArray(departmentsData?.data) ? departmentsData.data : Array.isArray(departmentsData) ? departmentsData : [];
  const citiesList = Array.isArray(citiesData?.result) ? citiesData.result : Array.isArray(citiesData?.data) ? citiesData.data : Array.isArray(citiesData) ? citiesData : [];
  const uoms = Array.isArray(uomsData?.result) ? uomsData.result : Array.isArray(uomsData?.data) ? uomsData.data : Array.isArray(uomsData) ? uomsData : [];
  const transportationModes = Array.isArray(transportationModesData?.result) ? transportationModesData.result : Array.isArray(transportationModesData?.data) ? transportationModesData.data : Array.isArray(transportationModesData) ? transportationModesData : [];

  const inventoryItems = useMemo(() => {
    return Array.isArray(inventoryData?.result)
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
        map[itemId] = (map[itemId] || 0) + Number(inv.qty || 0);
      }
    });
    return map;
  }, [inventoryItems]);

  const [createGRN, { isLoading: isCreating }] = useCreateGRNMutation();
  const [updateGRN, { isLoading: isUpdating }] = useUpdateGRNMutation();
  const [updateGRNStatus, { isLoading: isUpdatingStatus }] = useUpdateGRNStatusMutation();
  const [deleteGRN] = useDeleteGRNMutation();

  const handleSubmitWithStatus = (status: string) => {
    formik.setFieldValue("header.status", status);
    setTimeout(() => {
      formik.handleSubmit();
    }, 0);
  };

  const handleReceiveStatusUpdate = async (grnId: number | string) => {
    try {
      await updateGRNStatus({ id: grnId, body: { status: "RECEIVED" } }).unwrap();
      toast.success("GRN status updated to RECEIVED!");
      refetchGRNs();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update GRN status to RECEIVED");
    }
  };

  const getPoLineItems = (record: any) => {
    const candidates = [
      record?.lineItems,
      record?.line_items,
      record?.purchaseOrderLines,
      record?.purchase_order_lines,
      record?.details,
    ];
    return candidates.find((val) => Array.isArray(val)) ?? [];
  };

  const mapPoLineToGrnLine = (line: any) => {
    const itemId = line?.itemId ?? line?.item_id ?? line?.item?.id ?? "";
    const selectedItem = items.find((i: any) => String(i.id) === String(itemId));
    const uomId = line?.uom_id ?? line?.uomId ?? selectedItem?.uom_id ?? "";
    const orderedQty = Number(line?.orderedQty ?? line?.ordered_quantity ?? line?.quantity ?? line?.qty ?? 0);
    const receivedQty = Number(line?.receivedQty ?? line?.quantity ?? line?.qty ?? 0);
    const lineLocId = line?.locationId ?? line?.location_id ?? formik.values.header.location_id ?? "";

    return {
      purchaseOrderLineId: line?.purchaseOrderLineId ?? line?.purchase_order_line_id ?? line?.id ?? "",
      itemId,
      uom_id: uomId,
      locationId: lineLocId,
      onHand: onHandMap[String(itemId)] ?? 0,
      orderedQty,
      receivedQty,
      acceptedQty: receivedQty,
      rejectedQty: 0,
      manufacturingDate: line?.manufacturingDate ?? "",
      expiryDate: line?.expiryDate ?? "",
      qcRequired: line?.qcRequired ?? false,
      status: line?.status ?? "PENDING",
      remarks: line?.remarks ?? "",
    };
  };

  const formik = useFormik({
    initialValues: {
      header: {
        grnNo: "",
        purchaseOrderId: "",
        transportationModeId: "",
        driverName: "",
        driverPhoneNo: "",
        vehicleNo: "",
        grnDate: new Date().toISOString().split("T")[0],
        subsidiary_id: "",
        class_id: "",
        department_id: "",
        location_id: "",
        memo: "",
        status: "DRAFT",
        remarks: "",
      },
      lineItems: [createDefaultLineItem()],
    },
    validationSchema: Yup.object({
      header: Yup.object({
        grnNo: Yup.string().nullable(),
        grnDate: Yup.date().required("GRN Date is required"),
        location_id: Yup.string().required("Location / City is required"),
      }),
      lineItems: Yup.array().of(
        Yup.object({
          itemId: Yup.string().required("Item is required"),
          receivedQty: Yup.number().min(0.01, "Received Qty must be > 0").required("Received Qty is required"),
        })
      ).min(1, "At least one item line is required"),
    }),
    onSubmit: async (values) => {
      try {
        // Enforce Received Qty <= Open PO Qty validation
        for (let i = 0; i < values.lineItems.length; i++) {
          const line = values.lineItems[i];
          const uomObj = uoms.find((u: any) => String(u.id) === String(line.uom_id));
          if (uomObj && !isDecimalAllowedForUOM(uomObj) && Number(line.receivedQty) % 1 !== 0) {
            toast.error(`Received Quantity for line ${i + 1} (${uomObj.uom_name || uomObj.name}) must be a whole number.`);
            return;
          }
          if (line.orderedQty > 0 && Number(line.receivedQty) > Number(line.orderedQty)) {
            toast.error(`Line ${i + 1}: Received Quantity (${line.receivedQty}) cannot exceed Ordered Quantity (${line.orderedQty}).`);
            return;
          }
        }

        const payload = {
          header: values.header,
          lineItems: values.lineItems,
        };

        if (isEdit && editId) {
          const res = await updateGRN({ id: editId, body: payload }).unwrap();
          toast.success(res?.message || "GRN updated successfully.");
        } else {
          await createGRN(payload).unwrap();
          toast.success("GRN created successfully");
        }
        setViewMode("list");
        setIsEdit(false);
        setEditId(null);
        setSearchParams({});
        formik.resetForm();
        refetchGRNs();
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong");
      }
    },
  });

  const selectedSubsidiaryId = formik.values.header.subsidiary_id;
  const filteredLocations = useMemo(() => {
    if (!selectedSubsidiaryId) return citiesList;
    const subFiltered = citiesList.filter(
      (c: any) => String(c.subsidiary_id || c.subsidiaryId) === String(selectedSubsidiaryId)
    );
    return subFiltered.length > 0 ? subFiltered : citiesList;
  }, [citiesList, selectedSubsidiaryId]);

  const selectedPoId = formik.values.header.purchaseOrderId;

  // Sync state with URL search params (PO receive link & GRN edit link support)
  useEffect(() => {
    const urlPoId = searchParams.get("poId") || searchParams.get("po_id");
    const urlAction = searchParams.get("action");
    const urlId = searchParams.get("id") || searchParams.get("grnId") || searchParams.get("grn_id");

    if (urlId && (urlAction === "edit" || urlAction === "receive")) {
      handleEdit(urlId);
    } else if (urlId && urlAction === "view") {
      const targetGRN = grns.find((g: any) => String(g.id) === String(urlId));
      if (targetGRN) {
        setSelectedGRN(targetGRN);
        setViewMode("view");
      }
    } else if (urlPoId && !selectedPoId && !isEdit) {
      formik.setFieldValue("header.purchaseOrderId", urlPoId);
      setViewMode("form");
      setIsEdit(false);
    } else if (urlAction === "create") {
      setViewMode("form");
      setIsEdit(false);
    }
  }, [searchParams, grns]);

  useEffect(() => {
    if (isEdit || !selectedPoId) return;
    const selectedPo = purchaseOrders.find((po: any) => String(po.id) === String(selectedPoId));
    if (!selectedPo) return;

    const poLines = getPoLineItems(selectedPo);
    if (poLines.length > 0) {
      const mappedLines = poLines.map((line: any) => mapPoLineToGrnLine(line));
      formik.setFieldValue("lineItems", mappedLines);
    }

    const subId = selectedPo.subsidiary_id || selectedPo.subsidiaryId;
    if (subId) formik.setFieldValue("header.subsidiary_id", String(subId));
    const classId = selectedPo.class_id || selectedPo.classId;
    if (classId) formik.setFieldValue("header.class_id", String(classId));
    const deptId = selectedPo.department_id || selectedPo.departmentId;
    if (deptId) formik.setFieldValue("header.department_id", String(deptId));
    const cityId = selectedPo.city_id || selectedPo.cityId;
    if (cityId) formik.setFieldValue("header.location_id", String(cityId));
  }, [selectedPoId, purchaseOrders, isEdit]);

  const updateGrnLineField = (index: number, field: string, value: any) => {
    const lineItems = [...formik.values.lineItems];
    let newValue = value;

    if (field === "receivedQty" && newValue !== "") {
      const uomObj = uoms.find((u: any) => String(u.id) === String(lineItems[index].uom_id));
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

    const updatedLine = { ...lineItems[index], [field]: newValue };

    if (field === "itemId") {
      updatedLine.onHand = onHandMap[String(newValue)] ?? 0;
    }

    if (field === "receivedQty") {
      updatedLine.acceptedQty = Number(newValue) || 0;
    }

    lineItems[index] = updatedLine;
    formik.setFieldValue("lineItems", lineItems);
  };

  const handleEdit = (id: number | string) => {
    if (!canUpdate("grn")) {
      toast.error("No permission to edit GRN");
      return;
    }
    const item = grns.find((x: any) => String(x.id) === String(id));
    if (item) {
      setIsEdit(true);
      setEditId(id);

      const header = item.header ?? item;
      const formatDate = (val: any) => (val && String(val).length >= 10 ? String(val).slice(0, 10) : "");
      const poIdVal = String(header.purchaseOrderId ?? header.po_header_id ?? "");
      const poObj = purchaseOrders.find((po: any) => String(po.id) === poIdVal);
      const poLines = getPoLineItems(poObj);
      const grnLines = item.grnDetails || item.lineItems || item.details || [];

      formik.setValues({
        header: {
          grnNo: header.grnNo ?? header.grn_number ?? "",
          purchaseOrderId: poIdVal,
          transportationModeId: String(header.transportationModeId ?? header.transportation_mode_id ?? ""),
          driverName: header.driverName ?? header.driver_name ?? "",
          driverPhoneNo: header.driverPhoneNo ?? header.driver_phone_no ?? header.driverPhone ?? "",
          vehicleNo: header.vehicleNo ?? header.vehicle_number ?? "",
          grnDate: formatDate(header.grnDate ?? header.receipt_date) || new Date().toISOString().split("T")[0],
          subsidiary_id: String(header.subsidiary_id ?? poObj?.subsidiary_id ?? ""),
          class_id: String(header.class_id ?? poObj?.class_id ?? ""),
          department_id: String(header.department_id ?? poObj?.department_id ?? ""),
          location_id: String(header.location_id ?? header.city_id ?? poObj?.city_id ?? ""),
          memo: header.memo ?? "",
          status: header.status ?? "DRAFT",
          remarks: header.remarks ?? "",
        },
        lineItems: Array.isArray(grnLines) && grnLines.length > 0
          ? grnLines.map((l: any) => {
            const matchedPoLine = poLines.find((pol: any) => String(pol.id) === String(l.purchaseOrderLineId || l.po_line_id)) || poLines.find((pol: any) => String(pol.itemId || pol.item_id) === String(l.itemId || l.item_id));
            const itemId = String(l.itemId ?? l.item_id ?? matchedPoLine?.itemId ?? matchedPoLine?.item_id ?? "");
            const ordQty = Number(l.orderedQty ?? l.ordered_quantity ?? matchedPoLine?.quantity ?? matchedPoLine?.qty ?? 0);
            const recQty = Number(l.receivedQty ?? l.received_quantity ?? ordQty);

            return {
              purchaseOrderLineId: l.purchaseOrderLineId ?? l.po_line_id ?? matchedPoLine?.id ?? "",
              itemId,
              uom_id: String(l.uom_id ?? l.uomId ?? matchedPoLine?.uom_id ?? ""),
              locationId: String(l.locationId ?? l.location_id ?? header.location_id ?? header.city_id ?? ""),
              onHand: Number(l.onHand ?? onHandMap[itemId] ?? 0),
              orderedQty: ordQty,
              receivedQty: recQty,
              acceptedQty: Number(l.acceptedQty ?? l.accepted_quantity ?? recQty),
              rejectedQty: Number(l.rejectedQty ?? l.rejected_quantity ?? 0),
              manufacturingDate: l.manufacturingDate ?? "",
              expiryDate: l.expiryDate ?? "",
              qcRequired: l.qcRequired ?? false,
              status: l.status ?? "PENDING",
              remarks: l.remarks ?? "",
            };
          })
          : [createDefaultLineItem()],
      });
      setViewMode("form");
      setSearchParams({ id: String(id), action: "edit" });
    }
  };

  const handleView = (id: number | string) => {
    const item = grns.find((x: any) => String(x.id) === String(id));
    if (item) {
      setSelectedGRN(item);
      setViewMode("view");
      setSearchParams({ id: String(id), action: "view" });
    }
  };

  const confirmDelete = async () => {
    if (!grnToDelete) return;
    try {
      await deleteGRN(grnToDelete.id).unwrap();
      toast.success("GRN deleted successfully");
      refetchGRNs();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete GRN");
    } finally {
      setDeleteDialogOpen(false);
      setGrnToDelete(null);
    }
  };

  if (!canRead("grn")) {
    return <div className="p-8 text-center text-red-600 font-bold">Access Denied: You do not have permission to view GRN.</div>;
  }

  // ── RENDER 1: FORM & VIEW MODE ──
  if (viewMode === "form" || viewMode === "view") {
    const isView = viewMode === "view";
    const activeHeader = isView ? selectedGRN?.header || selectedGRN || {} : formik.values.header;
    const activeLines = isView ? selectedGRN?.grnDetails || selectedGRN?.lineItems || [] : formik.values.lineItems;

    const poObj = purchaseOrders.find((p: any) => String(p.id) === String(activeHeader.purchaseOrderId || activeHeader.po_header_id));
    const poNumber = activeHeader.purchaseOrder?.purchaseNo || poObj?.purchaseNo || (activeHeader.purchaseOrderId ? `PO-${activeHeader.purchaseOrderId}` : "—");

    const rawSub = activeHeader.subsidiary || subsidiaries.find((s: any) => String(s.id) === String(activeHeader.subsidiary_id));
    const subsidiaryName = typeof rawSub === "object" && rawSub !== null ? (rawSub.subsidiary_name || rawSub.name || "Ignitive Software Labs") : (typeof rawSub === "string" && rawSub ? rawSub : "Ignitive Software Labs");

    const rawCurr = activeHeader.currency || poObj?.currency || poObj?.currency_code;
    const currencyName = typeof rawCurr === "object" && rawCurr !== null ? (rawCurr.currency_code || rawCurr.currency_name || rawCurr.code || "INR") : (typeof rawCurr === "string" && rawCurr ? rawCurr : "INR");

    const rawClass = activeHeader.class || classesList.find((c: any) => String(c.id) === String(activeHeader.class_id));
    const classNameVal = typeof rawClass === "object" && rawClass !== null ? (rawClass.class_name || rawClass.name || "—") : (typeof rawClass === "string" && rawClass ? rawClass : "—");

    const rawDept = activeHeader.department || departmentsList.find((d: any) => String(d.id) === String(activeHeader.department_id));
    const deptNameVal = typeof rawDept === "object" && rawDept !== null ? (rawDept.department_name || rawDept.name || "—") : (typeof rawDept === "string" && rawDept ? rawDept : "—");

    const rawLoc = activeHeader.location || citiesList.find((c: any) => String(c.id) === String(activeHeader.location_id));
    const locNameVal = typeof rawLoc === "object" && rawLoc !== null ? (rawLoc.city_name || rawLoc.name || "—") : (typeof rawLoc === "string" && rawLoc ? rawLoc : "—");

    const rawTrans = activeHeader.transportationMode || transportationModes.find((t: any) => String(t.id) === String(activeHeader.transportationModeId));
    const transModeVal = typeof rawTrans === "object" && rawTrans !== null ? (rawTrans.mode_name || rawTrans.name || "—") : (typeof rawTrans === "string" && rawTrans ? rawTrans : "—");

    const totalRecQty = activeLines.reduce((acc: number, l: any) => acc + Number(l.receivedQty || l.received_quantity || 0), 0);
    const totalAccQty = activeLines.reduce((acc: number, l: any) => acc + Number(l.acceptedQty || l.accepted_quantity || 0), 0);

    const grnValTotal = activeLines.reduce((acc: number, l: any) => {
      const itemObj = items.find((i: any) => String(i.id) === String(l.itemId || l.item_id));
      const rate = Number(itemObj?.purchase_price || itemObj?.cost_price || itemObj?.default_rate || 100);
      const qty = Number(l.receivedQty || l.received_quantity || 0);
      return acc + (qty * rate);
    }, 0);

    const grnNoStr = activeHeader.grnNo || activeHeader.grn_number || `GRN-${selectedGRN?.id || "NEW"}`;

    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Goods Receipt Note (GRN)"
          subtitle={isView ? `GRN #${grnNoStr}` : isEdit ? `Edit GRN #${formik.values.header.grnNo}` : "New Item Receipt"}
          mode={isView ? "view" : "edit"}
          saveButtonText="Receive"
          onSave={() => handleSubmitWithStatus("RECEIVED")}
          onSaveDraft={() => handleSubmitWithStatus("DRAFT")}
          onEdit={() => { if (selectedGRN) handleEdit(selectedGRN.id); }}
          onBack={() => { setViewMode("list"); setSearchParams({}); }}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
          customActions={
            isView && selectedGRN ? (
              <div className="flex items-center space-x-1.5">
                {String(selectedGRN.status || "").toUpperCase() === "DRAFT" && (
                  <button
                    type="button"
                    onClick={() => handleReceiveStatusUpdate(selectedGRN.id)}
                    disabled={isUpdatingStatus}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingStatus ? "Updating..." : "Receive"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/purchase-invoice?grnId=${selectedGRN.id}`)}
                  className="bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Bill
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/purchase-return?grnId=${selectedGRN.id}`)}
                  className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Return
                </button>
              </div>
            ) : undefined
          }
          isSaving={isCreating || isUpdating}
          subTabs={[
            {
              id: "items",
              label: `Items Received (${activeLines.length})`,
              content: (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-slate-300 rounded-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#244b5a] text-white font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 border-r border-slate-400 w-10 text-center">#</th>
                          <th className="p-2 border-r border-slate-400 min-w-[180px]">ITEM *</th>
                          <th className="p-2 border-r border-slate-400 min-w-[140px]">LOCATION</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">ON-HAND QTY</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">ORDERED QTY</th>
                          <th className="p-2 border-r border-slate-400 w-28 text-right">REC QTY *</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">ACCEPTED QTY</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">REJECTED QTY</th>
                          <th className="p-2 border-r border-slate-400 min-w-[140px]">REMARKS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {activeLines.map((line: any, idx: number) => {
                          const itemObj = items.find((i: any) => String(i.id) === String(line.itemId || line.item_id));
                          const selectedUom = uoms.find((u: any) => String(u.id) === String(line.uom_id || itemObj?.uom_id));
                          const allowsDecimals = isDecimalAllowedForUOM(selectedUom);
                          const lineOnHand = onHandMap[String(line.itemId || line.item_id)] ?? line.onHand ?? 0;
                          const lineLocName = line.location?.city_name || citiesList.find((c: any) => String(c.id) === String(line.locationId || line.location_id))?.city_name || "—";

                          if (isView) {
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                                <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{line.item?.item_name || itemObj?.item_name || "—"}</td>
                                <td className="p-2 border-r border-slate-200 font-medium text-slate-800">{lineLocName}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-slate-700">{lineOnHand}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono">{line.orderedQty ?? 0}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-sky-800">{line.receivedQty ?? line.received_quantity ?? 0}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono text-emerald-700">{line.acceptedQty ?? line.accepted_quantity ?? 0}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono text-red-600">{line.rejectedQty ?? line.rejected_quantity ?? 0}</td>
                                <td className="p-2 border-r border-slate-200 text-slate-700">{line.remarks || "—"}</td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                              <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                                {line.item?.item_name || itemObj?.item_name || (line.itemId ? `Item #${line.itemId}` : "—")}
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <select
                                  value={line.locationId || ""}
                                  onChange={(e) => updateGrnLineField(idx, "locationId", e.target.value)}
                                  className="w-full h-7 bg-white border border-slate-300 rounded-xs px-2 text-xs focus:outline-none focus:border-sky-500"
                                >
                                  <option value="">Select Location...</option>
                                  {filteredLocations.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                      {c.city_name || c.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-slate-700 bg-slate-50">
                                {lineOnHand}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-500">{line.orderedQty || 0}</td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  disabled={true}
                                  step={allowsDecimals ? "any" : "1"}
                                  min={allowsDecimals ? "0.01" : "1"}
                                  value={line.receivedQty}
                                  onKeyDown={(e) => {
                                    if (!allowsDecimals && (e.key === "." || e.key === "," || e.key === "e" || e.key === "E" || e.key === "-")) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => updateGrnLineField(idx, "receivedQty", e.target.value)}
                                  className="w-full h-7 bg-slate-100 border border-slate-300 rounded-xs px-2 text-xs text-right font-mono text-slate-700 cursor-not-allowed font-semibold"
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  disabled={true}
                                  min="0"
                                  value={line.acceptedQty}
                                  onChange={(e) => updateGrnLineField(idx, "acceptedQty", Number(e.target.value) || 0)}
                                  className="w-full h-7 bg-slate-100 border border-slate-300 rounded-xs px-2 text-xs text-right font-mono text-slate-700 cursor-not-allowed font-semibold"
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  disabled={true}
                                  min="0"
                                  value={line.rejectedQty}
                                  onChange={(e) => updateGrnLineField(idx, "rejectedQty", Number(e.target.value) || 0)}
                                  className="w-full h-7 bg-slate-100 border border-slate-300 rounded-xs px-2 text-xs text-right font-mono text-slate-700 cursor-not-allowed"
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="text"
                                  placeholder="Remarks..."
                                  value={line.remarks}
                                  onChange={(e) => updateGrnLineField(idx, "remarks", e.target.value)}
                                  className="w-full h-7 bg-white border border-slate-300 rounded-xs px-2 text-xs focus:outline-none focus:border-sky-500"
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
            {
              id: "logistics",
              label: "Logistics & Transportation",
              content: (
                <div className="p-4 bg-white border border-slate-300 rounded-xs">
                  {isView ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">TRANSPORTATION MODE</span>
                        <span className="text-xs font-semibold text-slate-800">{transModeVal}</span>
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">DRIVER NAME</span>
                        <span className="text-xs font-semibold text-slate-800">{activeHeader.driverName || "—"}</span>
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">DRIVER PHONE NO</span>
                        <span className="text-xs font-semibold text-slate-800">{activeHeader.driverPhoneNo || activeHeader.driverPhone || "—"}</span>
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">VEHICLE NO</span>
                        <span className="text-xs font-semibold text-slate-800">{activeHeader.vehicleNo || "—"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[11px] font-semibold text-[#475569] uppercase">TRANSPORTATION MODE</label>
                        <select
                          name="header.transportationModeId"
                          value={formik.values.header.transportationModeId || ""}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                        >
                          <option value="">Select Transportation Mode...</option>
                          {transportationModes.map((t: any) => (
                            <option key={t.id} value={t.id}>
                              {t.mode_name || t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[11px] font-semibold text-[#475569] uppercase">DRIVER NAME</label>
                        <input
                          type="text"
                          name="header.driverName"
                          placeholder="Enter driver name"
                          value={formik.values.header.driverName}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[11px] font-semibold text-[#475569] uppercase">DRIVER PHONE NO</label>
                        <input
                          type="text"
                          name="header.driverPhoneNo"
                          placeholder="Enter driver phone no"
                          value={formik.values.header.driverPhoneNo}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[11px] font-semibold text-[#475569] uppercase">VEHICLE NO</label>
                        <input
                          type="text"
                          name="header.vehicleNo"
                          placeholder="Enter vehicle number"
                          value={formik.values.header.vehicleNo}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
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
                    const lines = activeHeader.lineItems || activeHeader.lines || activeHeader.grn_lines || [];
                    const entries: any[] = [];
                    let totalDebitSum = 0;

                    lines.forEach((l: any) => {
                      const itemObj = items.find((i: any) => String(i.id) === String(l.itemId || l.item_id || l.item?.id)) || l.item;
                      const itemName = itemObj?.item_name || l.item_name || `Item #${l.itemId || l.id}`;
                      const qty = Number(l.acceptedQty ?? l.accepted_quantity ?? l.receivedQty ?? l.received_quantity ?? l.quantity ?? 0);
                      const rate = Number(l.unitPrice ?? l.unit_price ?? l.rate ?? l.purchaseOrderLine?.rate ?? 0);
                      const lineAmt = Number((qty * rate).toFixed(2));

                      if (lineAmt > 0) {
                        totalDebitSum += lineAmt;
                        entries.push({
                          accountCode: itemObj?.asset_account?.account_number || "1100",
                          accountName: itemObj?.asset_account?.account_name || `Inventory Asset - ${itemName}`,
                          debit: lineAmt,
                          credit: 0,
                          memo: `Stock Inward: ${itemName} (Qty: ${qty} @ ₹${rate.toFixed(2)})`,
                        });
                      }
                    });

                    const finalTotal = totalDebitSum > 0 ? Number(totalDebitSum.toFixed(2)) : Number((grnValTotal || 0).toFixed(2));
                    if (finalTotal > 0) {
                      if (entries.length === 0) {
                        entries.push({
                          accountCode: "1100",
                          accountName: "Inventory Asset / Received Goods",
                          debit: finalTotal,
                          credit: 0,
                          memo: `Stock Inward GRN #${grnNoStr}`,
                        });
                      }
                      entries.push({
                        accountCode: "2200",
                        accountName: "Accrued Purchases (GRNI Liability)",
                        debit: 0,
                        credit: finalTotal,
                        memo: `Accrued Purchase Liability - GRN #${grnNoStr}`,
                      });
                    }

                    return <GLImpactSubtab documentNumber={grnNoStr} entries={entries} />;
                  })(),
                },
              ]
              : []),
          ]}
        >
          {/* PRIMARY INFORMATION + SUMMARY CARD */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 space-y-4">
              <RecordSection title="Primary Information" defaultOpen={true}>
                {isView ? (
                  <>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">GRN #</span>
                      <span className="text-xs font-bold text-slate-900">{activeHeader.grnNo || activeHeader.grn_number || `GRN-${selectedGRN?.id}`}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">PURCHASE ORDER</span>
                      <span className="text-xs font-semibold text-sky-700">{poNumber}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">RECEIPT DATE</span>
                      <span className="text-xs text-slate-800">{activeHeader.grnDate || activeHeader.receipt_date ? new Date(activeHeader.grnDate || activeHeader.receipt_date).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">MEMO</span>
                      <span className="text-xs text-slate-800">{activeHeader.memo || "—"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">GRN #</label>
                      <input
                        type="text"
                        name="header.grnNo"
                        placeholder="Auto-generated if empty"
                        value={formik.values.header.grnNo}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">PURCHASE ORDER REFERENCE</label>
                      <div className="h-7 px-2 py-1 bg-slate-100 border border-slate-300 rounded-xs text-xs font-semibold text-sky-800 flex items-center select-none">
                        {poNumber}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">
                        RECEIPT DATE <span className="text-amber-600">*</span>
                      </label>
                      <input
                        type="date"
                        name="header.grnDate"
                        value={formik.values.header.grnDate}
                        onChange={formik.handleChange}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase">MEMO</label>
                      <input
                        type="text"
                        name="header.memo"
                        placeholder="Enter memo..."
                        value={formik.values.header.memo || ""}
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
                  Receipt Summary
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-semibold text-slate-700 uppercase text-[10px]">ITEMS</span>
                    <span>{activeLines.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-semibold text-slate-700 uppercase text-[10px]">TOTAL REC QTY</span>
                    <span>{totalRecQty}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                    <span className="uppercase text-[11px]">ACCEPTED QTY</span>
                    <span className="text-emerald-700">{totalAccQty}</span>
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
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">CURRENCY</span>
                  <span className="text-xs font-semibold text-slate-800">{currencyName}</span>
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
                    LOCATION / CITY <span className="text-amber-600">*</span>
                  </label>
                  <select
                    name="header.location_id"
                    value={formik.values.header.location_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">Select Location...</option>
                    {filteredLocations.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.city_name || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase">CLASS</label>
                  <select
                    name="header.class_id"
                    value={formik.values.header.class_id || ""}
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
                    name="header.department_id"
                    value={formik.values.header.department_id || ""}
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
        </RecordPageLayout>
      </form>
    );
  }

  // ── RENDER 2: DATAGRID LIST VIEW MODE ──
  const filteredGRNs = grns.filter((grn: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const grnNoStr = String(grn.grnNo || grn.grn_number || `GRN-${grn.id}`).toLowerCase();
    const poRef = String(grn.purchaseOrder?.purchaseNo || (grn.po_header_id ? `PO-${grn.po_header_id}` : "")).toLowerCase();
    const driver = String(grn.driverName || "").toLowerCase();
    const vehicle = String(grn.vehicleNo || "").toLowerCase();
    return grnNoStr.includes(term) || poRef.includes(term) || driver.includes(term) || vehicle.includes(term);
  });

  return (
    <div className="flex flex-col space-y-3 p-4 bg-[#f3f6f9] min-h-screen font-sans text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-300">
        <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Goods Receipt Notes (GRN)</h1>
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
            <option>All Goods Receipt Notes</option>
          </select>
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
                placeholder="Search GRN #, PO Reference, Driver, Vehicle..."
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
              <th className="p-2 border-r border-slate-300 w-28 text-center">ACTION</th>
              <th className="p-2 border-r border-slate-300 w-24">INTERNAL ID</th>
              <th className="p-2 border-r border-slate-300 min-w-[130px]">GRN NUMBER</th>
              <th className="p-2 border-r border-slate-300 min-w-[150px]">PO REFERENCE</th>
              <th className="p-2 border-r border-slate-300 w-28">RECEIPT DATE</th>
              <th className="p-2 border-r border-slate-300 w-28 text-center">STATUS</th>
              <th className="p-2 w-20 text-center">DELETE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredGRNs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-medium italic">
                  {searchTerm ? "No matching GRNs found." : "No Goods Receipt Notes found. To create a GRN, approve a Purchase Order and click 'Receive'."}
                </td>
              </tr>
            ) : (
              filteredGRNs.map((grn: any) => {
                const poRef = grn.purchaseOrder?.purchaseNo || (grn.po_header_id || grn.purchaseOrderId ? `PO-${grn.po_header_id || grn.purchaseOrderId}` : "—");
                const grnNoStr = grn.grnNo || grn.grn_number || `GRN-${grn.id}`;
                const isGrnDraft = String(grn.status || "").toUpperCase() === "DRAFT";

                return (
                  <tr key={grn.id} className="hover:bg-sky-50/50 transition-colors">
                    <td className="p-2 border-r border-slate-200 text-center font-semibold space-x-1">
                      {isGrnDraft ? (
                        canUpdate("grn") ? (
                          <button
                            type="button"
                            onClick={() => handleEdit(grn.id)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-xs cursor-pointer shadow-2xs"
                          >
                            Receive
                          </button>
                        ) : (
                          <span className="text-slate-400">Receive</span>
                        )
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <button onClick={() => handleView(grn.id)} className="text-sky-700 hover:underline cursor-pointer">
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/purchase-invoice?grnId=${grn.id}`)}
                            className="text-sky-700 font-semibold hover:underline cursor-pointer"
                          >
                            Bill
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">{grn.id}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-sky-800">
                      <button onClick={() => handleView(grn.id)} className="hover:underline text-left cursor-pointer">
                        {grnNoStr}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 text-sky-800 font-medium">{poRef}</td>
                    <td className="p-2 border-r border-slate-200 text-slate-700">
                      {grn.grnDate || grn.receipt_date ? new Date(grn.grnDate || grn.receipt_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center">
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${isGrnDraft
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}>
                        {grn.status || "COMPLETED"}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {canDelete("grn") && (
                        <button
                          onClick={() => {
                            setGrnToDelete(grn);
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
        title="Delete Goods Receipt Note"
        message="Are you sure you want to delete this GRN? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default GRNComp;