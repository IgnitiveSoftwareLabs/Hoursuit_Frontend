import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import {
  Add,
  GetApp,
  Print,
  KeyboardArrowDown,
  KeyboardArrowUp,
  FilterList,
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

const ItemMasterComp: React.FC = () => {
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

  // Form Tab State
  const [activeTab, setActiveTab] = useState<"purchaseInventory" | "salesPurchasing" | "accounting">("purchaseInventory");

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
      item_code: Yup.string().required("Item code is required"),
      item_name: Yup.string().required("Item name is required"),
      item_type: Yup.mixed().required("Item type is required"),
      uom_id: Yup.number().required("UOM is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload: any = {
          item_code: values.item_code,
          item_name: values.item_name,
          item_desc: values.item_desc || null,
          item_type: values.item_type ? Number(values.item_type) : null,
          track_inventory: values.track_inventory,
          sku: values.sku || null,
          barcode: values.barcode || null,
          cost_price: values.cost_price !== "" ? Number(values.cost_price) : null,
          min_stock_level: values.min_stock_level !== "" ? Number(values.min_stock_level) : null,
          hsn_sac_code_id: values.hsn_sac_code_id ? Number(values.hsn_sac_code_id) : null,
          uom_id: Number(values.uom_id),
          default_rate: values.default_rate !== "" ? Number(values.default_rate) : null,
          subsidiary_id: values.subsidiary_id ? Number(values.subsidiary_id) : null,
          class_id: values.class_id ? Number(values.class_id) : null,
          department_id: values.department_id ? Number(values.department_id) : null,
          location_id: values.location_id ? Number(values.location_id) : null,
          safety_stock_level: values.safety_stock_level !== "" ? Number(values.safety_stock_level) : null,
          days: values.days !== "" ? Number(values.days) : null,
          manufacturer: values.manufacturer || null,
          purchase_price: values.purchase_price !== "" ? Number(values.purchase_price) : null,
          total_value: values.total_value !== "" ? Number(values.total_value) : null,
          purchase_desc: values.purchase_desc || null,
          item_image: values.item_image || null,
          sales_desc: values.sales_desc || null,
          sales_price: values.sales_price !== "" ? Number(values.sales_price) : null,
          shipping_cost: values.shipping_cost !== "" ? Number(values.shipping_cost) : null,
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
      }
    } else {
      setViewMode("list");
      setSelectedItemId(null);
    }
  }, [searchParams, rawItems.length]);

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

  const handleView = (id: number) => {
    setSelectedItemId(id);
    const item = rawItems.find((itm: any) => itm.id === id);
    if (item) setSelectedItem(item);
    setViewMode("view");
    setSearchParams({ id: String(id), action: "view" });
  };

  const handleEdit = (id: number) => {
    if (!canUpdate("item")) {
      toast.error("You do not have permission to edit items");
      return;
    }
    setSelectedItemId(id);
    const item = rawItems.find((itm: any) => itm.id === id);
    if (item) {
      setSelectedItem(item);
      populateForm(item);
      setEditItemId(id);
      setIsEdit(true);
    }
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("item")) {
      toast.error("You do not have permission to delete items");
      return;
    }
    try {
      const response = await deleteItem(id).unwrap();
      toast.success(response.message || "Item deleted successfully");
      setDeleteItemId(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleAddItem = () => {
    if (!canCreate("item")) {
      toast.error("You do not have permission to create items");
      return;
    }
    setViewMode("form");
    setIsEdit(false);
    setEditItemId(null);
    setSelectedItem(null);
    setSelectedItemId(null);
    formik.resetForm();
    setSearchParams({ action: "new" });
  };

  const handleExportCSV = () => {
    if (rawItems.length === 0) {
      toast.error("No items to export");
      return;
    }
    const headers = ["Internal ID", "Code", "Name", "Cost Price", "Default Rate", "Sales Price", "Manufacturer"];
    const rows = rawItems.map((itm: any) => [
      itm.id,
      `"${itm.item_code || `ITM-${itm.id}`}"`,
      `"${itm.item_name || ""}"`,
      itm.cost_price || 0,
      itm.default_rate || 0,
      itm.sales_price || 0,
      `"${itm.manufacturer || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Items_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Items List exported as CSV");
  };

  const filteredItems = rawItems.filter((itm: any) => {
    if (selectedItemTypeFilter !== "all" && String(itm.item_type_id || itm.item_type) !== selectedItemTypeFilter) return false;
    if (!showInactives && itm.isActive === false) return false;
    return true;
  });

  // ── RENDER 1: READ-ONLY VIEW MODE ──
  if (viewMode === "view") {
    const activeItem =
      singleItemData?.result ||
      singleItemData?.data ||
      (singleItemData && typeof singleItemData === "object" && !Array.isArray(singleItemData) ? singleItemData : null) ||
      selectedItem ||
      rawItems.find((i: any) => i.id === selectedItemId);

    if (isSingleItemLoading && !activeItem) {
      return (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          <CircularProgress size={24} className="mb-2" />
          <div>Loading item details...</div>
        </div>
      );
    }

    if (!activeItem) {
      return (
        <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600">
          <div>Item record unavailable.</div>
          <button onClick={() => { setViewMode("list"); setSearchParams({}); }} className="mt-2 px-3 py-1 bg-sky-600 text-white rounded text-xs">
            Back to Items List
          </button>
        </div>
      );
    }

    const itemTypeName = activeItem.item_type?.item_type_name || itemTypes.find((t: any) => String(t.id) === String(activeItem.item_type_id || activeItem.item_type))?.item_type_name || itemTypes.find((t: any) => String(t.id) === String(activeItem.item_type_id || activeItem.item_type))?.type_name || "Standard Item";
    const uomName = activeItem.uom?.uom_name || uomList.find((u: any) => String(u.id) === String(activeItem.uom_id))?.uom_name || "—";
    const subsidiaryName = activeItem.subsidiary?.subsidiary_name || rawSubsidiaries.find((s: any) => String(s.id) === String(activeItem.subsidiary_id))?.subsidiary_name || "—";
    const classNameVal = activeItem.class?.class_name || classesList.find((c: any) => String(c.id) === String(activeItem.class_id))?.class_name || "—";
    const deptNameVal = activeItem.department?.department_name || departmentsList.find((d: any) => String(d.id) === String(activeItem.department_id))?.department_name || "—";
    const locNameVal = activeItem.location?.city_name || activeItem.location?.name || locationList.find((l: any) => String(l.id) === String(activeItem.location_id))?.city_name || locationList.find((l: any) => String(l.id) === String(activeItem.location_id))?.name || "—";

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
            <span className="text-[10px] font-semibold text-slate-500 uppercase">UOM</span>
            <span className="text-xs font-semibold text-slate-800">{uomName}</span>
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
              onClick={() => setActiveTab("purchaseInventory")}
              className={`px-4 py-2.5 transition-colors border-r border-slate-300 ${
                activeTab === "purchaseInventory"
                  ? "bg-white text-sky-700 border-b-2 border-b-sky-600"
                  : "hover:bg-slate-200"
              }`}
            >
              Purchase / Inventory
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("salesPurchasing")}
              className={`px-4 py-2.5 transition-colors border-r border-slate-300 ${
                activeTab === "salesPurchasing"
                  ? "bg-white text-sky-700 border-b-2 border-b-sky-600"
                  : "hover:bg-slate-200"
              }`}
            >
              Sales / Purchasing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("accounting")}
              className={`px-4 py-2.5 transition-colors ${
                activeTab === "accounting"
                  ? "bg-white text-sky-700 border-b-2 border-b-sky-600"
                  : "hover:bg-slate-200"
              }`}
            >
              Accounting
            </button>
          </div>

          {/* TAB 1: PURCHASE / INVENTORY */}
          {activeTab === "purchaseInventory" && (
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
              <div className="flex flex-col space-y-0.5 md:col-span-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">MANUFACTURER</span>
                <span className="text-xs text-slate-800">{activeItem.manufacturer || "—"}</span>
              </div>
            </div>
          )}

          {/* TAB 2: SALES / PURCHASING */}
          {activeTab === "salesPurchasing" && (
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
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                ITEM CODE <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="item_code"
                value={formik.values.item_code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. ITM-001"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500 font-mono"
              />
              {formik.touched.item_code && formik.errors.item_code && (
                <span className="text-[10px] text-red-500">{formik.errors.item_code}</span>
              )}
            </div>

            <div className="flex flex-col space-y-1 md:col-span-2">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                ITEM NAME <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                name="item_name"
                value={formik.values.item_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Item Display Name"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              />
              {formik.touched.item_name && formik.errors.item_name && (
                <span className="text-[10px] text-red-500">{formik.errors.item_name}</span>
              )}
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                ITEM TYPE <span className="text-amber-600">*</span>
              </label>
              <select
                name="item_type"
                value={formik.values.item_type || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select Type --</option>
                {itemTypes.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.item_type_name || t.type_name || t.name}
                  </option>
                ))}
              </select>
              {formik.touched.item_type && formik.errors.item_type && (
                <span className="text-[10px] text-red-500">{String(formik.errors.item_type)}</span>
              )}
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">
                UOM <span className="text-amber-600">*</span>
              </label>
              <select
                name="uom_id"
                value={formik.values.uom_id || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select UOM --</option>
                {uomList.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.uom_name || u.name}
                  </option>
                ))}
              </select>
              {formik.touched.uom_id && formik.errors.uom_id && (
                <span className="text-[10px] text-red-500">{String(formik.errors.uom_id)}</span>
              )}
            </div>
          </RecordSection>

          {/* SECTION 2: CLASSIFICATION */}
          <RecordSection title="Classification" defaultOpen={true}>
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">SUBSIDIARY</label>
              <select
                name="subsidiary_id"
                value={formik.values.subsidiary_id || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select Subsidiary --</option>
                {rawSubsidiaries.map((sb: any) => (
                  <option key={sb.id} value={sb.id}>
                    {sb.subsidiary_name || sb.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase">UOM</label>
              <select
                name="uom_id"
                value={formik.values.uom_id || ""}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select UOM --</option>
                {uomList.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.uom_name || u.name}
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
                <option value="">-- Select Class --</option>
                {classesList.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name}
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
                <option value="">-- Select Department --</option>
                {departmentsList.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name}
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
          <div className="mt-4 border border-slate-300 rounded-xs bg-white overflow-hidden">
            {/* TAB HEADERS */}
            <div className="flex border-b border-slate-300 bg-slate-100 text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab("purchaseInventory")}
                className={`px-4 py-2.5 transition-colors border-r border-slate-300 ${activeTab === "purchaseInventory"
                  ? "bg-white text-sky-700 border-b-2 border-b-sky-600"
                  : "hover:bg-slate-200"
                  }`}
              >
                Purchase / Inventory
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("salesPurchasing")}
                className={`px-4 py-2.5 transition-colors border-r border-slate-300 ${activeTab === "salesPurchasing"
                  ? "bg-white text-sky-700 border-b-2 border-b-sky-600"
                  : "hover:bg-slate-200"
                  }`}
              >
                Sales / Purchasing
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("accounting")}
                className={`px-4 py-2.5 transition-colors ${activeTab === "accounting"
                  ? "bg-white text-sky-700 border-b-2 border-b-sky-600"
                  : "hover:bg-slate-200"
                  }`}
              >
                Accounting
              </button>
            </div>

            {/* TAB CONTENT: PURCHASE / INVENTORY */}
            {activeTab === "purchaseInventory" && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">COST PRICE</label>
                  <input
                    type="number"
                    name="cost_price"
                    value={formik.values.cost_price}
                    onChange={formik.handleChange}
                    placeholder="0.00"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">DEFAULT RATE</label>
                  <input
                    type="number"
                    name="default_rate"
                    value={formik.values.default_rate}
                    onChange={formik.handleChange}
                    placeholder="0.00"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">SAFETY STOCK LEVEL</label>
                  <input
                    type="number"
                    name="safety_stock_level"
                    value={formik.values.safety_stock_level}
                    onChange={formik.handleChange}
                    placeholder="0"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">DAYS</label>
                  <input
                    type="number"
                    name="days"
                    value={formik.values.days}
                    onChange={formik.handleChange}
                    placeholder="0"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono"
                  />
                </div>

                <div className="flex flex-col space-y-1 md:col-span-2">
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

            {/* TAB CONTENT: SALES / PURCHASING */}
            {activeTab === "salesPurchasing" && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">PURCHASE PRICE</label>
                  <input
                    type="number"
                    name="purchase_price"
                    value={formik.values.purchase_price}
                    onChange={formik.handleChange}
                    placeholder="0.00"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">TOTAL VALUE</label>
                  <input
                    type="number"
                    name="total_value"
                    value={formik.values.total_value}
                    onChange={formik.handleChange}
                    placeholder="0.00"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">SALES PRICE</label>
                  <input
                    type="number"
                    name="sales_price"
                    value={formik.values.sales_price}
                    onChange={formik.handleChange}
                    placeholder="0.00"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">SHIPPING COST</label>
                  <input
                    type="number"
                    name="shipping_cost"
                    value={formik.values.shipping_cost}
                    onChange={formik.handleChange}
                    placeholder="0.00"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono"
                  />
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
                    className="text-xs bg-white border border-slate-300 rounded-xs p-2"
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
                    className="text-xs bg-white border border-slate-300 rounded-xs p-2"
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
                    className="text-xs bg-white border border-slate-300 rounded-xs p-2"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: ACCOUNTING */}
            {activeTab === "accounting" && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">ASSET ACCOUNT</label>
                  <select
                    name="asset_account_id"
                    value={formik.values.asset_account_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Select Asset Account --</option>
                    {chartAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number ? `${acc.account_number} - ` : ""}{acc.account_name || acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">INCOME ACCOUNT</label>
                  <select
                    name="income_account_id"
                    value={formik.values.income_account_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Select Income Account --</option>
                    {chartAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number ? `${acc.account_number} - ` : ""}{acc.account_name || acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">COGS ACCOUNT</label>
                  <select
                    name="cogs_account_id"
                    value={formik.values.cogs_account_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Select COGS Account --</option>
                    {chartAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number ? `${acc.account_number} - ` : ""}{acc.account_name || acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">EXPENSE ACCOUNT</label>
                  <select
                    name="expense_account_id"
                    value={formik.values.expense_account_id || ""}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Select Expense Account --</option>
                    {chartAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number ? `${acc.account_number} - ` : ""}{acc.account_name || acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </RecordPageLayout>
      </form>
    );
  }

  // ── RENDER 3: LIST VIEW TABLE ──
  return (
    <div className="flex flex-col space-y-3 max-w-full font-sans text-slate-800">
      {/* ── TOP TITLE BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-300 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-amber-500 rounded-xs"></div>
          <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Items</h1>
        </div>
        <div className="flex items-center space-x-3 text-xs font-semibold text-sky-700">
          <button onClick={() => setViewMode("list")} className="hover:underline">
            List
          </button>
          <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="hover:underline">
            Search
          </button>
        </div>
      </div>

      {/* ── VIEW CONTROL RIBBON ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-300 p-2 rounded-xs">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="font-semibold text-slate-600 uppercase text-[10px]">VIEW</span>
            <select className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-medium focus:outline-none focus:border-sky-500">
              <option value="Basic">Basic</option>
              <option value="All Items">All Items</option>
              <option value="Active Items">Active Items</option>
            </select>
          </div>

          {canCreate("item") && (
            <button
              onClick={handleAddItem}
              className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs transition-colors flex items-center space-x-1"
            >
              <Add className="!w-4 !h-4" />
              <span>New Item</span>
            </button>
          )}
        </div>
      </div>

      {/* ── COLLAPSIBLE FILTERS PANEL ── */}
      <div className="border border-slate-300 rounded-xs bg-white overflow-hidden shadow-2xs">
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 flex items-center justify-between text-xs font-bold text-slate-700 select-none border-b border-slate-200"
        >
          <div className="flex items-center space-x-1.5">
            <FilterList className="!w-4 !h-4 text-slate-500" />
            <span className="uppercase tracking-wider text-[11px]">+ FILTERS</span>
          </div>
          {isFiltersOpen ? <KeyboardArrowUp className="!w-4 !h-4" /> : <KeyboardArrowDown className="!w-4 !h-4" />}
        </button>

        {isFiltersOpen && (
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Item Type</label>
              <select
                value={selectedItemTypeFilter}
                onChange={(e) => setSelectedItemTypeFilter(e.target.value)}
                className="w-full h-7 bg-white border border-slate-300 rounded-xs px-2 text-xs"
              >
                <option value="all">All Item Types</option>
                {itemTypes.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.item_type_name || t.type_name || t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── ACTION TOOLBAR ── */}
      <div className="bg-slate-100 border border-slate-300 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            title="Export CSV"
            className="p-1 text-slate-600 hover:text-sky-700 hover:bg-slate-200 rounded transition-colors flex items-center space-x-1 font-semibold text-[11px]"
          >
            <GetApp className="!w-4 !h-4" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            title="Print PDF"
            className="p-1 text-slate-600 hover:text-sky-700 hover:bg-slate-200 rounded transition-colors flex items-center space-x-1 font-semibold text-[11px]"
          >
            <Print className="!w-4 !h-4" />
            <span>Print</span>
          </button>

          <div className="h-4 border-r border-slate-300"></div>

          <label className="inline-flex items-center space-x-1 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactives}
              onChange={(e) => setShowInactives(e.target.checked)}
              className="w-3.5 h-3.5 text-sky-600 rounded-xs focus:ring-sky-500"
            />
            <span className="uppercase text-[10px] font-semibold">SHOW INACTIVES</span>
          </label>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <span className="font-semibold text-slate-500 uppercase text-[10px]">QUICK SORT:</span>
            <select
              value={quickSort}
              onChange={(e) => setQuickSort(e.target.value)}
              className="h-6 bg-white border border-slate-300 rounded-xs px-1 text-[11px]"
            >
              <option value="Recently Created">Recently Created</option>
              <option value="Name A-Z">Name A-Z</option>
            </select>
          </div>

          <span className="font-bold text-slate-700 uppercase text-[11px]">
            TOTAL: {filteredItems.length}
          </span>
        </div>
      </div>

      {/* ── DATA TABLE ── */}
      <div className="bg-white border border-slate-300 rounded-xs overflow-x-auto shadow-2xs">
        {isItemsLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            <CircularProgress size={24} className="mb-2" />
            <div>Loading items...</div>
          </div>
        ) : (
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase text-[10px] tracking-wider font-bold">
                <th className="p-2 border-r border-slate-200">ITEM CODE</th>
                <th className="p-2 border-r border-slate-200">ITEM NAME</th>
                <th className="p-2 border-r border-slate-200">TYPE</th>
                <th className="p-2 border-r border-slate-200">CLASS</th>
                <th className="p-2 border-r border-slate-200">DEPARTMENT</th>
                <th className="p-2 border-r border-slate-200">LOCATION</th>
                <th className="p-2 border-r border-slate-200">COST PRICE</th>
                <th className="p-2 border-r border-slate-200">DEFAULT RATE</th>
                <th className="p-2 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500 text-xs">
                    No items found. Click <strong>"New Item"</strong> to create one.
                  </td>
                </tr>
              ) : (
                filteredItems.map((itm: any) => {
                  const typeName = itm.item_type?.item_type_name || itemTypes.find((t: any) => String(t.id) === String(itm.item_type_id || itm.item_type))?.item_type_name || itemTypes.find((t: any) => String(t.id) === String(itm.item_type_id || itm.item_type))?.type_name || "—";
                  const classNameVal = itm.class?.class_name || classesList.find((c: any) => String(c.id) === String(itm.class_id))?.class_name || "—";
                  const deptNameVal = itm.department?.department_name || departmentsList.find((d: any) => String(d.id) === String(itm.department_id))?.department_name || "—";
                  const locNameVal = itm.location?.city_name || itm.location?.name || locationList.find((l: any) => String(l.id) === String(itm.location_id))?.city_name || locationList.find((l: any) => String(l.id) === String(itm.location_id))?.name || "—";

                  return (
                    <tr key={itm.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="p-2 border-r border-slate-200 font-mono text-sky-700 font-semibold">
                        <button onClick={() => handleView(itm.id)} className="hover:underline text-left">
                          {itm.item_code || `ITM-${itm.id}`}
                        </button>
                      </td>
                      <td className="p-2 border-r border-slate-200 font-medium text-slate-900">{itm.item_name}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">{typeName}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">{classNameVal}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">{deptNameVal}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">{locNameVal}</td>
                      <td className="p-2 border-r border-slate-200 font-mono">
                        {itm.cost_price ? `₹${Number(itm.cost_price).toFixed(2)}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono font-semibold text-emerald-700">
                        {itm.default_rate ? `₹${Number(itm.default_rate).toFixed(2)}` : "—"}
                      </td>
                      <td className="p-2 text-right space-x-2 font-semibold text-[11px]">
                        <button onClick={() => handleView(itm.id)} className="text-slate-600 hover:text-sky-700 hover:underline">
                          View
                        </button>
                        {canUpdate("item") && (
                          <button onClick={() => handleEdit(itm.id)} className="text-sky-600 hover:underline">
                            Edit
                          </button>
                        )}
                        {canDelete("item") && (
                          <button
                            onClick={() => {
                              setDeleteItemId(itm.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:underline"
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

      {/* Confirmation Dialog for Deletion */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        title="Delete Item"
        message="Are you sure you want to delete this item record? This action cannot be undone."
        onConfirm={() => {
          if (deleteItemId) handleDelete(deleteItemId);
        }}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeleteItemId(null);
        }}
      />
    </div>
  );
};

export default ItemMasterComp;