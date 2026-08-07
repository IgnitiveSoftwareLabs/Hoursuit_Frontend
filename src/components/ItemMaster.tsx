import React, { useState } from "react";

import type { } from "@mui/x-data-grid-pro/themeAugmentation";
import type { } from "@mui/x-date-pickers/themeAugmentation";
import type { } from "@mui/x-tree-view/themeAugmentation";
import type { } from "@mui/x-charts/themeAugmentation";

import { Add } from "@mui/icons-material";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  InputAdornment,
  MenuItem,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import { useGetChartOfAccountsQuery } from "../RTK/services/chartOfAccountApi";
import { useGetItemTypesQuery } from "../RTK/services/itemTypeApi";
import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import NavbarBreadcrumbs from "../components/NavbarBreadcrumbs";
import { useGetHSNSACsQuery } from "../RTK/services/hsnSacApi";
import { useGetUOMsQuery } from "../RTK/services/uomApi";
import { usePermissions } from "../Hooks/usePermissions";
import DynamicTable from "../components/Tables";
import {
  useCreateItemMutation,
  useDeleteItemMutation,
  useGetItemsQuery,
  useUpdateItemMutation,
} from "../RTK/services/itemApi";

interface ItemType {
  id?: number;
  item_code?: string;
  item_name: string;
  item_desc?: string | null;
  track_inventory: boolean;
  item_type?: number | string | "";
  sku?: string | null;
  barcode?: string | null;
  cost_price?: number | string | null;
  min_stock_level?: number | string | null;
  hsn_sac_code_id?: number | string | null;
  uom_id: number | string;
  default_rate?: number | string | null;
  subsidiary_id?: number | string | null;
  asset_account_id?: number | string | null;
  income_account_id?: number | string | null;
  cogs_account_id?: number | string | null;
  expense_account_id?: number | string | null;
  CompanyId?: number;
  user_id?: number;
  isActive: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`item-master-tabpanel-${index}`}
      aria-labelledby={`item-master-tab-${index}`}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
};

const ItemMasterComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 10, search: '' });
  const { data: subsidiariesData } = useGetSubsidiariesQuery();
  const { data: hsnSacData } = useGetHSNSACsQuery();
  const { data: uomData } = useGetUOMsQuery();
  const { data: itemTypesData } = useGetItemTypesQuery();
  const {
    data: chartAccountsData,
    isLoading: isChartAccountsLoading,
    isError: isChartAccountsError,
  } = useGetChartOfAccountsQuery(undefined, {
    skip: !isOpen,
  });

  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData?.result : [];
  const hsnSacList = Array.isArray(hsnSacData?.result) ? hsnSacData?.result : [];
  const itemTypes = Array.isArray(itemTypesData?.result) ? itemTypesData?.result : [];
  const chartAccounts = Array.isArray(chartAccountsData?.result) ? chartAccountsData?.result : [];

  const [createItem] = useCreateItemMutation();
  const [updateItem] = useUpdateItemMutation();
  const [deleteItem] = useDeleteItemMutation();

  const formik = useFormik<ItemType>({
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
      asset_account_id: "",
      income_account_id: "",
      cogs_account_id: "",
      expense_account_id: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      item_code: Yup.string()
        .max(200, "Item code must be at most 200 characters")
        .required("Item code is required"),
      item_name: Yup.string()
        .min(2, "Item Name must be at least 2 characters")
        .max(200, "Item Name must be at most 200 characters")
        .required("Item Name is required"),
      item_desc: Yup.string()
        .max(1000, "Item description must be at most 1000 characters")
        .optional()
        .nullable(),
      item_type: Yup.mixed().required("Item type is required"),
      track_inventory: Yup.boolean().required(),
      sku: Yup.string().max(200, "SKU must be at most 200 characters").optional().nullable(),
      barcode: Yup.string().max(200, "Barcode must be at most 200 characters").optional().nullable(),
      cost_price: Yup.number().min(0, "Cost price cannot be negative").optional().nullable(),
      min_stock_level: Yup.number().min(0, "Min stock level cannot be negative").optional().nullable(),
      hsn_sac_code_id: Yup.number()
        .positive("Please select a valid HSN/SAC code")
        .optional()
        .nullable(),
      uom_id: Yup.number()
        .positive("Please select a valid UOM")
        .required("UOM is required"),
      subsidiary_id: Yup.mixed().optional().nullable(),
      default_rate: Yup.number()
        .min(0, "Default rate cannot be negative")
        .optional()
        .nullable(),
      asset_account_id: Yup.number()
        .positive("Please select a valid asset account")
        .optional()
        .nullable(),
      income_account_id: Yup.number()
        .positive("Please select a valid income account")
        .optional()
        .nullable(),
      cogs_account_id: Yup.number()
        .positive("Please select a valid COGS account")
        .optional()
        .nullable(),
      expense_account_id: Yup.number()
        .positive("Please select a valid expense account")
        .optional()
        .nullable(),
      isActive: Yup.boolean().required(),
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
          cost_price: values.cost_price ? Number(values.cost_price) : null,
          min_stock_level: values.min_stock_level ? Number(values.min_stock_level) : null,
          hsn_sac_code_id: values.hsn_sac_code_id ? Number(values.hsn_sac_code_id) : null,
          uom_id: Number(values.uom_id),
          default_rate: values.default_rate ? Number(values.default_rate) : null,
          subsidiary_id: values.subsidiary_id ? Number(values.subsidiary_id) : null,
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
          const response = await updateItem({
            id: editItemId,
            payload,
          }).unwrap();
          toast.success(response.message);
        } else {
          if (!canCreate("item")) {
            toast.error("You do not have permission to create items");
            return;
          }
          const response = await createItem(payload).unwrap();
          toast.success(response.message);
        }

        formik.resetForm();
        setOpen(false);
        setIsEdit(false);
        setActiveTab(0);
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong");
        setOpen(false);
        setActiveTab(0);
      }
    },
  });

  const handleEdit = (id: number) => {
    if (!canUpdate("item")) {
      toast.error("You do not have permission to edit items");
      return;
    }

    const item: any = itemsData?.result?.find((item: any) => item.id === id);
    if (item) {
      formik.setValues({
        item_code: item.item_code || "",
        item_name: item.item_name,
        item_desc: item.item_desc || "",
        item_type: item.item_type?.id ?? item.item_type ?? "",
        track_inventory: item.track_inventory ?? false,
        sku: item.sku || "",
        barcode: item.barcode || "",
        cost_price: item.cost_price ?? "",
        min_stock_level: item.min_stock_level ?? "",
        hsn_sac_code_id: item.hsn_sac_code_id || "",
        uom_id: item.uom_id,
        default_rate: item.default_rate,
        subsidiary_id: item.subsidiary_id ?? item.subsidiary?.id ?? "",
        asset_account_id: item.asset_account_id || "",
        income_account_id: item.income_account_id || "",
        cogs_account_id: item.cogs_account_id || "",
        expense_account_id: item.expense_account_id || "",
        isActive: item.isActive ?? true,
      });
      setEditItemId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("item")) {
      toast.error("You do not have permission to delete items");
      return;
    }

    try {
      const response = await deleteItem(id).unwrap();
      toast.success(response.message);
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

    setActiveTab(0);
    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  const columns = [
    // {
    //   key: "id",
    //   label: "ID",
    // },
    {
      key: "item_name",
      label: "Sizes",
    },
    // {
    //   key: "hsnSacCode.code",
    //   label: "HSN/SAC Code",
    //   render: (row: any) => (
    //     <Box sx={{ display: "flex", flexDirection: "column" }}>
    //       <Typography variant="body2" fontWeight="medium">
    //         {row.hsnSacCode?.code || "N/A"}
    //       </Typography>
    //       <Box
    //         sx={{
    //           display: "inline-block",
    //           px: 1,
    //           py: 0.25,
    //           borderRadius: 0.5,
    //           backgroundColor:
    //             row.hsnSacCode?.type === "HSN" ? "#e3f2fd" : "#f3e5f5",
    //           color: row.hsnSacCode?.type === "HSN" ? "#1976d2" : "#7b1fa2",
    //           fontSize: "0.75rem",
    //           fontWeight: 500,
    //           width: "fit-content",
    //         }}
    //       >
    //         {row.hsnSacCode?.type || "N/A"}
    //       </Box>
    //     </Box>
    //   ),
    // },
    {
      key: "uom.uom_name",
      label: "UOM",
      render: (row: any) => row.uom?.uom_name || "N/A",
    },
    // {
    //   key: "workCategory.work_category_name",
    //   label: "Work Category",
    //   render: (row: any) => row.workCategory?.work_category_name || "N/A",
    // },
    // {
    //   key: "serviceType.service_name",
    //   label: "Service Type",
    //   render: (row: any) => row.serviceType?.service_name || "N/A",
    // },
    // {
    //   key: "default_rate",
    //   label: "Default Rate",
    //   render: (row: any) => (
    //     <Typography variant="body2" fontWeight="medium">
    //       ₹
    //       {Number(row.default_rate).toLocaleString("en-IN", {
    //         minimumFractionDigits: 2,
    //       })}
    //     </Typography>
    //   ),
    // },
    // {
    //   key: "subsidiary.subsidiary_name",
    //   label: "Subsidiary",
    //   render: (row: any) => row.subsidiary?.subsidiary_name || "N/A",
    // },
    {
      key: "item_desc",
      label: "Size Description",
    },
    {
      key: "isActive",
      label: "Status",
      render: (row: any) => (
        <Box
          sx={{
            display: "inline-block",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: row.isActive ? "#e8f5e8" : "#ffebee",
            color: row.isActive ? "#2e7d32" : "#c62828",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {row.isActive ? "Active" : "Inactive"}
        </Box>
      ),
    },
  ];

  if (!canRead("item")) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view items.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h3">Item Master</Typography>
          <NavbarBreadcrumbs />
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          {/* {canCreate("item") && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate("/items/csv-import")}
              >
                CSV Import
              </Button>
            )} */}
          {canCreate("item") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddItem}
            >
              Add Item
            </Button>
          )}
        </Box>
      </Box>

      <Dialog
        open={isOpen}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>{isEdit ? "Edit Item" : "Add Item"}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ mb: 3 }}
            >
              <Tab label="General" id="item-master-tab-0" />
              <Tab label="Accounting" id="item-master-tab-1" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <FormControl fullWidth>
                  <FormLabel htmlFor="item_code">Item Code</FormLabel>
                  <TextField
                    id="item_code"
                    fullWidth
                    variant="outlined"
                    placeholder="Enter Item Code"
                    {...formik.getFieldProps("item_code")}
                    error={formik.touched.item_code && !!formik.errors.item_code}
                    helperText={formik.touched.item_code && formik.errors.item_code}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel htmlFor="item_name">Item Name</FormLabel>
                  <TextField
                    id="item_name"
                    fullWidth
                    variant="outlined"
                    placeholder="Enter Item Name"
                    {...formik.getFieldProps("item_name")}
                    error={formik.touched.item_name && !!formik.errors.item_name}
                    helperText={formik.touched.item_name && formik.errors.item_name}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel htmlFor="item_desc">Item Description</FormLabel>
                  <TextField
                    id="item_desc"
                    fullWidth
                    variant="outlined"
                    placeholder="Enter Item Description"
                    minRows={3}
                    maxRows={6}
                    {...formik.getFieldProps("item_desc")}
                    error={formik.touched.item_desc && !!formik.errors.item_desc}
                    helperText={formik.touched.item_desc && formik.errors.item_desc}
                  />
                </FormControl>

                <Box
                  sx={{
                    gridColumn: { xs: "1 / -1", md: "span 2" },
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <FormControl fullWidth error={formik.touched.item_type && !!formik.errors.item_type}>
                    <FormLabel htmlFor="item_type">Item Type</FormLabel>
                    <Select
                      id="item_type"
                      name="item_type"
                      value={formik.values.item_type || ""}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Select Item Type</em>
                      </MenuItem>
                      {itemTypes.map((it: any) => (
                        <MenuItem key={it.id} value={it.id}>
                          {it.item_type_name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.item_type && formik.errors.item_type && (
                      <FormHelperText error>{formik.errors.item_type}</FormHelperText>
                    )}
                  </FormControl>
                  <FormControl fullWidth error={formik.touched.uom_id && !!formik.errors.uom_id}>
                    <FormLabel htmlFor="uom_id">Select UOM</FormLabel>
                    <Select
                      id="uom_id"
                      name="uom_id"
                      value={formik.values.uom_id}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Select UOM</em>
                      </MenuItem>
                      {uomData?.result?.map((uom: any) => (
                        <MenuItem key={uom.id} value={uom.id}>
                          {uom.uom_name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.uom_id && formik.errors.uom_id && (
                      <FormHelperText error>{formik.errors.uom_id}</FormHelperText>
                    )}
                  </FormControl>
                </Box>

                <FormControl fullWidth error={formik.touched.hsn_sac_code_id && !!formik.errors.hsn_sac_code_id}>
                  <FormLabel htmlFor="hsn_sac_code_id">HSN/SAC Code</FormLabel>
                  <Select
                    id="hsn_sac_code_id"
                    name="hsn_sac_code_id"
                    value={formik.values.hsn_sac_code_id || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Select HSN/SAC Code</em>
                    </MenuItem>
                    {hsnSacList.map((hsnSac: any) => (
                      <MenuItem key={hsnSac.id} value={hsnSac.id}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography>{hsnSac.code}</Typography>
                          <Box
                            sx={{
                              px: 0.5,
                              py: 0.25,
                              borderRadius: 0.5,
                              backgroundColor: hsnSac.type === "HSN" ? "#e3f2fd" : "#f3e5f5",
                              color: hsnSac.type === "HSN" ? "#1976d2" : "#7b1fa2",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                            }}
                          >
                            {hsnSac.type}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            {hsnSac.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.hsn_sac_code_id && formik.errors.hsn_sac_code_id && (
                    <FormHelperText error>{formik.errors.hsn_sac_code_id}</FormHelperText>
                  )}
                </FormControl>

                <FormControl fullWidth error={!!(formik.touched.subsidiary_id && formik.errors.subsidiary_id)}>
                  <FormLabel htmlFor="subsidiary_id">Subsidiary</FormLabel>
                  <Select
                    id="subsidiary_id"
                    name="subsidiary_id"
                    value={formik.values.subsidiary_id ?? ""}
                    onChange={(e) => formik.setFieldValue("subsidiary_id", e.target.value)}
                    onBlur={formik.handleBlur}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Select Subsidiary</em>
                    </MenuItem>
                    {subsidiaries.map((s: any) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.subsidiary_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.subsidiary_id && formik.errors.subsidiary_id && (
                    <FormHelperText error>{formik.errors.subsidiary_id}</FormHelperText>
                  )}
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel htmlFor="cost_price">Cost Price</FormLabel>
                  <TextField
                    id="cost_price"
                    fullWidth
                    variant="outlined"
                    placeholder="Enter Cost Price"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0, step: "0.01" },
                    }}
                    {...formik.getFieldProps("cost_price")}
                    error={formik.touched.cost_price && !!formik.errors.cost_price}
                    helperText={formik.touched.cost_price && formik.errors.cost_price}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel htmlFor="min_stock_level">Min Stock Level</FormLabel>
                  <TextField
                    id="min_stock_level"
                    fullWidth
                    variant="outlined"
                    placeholder="Enter Min Stock Level"
                    type="number"
                    {...formik.getFieldProps("min_stock_level")}
                    error={formik.touched.min_stock_level && !!formik.errors.min_stock_level}
                    helperText={formik.touched.min_stock_level && formik.errors.min_stock_level}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel htmlFor="default_rate">Default Rate</FormLabel>
                  <TextField
                    id="default_rate"
                    fullWidth
                    variant="outlined"
                    type="number"
                    placeholder="Enter default rate"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: {
                        min: 0,
                        step: "0.01",
                      },
                    }}
                    value={formik.values.default_rate}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (value === "") {
                        formik.setFieldValue("default_rate", "");
                        return;
                      }
                      if (/^\.(\d*)$/.test(value)) {
                        formik.setFieldValue("default_rate", value);
                        return;
                      }
                      if (value.includes(".")) {
                        const parts = value.split(".");
                        const intPart = parts[0].replace(/^0+(?=\d)/, "");
                        const fracPart = parts[1] ?? "";
                        value = (intPart === "" ? "0" : intPart) + "." + fracPart;
                        formik.setFieldValue("default_rate", value);
                        return;
                      }
                      value = value.replace(/^0+(?=\d)/, "");
                      formik.setFieldValue("default_rate", value);
                    }}
                    onBlur={formik.handleBlur}
                    error={formik.touched.default_rate && !!formik.errors.default_rate}
                    helperText={formik.touched.default_rate && formik.errors.default_rate}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel htmlFor="sku">SKU</FormLabel>
                  <TextField
                    id="sku"
                    fullWidth
                    variant="outlined"
                    placeholder="Enter SKU"
                    {...formik.getFieldProps("sku")}
                    error={formik.touched.sku && !!formik.errors.sku}
                    helperText={formik.touched.sku && formik.errors.sku}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel htmlFor="barcode">Barcode</FormLabel>
                  <TextField
                    id="barcode"
                    fullWidth
                    variant="outlined"
                    placeholder="Enter Barcode"
                    {...formik.getFieldProps("barcode")}
                    error={formik.touched.barcode && !!formik.errors.barcode}
                    helperText={formik.touched.barcode && formik.errors.barcode}
                  />
                </FormControl>

                <Box sx={{ gridColumn: "1 / -1", display: "flex", gap: 2, alignItems: "center" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.track_inventory}
                        onChange={(e) => formik.setFieldValue("track_inventory", e.target.checked)}
                      />
                    }
                    label="Track Inventory"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.isActive}
                        onChange={(e) => formik.setFieldValue("isActive", e.target.checked)}
                      />
                    }
                    label="Active"
                  />
                </Box>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              {isChartAccountsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : isChartAccountsError ? (
                <Typography color="error">Failed to load Chart of Accounts. Please try again later.</Typography>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <FormControl fullWidth error={formik.touched.income_account_id && !!formik.errors.income_account_id}>
                    <FormLabel htmlFor="income_account_id">Income Account</FormLabel>
                    <Select
                      id="income_account_id"
                      name="income_account_id"
                      value={formik.values.income_account_id || ""}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Select Income Account</em>
                      </MenuItem>
                      {chartAccounts.map((account: any) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.account_name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.income_account_id && formik.errors.income_account_id && (
                      <FormHelperText error>{formik.errors.income_account_id}</FormHelperText>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={formik.touched.expense_account_id && !!formik.errors.expense_account_id}>
                    <FormLabel htmlFor="expense_account_id">Expense Account</FormLabel>
                    <Select
                      id="expense_account_id"
                      name="expense_account_id"
                      value={formik.values.expense_account_id || ""}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Select Expense Account</em>
                      </MenuItem>
                      {chartAccounts.map((account: any) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.account_name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.expense_account_id && formik.errors.expense_account_id && (
                      <FormHelperText error>{formik.errors.expense_account_id}</FormHelperText>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={formik.touched.cogs_account_id && !!formik.errors.cogs_account_id}>
                    <FormLabel htmlFor="cogs_account_id">COGS Account</FormLabel>
                    <Select
                      id="cogs_account_id"
                      name="cogs_account_id"
                      value={formik.values.cogs_account_id || ""}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Select COGS Account</em>
                      </MenuItem>
                      {chartAccounts.map((account: any) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.account_name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.cogs_account_id && formik.errors.cogs_account_id && (
                      <FormHelperText error>{formik.errors.cogs_account_id}</FormHelperText>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={formik.touched.asset_account_id && !!formik.errors.asset_account_id}>
                    <FormLabel htmlFor="asset_account_id">Asset Account</FormLabel>
                    <Select
                      id="asset_account_id"
                      name="asset_account_id"
                      value={formik.values.asset_account_id || ""}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Select Asset Account</em>
                      </MenuItem>
                      {chartAccounts.map((account: any) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.account_name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.asset_account_id && formik.errors.asset_account_id && (
                      <FormHelperText error>{formik.errors.asset_account_id}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
              )}
            </TabPanel>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={formik.isSubmitting}
            >
              {isEdit ? "Update" : "Submit"}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpen(false);
            setActiveTab(0);
          }} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteItemId(null);
        }}
        onConfirm={() => deleteItemId !== null && handleDelete(deleteItemId)}
        variant="delete"
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
      />

      <DynamicTable
        columns={columns}
        data={itemsData?.result || []}
        getRowId={(row) => row.id}
        onEdit={
          canUpdate("item") ? (id) => handleEdit(Number(id)) : undefined
        }
        onDelete={
          canDelete("item")
            ? (id) => {
              setDeleteItemId(Number(id));
              setDeleteDialogOpen(true);
            }
            : undefined
        }
      />
    </Box>
  );
};

export default ItemMasterComp;