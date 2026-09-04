import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Add, Delete, Print, Search, List as ListIcon, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useGetVendorsQuery, useGetSingleVendorQuery } from "../RTK/services/vendorApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetDepartmentsQuery } from "../RTK/services/departmentApi";
import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";
import { useGetClassesQuery } from "../RTK/services/classApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import { useGetUOMsQuery } from "../RTK/services/uomApi";
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
  useGetPurchaseReturnsQuery,
} from "../RTK/services/purchaseApi";

import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";
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
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<number | string | null>(null);

  const effectivePOId = selectedPOId || searchParams.get("id");

  const [updatePOStatus, { isLoading: isStatusUpdating }] = useUpdatePurchaseOrderStatusMutation();
  const [createPurchaseOrder, { isLoading: isCreating }] = useCreatePurchaseOrderMutation();
  const [updatePurchaseOrder, { isLoading: isUpdating }] = useUpdatePurchaseOrderMutation();
  const [deletePurchaseOrder] = useDeletePurchaseOrderMutation();

  // Eager List Query
  const { data: purchaseOrdersData, refetch } = useGetPurchaseOrdersQuery({ page: 1, limit: 50 });
  const { data: grnsData } = useGetGRNsQuery({ page: 1, limit: 100 });
  const { data: invoicesData } = useGetPurchaseInvoicesQuery({ page: 1, limit: 100 });
  const { data: paymentsData } = useGetPurchasePaymentsQuery({ page: 1, limit: 100 });
  const { data: returnsData } = useGetPurchaseReturnsQuery({});

  // Single GET API Query for Specific PO View/Edit Details
  const { data: singlePOData, isLoading: isSinglePOLoading } = useGetPurchaseOrderByIdQuery(effectivePOId!, {
    skip: !effectivePOId,
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

  const purchaseOrders = Array.isArray(purchaseOrdersData?.result) ? purchaseOrdersData.result : [];
  const subsidiaries = Array.isArray(subsidiariesData?.result) ? subsidiariesData.result : [];
  const vendors = Array.isArray(vendorsData?.result) ? vendorsData.result : [];
  const cities = Array.isArray(citiesData?.result) ? citiesData.result : [];
  const items = Array.isArray(itemsData?.result) ? itemsData.result : [];
  const uoms = Array.isArray(uomsData?.result) ? uomsData.result : [];
  const classesList = Array.isArray(classesData?.result) ? classesData.result : [];
  const departmentsList = Array.isArray(departmentsData?.result) ? departmentsData.result : [];
  const currencies = Array.isArray(currenciesData?.result) ? currenciesData.result : [];
  const grnsList = Array.isArray(grnsData?.result) ? grnsData.result : [];
  const invoicesList = Array.isArray(invoicesData?.result) ? invoicesData.result : [];
  const paymentsList = Array.isArray(paymentsData?.result) ? paymentsData.result : [];
  const returnsList = Array.isArray(returnsData?.result) ? returnsData.result : Array.isArray(returnsData?.data) ? returnsData.data : Array.isArray(returnsData) ? returnsData : [];

  const isGrnCompletedForPo = (po: any) => {
    if (!po) return false;
    const status = String(po.status || po.header?.status || "").toUpperCase();
    if (status === "DRAFT" || status === "CANCELLED") return false;
    if (po.receiptSummary?.isFullyReceived !== undefined) {
      return Boolean(po.receiptSummary.isFullyReceived);
    }
    const poLines = po.purchaseOrderLines || po.line_items || po.lineItems || [];
    if (poLines.length === 0) return status === "COMPLETED";
    let totalOrdered = 0;
    let totalReceived = 0;
    poLines.forEach((l: any) => {
      const lineId = String(l.id || l.purchaseOrderLineId || "");
      const itemId = String(l.item_id || l.itemId || l.item?.id || "");
      const ord = Number(l.quantity || l.qty || 0);
      totalOrdered += ord;

      if (l.receivedQuantity !== undefined && l.receivedQuantity !== null) {
        totalReceived += Number(l.receivedQuantity);
      } else {
        let rec = 0;
        grnsList.forEach((g: any) => {
          if (String(g?.status || "").toUpperCase() === "CANCELLED") return;
          const gPoId = String(g.purchaseOrderId || g.purchase_order_id || g.poHeaderId || g.purchaseOrder?.id || g.header?.purchaseOrderId || "");
          const gPoNo = String(g.purchaseOrderNo || g.purchase_order_no || g.purchaseOrder?.purchaseNo || "");
          if (gPoId === String(po.id) || (po.purchaseNo && gPoNo === String(po.purchaseNo))) {
            const gLines = g.lineItems || g.grnLines || g.grnDetails || g.lines || g.details || [];
            gLines.forEach((gl: any) => {
              const glPoLineId = String(gl.purchaseOrderLineId || gl.po_line_id || gl.purchase_order_line_id || "");
              const glItemId = String(gl.itemId || gl.item_id || gl.item?.id || "");
              if ((lineId && glPoLineId === lineId) || (!lineId && glItemId === itemId)) {
                rec += Number(gl.receivedQty ?? gl.received_qty ?? gl.receivedQuantity ?? gl.quantity ?? gl.acceptedQty ?? gl.accepted_quantity ?? 0);
              }
            });
          }
        });
        totalReceived += rec;
      }
    });
    if (totalOrdered > 0) {
      return totalReceived >= totalOrdered;
    }
    return status === "COMPLETED";
  };

  const hasAnyGrnForPo = (po: any) => {
    if (!po) return false;
    const status = String(po.status || po.header?.status || "").toUpperCase();
    if (status === "PARTIAL_RECEIVED" || status === "COMPLETED") return true;
    return grnsList.some((g: any) => {
      if (String(g?.status || "").toUpperCase() === "CANCELLED") return false;
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
          discount_percent: 0,
          discount_amount: 0,
          discountPercent: 0,
          discountAmount: 0,
          subtotal: 0,
          tax_rate: 0,
          tax_amount: 0,
          taxRate: 0,
          taxAmount: 0,
          line_total: 0,
          lineTotal: 0,
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
          setSelectedPOId(Number(editId));
          setViewMode("view");
          setSearchParams({ id: String(editId), action: "view" });
        } else {
          const res = await createPurchaseOrder(payload).unwrap();
          toast.success(res?.message || "Purchase Order created successfully");
          const createdId =
            res?.result?.header?.id ??
            res?.result?.id ??
            res?.data?.header?.id ??
            res?.data?.id ??
            res?.header?.id ??
            res?.id;

          if (createdId) {
            setSelectedPOId(Number(createdId));
            setViewMode("view");
            setSearchParams({ id: String(createdId), action: "view" });
          } else {
            setViewMode("list");
            setSearchParams({});
          }
        }
        setIsEdit(false);
        setEditId(null);
        formik.resetForm();
        refetch();
      } catch (error: any) {
        console.error("Purchase Order save error:", error);
        toast.error(error?.data?.message || error?.message || "Failed to save Purchase Order.");
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
    } else if (urlId && urlAction === "view") {
      setViewMode("view");
    } else if (urlId && urlAction === "edit") {
      const idNum = Number(urlId);
      setEditId(idNum);
      setIsEdit(true);
      setViewMode("form");
    } else if (!urlAction && !urlId) {
      setViewMode("list");
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
    let discountAmount = 0;
    let taxAmount = 0;

    formik.values.lineItems.forEach((item: any) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const discountPercent = Number(item.discount_percent || item.discountPercent) || 0;
      const taxRate = Number(item.tax_rate || item.taxRate) || 0;

      const gross = qty * rate;
      const lineDisc = item.discount_amount != null && item.discount_amount !== ""
        ? Number(item.discount_amount)
        : (gross * discountPercent) / 100;
      const taxable = gross - lineDisc;
      const lineTax = item.tax_amount != null && item.tax_amount !== ""
        ? Number(item.tax_amount)
        : (taxable * taxRate) / 100;

      subtotal += gross;
      discountAmount += lineDisc;
      taxAmount += lineTax;
    });

    const totalAmount = subtotal - discountAmount + taxAmount;

    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
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
      lineItem.description = selectedItem.item_desc || selectedItem.description || selectedItem.item_name || "";
      lineItem.uom_id = selectedItem.uom_id ?? selectedItem.uom?.id ?? "";
      lineItem.rate = Number(selectedItem.purchase_price || selectedItem.cost_price || selectedItem.default_rate || 0);

      const itemTax = Number(
        selectedItem.hsnSacCode?.taxPercentage ??
        selectedItem.hsnSac?.taxPercentage ??
        selectedItem.tax_rate ??
        selectedItem.taxRate ??
        selectedItem.taxPercentage ??
        0
      );
      lineItem.tax_rate = itemTax;
      lineItem.taxRate = itemTax;

      const selectedUom = uoms.find((u: any) => String(u.id) === String(lineItem.uom_id));
      if (selectedUom && !isDecimalAllowedForUOM(selectedUom) && Number(lineItem.quantity) % 1 !== 0) {
        lineItem.quantity = Math.floor(Number(lineItem.quantity)) || 1;
      }
    } else {
      lineItem.description = "";
      lineItem.uom_id = "";
      lineItem.rate = 0;
      lineItem.tax_rate = 0;
      lineItem.taxRate = 0;
    }

    const qty = Number(lineItem.quantity) || 0;
    const rate = Number(lineItem.rate) || 0;
    const discountPercent = Number(lineItem.discount_percent || lineItem.discountPercent) || 0;
    const taxRate = Number(lineItem.tax_rate || lineItem.taxRate) || 0;

    const gross = qty * rate;
    const discountAmount = Number(((gross * discountPercent) / 100).toFixed(2));
    const subtotal = Number((gross - discountAmount).toFixed(2));
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const lineTotal = Number((subtotal + taxAmount).toFixed(2));

    lineItem.amount = gross;
    lineItem.discount_percent = discountPercent;
    lineItem.discount_amount = discountAmount;
    lineItem.subtotal = subtotal;
    lineItem.tax_amount = taxAmount;
    lineItem.line_total = lineTotal;

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
          toast.error(`Quantity for UOM '${uomObj.uom_name}' cannot contain decimals.`);
        } else if (Number(newValue) % 1 !== 0) {
          newValue = Math.floor(Number(newValue)) || 0;
          toast.error(`Quantity for UOM '${uomObj.uom_name}' cannot contain decimals.`);
        }
      }
    }

    const lineItem = { ...lineItems[index], [field]: newValue };

    if (field === "uom_id") {
      const newUomObj = uoms.find((u: any) => String(u.id) === String(newValue));
      if (newUomObj && !isDecimalAllowedForUOM(newUomObj) && Number(lineItem.quantity) % 1 !== 0) {
        lineItem.quantity = Math.floor(Number(lineItem.quantity)) || 1;
        toast.error(`Quantity adjusted to whole number for UOM '${newUomObj.uom_name}'.`);
      }
    }

    const qty = Number(lineItem.quantity) || 0;
    const rate = Number(lineItem.rate) || 0;
    const discountPercent = Number(lineItem.discount_percent || lineItem.discountPercent) || 0;
    const taxRate = Number(lineItem.tax_rate || lineItem.taxRate) || 0;

    const gross = qty * rate;
    const discountAmount = Number(((gross * discountPercent) / 100).toFixed(2));
    const subtotal = Number((gross - discountAmount).toFixed(2));
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const lineTotal = Number((subtotal + taxAmount).toFixed(2));

    lineItem.amount = gross;
    lineItem.discount_percent = discountPercent;
    lineItem.discount_amount = discountAmount;
    lineItem.subtotal = subtotal;
    lineItem.tax_amount = taxAmount;
    lineItem.line_total = lineTotal;

    lineItems[index] = lineItem;
    formik.setFieldValue("lineItems", lineItems);
  };

  const handleAddLineItem = () => {
    if (!formik.values.header.vendor_id) {
      toast.error("Please select a Vendor first before adding items.");
      return;
    }

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
        description: "",
        quantity: 1,
        uom_id: "",
        rate: 0,
        amount: 0,
        discount_percent: 0,
        discount_amount: 0,
        subtotal: 0,
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
        ? lineSource.map((line: any) => {
          const q = Number(line.quantity ?? line.qty ?? 1);
          const r = Number(line.rate ?? line.unitPrice ?? 0);
          const dp = Number(line.discount_percent ?? line.discountPercent ?? 0);
          const da = line.discount_amount != null ? Number(line.discount_amount) : Number(((q * r * dp) / 100).toFixed(2));
          const sub = line.subtotal != null ? Number(line.subtotal) : Number((q * r - da).toFixed(2));

          const itemObj = items.find((i: any) => String(i.id) === String(line.item_id ?? line.itemId));
          const desc = String(line.description ?? line.item_desc ?? itemObj?.item_desc ?? itemObj?.description ?? itemObj?.item_name ?? "");

          return {
            item_id: String(line.item_id ?? line.itemId ?? ""),
            description: desc,
            quantity: q,
            uom_id: String(line.uom_id ?? line.uomId ?? ""),
            rate: r,
            amount: Number(line.amount ?? (q * r).toFixed(2)),
            discount_percent: dp,
            discount_amount: da,
            subtotal: sub,
            tax_rate: Number(line.tax_rate ?? line.taxRate ?? 0),
            tax_amount: Number(line.tax_amount ?? line.taxAmount ?? 0),
            line_total: Number(line.line_total ?? line.lineTotal ?? 0),
            remarks: line.remarks ?? "",
            isActive: line.isActive ?? true,
          };
        })
        : [
          {
            item_id: "",
            quantity: 1,
            uom_id: "",
            rate: 0,
            amount: 0,
            discount_percent: 0,
            discount_amount: 0,
            subtotal: 0,
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
    setEditId(id);
    setIsEdit(true);
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleView = (id: number) => {
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
          recordTitle={formik.values.header.purchaseNo ? `#${formik.values.header.purchaseNo}` : (isEdit && editId ? `#${editId}` : "")}
          subtitle=""
          mode="edit"
          onSave={async () => {
            const errors = await formik.validateForm();
            formik.handleSubmit();
            if (Object.keys(errors).length > 0) {
              toast.error("Please fill in all required fields marked with *.");
            }
          }}
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
                          <th className="p-2 border-r border-slate-400 min-w-[160px]">DESCRIPTION</th>
                          <th className="p-2 border-r border-slate-400 min-w-[110px]">UNITS (UOM) *</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">QTY *</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">RATE (₹) *</th>
                          <th className="p-2 border-r border-slate-400 w-20 text-right">DISCOUNT %</th>
                          <th className="p-2 border-r border-slate-400 w-24 text-right">DISCOUNT (₹)</th>
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

                          const lineError = Array.isArray(formik.errors.lineItems) ? (formik.errors.lineItems as any)[index] : undefined;
                          const lineTouched = Array.isArray(formik.touched.lineItems) ? (formik.touched.lineItems as any)[index] : undefined;

                          const q = Number(line.quantity || 0);
                          const r = Number(line.rate || 0);
                          const dp = Number(line.discount_percent ?? line.discountPercent ?? 0);
                          const da = line.discount_amount != null && line.discount_amount !== "" ? Number(line.discount_amount) : Number(((q * r * dp) / 100).toFixed(2));
                          const sub = line.subtotal != null && line.subtotal !== "" ? Number(line.subtotal) : Number((q * r - da).toFixed(2));

                          return (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="p-2 text-center font-mono text-slate-500 border-r border-slate-200">{index + 1}</td>
                              <td className="p-1.5 border-r border-slate-200">
                                <select
                                  value={line.item_id}
                                  disabled={!formik.values.header.vendor_id}
                                  onChange={(e) => fillLineItemFromSelectedItem(index, e.target.value)}
                                  onBlur={formik.handleBlur}
                                  className={`w-full h-7 px-2 text-xs border rounded-xs focus:outline-none focus:border-sky-500 ${!formik.values.header.vendor_id
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                                    : (lineTouched?.item_id || formik.submitCount > 0) && lineError?.item_id
                                      ? "border-red-500 bg-red-50"
                                      : "border-slate-300 bg-white"
                                    }`}
                                >
                                  <option value="">{formik.values.header.vendor_id ? "Select Item..." : "Select Vendor first..."}</option>
                                  {items.map((item: any) => (
                                    <option key={item.id} value={item.id}>
                                      {item.item_name || item.name}
                                    </option>
                                  ))}
                                </select>
                                {(lineTouched?.item_id || formik.submitCount > 0) && lineError?.item_id && (
                                  <span className="text-[10px] text-red-600 block mt-0.5">{String(lineError.item_id)}</span>
                                )}
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={line.description || ""}
                                  disabled={true}
                                  placeholder="Item Description"
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs bg-slate-100 text-slate-700 font-medium cursor-not-allowed"
                                />
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <select
                                  value={line.uom_id}
                                  disabled={true}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs bg-slate-100 text-slate-700 font-medium cursor-not-allowed"
                                >
                                  <option value="">UOM</option>
                                  {uoms.map((u: any) => (
                                    <option key={u.id} value={u.id}>
                                      {u.uom_name || u.name}
                                    </option>
                                  ))}
                                </select>
                                {(lineTouched?.uom_id || formik.submitCount > 0) && lineError?.uom_id && (
                                  <span className="text-[10px] text-red-600 block mt-0.5">{String(lineError.uom_id)}</span>
                                )}
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
                                  onBlur={formik.handleBlur}
                                  className={`w-full h-7 px-2 text-xs border rounded-xs text-right font-mono focus:outline-none focus:border-sky-500 ${(lineTouched?.quantity || formik.submitCount > 0) && lineError?.quantity
                                    ? "border-red-500 bg-red-50"
                                    : "border-slate-300"
                                    }`}
                                />
                                {(lineTouched?.quantity || formik.submitCount > 0) && lineError?.quantity && (
                                  <span className="text-[10px] text-red-600 block text-right mt-0.5">{String(lineError.quantity)}</span>
                                )}
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={line.rate}
                                  onChange={(e) => updateLineItemField(index, "rate", e.target.value)}
                                  onBlur={formik.handleBlur}
                                  className={`w-full h-7 px-2 text-xs border rounded-xs text-right font-mono focus:outline-none focus:border-sky-500 ${(lineTouched?.rate || formik.submitCount > 0) && lineError?.rate
                                    ? "border-red-500 bg-red-50"
                                    : "border-slate-300"
                                    }`}
                                />
                                {(lineTouched?.rate || formik.submitCount > 0) && lineError?.rate && (
                                  <span className="text-[10px] text-red-600 block text-right mt-0.5">{String(lineError.rate)}</span>
                                )}
                              </td>
                              <td className="p-1.5 border-r border-slate-200">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  max="100"
                                  value={line.discount_percent ?? line.discountPercent ?? 0}
                                  onChange={(e) => updateLineItemField(index, "discount_percent", e.target.value)}
                                  className="w-full h-7 px-2 text-xs border border-slate-300 rounded-xs text-right font-mono focus:outline-none focus:border-sky-500"
                                />
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700 bg-slate-50">
                                ₹{da.toFixed(2)}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700 bg-slate-50 font-semibold">
                                ₹{sub.toFixed(2)}
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
                      disabled={!formik.values.header.vendor_id}
                      onClick={handleAddLineItem}
                      className={`text-white text-xs font-semibold px-3 py-1.5 rounded-xs transition-colors flex items-center space-x-1 ${!formik.values.header.vendor_id
                        ? "bg-slate-400 cursor-not-allowed opacity-60"
                        : "bg-slate-700 hover:bg-slate-800 cursor-pointer"
                        }`}
                      title={!formik.values.header.vendor_id ? "Select a Vendor first" : "Add Line Item"}
                    >
                      <Add className="!w-4 !h-4" />
                      <span>Add Line Item</span>
                    </button>

                    {typeof formik.errors.lineItems === "string" && (
                      <span className="text-xs text-red-600 font-medium bg-red-50 px-2.5 py-1 border border-red-200 rounded-xs">
                        {formik.errors.lineItems}
                      </span>
                    )}
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
                  {formik.touched.header?.deliveryDate && formik.errors.header?.deliveryDate && (
                    <span className="text-[10px] text-red-600">{String(formik.errors.header.deliveryDate)}</span>
                  )}
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
                  {formik.touched.header?.purchaseDate && formik.errors.header?.purchaseDate && (
                    <span className="text-[10px] text-red-600">{String(formik.errors.header.purchaseDate)}</span>
                  )}
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
                  {Number(totals.discountAmount) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>DISCOUNT TOTAL</span>
                      <span>-₹{totals.discountAmount}</span>
                    </div>
                  )}
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
              {formik.touched.header?.subsidiary_id && formik.errors.header?.subsidiary_id && (
                <span className="text-[10px] text-red-600">{String(formik.errors.header.subsidiary_id)}</span>
              )}
            </div>

            {/* Location */}
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                LOCATION <span className="text-amber-600">*</span>
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
              {formik.touched.header?.city_id && formik.errors.header?.city_id && (
                <span className="text-[10px] text-red-600">{String(formik.errors.header.city_id)}</span>
              )}
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
    const discountTotal = poLines.reduce((acc: number, l: any) => {
      const lineDiscAmt = l.discount_amount != null
        ? Number(l.discount_amount)
        : (l.discountAmount != null
          ? Number(l.discountAmount)
          : ((Number(l.quantity || 0) * Number(l.rate || 0) * Number(l.discount_percent || l.discountPercent || 0)) / 100));
      return acc + (Number(lineDiscAmt) || 0);
    }, 0);
    const taxTotal = poLines.reduce((acc: number, l: any) => acc + Number(l.tax_amount || 0), 0);
    const grandTotal = poLines.reduce((acc: number, l: any) => acc + Number(l.line_total || 0), 0);

    const vendorDisplayName = getVendorDisplayName(poVendor);
    const poNumberStr = poHeader.purchaseNo || `PO-${selectedPO.id}`;
    const statusStr = String(poHeader.status || selectedPO.status || "DRAFT").toUpperCase();
    const isDraft = statusStr === "DRAFT";
    // const isApproved = statusStr === "APPROVED";
    // const isReceivedOrCompleted = statusStr === "PARTIAL_RECEIVED" || statusStr === "COMPLETED";

    const isPoGrnDone = isGrnCompletedForPo(selectedPO);
    const hasGrnReceipt = hasAnyGrnForPo(selectedPO);
    const isPoBillDone = isBillCompletedForPo(selectedPO);
    const isPoPaymentDone = isPaymentCompletedForPo(selectedPO);

    const canShowReceive = !isDraft && !isPoGrnDone;
    const canShowBill = !isDraft && hasGrnReceipt && !isPoBillDone;
    const canShowPayment = !isDraft && isPoBillDone && !isPoPaymentDone;
    const canShowReturn = !isDraft && hasGrnReceipt;

    const poIdStr = String(selectedPO.id);
    const poNumStr = String(poHeader.purchaseNo || "");

    const relatedGrns = grnsList.filter((g: any) => {
      const gPoId = String(g.purchaseOrderId || g.purchase_order_id || g.poHeaderId || g.purchaseOrder?.id || "");
      const gPoNo = String(g.purchaseOrderNo || g.purchase_order_no || "");
      return (gPoId === poIdStr || (poNumStr && gPoNo === poNumStr)) && String(g?.status || "").toUpperCase() !== "CANCELLED";
    });

    const relatedBills = invoicesList.filter((inv: any) => {
      const invPoId = String(inv.poHeaderId || inv.purchase_order_id || inv.header?.poHeaderId || "");
      const invGrnId = String(inv.grnHeaderId || inv.header?.grnHeaderId || "");
      const isLinkedGrn = relatedGrns.some((g: any) => String(g.id) === invGrnId);
      return (invPoId === poIdStr || isLinkedGrn) && String(inv?.status || "").toUpperCase() !== "CANCELLED";
    });

    const relatedReturns = returnsList.filter((pr: any) => {
      const prPoId = String(pr.poHeaderId || pr.po_header_id || pr.purchaseOrderId || "");
      const prGrnId = String(pr.grnHeaderId || pr.grn_header_id || "");
      const prBillId = String(pr.purchaseInvoiceHeaderId || pr.purchase_invoice_header_id || pr.billId || "");
      const isLinkedGrn = relatedGrns.some((g: any) => String(g.id) === prGrnId);
      const isLinkedBill = relatedBills.some((b: any) => String(b.id) === prBillId);
      return (prPoId === poIdStr || isLinkedGrn || isLinkedBill) && String(pr?.status || "").toUpperCase() !== "CANCELLED";
    });

    const relatedPayments = paymentsList.filter((p: any) => {
      const h = p.header ?? p;
      const pPoId = String(h.poHeaderId || h.purchase_order_id || h.po_id || "");
      const pBillId = String(h.purchaseInvoiceHeaderId || h.purchase_invoice_header_id || h.billId || "");
      const isLinkedBill = relatedBills.some((b: any) => String(b.id) === pBillId);
      return (pPoId === poIdStr || isLinkedBill) && String(h?.status || "").toUpperCase() !== "CANCELLED";
    });

    const totalBilledAmount = relatedBills.reduce((acc: number, inv: any) => {
      const h = inv.header ?? inv;
      return acc + Number(h.totalAmount || h.total_amount || 0);
    }, 0);
    const totalPaidAmount = relatedBills.reduce((acc: number, inv: any) => {
      const h = inv.header ?? inv;
      return acc + Number(h.paidAmount || h.paid_amount || 0);
    }, 0);
    const totalDueAmount = Math.max(0, totalBilledAmount - totalPaidAmount);

    return (
      <RecordPageLayout
        recordType="Purchase Order"
        recordTitle={poNumberStr ? `#${poNumberStr.replace(/^#/, "")}` : ""}
        subtitle=""
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
                        <th className="p-2 border-r border-slate-400 min-w-[150px]">ITEM</th>
                        <th className="p-2 border-r border-slate-400 min-w-[150px]">DESCRIPTION</th>
                        <th className="p-2 border-r border-slate-400 min-w-[70px]">UNITS</th>
                        <th className="p-2 border-r border-slate-400 w-20 text-right">ORDERED</th>
                        <th className="p-2 border-r border-slate-400 w-20 text-right">RECEIVED</th>
                        <th className="p-2 border-r border-slate-400 w-20 text-right">BILLED</th>
                        <th className="p-2 border-r border-slate-400 w-20 text-right">OPEN QTY</th>
                        <th className="p-2 border-r border-slate-400 w-24 text-right">RATE (₹)</th>
                        <th className="p-2 border-r border-slate-400 w-20 text-right">DISC %</th>
                        <th className="p-2 border-r border-slate-400 w-24 text-right">DISC AMT (₹)</th>
                        <th className="p-2 border-r border-slate-400 w-28 text-right">SUBTOTAL (₹)</th>
                        <th className="p-2 border-r border-slate-400 w-20 text-right">TAX RATE</th>
                        <th className="p-2 border-r border-slate-400 w-24 text-right">TAX AMT (₹)</th>
                        <th className="p-2 border-r border-slate-400 w-28 text-right">BILLED AMT (₹)</th>
                        <th className="p-2 w-28 text-right">TOTAL (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {poLines.length === 0 ? (
                        <tr>
                          <td colSpan={16} className="p-4 text-center text-slate-400 italic">No line items in this order.</td>
                        </tr>
                      ) : (
                        poLines.map((l: any, idx: number) => {
                          const itemObj = items.find((i: any) => String(i.id) === String(l.item_id || l.itemId));
                          const uomObj = uoms.find((u: any) => String(u.id) === String(l.uom_id || l.uomId));
                          const lineId = String(l.id || l.purchaseOrderLineId || "");
                          const itemId = String(l.item_id || l.itemId || l.item?.id || "");
                          const lineQty = Number(l.quantity || l.qty || 0);
                          const lineRate = Number(l.rate || l.unitPrice || 0);

                          let lineRec = 0;
                          if (l.receivedQuantity !== undefined && l.receivedQuantity !== null) {
                            lineRec = Number(l.receivedQuantity);
                          } else {
                            relatedGrns.forEach((g: any) => {
                              const gLines = g.lineItems || g.grnLines || g.grnDetails || g.lines || g.details || [];
                              gLines.forEach((gl: any) => {
                                const glPoLineId = String(gl.purchaseOrderLineId || gl.po_line_id || gl.purchase_order_line_id || "");
                                const glItemId = String(gl.itemId || gl.item_id || gl.item?.id || "");
                                if ((lineId && glPoLineId === lineId) || (!lineId && glItemId === itemId)) {
                                  lineRec += Number(gl.receivedQty ?? gl.received_qty ?? gl.receivedQuantity ?? gl.quantity ?? gl.acceptedQty ?? gl.accepted_quantity ?? 0);
                                }
                              });
                            });
                          }

                          let lineBilled = 0;
                          relatedBills.forEach((inv: any) => {
                            const invLines = inv.lineItems || inv.purchaseInvoiceLines || inv.lines || inv.details || [];
                            invLines.forEach((il: any) => {
                              const ilPoLineId = String(il.purchaseOrderLineId || il.po_line_id || il.poLineId || "");
                              const ilItemId = String(il.itemId || il.item_id || il.item?.id || "");
                              if ((lineId && ilPoLineId === lineId) || (!lineId && ilItemId === itemId)) {
                                lineBilled += Number(il.quantity || il.qty || il.billedQty || 0);
                              }
                            });
                          });

                          const lineBilledAmount = lineBilled * lineRate;
                          const lineOpen = Math.max(0, lineQty - lineRec);
                          const lineGross = lineQty * lineRate;
                          const lineDiscPercent = Number(l.discount_percent ?? l.discountPercent ?? 0);
                          const lineDiscAmt = l.discount_amount != null ? Number(l.discount_amount) : ((lineGross * lineDiscPercent) / 100);
                          const lineSubtotal = l.subtotal != null ? Number(l.subtotal) : (lineGross - lineDiscAmt);
                          const lineTaxRate = Number(l.tax_rate || l.taxRate || 0);
                          const lineTaxAmt = l.tax_amount != null ? Number(l.tax_amount) : (lineSubtotal * (lineTaxRate / 100));
                          const lineTotal = l.line_total != null ? Number(l.line_total) : (lineSubtotal + lineTaxAmt);
                          const lineDesc = l.description || l.item_desc || itemObj?.item_desc || itemObj?.description || itemObj?.item_name || "-";

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                              <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                                {l.item?.item_name || itemObj?.item_name || `Item #${l.item_id}`}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-slate-700">
                                {lineDesc}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-slate-700">
                                {l.uom?.uom_name || uomObj?.uom_name || "—"}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold">{lineQty}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-700">{lineRec}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-indigo-700">{lineBilled}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">
                                <span className={`px-1.5 py-0.5 rounded text-[11px] ${lineOpen === 0 ? "bg-slate-100 text-slate-500 font-normal" : "bg-sky-100 text-sky-800 font-bold"}`}>
                                  {lineOpen}
                                </span>
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono">₹{lineRate.toFixed(2)}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono">{lineDiscPercent}%</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono">₹{lineDiscAmt.toFixed(2)}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold">₹{lineSubtotal.toFixed(2)}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono">{lineTaxRate}%</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono">₹{lineTaxAmt.toFixed(2)}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-indigo-900">₹{lineBilledAmount.toFixed(2)}</td>
                              <td className="p-2 text-right font-mono font-bold text-slate-900">₹{lineTotal.toFixed(2)}</td>
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
          {
            id: "relatedRecords",
            label: "Related Records",
            badge: relatedGrns.length + relatedBills.length + relatedReturns.length + relatedPayments.length,
            content: (
              <div className="space-y-6">
                {/* Goods Receipt Notes */}
                <div className="bg-white border border-slate-300 rounded-xs overflow-hidden">
                  <div className="bg-[#1d3e4c] text-white px-3 py-1.5 flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                    <span>Goods Receipt Notes (GRNs)</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-xs font-mono text-[10px]">{relatedGrns.length} records</span>
                  </div>
                  {relatedGrns.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 italic text-xs">No GRN received for this Purchase Order yet.</div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 font-semibold text-slate-600 text-[10px] uppercase border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-r border-slate-200">GRN #</th>
                          <th className="p-2 border-r border-slate-200">Date</th>
                          <th className="p-2 border-r border-slate-200">Status</th>
                          <th className="p-2 border-r border-slate-200 text-right">Received Qty</th>
                          <th className="p-2 text-center w-20">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {relatedGrns.map((g: any) => {
                          const gHeader = g.header ?? g;
                          const gLines = g.lineItems || g.grnLines || g.grnDetails || g.lines || g.details || [];
                          const totalRec = gLines.reduce((acc: number, l: any) => acc + Number(l.receivedQty ?? l.received_qty ?? l.receivedQuantity ?? l.quantity ?? l.acceptedQty ?? l.accepted_quantity ?? 0), 0);
                          const gNo = gHeader.grnNo || gHeader.grnNumber || gHeader.grn_number || g.grnNo || `GRN-${g.id}`;
                          return (
                            <tr key={g.id} className="hover:bg-slate-50">
                              <td className="p-2 border-r border-slate-200 font-bold text-sky-700 font-mono">{gNo}</td>
                              <td className="p-2 border-r border-slate-200 font-mono">{gHeader.grnDate ? String(gHeader.grnDate).slice(0, 10) : "-"}</td>
                              <td className="p-2 border-r border-slate-200">
                                <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${String(gHeader.status || "").toUpperCase() === "DRAFT" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}>
                                  {gHeader.status || "RECEIVED"}
                                </span>
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">{totalRec}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/grn?id=${g.id}&action=view`)}
                                  className="text-xs text-sky-700 hover:text-sky-900 font-semibold underline cursor-pointer"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Vendor Bills */}
                <div className="bg-white border border-slate-300 rounded-xs overflow-hidden">
                  <div className="bg-[#1d3e4c] text-white px-3 py-1.5 flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                    <span>Vendor Bills (Purchase Invoices)</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-xs font-mono text-[10px]">{relatedBills.length} records</span>
                  </div>
                  {relatedBills.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 italic text-xs">No Vendor Bills created for this Purchase Order yet.</div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 font-semibold text-slate-600 text-[10px] uppercase border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-r border-slate-200">Bill #</th>
                          <th className="p-2 border-r border-slate-200">Date</th>
                          <th className="p-2 border-r border-slate-200">Status</th>
                          <th className="p-2 border-r border-slate-200 text-right">Total (₹)</th>
                          <th className="p-2 border-r border-slate-200 text-right">Paid (₹)</th>
                          <th className="p-2 border-r border-slate-200 text-right">Balance (₹)</th>
                          <th className="p-2 text-center w-20">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {relatedBills.map((inv: any) => {
                          const h = inv.header ?? inv;
                          const invNo = h.invoiceNumber || h.vendorInvoiceNumber || `INV-${inv.id}`;
                          return (
                            <tr key={inv.id} className="hover:bg-slate-50">
                              <td className="p-2 border-r border-slate-200 font-bold text-sky-700 font-mono">{invNo}</td>
                              <td className="p-2 border-r border-slate-200 font-mono">{h.invoiceDate ? String(h.invoiceDate).slice(0, 10) : "-"}</td>
                              <td className="p-2 border-r border-slate-200">
                                <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${String(h.status || "").toUpperCase() === "PAID" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-blue-50 text-blue-800 border-blue-200"}`}>
                                  {h.status || "DRAFT"}
                                </span>
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">₹{Number(h.totalAmount || 0).toFixed(2)}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono text-emerald-700">₹{Number(h.paidAmount || 0).toFixed(2)}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono text-amber-800">₹{Number(h.balanceAmount || 0).toFixed(2)}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/purchase-invoice?id=${inv.id}&action=view`)}
                                  className="text-xs text-sky-700 hover:text-sky-900 font-semibold underline cursor-pointer"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Purchase Returns */}
                {relatedReturns.length > 0 && (
                  <div className="bg-white border border-slate-300 rounded-xs overflow-hidden">
                    <div className="bg-[#1d3e4c] text-white px-3 py-1.5 flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                      <span>Purchase Returns</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded-xs font-mono text-[10px]">{relatedReturns.length} records</span>
                    </div>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 font-semibold text-slate-600 text-[10px] uppercase border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-r border-slate-200">Return #</th>
                          <th className="p-2 border-r border-slate-200">Date</th>
                          <th className="p-2 border-r border-slate-200">Status</th>
                          <th className="p-2 border-r border-slate-200 text-right">Amount (₹)</th>
                          <th className="p-2 text-center w-20">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {relatedReturns.map((pr: any) => {
                          const h = pr.header ?? pr;
                          const rNo = h.returnNumber || h.return_number || `PR-${pr.id}`;
                          return (
                            <tr key={pr.id} className="hover:bg-slate-50">
                              <td className="p-2 border-r border-slate-200 font-bold text-purple-700 font-mono">{rNo}</td>
                              <td className="p-2 border-r border-slate-200 font-mono">{h.returnDate ? String(h.returnDate).slice(0, 10) : "-"}</td>
                              <td className="p-2 border-r border-slate-200">
                                <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border bg-purple-50 text-purple-800 border-purple-200">
                                  {h.status || "PENDING"}
                                </span>
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">₹{Number(h.totalAmount || 0).toFixed(2)}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/purchase-return?id=${pr.id}&action=view`)}
                                  className="text-xs text-purple-700 hover:text-purple-900 font-semibold underline cursor-pointer"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Bill Payments */}
                {relatedPayments.length > 0 && (
                  <div className="bg-white border border-slate-300 rounded-xs overflow-hidden">
                    <div className="bg-[#1d3e4c] text-white px-3 py-1.5 flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                      <span>Bill Payments</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded-xs font-mono text-[10px]">{relatedPayments.length} records</span>
                    </div>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 font-semibold text-slate-600 text-[10px] uppercase border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-r border-slate-200">Payment #</th>
                          <th className="p-2 border-r border-slate-200">Date</th>
                          <th className="p-2 border-r border-slate-200">Status</th>
                          <th className="p-2 border-r border-slate-200 text-right">Amount Paid (₹)</th>
                          <th className="p-2 text-center w-20">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {relatedPayments.map((p: any) => {
                          const h = p.header ?? p;
                          const pNo = h.paymentNo || h.payment_no || h.referenceNo || `PAY-${p.id}`;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="p-2 border-r border-slate-200 font-bold text-emerald-700 font-mono">{pNo}</td>
                              <td className="p-2 border-r border-slate-200 font-mono">{h.paymentDate ? String(h.paymentDate).slice(0, 10) : "-"}</td>
                              <td className="p-2 border-r border-slate-200">
                                <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border bg-emerald-50 text-emerald-800 border-emerald-200">
                                  {h.status || "COMPLETED"}
                                </span>
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-700">₹{Number(h.amountPaid || h.totalAmount || 0).toFixed(2)}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/purchase-payment?id=${p.id}&action=view`)}
                                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ),
          },
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
                {discountTotal > 0 && (
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-emerald-700">
                    <span className="font-semibold uppercase text-[10px]">DISCOUNT TOTAL</span>
                    <span className="font-bold">-₹{discountTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                  <span className="font-semibold text-slate-600 uppercase text-[10px]">TAX TOTAL</span>
                  <span className="font-bold text-slate-900">₹{taxTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-sm">
                  <span className="font-bold text-slate-800 uppercase text-[11px]">PO TOTAL</span>
                  <span className="font-bold text-slate-900">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-indigo-700">
                  <span className="font-semibold uppercase text-[10px]">TOTAL BILLED</span>
                  <span className="font-bold">₹{totalBilledAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-emerald-700">
                  <span className="font-semibold uppercase text-[10px]">TOTAL PAID</span>
                  <span className="font-bold">₹{totalPaidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pt-1 text-amber-800">
                  <span className="font-bold uppercase text-[11px]">DUE AMOUNT</span>
                  <span className="font-bold">₹{totalDueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
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
                      {canDelete("purchase_order") && !poIsGrnDone && (
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