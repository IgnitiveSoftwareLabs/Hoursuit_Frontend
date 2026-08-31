import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Add, Delete, Edit, Print, Search, List as ListIcon, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetVendorsQuery, useGetSingleVendorQuery } from "../RTK/services/vendorApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import { useGetUOMsQuery } from "../RTK/services/uomApi";
import { useGetClassesQuery } from "../RTK/services/classApi";
import { useGetDepartmentsQuery } from "../RTK/services/departmentApi";
import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";
import { usePermissions } from "../Hooks/usePermissions";

import {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useUpdatePurchaseOrderStatusMutation,
  useDeletePurchaseOrderMutation,
  useGetGRNsQuery,
  useGetPurchaseInvoicesQuery,
  useGetPurchasePaymentsQuery,
} from "../RTK/services/purchaseApi";

import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";
import { GLImpactSubtab } from "./Layout/GLImpactSubtab";
import ConfirmationDialog from "./Dialog/ConfirmationDialog";

const PurchaseOrderComp: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();

  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedPOId, setSelectedPOId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [createPurchaseOrder, { isLoading: isCreating }] = useCreatePurchaseOrderMutation();
  const [updatePurchaseOrder, { isLoading: isUpdating }] = useUpdatePurchaseOrderMutation();
  const [updatePOStatus, { isLoading: isStatusUpdating }] = useUpdatePurchaseOrderStatusMutation();
  const [deletePurchaseOrder] = useDeletePurchaseOrderMutation();

  // Eager List Query
  const { data: purchaseOrdersData, refetch } = useGetPurchaseOrdersQuery({ page: 1, limit: 50 });
  const { data: grnsData } = useGetGRNsQuery({ page: 1, limit: 100 });
  const { data: invoicesData } = useGetPurchaseInvoicesQuery({ page: 1, limit: 100 });
  const { data: paymentsData } = useGetPurchasePaymentsQuery({ page: 1, limit: 100 });

  // Single GET API Query for Specific PO View/Edit Details
  const { data: singlePOData, isLoading: isSinglePOLoading } = useGetPurchaseOrderByIdQuery(selectedPOId!, {
    skip: !selectedPOId,
  });
  const singlePO = singlePOData?.result || singlePOData?.data || singlePOData;
  const { data: vendorsData } = useGetVendorsQuery({ page: 1, option: true });
  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 1000 });
  const { data: subsidiariesData } = useGetSubsidiariesQuery(undefined);
  const { data: citiesData } = useGetCitiesQuery(undefined);
  const { data: uomsData } = useGetUOMsQuery(undefined);
  const { data: classesData } = useGetClassesQuery(undefined);
  const { data: departmentsData } = useGetDepartmentsQuery(undefined);
  const { data: currenciesData } = useGetCurrenciesQuery(undefined);

  const purchaseOrders = Array.isArray(purchaseOrdersData?.result) ? purchaseOrdersData.result : Array.isArray(purchaseOrdersData?.data) ? purchaseOrdersData.data : Array.isArray(purchaseOrdersData) ? purchaseOrdersData : [];
  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : Array.isArray(subsidiariesData?.data) ? subsidiariesData.data : Array.isArray(subsidiariesData) ? subsidiariesData : [];
  const vendors = Array.isArray(vendorsData?.result) ? vendorsData.result : Array.isArray(vendorsData?.data) ? vendorsData.data : Array.isArray(vendorsData) ? vendorsData : [];
  const cities = Array.isArray(citiesData?.result) ? citiesData.result : Array.isArray(citiesData?.data) ? citiesData.data : Array.isArray(citiesData) ? citiesData : [];
  const items = Array.isArray(itemsData?.result) ? itemsData.result : Array.isArray(itemsData?.data) ? itemsData.data : Array.isArray(itemsData) ? itemsData : [];
  const uoms = Array.isArray(uomsData?.result) ? uomsData.result : Array.isArray(uomsData?.data) ? uomsData.data : Array.isArray(uomsData) ? uomsData : [];
  const classesList = Array.isArray(classesData?.result) ? classesData.result : Array.isArray(classesData?.data) ? classesData.data : Array.isArray(classesData) ? classesData : [];
  const departmentsList = Array.isArray(departmentsData?.result) ? departmentsData.result : Array.isArray(departmentsData?.data) ? departmentsData.data : Array.isArray(departmentsData) ? departmentsData : [];
  const currencies = Array.isArray(currenciesData?.result) ? currenciesData.result : Array.isArray(currenciesData?.data) ? currenciesData.data : Array.isArray(currenciesData) ? currenciesData : [];
  const grnsList = Array.isArray(grnsData?.result) ? grnsData.result : Array.isArray(grnsData?.data) ? grnsData.data : Array.isArray(grnsData) ? grnsData : [];
  const invoicesList = Array.isArray(invoicesData?.result) ? invoicesData.result : Array.isArray(invoicesData?.data) ? invoicesData.data : Array.isArray(invoicesData) ? invoicesData : [];
  const paymentsList = Array.isArray(paymentsData?.result) ? paymentsData.result : Array.isArray(paymentsData?.data) ? paymentsData.data : Array.isArray(paymentsData) ? paymentsData : [];

  const isGrnCompletedForPo = (po: any) => {
    if (!po) return false;
    return grnsList.some((g: any) => {
      const gPoId = String(g.purchaseOrderId || g.purchase_order_id || g.poHeaderId || g.purchaseOrder?.id || "");
      const gPoNo = String(g.purchaseOrderNo || g.purchase_order_no || "");
      return gPoId === String(po.id) || (po.purchaseNo && gPoNo === String(po.purchaseNo));
    });
  };

  const isBillCompletedForPo = (po: any) => {
    if (!po) return false;
    return invoicesList.some((inv: any) => {
      const invPoId = String(inv.poHeaderId || inv.purchase_order_id || inv.header?.poHeaderId || "");
      return invPoId === String(po.id);
    });
  };

  const isPaymentCompletedForPo = (po: any) => {
    if (!po) return false;
    return paymentsList.some((p: any) => {
      const h = p.header ?? p;
      const ref = String(h.referenceNo || h.reference_number || "");
      const pPoId = String(h.poHeaderId || h.purchase_order_id || h.po_id || "");
      return pPoId === String(po.id) || ref.includes(String(po.purchaseNo || `PO-${po.id}`)) || ref.includes(String(po.id));
    });
  };

  const formik = useFormik({
    initialValues: {
      header: {
        purchaseNo: "",
        vendor_id: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        deliveryDate: "",
        city_id: "",
        subsidiary_id: "",
        currency_id: "",
        vendor_address_id: "",
        billing_address: "",
        class_id: "",
        department_id: "",
        remarks: "",
      },
      lineItems: [
        {
          item_id: "",
          quantity: 1,
          uom_id: "",
          rate: 0,
          amount: 0,
          tax_rate: 0,
          tax_amount: 0,
          line_total: 0,
          remarks: "",
          isActive: true,
        }
      ],
      subtotal: 0,
      totalAmount: 0,
    },
    validationSchema: Yup.object({
      header: Yup.object({
        purchaseNo: Yup.string().nullable(),
        purchaseDate: Yup.date().required("Purchase Date is required"),
        vendor_id: Yup.string().required("Vendor is required"),
        deliveryDate: Yup.date().required("Delivery Date is required"),
        city_id: Yup.string().required("City/Location is required"),
        subsidiary_id: Yup.string().required("Subsidiary is required"),
      }),
      lineItems: Yup.array().of(
        Yup.object({
          item_id: Yup.string().required("Item is required"),
          quantity: Yup.number().min(0.01, "Qty must be > 0").required("Quantity is required"),
          uom_id: Yup.string().required("UOM is required"),
          rate: Yup.number().min(0, "Rate must be >= 0").required("Rate is required"),
          tax_rate: Yup.number().min(0, "Tax must be >= 0"),
        })
      ).min(1, "At least one line item is required"),
    }),
    onSubmit: async (values) => {
      try {
        for (let i = 0; i < values.lineItems.length; i++) {
          const line = values.lineItems[i];
          const uomObj = uoms.find((u: any) => String(u.id) === String(line.uom_id));
          if (uomObj && !isDecimalAllowedForUOM(uomObj) && Number(line.quantity) % 1 !== 0) {
            toast.error(`Quantity for UOM '${uomObj.uom_name}' in line ${i + 1} must be a whole number (decimals not allowed).`);
            return;
          }
        }

        const payload = {
          header: values.header,
          lineItems: values.lineItems,
        };

        if (isEdit && editId) {
          if (!canUpdate("purchase_order")) {
            toast.error("No permission to update");
            return;
          }
          const res = await updatePurchaseOrder({ id: editId, payload }).unwrap();
          toast.success(res?.message || "Purchase Order updated successfully.");
        } else {
          await createPurchaseOrder(payload).unwrap();
          toast.success("Purchase Order created successfully");
        }
        setViewMode("list");
        setIsEdit(false);
        setEditId(null);
        setSelectedPOId(null);
        formik.resetForm();
        setSearchParams({});
        refetch();
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong");
      }
    },
  });

  const autofillClassAndDepartment = (subId: string) => {
    if (!subId) {
      formik.setFieldValue("header.class_id", "");
      formik.setFieldValue("header.department_id", "");
      return;
    }

    const matchingClasses = classesList.filter((c: any) => String(c.subsidiary_id) === String(subId));
    if (matchingClasses.length > 0) {
      formik.setFieldValue("header.class_id", String(matchingClasses[0].id));
    } else {
      const fallbackClass = classesList.find((c: any) => !c.subsidiary_id);
      formik.setFieldValue("header.class_id", fallbackClass ? String(fallbackClass.id) : "");
    }

    const matchingDepts = departmentsList.filter((d: any) => String(d.subsidiary_id) === String(subId));
    if (matchingDepts.length > 0) {
      formik.setFieldValue("header.department_id", String(matchingDepts[0].id));
    } else {
      const fallbackDept = departmentsList.find((d: any) => !d.subsidiary_id);
      formik.setFieldValue("header.department_id", fallbackDept ? String(fallbackDept.id) : "");
    }
  };

  const formatVendorAddress = (addrObj: any) => {
    if (!addrObj) return "";
    const lines = [
      addrObj.addressee || addrObj.label || "",
      addrObj.addr1 || addrObj.address || "",
      addrObj.addr2 || "",
      [
        addrObj.city?.city_name || addrObj.city_name || "",
        addrObj.state?.state_name || addrObj.state_name || "",
        addrObj.zip || addrObj.zip_code || ""
      ].filter(Boolean).join(", "),
    ].filter(Boolean);
    return lines.join("\n");
  };

  const getVendorDisplayName = (vendorObj: any) => {
    if (!vendorObj) return "—";
    const code = vendorObj.entity_id ? `${vendorObj.entity_id} ` : "";
    const name =
      vendorObj.company_name ||
      [vendorObj.salutation, vendorObj.first_name, vendorObj.middle_name, vendorObj.last_name]
        .filter(Boolean)
        .join(" ");
    return `${code}${name}`.trim() || "—";
  };

  const isDecimalAllowedForUOM = (uomObj: any) => {
    if (!uomObj) return true;
    const name = String(uomObj.uom_name || uomObj.name || uomObj.uom_symbol || "").toUpperCase();
    const integerUOMs = ["EACH", "PCS", "PIECE", "PIECES", "NOS", "NUMBER", "NUMBERS", "BOX", "BOXES", "UNIT", "UNITS", "SET", "SETS", "PACK", "PACKS", "BAG", "BAGS", "BOTTLE", "BOTTLES", "CAN", "CANS", "DRUM", "DRUMS", "CARTON", "CARTONS"];
    if (integerUOMs.some((u) => name.includes(u))) {
      return false;
    }
    return true;
  };

  React.useEffect(() => {
    const urlId = searchParams.get("id");
    const urlAction = searchParams.get("action");

    if (urlAction === "create") {
      setViewMode("form");
      setIsEdit(false);
      setEditId(null);
      setSelectedPOId(null);
    } else if (urlId && urlAction === "view") {
      const idNum = Number(urlId);
      setSelectedPOId(idNum);
      setViewMode("view");
    } else if (urlId && urlAction === "edit") {
      const idNum = Number(urlId);
      setSelectedPOId(idNum);
      setEditId(idNum);
      setIsEdit(true);
      setViewMode("form");
    } else if (!urlAction && !urlId) {
      setViewMode("list");
      setSelectedPOId(null);
    }
  }, [searchParams]);

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = e.target.value;
    formik.setFieldValue("header.vendor_id", vendorId);

    const selectedVendor = vendors.find((v: any) => String(v.id) === String(vendorId));
    if (selectedVendor) {
      // 1. Auto-link Primary Subsidiary from vendor structure
      const subId = selectedVendor.primary_subsidiary_id ?? selectedVendor.primarySubsidiary?.id ?? selectedVendor.subsidiary_id ?? selectedVendor.subsidiary?.id;
      if (subId) {
        const strSubId = String(subId);
        formik.setFieldValue("header.subsidiary_id", strSubId);
        autofillClassAndDepartment(strSubId);
      } else {
        formik.setFieldValue("header.subsidiary_id", "");
        autofillClassAndDepartment("");
      }

      // 2. Auto-link Currency from vendor structure
      const vendorCurrencyId = selectedVendor.currency_id ?? selectedVendor.currency?.id;
      if (vendorCurrencyId) {
        formik.setFieldValue("header.currency_id", String(vendorCurrencyId));
      } else if (currencies.length > 0) {
        formik.setFieldValue("header.currency_id", String(currencies[0].id));
      }

      // 3. Auto-link Billing Address from vendor addressBook
      const addrs = selectedVendor.addressBook || selectedVendor.vendor_address_books || [];
      if (Array.isArray(addrs) && addrs.length > 0) {
        const defaultBillingAddress = addrs.find((a: any) => a.default_billing || a.defaultBilling) || addrs[0];
        formik.setFieldValue("header.vendor_address_id", String(defaultBillingAddress.id || ""));
        formik.setFieldValue("header.billing_address", formatVendorAddress(defaultBillingAddress));
      } else if (selectedVendor.address && selectedVendor.address !== "N/A") {
        formik.setFieldValue("header.vendor_address_id", "");
        formik.setFieldValue("header.billing_address", selectedVendor.address);
      } else {
        formik.setFieldValue("header.vendor_address_id", "");
        formik.setFieldValue("header.billing_address", "");
      }
    } else {
      formik.setFieldValue("header.subsidiary_id", "");
      formik.setFieldValue("header.currency_id", "");
      formik.setFieldValue("header.vendor_address_id", "");
      formik.setFieldValue("header.billing_address", "");
      autofillClassAndDepartment("");
    }
  };

  const handleSubsidiarySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subId = e.target.value;
    formik.setFieldValue("header.subsidiary_id", subId);
    autofillClassAndDepartment(subId);
  };

  // Derive vendor-specific assigned subsidiaries (primary + line subsidiaries)
  const currentSelectedVendorId = formik.values.header.vendor_id;
  const { data: singleVendorForPO } = useGetSingleVendorQuery(Number(currentSelectedVendorId), {
    skip: !currentSelectedVendorId,
  });

  const currentSelectedVendor =
    (singleVendorForPO?.result?.id === Number(currentSelectedVendorId) && singleVendorForPO.result) ||
    (singleVendorForPO?.data?.id === Number(currentSelectedVendorId) && singleVendorForPO.data) ||
    vendors.find((v: any) => String(v.id) === String(currentSelectedVendorId));

  const vendorSubIds = currentSelectedVendor
    ? Array.from(
      new Set(
        [
          currentSelectedVendor.primary_subsidiary_id ?? currentSelectedVendor.primarySubsidiary?.id ?? currentSelectedVendor.subsidiary_id,
          ...(Array.isArray(currentSelectedVendor.subsidiaryAssignments)
            ? currentSelectedVendor.subsidiaryAssignments
            : Array.isArray(currentSelectedVendor.vendor_subsidiaries)
              ? currentSelectedVendor.vendor_subsidiaries
              : []
          ).map((s: any) => s.subsidiary_id ?? s.subsidiary?.id ?? s.id),
        ]
          .filter((id) => id !== undefined && id !== null && id !== "")
          .map(String)
      )
    )
    : [];

  const availableSubsidiaries = currentSelectedVendorId
    ? subsidiaries.filter((s: any) => vendorSubIds.includes(String(s.id)))
    : [];

  const vendorAddressesList = currentSelectedVendor
    ? Array.isArray(currentSelectedVendor.addressBook) && currentSelectedVendor.addressBook.length > 0
      ? currentSelectedVendor.addressBook
      : Array.isArray(currentSelectedVendor.vendor_address_books) && currentSelectedVendor.vendor_address_books.length > 0
        ? currentSelectedVendor.vendor_address_books
        : []
    : [];

  const handleBillingAddressSelect = (addressId: string) => {
    formik.setFieldValue("header.vendor_address_id", addressId);
    const selectedAddr = vendorAddressesList.find((a: any) => String(a.id) === String(addressId));
    if (selectedAddr) {
      formik.setFieldValue("header.billing_address", formatVendorAddress(selectedAddr));
    } else {
      formik.setFieldValue("header.billing_address", "");
    }
  };

  React.useEffect(() => {
    if (currentSelectedVendor) {
      if (!formik.values.header.currency_id) {
        const currId = currentSelectedVendor.currency_id ?? currentSelectedVendor.currency?.id;
        if (currId) {
          formik.setFieldValue("header.currency_id", String(currId));
        }
      }
      if (!formik.values.header.billing_address && !formik.values.header.vendor_address_id) {
        const addrs = currentSelectedVendor.addressBook || currentSelectedVendor.vendor_address_books || [];
        if (Array.isArray(addrs) && addrs.length > 0) {
          const defaultBilling = addrs.find((a: any) => a.default_billing || a.defaultBilling) || addrs[0];
          formik.setFieldValue("header.vendor_address_id", String(defaultBilling.id || ""));
          formik.setFieldValue("header.billing_address", formatVendorAddress(defaultBilling));
        }
      }
    }
  }, [currentSelectedVendor]);

  const currentSubId = formik.values.header.subsidiary_id;
  const availableClasses = currentSubId
    ? classesList.filter((c: any) => !c.subsidiary_id || String(c.subsidiary_id) === String(currentSubId))
    : classesList;

  const availableDepartments = currentSubId
    ? departmentsList.filter((d: any) => !d.subsidiary_id || String(d.subsidiary_id) === String(currentSubId))
    : departmentsList;

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;

    formik.values.lineItems.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const taxRate = Number(item.tax_rate) || 0;

      const lineSubtotal = qty * rate;
      const lineTax = lineSubtotal * (taxRate / 100);

      subtotal += lineSubtotal;
      taxAmount += lineTax;
    });

    const totalAmount = subtotal + taxAmount;

    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    };
  };

  const totals = calculateTotals();

  const fillLineItemFromSelectedItem = (index: number, itemId: any) => {
    const selectedItem = items.find((i: any) => String(i.id) === String(itemId));
    const lineItems = [...formik.values.lineItems];
    const lineItem = { ...lineItems[index], item_id: itemId };

    if (selectedItem) {
      lineItem.uom_id = selectedItem.uom_id ?? "";
      lineItem.rate = Number(selectedItem.purchase_price || selectedItem.cost_price || selectedItem.default_rate || 0);

      const selectedUom = uoms.find((u: any) => String(u.id) === String(lineItem.uom_id));
      if (selectedUom && !isDecimalAllowedForUOM(selectedUom) && Number(lineItem.quantity) % 1 !== 0) {
        lineItem.quantity = Math.floor(Number(lineItem.quantity)) || 1;
      }
    } else {
      lineItem.uom_id = "";
      lineItem.rate = 0;
    }

    const qty = Number(lineItem.quantity) || 0;
    const rate = Number(lineItem.rate) || 0;
    const taxRate = Number(lineItem.tax_rate) || 0;
    const lineSubtotal = qty * rate;
    const taxAmount = lineSubtotal * (taxRate / 100);
    const lineTotal = lineSubtotal + taxAmount;

    lineItem.tax_amount = Number(taxAmount.toFixed(2));
    lineItem.line_total = Number(lineTotal.toFixed(2));

    lineItems[index] = lineItem;
    formik.setFieldValue("lineItems", lineItems);
  };

  const updateLineItemField = (index: number, field: string, value: any) => {
    const lineItems = [...formik.values.lineItems];
    let newValue = value;

    if (field === "quantity" && newValue !== "") {
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

    const lineItem = { ...lineItems[index], [field]: newValue };

    if (field === "uom_id") {
      const newUomObj = uoms.find((u: any) => String(u.id) === String(newValue));
      if (newUomObj && !isDecimalAllowedForUOM(newUomObj) && Number(lineItem.quantity) % 1 !== 0) {
        lineItem.quantity = Math.floor(Number(lineItem.quantity)) || 1;
        toast.error(`Quantity adjusted to whole number for UOM '${newUomObj.uom_name || newUomObj.name}'.`);
      }
    }

    const qty = Number(lineItem.quantity) || 0;
    const rate = Number(lineItem.rate) || 0;
    const taxRate = Number(lineItem.tax_rate) || 0;

    const lineSubtotal = qty * rate;
    const taxAmount = lineSubtotal * (taxRate / 100);
    const lineTotal = lineSubtotal + taxAmount;

    lineItem.tax_amount = Number(taxAmount.toFixed(2));
    lineItem.line_total = Number(lineTotal.toFixed(2));

    lineItems[index] = lineItem;
    formik.setFieldValue("lineItems", lineItems);
  };

  const handleAddLineItem = () => {
    const currentLines = formik.values.lineItems;
    if (currentLines.length > 0) {
      const unfulfilledLineIndex = currentLines.findIndex((line: any) => !line.item_id || String(line.item_id).trim() === "");
      if (unfulfilledLineIndex !== -1) {
        toast.error(`Please select an item in line ${unfulfilledLineIndex + 1} before adding a new line.`);
        return;
      }
    }

    formik.setFieldValue("lineItems", [
      ...currentLines,
      {
        item_id: "",
        quantity: 1,
        uom_id: "",
        rate: 0,
        amount: 0,
        tax_rate: 0,
        tax_amount: 0,
        line_total: 0,
        remarks: "",
        isActive: true,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    const newLineItems = [...formik.values.lineItems];
    newLineItems.splice(index, 1);
    formik.setFieldValue("lineItems", newLineItems);
  };

  const populateFormFromPO = (item: any) => {
    if (!item) return;
    const header = item.header ?? item;
    const lineSource = item.lineItems ?? item.line_items ?? item.purchaseOrderLines ?? [];
    const rawPurchaseDate = header.purchaseDate ?? header.purchase_date;
    const rawDeliveryDate = header.deliveryDate ?? header.delivery_date;
    const formatDate = (val: any) => (val && String(val).length >= 10 ? String(val).slice(0, 10) : "");

    formik.setValues({
      header: {
        purchaseNo: header.purchaseNo ?? header.purchase_no ?? "",
        vendor_id: String(header.vendor_id ?? header.vendorId ?? ""),
        purchaseDate: formatDate(rawPurchaseDate) || new Date().toISOString().split("T")[0],
        deliveryDate: formatDate(rawDeliveryDate),
        city_id: String(header.city_id ?? header.cityId ?? ""),
        subsidiary_id: String(header.subsidiary_id ?? header.subsidiaryId ?? ""),
        currency_id: String(header.currency_id ?? header.currencyId ?? item.vendor?.currency_id ?? ""),
        vendor_address_id: String(header.vendor_address_id ?? header.vendorAddressId ?? ""),
        billing_address: header.billing_address ?? header.billingAddress ?? formatVendorAddress(item.vendorAddress) ?? "",
        class_id: String(header.class_id ?? header.classId ?? ""),
        department_id: String(header.department_id ?? header.departmentId ?? ""),
        remarks: header.remarks ?? "",
      },
      lineItems: Array.isArray(lineSource) && lineSource.length > 0
        ? lineSource.map((line: any) => ({
          item_id: String(line.item_id ?? line.itemId ?? ""),
          quantity: Number(line.quantity ?? line.qty ?? 1),
          uom_id: String(line.uom_id ?? line.uomId ?? ""),
          rate: Number(line.rate ?? line.unitPrice ?? 0),
          amount: Number(line.amount ?? 0),
          tax_rate: Number(line.tax_rate ?? line.taxRate ?? 0),
          tax_amount: Number(line.tax_amount ?? line.taxAmount ?? 0),
          line_total: Number(line.line_total ?? line.lineTotal ?? 0),
          remarks: line.remarks ?? "",
          isActive: line.isActive ?? true,
        }))
        : [
          {
            item_id: "",
            quantity: 1,
            uom_id: "",
            rate: 0,
            amount: 0,
            tax_rate: 0,
            tax_amount: 0,
            line_total: 0,
            remarks: "",
            isActive: true,
          }
        ],
      subtotal: 0,
      totalAmount: 0,
    } as any);
  };

  React.useEffect(() => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");
    if (action === "create") {
      setViewMode("form");
      setIsEdit(false);
      setEditId(null);
    } else if (action === "edit" && id) {
      setViewMode("form");
      setIsEdit(true);
      setEditId(Number(id));
      setSelectedPOId(Number(id));
    } else if (action === "view" && id) {
      setViewMode("view");
      setSelectedPOId(Number(id));
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (viewMode === "form" && isEdit && singlePO && editId && Number(singlePO.id) === Number(editId)) {
      const header = singlePO.header ?? singlePO;
      const status = String(header.status || singlePO.status || "DRAFT").toUpperCase();
      if (status !== "DRAFT") {
        toast.error("Only DRAFT Purchase Orders can be updated.");
        setViewMode("list");
        setSearchParams({});
        return;
      }
      populateFormFromPO(singlePO);
    }
  }, [singlePO, isEdit, editId, viewMode]);

  const handleNewOrder = () => {
    setIsEdit(false);
    setEditId(null);
    setSelectedPOId(null);
    formik.resetForm();
    setViewMode("form");
    setSearchParams({ action: "create" });
  };

  const handleEdit = (id: number) => {
    if (!canUpdate("purchase_order")) {
      toast.error("No permission to edit");
      return;
    }
    const itemFromList = purchaseOrders.find((x: any) => Number(x.id) === Number(id));
    if (itemFromList) {
      const header = itemFromList.header ?? itemFromList;
      const status = String(header.status || itemFromList.status || "DRAFT").toUpperCase();
      if (status !== "DRAFT") {
        toast.error("Only DRAFT Purchase Orders can be updated.");
        return;
      }
      populateFormFromPO(itemFromList);
    }
    setSelectedPOId(id);
    setEditId(id);
    setIsEdit(true);
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleView = (id: number) => {
    setSelectedPOId(id);
    setViewMode("view");
    setSearchParams({ id: String(id), action: "view" });
  };

  const handleCancel = () => {
    setViewMode("list");
    setSearchParams({});
  };

  const confirmDelete = async () => {
    const targetId = deleteId;
    if (!targetId) return;

    try {
      await deletePurchaseOrder(targetId).unwrap();
      toast.success("Purchase Order deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete Purchase Order");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  if (!canRead("purchase_order")) {
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Access Denied: You do not have permission to view Purchase Orders.
      </div>
    );
  }

  // ── RENDER 1: CREATE OR EDIT PURCHASE ORDER FORM MODE ──
  if (viewMode === "form") {
    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Purchase Order"
          recordTitle={isEdit ? `Edit Purchase Order #${formik.values.header.purchaseNo || editId}` : "New Purchase Order"}
          subtitle={isEdit ? "Update purchase order header and line items" : "Primary Information & Line Items details"}
          mode="edit"
          onSave={() => formik.handleSubmit()}
          onCancel={handleCancel}
          onListClick={() => { setViewMode("list"); setSearchParams({}); }}
          onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
          isSaving={isCreating || isUpdating}
          subTabs={[
            {
              id: "items",
              label: "Items",
              badge: formik.values.lineItems.length,
              content: (
                <div className="space-y-3">
                  <div className="overflow-x-auto border border-slate-300 rounded-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#1d3e4c] text-white font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 border-r border-slate-400 w-8 text-center">#</th>
                          <th className="p-2 border-r border-slate-400 min-w-[180px]">ITEM *</th>
                          <th className="p-2 border-r border-slate-400 min-w-[110px]">UNITS (UOM) *</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">QTY *</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">RATE (₹) *</th>
                          <th className="p-2 border-r border-slate-400 w-28 text-right">SUBTOTAL (₹)</th>
                          <th className="p-2 border-r border-slate-400 w-20 text-right">TAX %</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">TAX AMT (₹)</th>
                          <th className="p-2 border-r border-slate-400 w-28 text-right">TOTAL (₹)</th>
                          <th className="p-2 w-10 text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {formik.values.lineItems.map((line: any, index: number) => {
                          const selectedUom = uoms.find((u: any) => String(u.id) === String(line.uom_id));
                          const allowsDecimals = isDecimalAllowedForUOM(selectedUom);

                          return (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="p-2 text-center font-mono text-slate-500 border-r border-slate-200">{index + 1}</td>
                              <td className="p-1.5 border-r border-slate-200">
                                <select
                                  value={line.item_id}
                                  onChange={(e) => fillLineItemFromSelectedItem(index, e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:border-sky-500 bg-white"
                                >
                                  <option value="">Select Item...</option>
                                  {items.map((item: any) => (
                                    <option key={item.id} value={item.id}>
                                      {item.item_name || item.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <select
                                  value={line.uom_id}
                                  onChange={(e) => updateLineItemField(index, "uom_id", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs focus:outline-none focus:border-sky-500 bg-white"
                                >
                                  <option value="">Select UOM...</option>
                                  {uoms.map((u: any) => (
                                    <option key={u.id} value={u.id}>
                                      {u.uom_name || u.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  step={allowsDecimals ? "any" : "1"}
                                  min={allowsDecimals ? "0.01" : "1"}
                                  value={line.quantity}
                                  onKeyDown={(e) => {
                                    if (!allowsDecimals && (e.key === "." || e.key === "," || e.key === "e" || e.key === "E" || e.key === "-")) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onPaste={(e) => {
                                    if (!allowsDecimals) {
                                      const pasteData = e.clipboardData.getData("text");
                                      if (pasteData.includes(".") || pasteData.includes(",")) {
                                        e.preventDefault();
                                        const cleanInt = pasteData.split(".")[0].split(",")[0].replace(/\D/g, "");
                                        if (cleanInt) {
                                          updateLineItemField(index, "quantity", cleanInt);
                                        }
                                      }
                                    }
                                  }}
                                  onChange={(e) => updateLineItemField(index, "quantity", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono focus:outline-none focus:border-sky-500"
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={line.rate}
                                  onChange={(e) => updateLineItemField(index, "rate", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono focus:outline-none focus:border-sky-500"
                                />
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700 bg-slate-50">
                                ₹{(Number(line.quantity || 0) * Number(line.rate || 0)).toFixed(2)}
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={line.tax_rate}
                                  onChange={(e) => updateLineItemField(index, "tax_rate", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono focus:outline-none focus:border-sky-500"
                                />
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700 bg-slate-50">
                                ₹{Number(line.tax_amount || 0).toFixed(2)}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900 bg-slate-50">
                                ₹{Number(line.line_total || 0).toFixed(2)}
                              </td>
                              <td className="p-1.5 text-center">
                                {formik.values.lineItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLineItem(index)}
                                    className="text-red-500 hover:text-red-700 cursor-pointer"
                                    title="Remove line item"
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

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xs transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Add className="!w-4 !h-4" />
                      <span>Add Line Item</span>
                    </button>


                  </div>
                </div>
              ),
            },
            {
              id: "billing",
              label: "Billing",
              content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendorAddressesList.length > 0 && (
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">VENDOR ADDRESS BOOK</label>
                      <select
                        value={formik.values.header.vendor_address_id}
                        onChange={(e) => handleBillingAddressSelect(e.target.value)}
                        className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                      >
                        <option value="">Select Address...</option>
                        {vendorAddressesList.map((a: any) => (
                          <option key={a.id} value={a.id}>
                            {a.label || a.addressee || `Address #${a.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-2">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">BILLING ADDRESS</label>
                      <textarea
                        name="header.billing_address"
                        rows={3}
                        value={formik.values.header.billing_address}
                        onChange={formik.handleChange}
                        placeholder="Enter billing address..."
                        className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xs focus:outline-none focus:border-sky-500 font-sans"
                      />
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">REMARKS / NOTE</label>
                      <textarea
                        name="header.remarks"
                        rows={2}
                        value={formik.values.header.remarks}
                        onChange={formik.handleChange}
                        placeholder="Additional order remarks or instructions..."
                        className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xs focus:outline-none focus:border-sky-500 font-sans"
                      />
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        >
          {/* Primary Information + Summary Card side by side */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <RecordSection title="Primary Information" defaultOpen={true}>


                {/* PO # */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">PO #</label>
                  <input
                    type="text"
                    value={formik.values.header.purchaseNo || "To Be Generated"}
                    readOnly
                    className="h-7 text-xs bg-slate-50 border border-slate-300 rounded-xs px-2 text-slate-500 font-mono"
                  />
                </div>

                {/* Vendor */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                    VENDOR <span className="text-amber-600">*</span>
                  </label>
                  <select
                    name="header.vendor_id"
                    value={formik.values.header.vendor_id}
                    onChange={handleVendorChange}
                    onBlur={formik.handleBlur}
                    className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${formik.touched.header?.vendor_id && formik.errors.header?.vendor_id
                      ? "border-red-500 bg-red-50"
                      : "border-slate-300 bg-white"
                      }`}
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {getVendorDisplayName(v)}
                      </option>
                    ))}
                  </select>
                  {formik.touched.header?.vendor_id && formik.errors.header?.vendor_id && (
                    <span className="text-[10px] text-red-600">{String(formik.errors.header.vendor_id)}</span>
                  )}
                </div>



                {/* Receive By */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                    RECEIVE BY <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="date"
                    name="header.deliveryDate"
                    value={formik.values.header.deliveryDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${formik.touched.header?.deliveryDate && formik.errors.header?.deliveryDate
                      ? "border-red-500 bg-red-50"
                      : "border-slate-300 bg-white"
                      }`}
                  />
                </div>

                {/* Date */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                    DATE <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="date"
                    name="header.purchaseDate"
                    value={formik.values.header.purchaseDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${formik.touched.header?.purchaseDate && formik.errors.header?.purchaseDate
                      ? "border-red-500 bg-red-50"
                      : "border-slate-300 bg-white"
                      }`}
                  />
                </div>
              </RecordSection>
            </div>

            {/* Summary Card */}
            <div className="w-full lg:w-64 self-start">
              <div className="border border-slate-300 rounded-xs overflow-hidden shadow-2xs">
                <div className="bg-[#78a4b7] text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                  Summary
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-semibold text-slate-700">SUBTOTAL</span>
                    <span>₹{totals.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-1.5">
                    <span className="font-semibold text-slate-700">TAX TOTAL</span>
                    <span>₹{totals.taxAmount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 text-sm">
                    <span>TOTAL</span>
                    <span>₹{totals.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Classification Section */}
          <RecordSection title="Classification" defaultOpen={true}>
            {/* Subsidiary */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                SUBSIDIARY <span className="text-amber-600">*</span>
              </label>
              <select
                name="header.subsidiary_id"
                value={formik.values.header.subsidiary_id}
                onChange={handleSubsidiarySelect}
                onBlur={formik.handleBlur}
                className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${formik.touched.header?.subsidiary_id && formik.errors.header?.subsidiary_id
                  ? "border-red-500 bg-red-50"
                  : "border-slate-300 bg-white"
                  }`}
              >
                <option value="">Select Subsidiary...</option>
                {(availableSubsidiaries.length > 0 ? availableSubsidiaries : subsidiaries).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.subsidiary_name || s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location / City */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                LOCATION / CITY <span className="text-amber-600">*</span>
              </label>
              <select
                name="header.city_id"
                value={formik.values.header.city_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`h-7 text-xs border rounded-xs px-2 focus:outline-none focus:border-sky-500 ${formik.touched.header?.city_id && formik.errors.header?.city_id
                  ? "border-red-500 bg-red-50"
                  : "border-slate-300 bg-white"
                  }`}
              >
                <option value="">Select Location...</option>
                {cities.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.city_name || c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">CLASS</label>
              <select
                name="header.class_id"
                value={formik.values.header.class_id}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">Select Class...</option>
                {availableClasses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.class_name || c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">DEPARTMENT</label>
              <select
                name="header.department_id"
                value={formik.values.header.department_id}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">Select Department...</option>
                {availableDepartments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name || d.name}
                  </option>
                ))}
              </select>
            </div>
          </RecordSection>

          {/* Intercompany Management Section */}
          <RecordSection title="Intercompany Management" defaultOpen={true}>
            {/* Currency */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">CURRENCY</label>
              <select
                name="header.currency_id"
                value={formik.values.header.currency_id}
                onChange={formik.handleChange}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
              >
                <option value="">Select Currency...</option>
                {currencies.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.currency_code || c.code} - {c.currency_name || c.name}
                  </option>
                ))}
              </select>
            </div>
          </RecordSection>
        </RecordPageLayout>
      </form>
    );
  }

  // ── RENDER 2: READ-ONLY VIEW MODE ──
  if (viewMode === "view") {
    const selectedPO = singlePO || purchaseOrders.find((p: any) => Number(p.id) === Number(selectedPOId));

    if (isSinglePOLoading && !selectedPO) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 min-h-screen text-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0070d2]"></div>
          <p className="mt-3 text-slate-600 font-semibold">Loading Purchase Order details...</p>
        </div>
      );
    }

    if (!selectedPO) {
      return (
        <div className="p-8 text-center bg-slate-50 min-h-screen text-xs space-y-3">
          <p className="text-slate-600 font-bold">Purchase Order record not found or failed to load.</p>
          <button
            onClick={() => { setViewMode("list"); setSearchParams({}); }}
            className="bg-[#0070d2] text-white px-3 py-1.5 rounded-xs font-semibold cursor-pointer"
          >
            Back to List
          </button>
        </div>
      );
    }

    const poHeader = selectedPO.header || selectedPO;
    const poVendor = selectedPO.vendor || vendors.find((v: any) => String(v.id) === String(poHeader.vendor_id));
    const poSubsidiary = selectedPO.subsidiary || subsidiaries.find((s: any) => String(s.id) === String(poHeader.subsidiary_id));
    const poCity = selectedPO.city || cities.find((c: any) => String(c.id) === String(poHeader.city_id));
    const poClass = selectedPO.class || classesList.find((c: any) => String(c.id) === String(poHeader.class_id));
    const poDepartment = selectedPO.department || departmentsList.find((d: any) => String(d.id) === String(poHeader.department_id));
    const poCurrency = selectedPO.currency || currencies.find((c: any) => String(c.id) === String(poHeader.currency_id));

    const poLines = selectedPO.purchaseOrderLines || selectedPO.line_items || selectedPO.lineItems || [];
    const subtotal = poLines.reduce((acc: number, l: any) => acc + (Number(l.quantity || 0) * Number(l.rate || 0)), 0);
    const taxTotal = poLines.reduce((acc: number, l: any) => acc + Number(l.tax_amount || 0), 0);
    const grandTotal = poLines.reduce((acc: number, l: any) => acc + Number(l.line_total || 0), 0);

    const vendorDisplayName = getVendorDisplayName(poVendor);
    const poNumberStr = poHeader.purchaseNo || `PO-${selectedPO.id}`;
    const statusStr = String(poHeader.status || selectedPO.status || "DRAFT").toUpperCase();
    const isDraft = statusStr === "DRAFT";
    const isApproved = statusStr === "APPROVED";
    const isReceivedOrCompleted = statusStr === "PARTIAL_RECEIVED" || statusStr === "COMPLETED";

    const isPoGrnDone = isGrnCompletedForPo(selectedPO);
    const isPoBillDone = isBillCompletedForPo(selectedPO);
    const isPoPaymentDone = isPaymentCompletedForPo(selectedPO);

    const canShowReceive = !isDraft && !isPoGrnDone;
    const canShowBill = !isDraft && isPoGrnDone && !isPoBillDone;
    const canShowPayment = !isDraft && isPoBillDone && !isPoPaymentDone;
    const canShowReturn = !isDraft && isPoPaymentDone;

    return (
      <RecordPageLayout
        recordType="Purchase Order"
        subtitle={`${poNumberStr} ${vendorDisplayName}`}
        mode="view"
        onEdit={isDraft && canUpdate("purchase_order") ? () => handleEdit(selectedPO.id) : undefined}
        onBack={() => { setViewMode("list"); setSearchParams({}); }}
        onListClick={() => { setViewMode("list"); setSearchParams({}); }}
        onSearchClick={() => { setViewMode("list"); setSearchParams({}); }}
        customActions={
          <div className="flex items-center space-x-1.5">
            {isDraft && canUpdate("purchase_order") && (
              <button
                type="button"
                disabled={isStatusUpdating}
                onClick={async () => {
                  try {
                    await updatePOStatus({ id: selectedPO.id, payload: { status: "APPROVED" } }).unwrap();
                    toast.success("Purchase Order approved successfully!");
                    refetch();
                  } catch (err: any) {
                    toast.error(err?.data?.message || "Failed to approve Purchase Order");
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
              >
                {isStatusUpdating ? "Approving..." : "Approve"}
              </button>
            )}

            {canShowReceive && (
              <button
                type="button"
                onClick={() => navigate(`/grn?poId=${selectedPO.id}`)}
                className="bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
              >
                Receive
              </button>
            )}

            {canShowBill && (
              <button
                type="button"
                onClick={() => navigate(`/purchase-invoice?poId=${selectedPO.id}`)}
                className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
              >
                Bill
              </button>
            )}

            {canShowPayment && (
              <button
                type="button"
                onClick={() => navigate(`/purchase-payment?poId=${selectedPO.id}`)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
              >
                Payment
              </button>
            )}

            {canShowReturn && (
              <button
                type="button"
                onClick={() => navigate(`/purchase-return?poId=${selectedPO.id}`)}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-3 py-1 rounded-xs shadow-2xs transition-colors cursor-pointer"
              >
                Return
              </button>
            )}
          </div>
        }
        subTabs={[
          {
            id: "items",
            label: "Items",
            badge: poLines.length,
            content: (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-700 border-b border-slate-200 pb-1 flex justify-between items-center">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-slate-900">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="overflow-x-auto border border-slate-300 rounded-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#1d3e4c] text-white font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2 border-r border-slate-400 w-10 text-center">#</th>
                        <th className="p-2 border-r border-slate-400 min-w-[160px]">ITEM</th>
                        <th className="p-2 border-r border-slate-400 min-w-[80px]">UNITS</th>
                        <th className="p-2 border-r border-slate-400 w-20 text-right">QUANTITY</th>
                        <th className="p-2 border-r border-slate-400 w-24 text-right">RATE (₹)</th>
                        <th className="p-2 border-r border-slate-400 w-24 text-right">AMOUNT (₹)</th>
                        <th className="p-2 border-r border-slate-400 w-20 text-right">TAX RATE</th>
                        <th className="p-2 border-r border-slate-400 w-24 text-right">TAX AMT (₹)</th>
                        <th className="p-2 w-28 text-right">GROSS AMT (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {poLines.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-4 text-center text-slate-400 italic">No line items in this order.</td>
                        </tr>
                      ) : (
                        poLines.map((l: any, idx: number) => {
                          const itemObj = items.find((i: any) => String(i.id) === String(l.item_id || l.itemId));
                          const uomObj = uoms.find((u: any) => String(u.id) === String(l.uom_id || l.uomId));
                          const lineQty = Number(l.quantity ?? l.qty ?? 0);
                          const lineRate = Number(l.rate ?? l.unitPrice ?? 0);
                          const lineSub = lineQty * lineRate;
                          const lineTaxRate = Number(l.tax_rate ?? l.taxRate ?? 0);
                          const lineTaxAmt = Number(l.tax_amount ?? (lineSub * (lineTaxRate / 100)) ?? 0);
                          const lineGross = Number(l.line_total ?? (lineSub + lineTaxAmt) ?? 0);

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                              <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                                {l.item?.item_name || itemObj?.item_name || `Item #${l.item_id}`}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-slate-700">
                                {l.uom?.uom_name || uomObj?.uom_name || "—"}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold">{lineQty}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono">₹{lineRate.toFixed(2)}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono">₹{lineSub.toFixed(2)}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono">{lineTaxRate}%</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono">₹{lineTaxAmt.toFixed(2)}</td>
                              <td className="p-2 text-right font-mono font-bold text-slate-900">₹{lineGross.toFixed(2)}</td>
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
          ...(!isDraft
            ? [
              {
                id: "gl_impact",
                label: "GL Impact",
                content: (
                  <GLImpactSubtab
                    documentNumber={poNumberStr}
                    entries={[
                      {
                        accountCode: "1100",
                        accountName: "Inventory Asset / Encumbrances",
                        debit: grandTotal,
                        credit: 0,
                        memo: `Purchase Order Encumbrance #${poNumberStr}`,
                      },
                      {
                        accountCode: "2200",
                        accountName: "Accrued Purchase Commitments",
                        debit: 0,
                        credit: grandTotal,
                        memo: `Vendor Commitment - ${vendorDisplayName}`,
                      },
                    ]}
                  />
                ),
              },
            ]
            : []),
          {
            id: "shipping",
            label: "Shipping",
            content: (
              <div className="space-y-3 p-2">
                <h4 className="font-bold text-slate-800 uppercase text-[11px]">Shipping Destination (Ship To)</h4>
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-xs min-h-[90px] whitespace-pre-line text-xs">
                  {poHeader.shipped_to || [poSubsidiary?.subsidiary_name, poCity?.city_name].filter(Boolean).join("\n") || "No Shipping Information"}
                </div>
              </div>
            ),
          },
          {
            id: "billing",
            label: "Billing",
            content: (
              <div className="space-y-3 p-2">
                <h4 className="font-bold text-slate-800 uppercase text-[11px]">Billing Address</h4>
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-xs min-h-[90px] whitespace-pre-line text-xs font-sans">
                  {poHeader.billing_address || formatVendorAddress(poHeader.vendorAddress) || formatVendorAddress(poVendor?.addressBook?.[0]) || "No Billing Address"}
                </div>
              </div>
            ),
          },
        ]}
      >
        {/* Primary Information + Summary Card side by side */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 space-y-4">
            {/* Primary Information Section */}
            <RecordSection title="Primary Information" defaultOpen={true}>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">PO #</span>
                <span className="text-xs font-bold text-slate-900">{poNumberStr}</span>
              </div>

              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">VENDOR</span>
                <span className="text-xs font-bold text-sky-700">{vendorDisplayName}</span>
              </div>

              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">RECEIVE BY</span>
                <span className="text-xs font-medium text-slate-900">
                  {poHeader.deliveryDate ? new Date(poHeader.deliveryDate).toLocaleDateString() : "—"}
                </span>
              </div>

              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">DATE</span>
                <span className="text-xs font-medium text-slate-900">
                  {poHeader.purchaseDate ? new Date(poHeader.purchaseDate).toLocaleDateString() : "—"}
                </span>
              </div>
            </RecordSection>

            {/* Classification Section */}
            <RecordSection title="Classification" defaultOpen={true}>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">SUBSIDIARY</span>
                <span className="text-xs font-semibold text-slate-900">
                  {poSubsidiary?.subsidiary_name || poSubsidiary?.name || "—"}
                </span>
              </div>

              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">LOCATION / CITY</span>
                <span className="text-xs font-semibold text-slate-800">
                  {poCity?.city_name || poCity?.name || "—"}
                </span>
              </div>

              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">CLASS</span>
                <span className="text-xs font-semibold text-slate-800">
                  {poClass?.class_name || "—"}
                </span>
              </div>

              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">DEPARTMENT</span>
                <span className="text-xs font-semibold text-slate-800">
                  {poDepartment?.department_name || "—"}
                </span>
              </div>
            </RecordSection>

            {/* Intercompany Management Section */}
            <RecordSection title="Intercompany Management" defaultOpen={true}>
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">CURRENCY</span>
                <span className="text-xs font-bold text-slate-900">
                  {poCurrency?.currency_code || "INR"}
                </span>
              </div>
            </RecordSection>
          </div>

          {/* Summary Card */}
          <div className="w-full lg:w-64 self-start">
            <div className="border border-slate-300 rounded-xs overflow-hidden bg-slate-50">
              <div className="bg-[#78a4b7] text-white px-3 py-1.5 font-bold uppercase text-[11px] tracking-wider">
                Summary
              </div>
              <div className="p-3 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                  <span className="font-semibold text-slate-600 uppercase text-[10px]">SUBTOTAL</span>
                  <span className="font-bold text-slate-900">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                  <span className="font-semibold text-slate-600 uppercase text-[10px]">TAX TOTAL</span>
                  <span className="font-bold text-slate-900">₹{taxTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pt-1 text-sm">
                  <span className="font-bold text-slate-800 uppercase text-[11px]">TOTAL</span>
                  <span className="font-bold text-slate-900">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RecordPageLayout>
    );
  }

  // ── RENDER 3: NETSUITE DATAGRID LIST VIEW MODE ──
  const filteredPurchaseOrders = purchaseOrders.filter((po: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const poNo = String(po.purchaseNo || `PO-${po.id}`).toLowerCase();
    const vendorName = getVendorDisplayName(po.vendor).toLowerCase();
    const subName = String(po.subsidiary?.subsidiary_name || po.subsidiary?.name || "").toLowerCase();
    return poNo.includes(term) || vendorName.includes(term) || subName.includes(term);
  });

  return (
    <div className="flex flex-col space-y-3 p-4 bg-[#f3f6f9] min-h-screen font-sans text-slate-800">
      {/* Top Header Title & Action Links */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-300">
        <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Purchase Orders</h1>
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

      {/* VIEW & New Purchase Order Button Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded-xs shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-xs">
          <span className="uppercase text-[10px] font-bold text-slate-500">VIEW</span>
          <select className="h-7 px-3 text-xs bg-white border border-slate-300 rounded-xs font-medium focus:outline-none focus:border-sky-600">
            <option>All Purchase Orders</option>
            <option>Ignitive PO List</option>
          </select>
          {canCreate("purchase_order") && (
            <button
              type="button"
              onClick={handleNewOrder}
              className="bg-[#0070d2] hover:bg-blue-700 text-white font-bold text-xs px-4 py-1.5 rounded-xs border border-blue-800 shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Add className="!w-4 !h-4" />
              <span>+ New Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable + FILTERS Panel */}
      <div className="bg-white border border-slate-300 rounded-xs shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full bg-[#f8fafc] hover:bg-slate-100 px-3 py-1.5 border-b border-slate-300 text-xs font-bold text-slate-700 flex items-center justify-between transition-colors select-none cursor-pointer"
        >
          <div className="flex items-center space-x-1.5 text-[11px] text-[#244b5a]">
            <span>= + FILTERS</span>
          </div>
          {isFilterOpen ? (
            <KeyboardArrowUp className="!w-4 !h-4 text-slate-500" />
          ) : (
            <KeyboardArrowDown className="!w-4 !h-4 text-slate-500" />
          )}
        </button>

        {isFilterOpen && (
          <div className="p-3 bg-slate-50/50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search</label>
              <input
                type="text"
                placeholder="Search PO #, Vendor, Subsidiary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded-xs focus:outline-none focus:border-sky-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table Toolbar & Stats Row */}
      <div className="bg-[#f0f4f8] px-3 py-1.5 border border-slate-300 rounded-xs flex flex-wrap items-center justify-between text-xs font-semibold text-slate-600 gap-2">
        <div className="flex items-center space-x-4">
          <button type="button" className="hover:text-sky-800 flex items-center space-x-1 cursor-pointer">
            <Print className="!w-3.5 !h-3.5" />
            <span>Print</span>
          </button>
          <span className="text-slate-300">|</span>
          <label className="flex items-center space-x-1.5 text-slate-700 cursor-pointer">
            <input type="checkbox" className="rounded-xs text-sky-600" />
            <span>SHOW INACTIVES</span>
          </label>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[10px] uppercase font-bold text-slate-500">QUICK SORT:</span>
          <select className="h-6 px-2 text-xs bg-white border border-slate-300 rounded-xs font-medium focus:outline-none focus:border-sky-600">
            <option>Recently Created</option>
            <option>PO Number</option>
          </select>
          <span className="font-bold text-slate-900 uppercase text-[11px] border-l border-slate-300 pl-3">
            TOTAL: {filteredPurchaseOrders.length}
          </span>
        </div>
      </div>

      {/* NetSuite DataGrid Table */}
      <div className="bg-white border border-slate-300 rounded-xs shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#e5eff5] border-b border-slate-300 text-[#244b5a] font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-2 border-r border-slate-300 w-24 text-center">EDIT | VIEW</th>
              <th className="p-2 border-r border-slate-300 w-24">INTERNAL ID</th>
              <th className="p-2 border-r border-slate-300 min-w-[120px]">DOCUMENT NUMBER</th>
              <th className="p-2 border-r border-slate-300 min-w-[180px]">NAME (VENDOR)</th>
              <th className="p-2 border-r border-slate-300 w-28">DATE</th>
              <th className="p-2 border-r border-slate-300 w-28 text-center">STATUS</th>
              <th className="p-2 border-r border-slate-300 w-28 text-right">AMOUNT (₹)</th>
              <th className="p-2 w-20 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredPurchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-medium italic">
                  {searchTerm ? "No matching purchase orders found." : "No Purchase Orders found. Click '+ New Purchase Order' to create one."}
                </td>
              </tr>
            ) : (
              filteredPurchaseOrders.map((po: any) => {
                const isDraft = String(po.status || "DRAFT").toUpperCase() === "DRAFT";
                const lineItems = po.purchaseOrderLines || po.line_items || po.lineItems || [];
                const totalLineVal = lineItems.length > 0
                  ? lineItems.reduce((acc: number, l: any) => acc + Number(l.line_total || 0), 0)
                  : Number(po.total_amount || 0);

                const vendorDisplayName = getVendorDisplayName(po.vendor);
                const poNoStr = po.purchaseNo || `PO-${po.id}`;

                const poIsGrnDone = isGrnCompletedForPo(po);
                const poIsBillDone = isBillCompletedForPo(po);
                const poIsPaymentDone = isPaymentCompletedForPo(po);

                const canShowReceive = !isDraft && !poIsGrnDone;
                const canShowBill = !isDraft && poIsGrnDone && !poIsBillDone;
                const canShowPayment = !isDraft && poIsBillDone && !poIsPaymentDone;
                const canShowReturn = !isDraft && poIsPaymentDone;

                return (
                  <tr key={po.id} className="hover:bg-sky-50/50 transition-colors">
                    <td className="p-2 border-r border-slate-200 text-center font-semibold space-x-1">
                      {isDraft && canUpdate("purchase_order") ? (
                        <button onClick={() => handleEdit(po.id)} className="text-sky-700 hover:underline cursor-pointer">
                          Edit
                        </button>
                      ) : (
                        <span className="text-slate-300">Edit</span>
                      )}
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleView(po.id)} className="text-sky-700 hover:underline cursor-pointer">
                        View
                      </button>
                      {canShowReceive && (
                        <>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => navigate(`/grn?poId=${po.id}`)}
                            className="text-sky-700 font-semibold hover:underline cursor-pointer"
                          >
                            Receive
                          </button>
                        </>
                      )}
                      {canShowBill && (
                        <>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => navigate(`/purchase-invoice?poId=${po.id}`)}
                            className="text-[#0070d2] font-semibold hover:underline cursor-pointer"
                          >
                            Bill
                          </button>
                        </>
                      )}
                      {canShowPayment && (
                        <>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => navigate(`/purchase-payment?poId=${po.id}`)}
                            className="text-emerald-700 font-semibold hover:underline cursor-pointer"
                          >
                            Payment
                          </button>
                        </>
                      )}
                      {canShowReturn && (
                        <>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => navigate(`/purchase-return?poId=${po.id}`)}
                            className="text-purple-700 font-semibold hover:underline cursor-pointer"
                          >
                            Return
                          </button>
                        </>
                      )}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">{po.id}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-sky-800">
                      <button onClick={() => handleView(po.id)} className="hover:underline text-left cursor-pointer">
                        {poNoStr}
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                      {vendorDisplayName}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-slate-700">
                      {po.purchaseDate ? new Date(po.purchaseDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center">
                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase bg-sky-100 text-sky-800 border border-sky-200">
                        {po.status || "DRAFT"}
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                      ₹{totalLineVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-center">
                      {canDelete("purchase_order") && isDraft && (
                        <button
                          onClick={() => {
                            setDeleteId(po.id);
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
        open={isDeleteDialogOpen}
        title="Delete Purchase Order"
        message="Are you sure you want to delete this purchase order? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default PurchaseOrderComp;