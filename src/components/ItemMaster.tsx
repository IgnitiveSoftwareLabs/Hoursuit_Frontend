import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import {
  Add,
  GetApp,
  Print,
  KeyboardArrowDown,
  KeyboardArrowUp,
  FilterList,
  Autorenew,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import {
  useCreateItemMutation,
  useDeleteItemMutation,
  useGetItemsQuery,
  useGetSingleItemQuery,
  useUpdateItemMutation,
} from "../RTK/services/itemApi";
import { useGetItemTypesQuery } from "../RTK/services/itemTypeApi";
import { useGetUOMsQuery } from "../RTK/services/uomApi";
import { useGetHSNSACsQuery } from "../RTK/services/hsnSacApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetChartOfAccountsQuery } from "../RTK/services/chartOfAccountApi";
import { useGetClassesQuery } from "../RTK/services/classApi";
import { useGetDepartmentsQuery } from "../RTK/services/departmentApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";

interface ItemFormValues {
  id?: number;
  item_code: string;
  item_name: string;
  item_desc: string;
  item_type: number | string;
  track_inventory: boolean;
  sku: string;
  barcode: string;
  cost_price: number | string;
  min_stock_level: number | string;
  hsn_sac_code_id: number | string;
  uom_id: number | string;
  default_rate: number | string;
  subsidiary_id: number | string;
  class_id: number | string;
  department_id: number | string;
  location_id: number | string;
  safety_stock_level: number | string;
  days: number | string;
  manufacturer: string;
  purchase_price: number | string;
  total_value: number | string;
  purchase_desc: string;
  item_image: string;
  sales_desc: string;
  sales_price: number | string;
  shipping_cost: number | string;
  asset_account_id: number | string;
  income_account_id: number | string;
  cogs_account_id: number | string;
  expense_account_id: number | string;
  isActive: boolean;
}

export default function ItemMasterComp() {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'list' (Data Table) | 'view' (Read-Only View) | 'form' (Editable Form)
  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  // Form Tab State: 'inventory' | 'salesPricing' | 'accounting'
  const [activeTab, setActiveTab] = useState<"inventory" | "salesPricing" | "accounting">("inventory");

  // Filter State
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedItemTypeFilter, setSelectedItemTypeFilter] = useState<string>("all");
  const [showInactives, setShowInactives] = useState(false);
  const [quickSort, setQuickSort] = useState("Recently Created");

  // RTK Queries
  const { data: itemsData, isLoading: isItemsLoading } = useGetItemsQuery({ page: 1, search: "" });
  const { data: singleItemData, isLoading: isSingleItemLoading } = useGetSingleItemQuery(selectedItemId!, {
    skip: !selectedItemId || viewMode !== "view",
  });
  const { data: itemTypesData } = useGetItemTypesQuery();
  const { data: uomData } = useGetUOMsQuery();
  const { data: hsnSacData } = useGetHSNSACsQuery();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();
  const { data: classesData } = useGetClassesQuery();
  const { data: departmentsData } = useGetDepartmentsQuery();
  const { data: citiesData } = useGetCitiesQuery();
  const { data: chartAccountsData } = useGetChartOfAccountsQuery(undefined, { skip: viewMode === "list" });

  const [createItem, { isLoading: isCreating }] = useCreateItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateItemMutation();
  const [deleteItem] = useDeleteItemMutation();

  // Master data extraction with fallbacks
  const rawItems = Array.isArray(itemsData?.result)
    ? itemsData.result
    : Array.isArray(itemsData?.data)
      ? itemsData.data
      : Array.isArray(itemsData)
        ? itemsData
        : [];

  const itemTypes = Array.isArray(itemTypesData?.result) ? itemTypesData.result : [];
  const uomList = Array.isArray(uomData?.result) ? uomData.result : [];
  const hsnSacList = Array.isArray(hsnSacData?.result) ? hsnSacData.result : [];
  const rawSubsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : [];
  const classesList = Array.isArray(classesData?.result) ? classesData.result : [];
  const departmentsList = Array.isArray(departmentsData?.result) ? departmentsData.result : [];
  const locationList = Array.isArray(citiesData?.result)
    ? citiesData.result
    : Array.isArray(citiesData?.data)
      ? citiesData.data
      : Array.isArray(citiesData)
        ? citiesData
        : [];
  const chartAccounts = Array.isArray(chartAccountsData?.result) ? chartAccountsData.result : [];

  const generateNextItemCode = () => {
    const nextNum = rawItems.length + 1;
    return `ITM-${String(nextNum).padStart(4, "0")}`;
  };

  const preventNegativeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
      e.preventDefault();
    }
  };

  const handleNonNegativeChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      formik.setFieldValue(field, "");
      return;
    }
    const num = Number(val);
    if (num < 0) {
      formik.setFieldValue(field, 0);
    } else {
      formik.setFieldValue(field, val);
    }
  };

  const formik = useFormik<ItemFormValues>({
    initialValues: {
      item_code: "",
      item_name: "",
      item_desc: "",
      item_type: "",
      track_inventory: false,
      sku: "",
      barcode: "",
      cost_price: "",
      min_stock_level: "",
      hsn_sac_code_id: "",
      uom_id: "",
      default_rate: "",
      subsidiary_id: "",
      class_id: "",
      department_id: "",
      location_id: "",
      safety_stock_level: "",
      days: "",
      manufacturer: "",
      purchase_price: "",
      total_value: "",
      purchase_desc: "",
      item_image: "",
      sales_desc: "",
      sales_price: "",
      shipping_cost: "",
      asset_account_id: "",
      income_account_id: "",
      cogs_account_id: "",
      expense_account_id: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      item_code: Yup.string().trim().required("Item Code is required"),
      item_name: Yup.string().trim().required("Item Name is required"),
      item_type: Yup.mixed().required("Item Type is required"),
      uom_id: Yup.mixed().required("UOM is required"),
      subsidiary_id: Yup.mixed().required("Subsidiary is required"),
      asset_account_id: Yup.mixed().required("Asset Account is required"),
      income_account_id: Yup.mixed().required("Income Account is required"),
      cogs_account_id: Yup.mixed().required("COGS Account is required"),
      expense_account_id: Yup.mixed().required("Expense Account is required"),
      cost_price: Yup.number().transform((v, o) => (o === "" ? null : v)).min(0, "Cost price cannot be negative").nullable(),
      default_rate: Yup.number().transform((v, o) => (o === "" ? null : v)).min(0, "Default rate cannot be negative").nullable(),
      safety_stock_level: Yup.number().transform((v, o) => (o === "" ? null : v)).min(0, "Safety stock level cannot be negative").nullable(),
      days: Yup.number().transform((v, o) => (o === "" ? null : v)).min(0, "Days cannot be negative").nullable(),
      min_stock_level: Yup.number().transform((v, o) => (o === "" ? null : v)).min(0, "Min stock level cannot be negative").nullable(),
      purchase_price: Yup.number().transform((v, o) => (o === "" ? null : v)).min(0, "Purchase price cannot be negative").nullable(),
      total_value: Yup.number().transform((v, o) => (o === "" ? null : v)).min(0, "Total value cannot be negative").nullable(),
      sales_price: Yup.number().transform((v, o) => (o === "" ? null : v)).min(0, "Sales price cannot be negative").nullable(),
      shipping_cost: Yup.number().transform((v, o) => (o === "" ? null : v)).min(0, "Shipping cost cannot be negative").nullable(),
    }),
    onSubmit: async (values) => {
      try {
        const itemCodeToUse = values.item_code.trim() || generateNextItemCode();

        const payload: any = {
          item_code: itemCodeToUse,
          item_name: values.item_name.trim(),
          item_desc: values.item_desc || null,
          item_type: values.item_type ? Number(values.item_type) : null,
          item_type_id: values.item_type ? Number(values.item_type) : null,
          track_inventory: values.track_inventory,
          sku: values.sku || null,
          barcode: values.barcode || null,
          cost_price: values.cost_price !== "" ? Math.max(0, Number(values.cost_price)) : null,
          min_stock_level: values.min_stock_level !== "" ? Math.max(0, Number(values.min_stock_level)) : null,
          hsn_sac_code_id: values.hsn_sac_code_id ? Number(values.hsn_sac_code_id) : null,
          uom_id: Number(values.uom_id),
          default_rate: values.default_rate !== "" ? Math.max(0, Number(values.default_rate)) : null,
          subsidiary_id: values.subsidiary_id ? Number(values.subsidiary_id) : null,
          class_id: values.class_id ? Number(values.class_id) : null,
          department_id: values.department_id ? Number(values.department_id) : null,
          location_id: values.location_id ? Number(values.location_id) : null,
          safety_stock_level: values.safety_stock_level !== "" ? Math.max(0, Number(values.safety_stock_level)) : null,
          days: values.days !== "" ? Math.max(0, Number(values.days)) : null,
          manufacturer: values.manufacturer || null,
          purchase_price: values.purchase_price !== "" ? Math.max(0, Number(values.purchase_price)) : null,
          total_value: values.total_value !== "" ? Math.max(0, Number(values.total_value)) : null,
          purchase_desc: values.purchase_desc || null,
          item_image: values.item_image || null,
          sales_desc: values.sales_desc || null,
          sales_price: values.sales_price !== "" ? Math.max(0, Number(values.sales_price)) : null,
          shipping_cost: values.shipping_cost !== "" ? Math.max(0, Number(values.shipping_cost)) : null,
          asset_account_id: values.asset_account_id ? Number(values.asset_account_id) : null,
          income_account_id: values.income_account_id ? Number(values.income_account_id) : null,
          cogs_account_id: values.cogs_account_id ? Number(values.cogs_account_id) : null,
          expense_account_id: values.expense_account_id ? Number(values.expense_account_id) : null,
          isActive: values.isActive,
        };

        if (isEdit && editItemId) {
          if (!canUpdate("item")) {
            toast.error("You do not have permission to update items");
            return;
          }
          const response = await updateItem({ id: editItemId, payload }).unwrap();
          toast.success(response.message || "Item updated successfully");
        } else {
          if (!canCreate("item")) {
            toast.error("You do not have permission to create items");
            return;
          }
          const response = await createItem(payload).unwrap();
          toast.success(response.message || "Item created successfully");
        }

        formik.resetForm();
        setViewMode("list");
        setIsEdit(false);
        setSearchParams({});
      } catch (error: any) {
        toast.error(error?.data?.message || error?.message || "Something went wrong");
      }
    },
  });

  // URL search parameter page routing
  useEffect(() => {
    const urlId = searchParams.get("id");
    const urlAction = searchParams.get("action");

    if (urlId) {
      const idNum = Number(urlId);
      setSelectedItemId(idNum);

      if (urlAction === "edit") {
        const item = rawItems.find((itm: any) => itm.id === idNum);
        if (item) {
          setSelectedItem(item);
          populateForm(item);
          setEditItemId(idNum);
          setIsEdit(true);
        }
        setViewMode("form");
      } else {
        const itemFallback = rawItems.find((itm: any) => itm.id === idNum);
        if (itemFallback) {
          setSelectedItem(itemFallback);
        }
        setViewMode("view");
      }
    } else if (urlAction === "new" || urlAction === "form") {
      setViewMode("form");
      if (urlAction === "new") {
        setIsEdit(false);
        setEditItemId(null);
        setSelectedItem(null);
        formik.resetForm();
        formik.setFieldValue("item_code", generateNextItemCode());
        if (rawSubsidiaries.length > 0) {
          formik.setFieldValue("subsidiary_id", String(rawSubsidiaries[0].id));
        }
      }
    } else {
      setViewMode("list");
      setSelectedItemId(null);
    }
  }, [searchParams, rawItems.length, rawSubsidiaries.length]);

  const populateForm = (item: any) => {
    formik.setValues({
      item_code: item.item_code || "",
      item_name: item.item_name || "",
      item_desc: item.item_desc || "",
      item_type: item.item_type_id || item.item_type || "",
      track_inventory: item.track_inventory ?? false,
      sku: item.sku || "",
      barcode: item.barcode || "",
      cost_price: item.cost_price ?? "",
      min_stock_level: item.min_stock_level ?? "",
      hsn_sac_code_id: item.hsn_sac_code_id || "",
      uom_id: item.uom_id || "",
      default_rate: item.default_rate ?? "",
      subsidiary_id: item.subsidiary_id || "",
      class_id: item.class_id || "",
      department_id: item.department_id || "",
      location_id: item.location_id || "",
      safety_stock_level: item.safety_stock_level ?? "",
      days: item.days ?? "",
      manufacturer: item.manufacturer || "",
      purchase_price: item.purchase_price ?? "",
      total_value: item.total_value ?? "",
      purchase_desc: item.purchase_desc || "",
      item_image: item.item_image || "",
      sales_desc: item.sales_desc || "",
      sales_price: item.sales_price ?? "",
      shipping_cost: item.shipping_cost ?? "",
      asset_account_id: item.asset_account_id || "",
      income_account_id: item.income_account_id || "",
      cogs_account_id: item.cogs_account_id || "",
      expense_account_id: item.expense_account_id || "",
      isActive: item.isActive ?? true,
    });
  };

  const handleRowClick = (item: any) => {
    setSelectedItemId(item.id);
    setSelectedItem(item);
    setViewMode("view");
    setSearchParams({ id: item.id.toString() });
  };

  const handleEdit = (id: number) => {
    const item = rawItems.find((itm: any) => itm.id === id);
    if (item) {
      setSelectedItem(item);
      populateForm(item);
      setEditItemId(id);
      setIsEdit(true);
      setViewMode("form");
      setSearchParams({ id: id.toString(), action: "edit" });
    }
  };

  const handleDeletePrompt = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteItemId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItemId) return;
    try {
      if (!canDelete("item")) {
        toast.error("You do not have permission to delete items");
        return;
      }
      const response = await deleteItem(deleteItemId).unwrap();
      toast.success(response.message || "Item deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteItemId(null);
      if (selectedItemId === deleteItemId) {
        setViewMode("list");
        setSelectedItemId(null);
        setSearchParams({});
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete item");
    }
  };

  // ── RENDER 1: READ-ONLY VIEW MODE ──
  if (viewMode === "view") {
    const activeItem = singleItemData?.result || selectedItem || {};

    const itemTypeName = activeItem.itemType?.item_type_name || activeItem.item_type?.item_type_name || itemTypes.find((t: any) => String(t.id) === String(activeItem.item_type_id || activeItem.item_type))?.item_type_name || "—";
    const uomName = activeItem.uom?.uom_name || uomList.find((u: any) => String(u.id) === String(activeItem.uom_id))?.uom_name || "—";
    const subsidiaryName = activeItem.subsidiary?.subsidiary_name || rawSubsidiaries.find((s: any) => String(s.id) === String(activeItem.subsidiary_id))?.subsidiary_name || "—";
    const classNameVal = activeItem.class?.class_name || classesList.find((c: any) => String(c.id) === String(activeItem.class_id))?.class_name || "—";
    const deptNameVal = activeItem.department?.department_name || departmentsList.find((d: any) => String(d.id) === String(activeItem.department_id))?.department_name || "—";
    const locNameVal = activeItem.location?.city_name || locationList.find((l: any) => String(l.id) === String(activeItem.location_id))?.city_name || "—";

    const assetAccountName = activeItem.asset_account
      ? `${activeItem.asset_account.account_number ? `${activeItem.asset_account.account_number} - ` : ""}${activeItem.asset_account.account_name}`
      : chartAccounts.find((a: any) => String(a.id) === String(activeItem.asset_account_id))?.account_name || "—";

    const incomeAccountName = activeItem.income_account
      ? `${activeItem.income_account.account_number ? `${activeItem.income_account.account_number} - ` : ""}${activeItem.income_account.account_name}`
      : chartAccounts.find((a: any) => String(a.id) === String(activeItem.income_account_id))?.account_name || "—";

    const cogsAccountName = activeItem.cogs_account
      ? `${activeItem.cogs_account.account_number ? `${activeItem.cogs_account.account_number} - ` : ""}${activeItem.cogs_account.account_name}`
      : chartAccounts.find((a: any) => String(a.id) === String(activeItem.cogs_account_id))?.account_name || "—";

    const expenseAccountName = activeItem.expense_account
      ? `${activeItem.expense_account.account_number ? `${activeItem.expense_account.account_number} - ` : ""}${activeItem.expense_account.account_name}`
      : chartAccounts.find((a: any) => String(a.id) === String(activeItem.expense_account_id))?.account_name || "—";

    return (
      <RecordPageLayout
        recordType="Item Master"
        subtitle={`${activeItem.item_code || `ITEM-${activeItem.id}`} ${activeItem.item_name}`}
        mode="view"
        onEdit={() => handleEdit(activeItem.id || selectedItemId!)}
        onBack={() => { setViewMode("list"); setSearchParams({}); }}
        onListClick={() => { setViewMode("list"); setSearchParams({}); }}
        onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
      >
        {/* Primary Information */}
        <RecordSection title="Primary Information" defaultOpen={true}>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">ITEM CODE</span>
            <span className="text-xs font-bold text-slate-900">{activeItem.item_code || `ITEM-${activeItem.id}`}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">ITEM NAME</span>
            <span className="text-xs font-bold text-slate-900">{activeItem.item_name}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">ITEM TYPE</span>
            <span className="text-xs font-semibold text-slate-800">{itemTypeName}</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">UOM</span>
            <span className="text-xs font-semibold text-slate-800">{uomName}</span>
          </div>
        </RecordSection>

        {/* Classification */}
        <RecordSection title="Classification" defaultOpen={true}>
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
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">LOCATION</span>
            <span className="text-xs font-semibold text-slate-800">{locNameVal}</span>
          </div>
        </RecordSection>

        {/* Tab Navigation in Read-Only View Mode */}
        <div className="mt-4 border border-slate-300 rounded-xs bg-white overflow-hidden shadow-2xs">
          <div className="flex border-b border-slate-300 bg-slate-100 text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2.5 transition-colors border-r border-slate-300 cursor-pointer ${
                activeTab === "inventory"
                  ? "bg-white text-sky-700 border-b-2 border-b-sky-600 font-bold"
                  : "hover:bg-slate-200"
              }`}
            >
              Inventory
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("salesPricing")}
              className={`px-4 py-2.5 transition-colors border-r border-slate-300 cursor-pointer ${
                activeTab === "salesPricing"
                  ? "bg-white text-sky-700 border-b-2 border-b-sky-600 font-bold"
                  : "hover:bg-slate-200"
              }`}
            >
              Sales / Pricing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("accounting")}
              className={`px-4 py-2.5 transition-colors cursor-pointer ${
                activeTab === "accounting"
                  ? "bg-white text-sky-700 border-b-2 border-b-sky-600 font-bold"
                  : "hover:bg-slate-200"
              }`}
            >
              Accounting
            </button>
          </div>

          {/* TAB 1: INVENTORY */}
          {activeTab === "inventory" && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">COST PRICE</span>
                <span className="text-xs font-mono text-slate-800">₹{activeItem.cost_price ? Number(activeItem.cost_price).toFixed(2) : "0.00"}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">DEFAULT RATE</span>
                <span className="text-xs font-mono font-bold text-emerald-700">₹{activeItem.default_rate ? Number(activeItem.default_rate).toFixed(2) : "0.00"}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">SAFETY STOCK LEVEL</span>
                <span className="text-xs font-mono text-slate-800">{activeItem.safety_stock_level ?? "—"}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">DAYS</span>
                <span className="text-xs font-mono text-slate-800">{activeItem.days ?? "—"}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">MIN STOCK LEVEL</span>
                <span className="text-xs font-mono text-slate-800">{activeItem.min_stock_level ?? "—"}</span>
              </div>
              <div className="flex flex-col space-y-0.5 md:col-span-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">MANUFACTURER</span>
                <span className="text-xs text-slate-800">{activeItem.manufacturer || "—"}</span>
              </div>
            </div>
          )}

          {/* TAB 2: SALES / PRICING */}
          {activeTab === "salesPricing" && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">PURCHASE PRICE</span>
                <span className="text-xs font-mono text-slate-800">₹{activeItem.purchase_price ? Number(activeItem.purchase_price).toFixed(2) : "0.00"}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">TOTAL VALUE</span>
                <span className="text-xs font-mono text-slate-800">₹{activeItem.total_value ? Number(activeItem.total_value).toFixed(2) : "0.00"}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">SALES PRICE</span>
                <span className="text-xs font-mono text-slate-800">₹{activeItem.sales_price ? Number(activeItem.sales_price).toFixed(2) : "0.00"}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">SHIPPING COST</span>
                <span className="text-xs font-mono text-slate-800">₹{activeItem.shipping_cost ? Number(activeItem.shipping_cost).toFixed(2) : "0.00"}</span>
              </div>
              <div className="flex flex-col space-y-0.5 md:col-span-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">PURCHASE DESCRIPTION</span>
                <span className="text-xs text-slate-800">{activeItem.purchase_desc || "—"}</span>
              </div>
              <div className="flex flex-col space-y-0.5 md:col-span-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">ITEM DESCRIPTION</span>
                <span className="text-xs text-slate-800">{activeItem.item_desc || "—"}</span>
              </div>
              <div className="flex flex-col space-y-0.5 md:col-span-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">SALES DESCRIPTION</span>
                <span className="text-xs text-slate-800">{activeItem.sales_desc || "—"}</span>
              </div>
              {activeItem.item_image && (
                <div className="flex flex-col space-y-0.5 md:col-span-2">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">ITEM IMAGE</span>
                  <img src={activeItem.item_image} alt="Item" className="w-24 h-24 object-cover border border-slate-300 rounded mt-1" />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACCOUNTING */}
          {activeTab === "accounting" && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">ASSET ACCOUNT</span>
                <span className="text-xs font-semibold text-slate-800">{assetAccountName}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">INCOME ACCOUNT</span>
                <span className="text-xs font-semibold text-slate-800">{incomeAccountName}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">COGS ACCOUNT</span>
                <span className="text-xs font-semibold text-slate-800">{cogsAccountName}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">EXPENSE ACCOUNT</span>
                <span className="text-xs font-semibold text-slate-800">{expenseAccountName}</span>
              </div>
            </div>
          )}
        </div>
      </RecordPageLayout>
    );
  }

  // ── RENDER 2: EDITABLE FORM MODE WITH CLASSIFICATION & TABS ──
  if (viewMode === "form") {
    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Item Master"
          recordTitle={formik.values.item_name || (isEdit ? "Edit Item Record" : "New Item Record")}
          mode="edit"
          onSave={() => formik.handleSubmit()}
          onCancel={() => { setViewMode("list"); setSearchParams({}); }}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
          isSaving={isCreating || isUpdating}
        >
          {/* SECTION 1: PRIMARY INFORMATION */}
          <RecordSection title="Primary Information" defaultOpen={true}>
            {/* Item Code (Auto-generated with Auto button) */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#475569] uppercase">
                  ITEM CODE <span className="text-red-500">*</span>
                </label>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => formik.setFieldValue("item_code", generateNextItemCode())}
                    className="text-[10px] text-sky-700 hover:underline flex items-center space-x-0.5 font-medium cursor-pointer"
                    title="Generate automatic item code"
                  >
                    <Autorenew className="!w-3 !h-3" />
                    <span>Auto-generate</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                name="item_code"
                value={formik.values.item_code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. ITM-0001 (Auto-generated)"
                className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 font-mono ${
                  formik.touched.item_code && formik.errors.item_code ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                }`}
              />
              {formik.touched.item_code && formik.errors.item_code && (
                <span className="text-[10px] text-red-500 font-medium">{formik.errors.item_code}</span>
              )}
            </div>

            {/* Item Name */}
            <div className="flex flex-col space-y-1 md:col-span-2">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                ITEM NAME <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="item_name"
                value={formik.values.item_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Item Display Name"
                className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                  formik.touched.item_name && formik.errors.item_name ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                }`}
              />
              {formik.touched.item_name && formik.errors.item_name && (
                <span className="text-[10px] text-red-500 font-medium">{formik.errors.item_name}</span>
              )}
            </div>

            {/* Item Type */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                ITEM TYPE <span className="text-red-500">*</span>
              </label>
              <select
                name="item_type"
                value={formik.values.item_type || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                  formik.touched.item_type && formik.errors.item_type ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                }`}
              >
                <option value="">-- Select Type * --</option>
                {itemTypes.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.item_type_name || t.type_name || t.name}
                  </option>
                ))}
              </select>
              {formik.touched.item_type && formik.errors.item_type && (
                <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.item_type)}</span>
              )}
            </div>

            {/* UOM (Single place only in Primary Information) */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                UOM (UNIT OF MEASURE) <span className="text-red-500">*</span>
              </label>
              <select
                name="uom_id"
                value={formik.values.uom_id || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                  formik.touched.uom_id && formik.errors.uom_id ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                }`}
              >
                <option value="">-- Select UOM * --</option>
                {uomList.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.uom_name || u.name} {u.uom_symbol ? `(${u.uom_symbol})` : ""}
                  </option>
                ))}
              </select>
              {formik.touched.uom_id && formik.errors.uom_id && (
                <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.uom_id)}</span>
              )}
            </div>
          </RecordSection>

          {/* SECTION 2: CLASSIFICATION */}
          <RecordSection title="Classification" defaultOpen={true}>
            {/* Subsidiary (REQUIRED) */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                SUBSIDIARY <span className="text-red-500">*</span>
              </label>
              <select
                name="subsidiary_id"
                value={formik.values.subsidiary_id || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                  formik.touched.subsidiary_id && formik.errors.subsidiary_id ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                }`}
              >
                <option value="">-- Select Subsidiary * --</option>
                {rawSubsidiaries.map((sb: any) => (
                  <option key={sb.id} value={sb.id}>
                    {sb.subsidiary_name || sb.name}
                  </option>
                ))}
              </select>
              {formik.touched.subsidiary_id && formik.errors.subsidiary_id && (
                <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.subsidiary_id)}</span>
              )}
            </div>

            {/* Class */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">CLASS</label>
              <select
                name="class_id"
                value={formik.values.class_id || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select Class --</option>
                {classesList.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">DEPARTMENT</label>
              <select
                name="department_id"
                value={formik.values.department_id || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select Department --</option>
                {departmentsList.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">LOCATION</label>
              <select
                name="location_id"
                value={formik.values.location_id || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select Location --</option>
                {locationList.map((loc: any) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.city_name || loc.name || loc.location}
                  </option>
                ))}
              </select>
            </div>
          </RecordSection>

          {/* SECTION 3: TAB NAVIGATION & CONTENT */}
          <div className="mt-4 border border-slate-300 rounded-xs bg-white overflow-hidden shadow-2xs">
            {/* TAB HEADERS */}
            <div className="flex border-b border-slate-300 bg-slate-100 text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab("inventory")}
                className={`px-4 py-2.5 transition-colors border-r border-slate-300 cursor-pointer ${
                  activeTab === "inventory"
                    ? "bg-white text-sky-700 border-b-2 border-b-sky-600 font-bold"
                    : "hover:bg-slate-200"
                }`}
              >
                Inventory
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("salesPricing")}
                className={`px-4 py-2.5 transition-colors border-r border-slate-300 cursor-pointer ${
                  activeTab === "salesPricing"
                    ? "bg-white text-sky-700 border-b-2 border-b-sky-600 font-bold"
                    : "hover:bg-slate-200"
                }`}
              >
                Sales / Pricing
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("accounting")}
                className={`px-4 py-2.5 transition-colors cursor-pointer ${
                  activeTab === "accounting"
                    ? "bg-white text-sky-700 border-b-2 border-b-sky-600 font-bold"
                    : "hover:bg-slate-200"
                }`}
              >
                Accounting <span className="text-red-500">*</span>
              </button>
            </div>

            {/* TAB CONTENT: INVENTORY */}
            {activeTab === "inventory" && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">COST PRICE (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name="cost_price"
                    value={formik.values.cost_price}
                    onKeyDown={preventNegativeInput}
                    onChange={(e) => handleNonNegativeChange("cost_price", e)}
                    placeholder="0.00"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono text-right"
                  />
                  {formik.touched.cost_price && formik.errors.cost_price && (
                    <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.cost_price)}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">DEFAULT RATE (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name="default_rate"
                    value={formik.values.default_rate}
                    onKeyDown={preventNegativeInput}
                    onChange={(e) => handleNonNegativeChange("default_rate", e)}
                    placeholder="0.00"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono text-right"
                  />
                  {formik.touched.default_rate && formik.errors.default_rate && (
                    <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.default_rate)}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">SAFETY STOCK LEVEL</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="safety_stock_level"
                    value={formik.values.safety_stock_level}
                    onKeyDown={preventNegativeInput}
                    onChange={(e) => handleNonNegativeChange("safety_stock_level", e)}
                    placeholder="0"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono text-right"
                  />
                  {formik.touched.safety_stock_level && formik.errors.safety_stock_level && (
                    <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.safety_stock_level)}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">DAYS</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="days"
                    value={formik.values.days}
                    onKeyDown={preventNegativeInput}
                    onChange={(e) => handleNonNegativeChange("days", e)}
                    placeholder="0"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono text-right"
                  />
                  {formik.touched.days && formik.errors.days && (
                    <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.days)}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">MIN STOCK LEVEL</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="min_stock_level"
                    value={formik.values.min_stock_level}
                    onKeyDown={preventNegativeInput}
                    onChange={(e) => handleNonNegativeChange("min_stock_level", e)}
                    placeholder="0"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono text-right"
                  />
                  {formik.touched.min_stock_level && formik.errors.min_stock_level && (
                    <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.min_stock_level)}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">MANUFACTURER</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formik.values.manufacturer}
                    onChange={formik.handleChange}
                    placeholder="Manufacturer Name"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: SALES / PRICING */}
            {activeTab === "salesPricing" && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">PURCHASE PRICE (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name="purchase_price"
                    value={formik.values.purchase_price}
                    onKeyDown={preventNegativeInput}
                    onChange={(e) => handleNonNegativeChange("purchase_price", e)}
                    placeholder="0.00"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono text-right"
                  />
                  {formik.touched.purchase_price && formik.errors.purchase_price && (
                    <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.purchase_price)}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">TOTAL VALUE (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name="total_value"
                    value={formik.values.total_value}
                    onKeyDown={preventNegativeInput}
                    onChange={(e) => handleNonNegativeChange("total_value", e)}
                    placeholder="0.00"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono text-right"
                  />
                  {formik.touched.total_value && formik.errors.total_value && (
                    <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.total_value)}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">SALES PRICE (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name="sales_price"
                    value={formik.values.sales_price}
                    onKeyDown={preventNegativeInput}
                    onChange={(e) => handleNonNegativeChange("sales_price", e)}
                    placeholder="0.00"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono text-right"
                  />
                  {formik.touched.sales_price && formik.errors.sales_price && (
                    <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.sales_price)}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">SHIPPING COST (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name="shipping_cost"
                    value={formik.values.shipping_cost}
                    onKeyDown={preventNegativeInput}
                    onChange={(e) => handleNonNegativeChange("shipping_cost", e)}
                    placeholder="0.00"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono text-right"
                  />
                  {formik.touched.shipping_cost && formik.errors.shipping_cost && (
                    <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.shipping_cost)}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">ITEM IMAGE URL / PATH</label>
                  <input
                    type="text"
                    name="item_image"
                    value={formik.values.item_image}
                    onChange={formik.handleChange}
                    placeholder="https://example.com/image.png"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2"
                  />
                </div>

                <div className="flex flex-col space-y-1 md:col-span-3">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">PURCHASE DESCRIPTION</label>
                  <textarea
                    name="purchase_desc"
                    value={formik.values.purchase_desc}
                    onChange={formik.handleChange}
                    rows={2}
                    placeholder="Purchase description..."
                    className="text-xs bg-white border border-slate-300 rounded-xs p-2 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex flex-col space-y-1 md:col-span-3">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">ITEM DESCRIPTION</label>
                  <textarea
                    name="item_desc"
                    value={formik.values.item_desc}
                    onChange={formik.handleChange}
                    rows={2}
                    placeholder="Item description..."
                    className="text-xs bg-white border border-slate-300 rounded-xs p-2 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex flex-col space-y-1 md:col-span-3">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">SALES DESCRIPTION</label>
                  <textarea
                    name="sales_desc"
                    value={formik.values.sales_desc}
                    onChange={formik.handleChange}
                    rows={2}
                    placeholder="Sales description..."
                    className="text-xs bg-white border border-slate-300 rounded-xs p-2 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: ACCOUNTING (ALL REQUIRED) */}
            {activeTab === "accounting" && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/50">
                {/* Asset Account */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase">
                    ASSET ACCOUNT <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="asset_account_id"
                    value={formik.values.asset_account_id || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                      formik.touched.asset_account_id && formik.errors.asset_account_id ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                    }`}
                  >
                    <option value="">-- Select Asset Account * --</option>
                    {chartAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number ? `${acc.account_number} - ` : ""}{acc.account_name || acc.name}
                      </option>
                    ))}
                  </select>
                  {formik.touched.asset_account_id && formik.errors.asset_account_id && (
                    <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.asset_account_id)}</span>
                  )}
                </div>

                {/* Income Account */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase">
                    INCOME ACCOUNT <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="income_account_id"
                    value={formik.values.income_account_id || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                      formik.touched.income_account_id && formik.errors.income_account_id ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                    }`}
                  >
                    <option value="">-- Select Income Account * --</option>
                    {chartAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number ? `${acc.account_number} - ` : ""}{acc.account_name || acc.name}
                      </option>
                    ))}
                  </select>
                  {formik.touched.income_account_id && formik.errors.income_account_id && (
                    <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.income_account_id)}</span>
                  )}
                </div>

                {/* COGS Account */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase">
                    COGS ACCOUNT <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="cogs_account_id"
                    value={formik.values.cogs_account_id || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                      formik.touched.cogs_account_id && formik.errors.cogs_account_id ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                    }`}
                  >
                    <option value="">-- Select COGS Account * --</option>
                    {chartAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number ? `${acc.account_number} - ` : ""}{acc.account_name || acc.name}
                      </option>
                    ))}
                  </select>
                  {formik.touched.cogs_account_id && formik.errors.cogs_account_id && (
                    <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.cogs_account_id)}</span>
                  )}
                </div>

                {/* Expense Account */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase">
                    EXPENSE ACCOUNT <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="expense_account_id"
                    value={formik.values.expense_account_id || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${
                      formik.touched.expense_account_id && formik.errors.expense_account_id ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"
                    }`}
                  >
                    <option value="">-- Select Expense Account * --</option>
                    {chartAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number ? `${acc.account_number} - ` : ""}{acc.account_name || acc.name}
                      </option>
                    ))}
                  </select>
                  {formik.touched.expense_account_id && formik.errors.expense_account_id && (
                    <span className="text-[10px] text-red-500 font-medium">{String(formik.errors.expense_account_id)}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </RecordPageLayout>
      </form>
    );
  }

  // ── RENDER 3: LIST VIEW TABLE ──
  const filteredItems = rawItems.filter((item: any) => {
    if (!showInactives && item.isActive === false) return false;
    if (selectedItemTypeFilter !== "all") {
      const itId = item.item_type_id || item.item_type;
      if (String(itId) !== String(selectedItemTypeFilter)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col space-y-3 p-4 bg-[#f3f6f9] min-h-screen font-sans text-slate-800">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-300">
        <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Items Master</h1>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
          <button onClick={() => setViewMode("list")} className="text-sky-700 hover:underline cursor-pointer">
            List
          </button>
          <span className="text-slate-300">|</span>
          <button onClick={() => setViewMode("list")} className="text-sky-700 hover:underline cursor-pointer">
            Search
          </button>
        </div>
      </div>

      {/* 2. Top Button Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded-xs shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-xs">
          <span className="uppercase text-[10px] font-bold text-slate-500">VIEW</span>
          <select className="h-7 px-3 text-xs bg-white border border-slate-300 rounded-xs font-medium focus:outline-none focus:border-sky-600">
            <option>All Items & Materials</option>
          </select>
          {canCreate("item") && (
            <button
              type="button"
              onClick={() => {
                setIsEdit(false);
                setEditItemId(null);
                setSelectedItem(null);
                formik.resetForm();
                formik.setFieldValue("item_code", generateNextItemCode());
                if (rawSubsidiaries.length > 0) {
                  formik.setFieldValue("subsidiary_id", String(rawSubsidiaries[0].id));
                }
                setViewMode("form");
                setSearchParams({ action: "new" });
              }}
              className="bg-[#0070d2] hover:bg-blue-700 text-white font-bold text-xs px-4 py-1.5 rounded-xs border border-blue-800 shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Add className="!w-4 !h-4" />
              <span>+ New Item</span>
            </button>
          )}
        </div>

        {/* Quick Sort dropdown */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">SORT:</span>
          <select
            value={quickSort}
            onChange={(e) => setQuickSort(e.target.value)}
            className="h-7 px-2 text-xs bg-white border border-slate-300 rounded-xs font-medium focus:outline-none focus:border-sky-600"
          >
            <option>Recently Created</option>
            <option>Item Code</option>
            <option>Item Name (A-Z)</option>
            <option>Cost Price</option>
          </select>
        </div>
      </div>

      {/* 3. Filters Panel */}
      <div className="bg-white border border-slate-300 rounded-xs shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-full bg-[#f8fafc] hover:bg-slate-100 px-3 py-1.5 border-b border-slate-300 text-xs font-bold text-slate-700 flex items-center justify-between transition-colors select-none cursor-pointer"
        >
          <div className="flex items-center space-x-1.5 text-[11px] text-[#244b5a]">
            <span>= + FILTERS</span>
          </div>
          {isFiltersOpen ? <KeyboardArrowUp className="!w-4 !h-4 text-slate-500" /> : <KeyboardArrowDown className="!w-4 !h-4 text-slate-500" />}
        </button>

        {isFiltersOpen && (
          <div className="p-3 bg-slate-50/50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Item Type</label>
              <select
                value={selectedItemTypeFilter}
                onChange={(e) => setSelectedItemTypeFilter(e.target.value)}
                className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded-xs focus:outline-none focus:border-sky-600"
              >
                <option value="all">All Types</option>
                {itemTypes.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.item_type_name || t.type_name || t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <input
                type="checkbox"
                id="showInactives"
                checked={showInactives}
                onChange={(e) => setShowInactives(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded-xs border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="showInactives" className="text-xs font-medium text-slate-700 cursor-pointer">
                SHOW INACTIVES
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 4. DataGrid Table */}
      <div className="bg-white border border-slate-300 rounded-xs shadow-2xs overflow-x-auto">
        {isItemsLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
            <CircularProgress size={24} className="text-sky-600" />
            <span className="text-xs font-medium">Loading Items Master Catalog...</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#e5eff5] border-b border-slate-300 text-[#244b5a] font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-2 border-r border-slate-300 w-24 text-center">EDIT | VIEW</th>
                <th className="p-2 border-r border-slate-300 w-28">ITEM CODE</th>
                <th className="p-2 border-r border-slate-300 min-w-[200px]">ITEM NAME</th>
                <th className="p-2 border-r border-slate-300 w-32">ITEM TYPE</th>
                <th className="p-2 border-r border-slate-300 w-24">UOM</th>
                <th className="p-2 border-r border-slate-300 w-36">SUBSIDIARY</th>
                <th className="p-2 border-r border-slate-300 w-28 text-right">COST PRICE (₹)</th>
                <th className="p-2 border-r border-slate-300 w-28 text-right">DEFAULT RATE (₹)</th>
                <th className="p-2 border-r border-slate-300 w-24 text-center">STATUS</th>
                <th className="p-2 w-16 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-medium italic">
                    No items found matching the selected filters. Click "+ New Item" to create one.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => {
                  const itTypeName = item.itemType?.item_type_name || item.item_type?.item_type_name || itemTypes.find((t: any) => String(t.id) === String(item.item_type_id || item.item_type))?.item_type_name || "—";
                  const uomValName = item.uom?.uom_name || uomList.find((u: any) => String(u.id) === String(item.uom_id))?.uom_name || "—";
                  const subValName = item.subsidiary?.subsidiary_name || rawSubsidiaries.find((s: any) => String(s.id) === String(item.subsidiary_id))?.subsidiary_name || "—";
                  const isItemActive = item.isActive !== false;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                    >
                      <td className="p-2 border-r border-slate-200 text-center font-semibold space-x-1" onClick={(e) => e.stopPropagation()}>
                        {canUpdate("item") ? (
                          <button
                            onClick={() => handleEdit(item.id)}
                            className="text-sky-700 hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        ) : (
                          <span className="text-slate-300">Edit</span>
                        )}
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => handleRowClick(item)}
                          className="text-sky-700 hover:underline cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold text-sky-800">
                        {item.item_code || `ITEM-${item.id}`}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                        {item.item_name}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">{itTypeName}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">{uomValName}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">{subValName}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-800">
                        ₹{item.cost_price ? Number(item.cost_price).toFixed(2) : "0.00"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-emerald-700">
                        ₹{item.default_rate ? Number(item.default_rate).toFixed(2) : "0.00"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                            isItemActive
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {isItemActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                        {canDelete("item") && (
                          <button
                            type="button"
                            onClick={(e) => handleDeletePrompt(item.id, e)}
                            className="text-red-600 hover:text-red-800 cursor-pointer p-0.5 rounded"
                            title="Delete Item"
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
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Item Record"
        description="Are you sure you want to delete this item? This action cannot be undone."
      />
    </div>
  );
}
