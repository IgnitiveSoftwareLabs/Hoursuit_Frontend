import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import {
  Add,
  Search,
  List as ListIcon,
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
  useCreateVendorMutation,
  useDeleteVendorMutation,
  useGetVendorsQuery,
  useGetSingleVendorQuery,
  useUpdateVendorMutation,
} from "../RTK/services/vendorApi";

import { useGetStatesQuery } from "../RTK/services/stateApi";
import { useGetCitiesQuery } from "../RTK/services/cityApi";
import { useGetSubsidiariesQuery } from "../RTK/services/subsdiaryApi";
import { useGetChartOfAccountsQuery } from "../RTK/services/chartOfAccountApi";
import { useGetCurrenciesQuery } from "../RTK/services/currencyApi";
import { useGetPaymentMethodsQuery } from "../RTK/services/paymentMethodApi";
import { useGetPaymentTermsQuery } from "../RTK/services/paymentTermApi";
import { useGetPanAvailabilitiesQuery } from "../RTK/services/panAvailibiltyApi";
import { useGetRegistrationTypesQuery } from "../RTK/services/resigtrationTypeApi";

import ConfirmationDialog from "../components/Dialog/ConfirmationDialog";
import { usePermissions } from "../Hooks/usePermissions";
import RecordPageLayout, { RecordSection } from "./Layout/RecordPageLayout";
import SublistTable, { type SublistColumn } from "./Layout/SublistTable";

interface VendorType {
  id?: number;
  vendor_type: "COMPANY" | "INDIVIDUAL";
  salutation?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  state_code_id?: number | string;
  city_id?: number | string;
  primary_subsidiary_id?: number | string;
  subsidiary_id?: number | string;
  terms_id?: number | string;
  credit_limit?: number | string;
  currency_id?: number | string;
  opening_balance?: number | string;
  opening_balance_account_id?: number | string;
  gstin?: string;
  tin_no?: string;
  aadhar_no?: string;
  pan_avl_id?: number | string;
  registration_type_id?: number | string;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  Password?: string;
  Phone?: string;
  isActive?: boolean;
}

const VendorComp: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'list' (Data Table) | 'view' (NetSuite Read-Only View) | 'form' (NetSuite Editable Form)
  const [viewMode, setViewMode] = useState<"list" | "view" | "form">("list");
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editVendorId, setEditVendorId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteVendorId, setDeleteVendorId] = useState<number | null>(null);

  // Filter State for List View
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("all");
  const [selectedSubsidiaryFilter, setSelectedSubsidiaryFilter] = useState<string>("all");
  const [showInactives, setShowInactives] = useState(false);
  const [quickSort, setQuickSort] = useState("Recently Created");

  // Draft Rows for Sublists
  const [addressDraft, setAddressDraft] = useState<Record<string, any>>({});
  const [subsidiaryDraft, setSubsidiaryDraft] = useState<Record<string, any>>({});

  // RTK Queries
  const { data: vendorsData, isLoading: isVendorsLoading } = useGetVendorsQuery({ page: 1, option: true });
  const { data: singleVendorData, isLoading: isSingleVendorLoading } = useGetSingleVendorQuery(selectedVendorId!, {
    skip: !selectedVendorId,
  });
  const { data: statesData } = useGetStatesQuery();
  const { data: citiesData } = useGetCitiesQuery();
  const { data: subsidiariesData } = useGetSubsidiariesQuery();
  const { data: accountsData } = useGetChartOfAccountsQuery();
  const { data: currenciesData } = useGetCurrenciesQuery();
  const { data: paymentMethodsData } = useGetPaymentMethodsQuery({});
  const { data: paymentTermsData } = useGetPaymentTermsQuery();
  const { data: panAvailabilitiesData } = useGetPanAvailabilitiesQuery({});
  const { data: registrationTypesData } = useGetRegistrationTypesQuery({});

  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();
  const [deleteVendor] = useDeleteVendorMutation();

  // Extract Master Data Arrays safely
  const rawVendors = Array.isArray(vendorsData?.result)
    ? vendorsData.result
    : Array.isArray(vendorsData?.data)
      ? vendorsData.data
      : Array.isArray(vendorsData)
        ? vendorsData
        : [];

  const rawStates = Array.isArray((statesData as any)?.result)
    ? (statesData as any).result
    : Array.isArray((statesData as any)?.data)
      ? (statesData as any).data
      : Array.isArray(statesData)
        ? statesData
        : [];

  const rawCities = Array.isArray((citiesData as any)?.result)
    ? (citiesData as any).result
    : Array.isArray((citiesData as any)?.data)
      ? (citiesData as any).data
      : Array.isArray(citiesData)
        ? citiesData
        : [];

  const rawSubsidiaries = Array.isArray(subsidiariesData?.result)
    ? subsidiariesData.result
    : Array.isArray((subsidiariesData as any)?.data)
      ? (subsidiariesData as any).data
      : Array.isArray(subsidiariesData)
        ? subsidiariesData
        : [];

  const rawAccounts = Array.isArray(accountsData?.result)
    ? accountsData.result
    : Array.isArray((accountsData as any)?.data)
      ? (accountsData as any).data
      : Array.isArray(accountsData)
        ? accountsData
        : [];

  const rawCurrencies = Array.isArray(currenciesData?.result)
    ? currenciesData.result
    : Array.isArray((currenciesData as any)?.data)
      ? (currenciesData as any).data
      : Array.isArray(currenciesData)
        ? currenciesData
        : [];

  const rawPaymentMethods = Array.isArray(paymentMethodsData?.result)
    ? paymentMethodsData.result
    : Array.isArray((paymentMethodsData as any)?.data)
      ? (paymentMethodsData as any).data
      : Array.isArray(paymentMethodsData)
        ? paymentMethodsData
        : [];

  const rawPanAvailabilities = Array.isArray(panAvailabilitiesData?.result)
    ? panAvailabilitiesData.result
    : Array.isArray((panAvailabilitiesData as any)?.data)
      ? (panAvailabilitiesData as any).data
      : Array.isArray(panAvailabilitiesData)
        ? panAvailabilitiesData
        : [];

  const rawRegistrationTypes = Array.isArray(registrationTypesData?.result)
    ? registrationTypesData.result
    : Array.isArray((registrationTypesData as any)?.data)
      ? (registrationTypesData as any).data
      : Array.isArray(registrationTypesData)
        ? registrationTypesData
        : [];

  // Filter Accounts Payable Chart of Accounts for Opening Balance Account
  const payablesAccounts = rawAccounts.filter((acc: any) => {
    const typeName = String(acc.accountType?.account_type_name || acc.account_type || "").toLowerCase();
    return typeName.includes("payable") || typeName.includes("ap") || typeName.includes("liability");
  });
  const apOptions = payablesAccounts.length > 0 ? payablesAccounts : rawAccounts;

  // Sublist Data States (Empty initially - no pre-populated default row in subsidiary!)
  const [subsidiarySublist, setSubsidiarySublist] = useState<Record<string, any>[]>([]);
  const [addressSublist, setAddressSublist] = useState<Record<string, any>[]>([]);

  // Formik definition
  const formik = useFormik<VendorType>({
    initialValues: {
      vendor_type: "COMPANY",
      salutation: "MR",
      first_name: "",
      middle_name: "",
      last_name: "",
      company_name: "",
      email: "",
      phone: "",
      address: "",
      city_id: "",
      state_code_id: "",
      primary_subsidiary_id: "",
      subsidiary_id: "",
      terms_id: "",
      credit_limit: "0.00",
      currency_id: "",
      opening_balance: "0.00",
      opening_balance_account_id: "",
      gstin: "",
      tin_no: "",
      aadhar_no: "",
      pan_avl_id: "",
      registration_type_id: "",
      FirstName: "",
      LastName: "",
      Email: "",
      Password: "",
      Phone: "",
      isActive: true,
    },
    validationSchema: Yup.object({
      vendor_type: Yup.string().oneOf(["COMPANY", "INDIVIDUAL"]).required(),
      company_name: Yup.string().when("vendor_type", {
        is: "COMPANY",
        then: (schema) => schema.min(2, "Company name must be at least 2 characters").required("Company name is required when vendor type is Company"),
        otherwise: (schema) => schema.notRequired().nullable(),
      }),
      first_name: Yup.string().when("vendor_type", {
        is: "INDIVIDUAL",
        then: (schema) => schema.required("First name is required"),
        otherwise: (schema) => schema.notRequired(),
      }),
      last_name: Yup.string().when("vendor_type", {
        is: "INDIVIDUAL",
        then: (schema) => schema.required("Last name is required"),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
    onSubmit: async (values) => {
      try {
        let effectiveAddressSublist = [...addressSublist];
        if (
          addressDraft &&
          (addressDraft.addr1 || addressDraft.address) &&
          String(addressDraft.addr1 || addressDraft.address).trim() !== ""
        ) {
          const exists = effectiveAddressSublist.some(
            (a) => (a.addr1 || a.address) === (addressDraft.addr1 || addressDraft.address)
          );
          if (!exists) {
            effectiveAddressSublist.push(addressDraft);
          }
        }

        let effectiveSubsidiarySublist = [...subsidiarySublist];
        if (
          subsidiaryDraft &&
          subsidiaryDraft.subsidiary &&
          String(subsidiaryDraft.subsidiary).trim() !== ""
        ) {
          const exists = effectiveSubsidiarySublist.some(
            (s) => String(s.subsidiary) === String(subsidiaryDraft.subsidiary)
          );
          if (!exists) {
            effectiveSubsidiarySublist.push(subsidiaryDraft);
          }
        }

        // Resolve address details from Address Tab Sublist if available
        const primaryAddressItem = effectiveAddressSublist.find((a) => a.defaultBilling || a.defaultShipping) || effectiveAddressSublist[0];
        const resolvedAddress = primaryAddressItem?.addr1 || primaryAddressItem?.address || values.address || "N/A";
        const resolvedStateId = primaryAddressItem?.state_code_id ? Number(primaryAddressItem.state_code_id) : values.state_code_id ? Number(values.state_code_id) : rawStates[0]?.id || 1;
        const resolvedCityId = primaryAddressItem?.city_id ? Number(primaryAddressItem.city_id) : values.city_id ? Number(values.city_id) : rawCities[0]?.id || 1;

        const payload: any = {
          ...values,
          company_name: values.vendor_type === "INDIVIDUAL" && !values.company_name ? null : values.company_name,
          address: resolvedAddress,
          city_id: resolvedCityId,
          state_code_id: resolvedStateId,
          primary_subsidiary_id: values.primary_subsidiary_id || values.subsidiary_id ? Number(values.primary_subsidiary_id || values.subsidiary_id) : null,
          subsidiary_id: values.subsidiary_id || values.primary_subsidiary_id ? Number(values.subsidiary_id || values.primary_subsidiary_id) : null,
          currency_id: values.currency_id ? Number(values.currency_id) : null,
          opening_balance_account_id: values.opening_balance_account_id ? Number(values.opening_balance_account_id) : null,
          terms_id: values.terms_id ? Number(values.terms_id) : null,
          pan_avl_id: values.pan_avl_id ? Number(values.pan_avl_id) : null,
          registration_type_id: values.registration_type_id ? Number(values.registration_type_id) : null,
          credit_limit: values.credit_limit ? Number(values.credit_limit) : 0,
          opening_balance: values.opening_balance ? Number(values.opening_balance) : 0,
          FirstName: values.first_name || values.company_name || "Vendor",
          LastName: values.last_name || "Master",
          Email: values.email || "",
          Phone: values.phone || "",
          subsidiaryAssignments: effectiveSubsidiarySublist.map((item) => ({
            subsidiary_id: Number(item.subsidiary || item.subsidiary_id || item.id),
            credit_limit: item.creditLimit ? Number(item.creditLimit) : null,
            tax_code_id: item.taxCode ? Number(item.taxCode) : null,
          })),
          addressBook: effectiveAddressSublist.map((a: any) => ({
            label: a.label || "Primary Address",
            addressee: a.addressee || a.label || "Primary Address",
            addr1: a.addr1 || a.address || "N/A",
            addr2: a.addr2 || null,
            zip: a.zip || null,
            address: a.addr1 || a.address || "N/A",
            city_id: a.city_id ? Number(a.city_id) : null,
            state_code_id: a.state_code_id ? Number(a.state_code_id) : null,
            default_billing: Boolean(a.defaultBilling ?? a.default_billing),
            default_shipping: Boolean(a.defaultShipping ?? a.default_shipping),
          })),
        };

        if (isEdit && !values.Password) {
          delete payload.Password;
        }

        if (isEdit && editVendorId) {
          if (!canUpdate("vendor")) {
            toast.error("You do not have permission to update vendors");
            return;
          }
          const response = await updateVendor({ id: editVendorId, payload }).unwrap();
          toast.success(response.message || "Vendor updated successfully");
        } else {
          if (!canCreate("vendor")) {
            toast.error("You do not have permission to create vendors");
            return;
          }
          const response = await createVendor(payload).unwrap();
          toast.success(response.message || "Vendor created successfully");
        }

        formik.resetForm();
        setSubsidiarySublist([]);
        setAddressSublist([]);
        setViewMode("list");
        setIsEdit(false);
        setSearchParams({});
      } catch (error: any) {
        toast.error(error?.data?.message || error?.message || "Something went wrong");
      }
    },
  });

  // Check URL parameters for mode navigation
  useEffect(() => {
    const urlId = searchParams.get("id");
    const urlAction = searchParams.get("action");

    if (urlId) {
      const idNum = Number(urlId);
      setSelectedVendorId(idNum);

      const activeVendor =
        (singleVendorData?.result?.id === idNum && singleVendorData.result) ||
        (singleVendorData?.data?.id === idNum && singleVendorData.data) ||
        rawVendors.find((item: any) => item.id === idNum);

      if (urlAction === "edit") {
        if (activeVendor) {
          setSelectedVendor(activeVendor);
          populateForm(activeVendor);
          setEditVendorId(idNum);
          setIsEdit(true);
        }
        setViewMode("form");
      } else {
        if (activeVendor) {
          setSelectedVendor(activeVendor);
        }
        setViewMode("view");
      }
    } else if (urlAction === "new" || urlAction === "form") {
      setViewMode("form");
      if (urlAction === "new") {
        setIsEdit(false);
        setEditVendorId(null);
        setSelectedVendor(null);
        formik.resetForm();
        setSubsidiarySublist([]);
        setAddressSublist([]);
      }
    } else {
      setViewMode("list");
      setSelectedVendorId(null);
    }
  }, [searchParams, rawVendors.length, singleVendorData]);

  const populateForm = (vendor: any) => {
    const stateId = vendor.state_code_id || vendor.state?.id || vendor.city?.state_code_id || "";
    const cityId = vendor.city_id || vendor.city?.id || "";
    const subId = vendor.primary_subsidiary_id ?? vendor.subsidiary_id ?? vendor.subsidiary?.id ?? "";

    formik.setValues({
      vendor_type: vendor.vendor_type || "COMPANY",
      salutation: vendor.salutation || "MR",
      first_name: vendor.first_name || "",
      middle_name: vendor.middle_name || "",
      last_name: vendor.last_name || "",
      company_name: vendor.company_name || vendor.vendor_name || "",
      email: vendor.email || vendor.user?.Email || "",
      phone: vendor.phone || vendor.user?.Phone || "",
      address: vendor.address || "",
      city_id: cityId,
      state_code_id: stateId,
      primary_subsidiary_id: subId,
      subsidiary_id: subId,
      terms_id: vendor.terms_id || "",
      credit_limit: vendor.credit_limit ?? "0.00",
      currency_id: vendor.currency_id || "",
      opening_balance: vendor.opening_balance ?? "0.00",
      opening_balance_account_id: vendor.opening_balance_account_id || "",
      gstin: vendor.gstin || "",
      tin_no: vendor.tin_no || "",
      aadhar_no: vendor.aadhar_no || "",
      pan_avl_id: vendor.pan_avl_id || "",
      registration_type_id: vendor.registration_type_id || "",
      FirstName: vendor.user?.FirstName || vendor.first_name || "",
      LastName: vendor.user?.LastName || vendor.last_name || "",
      Email: vendor.user?.Email || vendor.email || "",
      Password: "",
      Phone: vendor.user?.Phone || vendor.phone || "",
      isActive: vendor.isActive ?? true,
    });

    const addressSource = vendor.addressBook || vendor.vendor_address_books || [];
    if (Array.isArray(addressSource) && addressSource.length > 0) {
      setAddressSublist(
        addressSource.map((a: any) => {
          const resolvedAddr1 = (a.addr1 && a.addr1 !== "N/A") ? a.addr1 : (a.address && a.address !== "N/A") ? a.address : "";
          const resolvedAddressee = (a.addressee && a.addressee !== "N/A") ? a.addressee : "";
          const finalAddr1 = resolvedAddr1 || resolvedAddressee || (vendor.address && vendor.address !== "N/A" ? vendor.address : "");

          return {
            defaultShipping: a.default_shipping ?? a.defaultShipping ?? true,
            defaultBilling: a.default_billing ?? a.defaultBilling ?? true,
            label: a.label || "Primary Address",
            addressee: a.addressee || "",
            addr1: finalAddr1,
            addr2: a.addr2 || "",
            zip: a.zip || "",
            address: finalAddr1,
            state_code_id: a.state_code_id || stateId,
            city_id: a.city_id || cityId,
          };
        })
      );
    } else if (vendor.address) {
      setAddressSublist([
        {
          defaultShipping: true,
          defaultBilling: true,
          label: "Primary Address",
          addressee: vendor.company_name || vendor.first_name || "",
          addr1: vendor.address && vendor.address !== "N/A" ? vendor.address : "",
          addr2: "",
          zip: "",
          address: vendor.address && vendor.address !== "N/A" ? vendor.address : "",
          state_code_id: stateId,
          city_id: cityId,
        },
      ]);
    } else {
      setAddressSublist([]);
    }

    const subSource = vendor.subsidiaryAssignments || vendor.vendor_subsidiaries || vendor.subsidiaries || [];
    if (Array.isArray(subSource) && subSource.length > 0) {
      setSubsidiarySublist(
        subSource.map((s: any) => ({
          subsidiary: s.subsidiary_id ?? s.subsidiary?.id ?? s.id ?? "",
          subsidiary_id: s.subsidiary_id ?? s.subsidiary?.id ?? s.id ?? "",
          creditLimit: s.credit_limit ?? s.creditLimit ?? "0.00",
          taxCode: s.tax_code_id ?? s.taxCode ?? "",
          is_primary: Boolean(s.is_primary || (subId && Number(subId) === Number(s.subsidiary_id ?? s.subsidiary?.id))),
        }))
      );
    } else if (subId) {
      setSubsidiarySublist([
        {
          subsidiary: Number(subId),
          subsidiary_id: Number(subId),
          creditLimit: "0.00",
          taxCode: "",
          is_primary: true,
        },
      ]);
    } else {
      setSubsidiarySublist([]);
    }
  };

  const handleView = (id: number) => {
    setSelectedVendorId(id);
    const vendorFallback = rawVendors.find((item: any) => item.id === id);
    if (vendorFallback) {
      setSelectedVendor(vendorFallback);
    }
    setViewMode("view");
    setSearchParams({ id: String(id), action: "view" });
  };

  const handleEdit = (id: number) => {
    if (!canUpdate("vendor")) {
      toast.error("You do not have permission to edit vendors");
      return;
    }

    setSelectedVendorId(id);
    const vendor =
      (singleVendorData?.result?.id === id && singleVendorData.result) ||
      rawVendors.find((item: any) => item.id === id);

    if (vendor) {
      setSelectedVendor(vendor);
      populateForm(vendor);
      setEditVendorId(id);
      setIsEdit(true);
    }
    setViewMode("form");
    setSearchParams({ id: String(id), action: "edit" });
  };

  const handleDelete = async (id: number) => {
    if (!canDelete("vendor")) {
      toast.error("You do not have permission to delete vendors");
      return;
    }

    try {
      await deleteVendor(id).unwrap();
      toast.success("Vendor master record deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteVendorId(null);
      if (selectedVendorId === id) {
        setViewMode("list");
        setSelectedVendorId(null);
        setSearchParams({});
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete vendor");
    }
  };

  const handleAddVendor = () => {
    if (!canCreate("vendor")) {
      toast.error("You do not have permission to create vendors");
      return;
    }

    setViewMode("form");
    setIsEdit(false);
    setEditVendorId(null);
    setSelectedVendor(null);
    setSelectedVendorId(null);
    formik.resetForm();
    setSubsidiarySublist([]);
    setAddressSublist([]);
    setSearchParams({ action: "new" });
  };

  const handleExportCSV = () => {
    if (rawVendors.length === 0) {
      toast.error("No vendor records to export");
      return;
    }
    const headers = ["ID", "Company Name", "GSTIN", "Contact Person", "Email", "Phone", "City", "State"];
    const rows = rawVendors.map((v: any) => [
      `VEND${String(v.id).padStart(4, "0")}`,
      `"${v.company_name || v.vendor_name || ""}"`,
      v.gstin || "",
      `"${v.first_name || v.user?.FirstName || ""} ${v.last_name || v.user?.LastName || ""}"`,
      v.email || v.user?.Email || "",
      v.phone || v.user?.Phone || "",
      v.city?.city_name || v.city?.name || "",
      v.state?.state_name || v.state?.name || "",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Vendors_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Vendor List exported as CSV");
  };

  // Sublist Column Definitions
  const subsidiaryColumns: SublistColumn[] = [
    {
      key: "subsidiary",
      label: "SUBSIDIARY",
      type: "select",
      required: true,
      options: rawSubsidiaries.length > 0
        ? rawSubsidiaries.map((s: any) => ({
          label: s.subsidiary_name || s.name || `Subsidiary #${s.id}`,
          value: s.id,
        }))
        : [],
    },
    { key: "creditLimit", label: "CREDIT LIMIT", type: "text" },
    { key: "taxCode", label: "TAX CODE", type: "text" },
  ];

  // Address Sublist Column Definitions matching NetSuite Screenshot
  const addressColumns: SublistColumn[] = [
    { key: "defaultShipping", label: "DEFAULT SHIPPING", type: "checkbox" },
    { key: "defaultBilling", label: "DEFAULT BILLING", type: "checkbox" },
    { key: "label", label: "LABEL", type: "text", placeholder: "Main Office / Branch" },
    { key: "addressee", label: "ADDRESSEE", type: "text", placeholder: "Company / Person Name" },
    { key: "addr1", label: "ADDRESS 1", type: "text", required: true, placeholder: "Street Address 1..." },
    { key: "addr2", label: "ADDRESS 2", type: "text", placeholder: "Street Address 2 / Suite..." },
    { key: "zip", label: "ZIP / POSTAL CODE", type: "text", placeholder: "Zip Code" },
    {
      key: "state_code_id",
      label: "STATE",
      type: "select",
      options: rawStates.map((st: any) => ({ label: st.state_name || st.name, value: st.id })),
    },
    {
      key: "city_id",
      label: "CITY",
      type: "select",
      options: rawCities.map((ct: any) => ({ label: ct.city_name || ct.name, value: ct.id })),
    },
  ];

  const filteredVendors = rawVendors.filter((v: any) => {
    if (selectedStateFilter !== "all" && String(v.state_code_id) !== selectedStateFilter) return false;
    if (selectedSubsidiaryFilter !== "all" && String(v.primary_subsidiary_id || v.subsidiary_id) !== selectedSubsidiaryFilter) return false;
    if (!showInactives && v.isActive === false) return false;
    return true;
  });

  // ── RENDER 1: READ-ONLY VIEW MODE ──
  if (viewMode === "view") {
    const activeVendor =
      singleVendorData?.result ||
      singleVendorData?.data ||
      (singleVendorData && typeof singleVendorData === "object" && !Array.isArray(singleVendorData) ? singleVendorData : null) ||
      selectedVendor ||
      rawVendors.find((v: any) => v.id === selectedVendorId);

    if (isSingleVendorLoading && !activeVendor) {
      return (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          <CircularProgress size={24} className="mb-2" />
          <div>Loading vendor record...</div>
        </div>
      );
    }

    if (!activeVendor) {
      return (
        <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-600 space-y-3">
          <div>Vendor record unavailable.</div>
          <button
            onClick={() => {
              setViewMode("list");
              setSearchParams({});
            }}
            className="px-3 py-1 bg-sky-600 text-white rounded text-xs font-semibold hover:bg-sky-700"
          >
            Back to Vendors List
          </button>
        </div>
      );
    }

    const vendorCode = `VEND${String(activeVendor.id || selectedVendorId).padStart(4, "0")}`;
    const vendorName = activeVendor.company_name || activeVendor.vendor_name || "Vendor Master";
    const vendorSub = activeVendor.primarySubsidiary?.subsidiary_name || activeVendor.subsidiary?.name || "Parent Company";
    const vendorState = activeVendor.state?.state_name || activeVendor.state?.name || "N/A";
    const vendorCity = activeVendor.city?.city_name || activeVendor.city?.name || "N/A";
    const contactPerson = activeVendor.first_name || activeVendor.last_name
      ? `${activeVendor.salutation || ""} ${activeVendor.first_name || ""} ${activeVendor.middle_name || ""} ${activeVendor.last_name || ""}`.trim()
      : activeVendor.user?.FirstName
        ? `${activeVendor.user?.FirstName} ${activeVendor.user?.LastName || ""}`
        : "N/A";

    const vendorSubsidiariesList = Array.isArray(activeVendor.subsidiaryAssignments) && activeVendor.subsidiaryAssignments.length > 0
      ? activeVendor.subsidiaryAssignments
      : Array.isArray(activeVendor.vendor_subsidiaries) && activeVendor.vendor_subsidiaries.length > 0
      ? activeVendor.vendor_subsidiaries
      : [{ subsidiary: vendorSub, primary: "Yes", balance: "₹0.00", creditLimit: `₹${activeVendor.credit_limit || "0.00"}` }];

    const vendorAddressList = Array.isArray(activeVendor.addressBook) && activeVendor.addressBook.length > 0
      ? activeVendor.addressBook
      : Array.isArray(activeVendor.vendor_address_books) && activeVendor.vendor_address_books.length > 0
      ? activeVendor.vendor_address_books
      : [{ defaultShipping: true, defaultBilling: true, label: "Primary Address", addressee: activeVendor.company_name || contactPerson, addr1: activeVendor.address || "N/A", state: vendorState, city: vendorCity }];

    return (
      <RecordPageLayout
        recordType="Vendor"
        subtitle={`${vendorCode} ${vendorName}`}
        mode="view"
        onEdit={() => handleEdit(activeVendor.id || selectedVendorId!)}
        onBack={() => {
          setViewMode("list");
          setSearchParams({});
        }}
        onListClick={() => {
          setViewMode("list");
          setSearchParams({});
        }}
        onSearchClick={() => {
          setViewMode("list");
          setSearchParams({});
        }}
        onMakePayment={() => toast.success(`Payment voucher generated for ${vendorName}`)}
        subTabs={[
          {
            id: "address",
            label: "Address",
            badge: vendorAddressList.length,
            content: (
              <div className="border border-slate-300 rounded-xs overflow-x-auto bg-white">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-300">
                    <tr>
                      <th className="px-3 py-2 border-r border-slate-300">DEFAULT SHIPPING</th>
                      <th className="px-3 py-2 border-r border-slate-300">DEFAULT BILLING</th>
                      <th className="px-3 py-2 border-r border-slate-300">LABEL</th>
                      <th className="px-3 py-2 border-r border-slate-300">ADDRESSEE</th>
                      <th className="px-3 py-2 border-r border-slate-300">ADDRESS 1</th>
                      <th className="px-3 py-2 border-r border-slate-300">ADDRESS 2</th>
                      <th className="px-3 py-2 border-r border-slate-300">ZIP</th>
                      <th className="px-3 py-2 border-r border-slate-300">STATE</th>
                      <th className="px-3 py-2">CITY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {vendorAddressList.map((addr: any, idx: number) => {
                      const cityName = addr.city?.city_name || addr.city?.name || (typeof addr.city === "string" ? addr.city : vendorCity);
                      const stateName = addr.state?.state_name || addr.state?.name || (typeof addr.state === "string" ? addr.state : vendorState);

                      return (
                        <tr key={idx}>
                          <td className="px-3 py-2 border-r border-slate-200 text-emerald-700 font-semibold">{addr.default_billing ?? addr.defaultBilling ? "Yes" : "No"}</td>
                          <td className="px-3 py-2 border-r border-slate-200 text-emerald-700 font-semibold">{addr.default_shipping ?? addr.defaultShipping ? "Yes" : "No"}</td>
                          <td className="px-3 py-2 font-bold border-r border-slate-200">{addr.label || "Primary Address"}</td>
                          <td className="px-3 py-2 border-r border-slate-200">{addr.addressee || "N/A"}</td>
                          <td className="px-3 py-2 border-r border-slate-200">{addr.addr1 && addr.addr1 !== "N/A" ? addr.addr1 : addr.address && addr.address !== "N/A" ? addr.address : activeVendor.address || "N/A"}</td>
                          <td className="px-3 py-2 border-r border-slate-200">{addr.addr2 || "N/A"}</td>
                          <td className="px-3 py-2 border-r border-slate-200 font-mono">{addr.zip || "N/A"}</td>
                          <td className="px-3 py-2 border-r border-slate-200">{stateName}</td>
                          <td className="px-3 py-2">{cityName}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ),
          },
          {
            id: "financial",
            label: "Financial",
            content: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 text-xs bg-slate-50 border border-slate-200 rounded">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 uppercase text-[11px] border-b pb-1">FINANCIAL TERMS & BALANCE</h4>
                  <div><strong>Payment Terms:</strong> {activeVendor.terms?.name || activeVendor.terms?.term_name || activeVendor.terms?.payment_method_name || "N/A"}</div>
                  <div><strong>Credit Limit:</strong> ₹{activeVendor.credit_limit || "0.00"}</div>
                  <div><strong>Primary Currency:</strong> {activeVendor.currency?.currency_name || activeVendor.currency?.currency_code || "N/A"}</div>
                  <div><strong>Opening Balance:</strong> ₹{activeVendor.opening_balance || "0.00"}</div>
                  <div><strong>Opening Balance Account:</strong> {activeVendor.openingBalanceAccount?.account_name || "Accounts Payable"}</div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 uppercase text-[11px] border-b pb-1">TAX & STATUTORY</h4>
                  <div><strong>GSTIN Number:</strong> {activeVendor.gstin || "Not specified"}</div>
                  <div><strong>TIN Number:</strong> {activeVendor.tin_no || "N/A"}</div>
                  <div><strong>Aadhaar Number:</strong> {activeVendor.aadhar_no || "N/A"}</div>
                  <div><strong>PAN Availability:</strong> {activeVendor.pan_availability?.name || "N/A"}</div>
                  <div><strong>Registration Type:</strong> {activeVendor.registration_type?.registration_type || "N/A"}</div>
                </div>
              </div>
            ),
          },
          {
            id: "subsidiaries",
            label: "Subsidiaries",
            badge: vendorSubsidiariesList.length,
            content: (
              <div className="border border-slate-300 rounded-xs overflow-x-auto bg-white">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-300">
                    <tr>
                      <th className="px-3 py-2 border-r border-slate-300">SUBSIDIARY</th>
                      <th className="px-3 py-2 border-r border-slate-300">PRIMARY</th>
                      <th className="px-3 py-2 border-r border-slate-300">BALANCE</th>
                      <th className="px-3 py-2">CREDIT LIMIT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {vendorSubsidiariesList.map((subItem: any, idx: number) => {
                      const subName = subItem.subsidiary?.subsidiary_name || subItem.subsidiary?.name || (typeof subItem.subsidiary === "string" ? subItem.subsidiary : vendorSub);
                      const isPrimary = subItem.is_primary ?? subItem.isPrimary ?? (idx === 0 && subItem.subsidiary_id === activeVendor.primary_subsidiary_id);
                      const creditLimitVal = subItem.credit_limit || subItem.creditLimit || activeVendor.credit_limit || "0.00";

                      return (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-bold border-r border-slate-200">{subName}</td>
                          <td className="px-3 py-2 border-r border-slate-200 text-emerald-700 font-semibold">{isPrimary ? "Yes" : "No"}</td>
                          <td className="px-3 py-2 border-r border-slate-200 font-mono">₹0.00</td>
                          <td className="px-3 py-2 font-mono">₹{creditLimitVal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ),
          },
        ]}
      >
        {/* SECTION 1: PRIMARY VENDOR DETAILS */}
        <RecordSection title="Primary Information" defaultOpen={true}>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">VENDOR ID</span>
            <span className="text-xs font-bold text-slate-900">{vendorCode}</span>
          </div>

          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">VENDOR TYPE</span>
            <span className="text-xs font-semibold text-slate-800">{activeVendor.vendor_type || "COMPANY"}</span>
          </div>

          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">COMPANY NAME</span>
            <span className="text-xs font-bold text-slate-900">{vendorName}</span>
          </div>
        </RecordSection>

        {/* SECTION 2: EMAIL | PHONE */}
        <RecordSection title="Email | Phone" defaultOpen={true}>
          {activeVendor.vendor_type === "INDIVIDUAL" && (
            <div className="flex flex-col space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">CONTACT PERSON</span>
              <span className="text-xs font-semibold text-slate-800">{contactPerson}</span>
            </div>
          )}

          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">EMAIL</span>
            <span className="text-xs font-semibold text-sky-700">{activeVendor.email || activeVendor.user?.Email || "N/A"}</span>
          </div>

          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">PHONE</span>
            <span className="text-xs font-mono text-slate-800">{activeVendor.phone || activeVendor.user?.Phone || "N/A"}</span>
          </div>
        </RecordSection>

        {/* SECTION 3: CLASSIFICATION */}
        <RecordSection title="Classification" defaultOpen={true}>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">PRIMARY SUBSIDIARY</span>
            <span className="text-xs font-semibold text-slate-800">{vendorSub}</span>
          </div>

          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">STATUS</span>
            <span className={`text-xs font-semibold ${activeVendor.isActive !== false ? "text-emerald-700" : "text-red-600"}`}>
              {activeVendor.isActive !== false ? "Active" : "Inactive"}
            </span>
          </div>
        </RecordSection>
      </RecordPageLayout>
    );
  }

  // ── RENDER 2: EDITABLE FORM MODE ──
  if (viewMode === "form") {
    return (
      <form onSubmit={formik.handleSubmit}>
        <RecordPageLayout
          recordType="Vendor"
          recordTitle={formik.values.company_name || (isEdit ? "Edit Vendor Record" : "New Vendor Record")}
          mode="edit"
          onSave={() => formik.handleSubmit()}
          onCancel={() => {
            setViewMode("list");
            setSearchParams({});
          }}
          onBack={() => {
            setViewMode("list");
            setSearchParams({});
          }}
          onSearchClick={() => {
            setViewMode("list");
            setSearchParams({});
          }}
          isSaving={isCreating || isUpdating}
          subTabs={[
            {
              id: "address",
              label: "Address",
              badge: addressSublist.length,
              content: (
                <SublistTable
                  title="Vendor Address Sublist Table"
                  columns={addressColumns}
                  data={addressSublist}
                  onAddRow={(newRow) => setAddressSublist([...addressSublist, newRow])}
                  onUpdateRow={(idx, row) => {
                    const copy = [...addressSublist];
                    copy[idx] = row;
                    setAddressSublist(copy);
                  }}
                  onRemoveRow={(idx) => setAddressSublist(addressSublist.filter((_, i) => i !== idx))}
                  onDraftChange={(draft) => setAddressDraft(draft)}
                />
              ),
            },
            {
              id: "financial",
              label: "Financial",
              content: (
                <div className="space-y-4 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                  {/* TERMS & BALANCE GROUP */}
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider border-b border-slate-300 pb-1 mb-2">
                      TERMS & CREDIT LIMIT
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase">TERMS</label>
                        <select
                          name="terms_id"
                          value={formik.values.terms_id || ""}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                        >
                          <option value="">-- Select Terms --</option>
                          {(Array.isArray(paymentTermsData?.result) ? paymentTermsData.result : Array.isArray((paymentTermsData as any)?.data) ? (paymentTermsData as any).data : []).map((pt: any) => (
                            <option key={pt.id} value={pt.id}>
                              {pt.name || pt.term_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase">CREDIT LIMIT</label>
                        <input
                          type="number"
                          step="0.01"
                          name="credit_limit"
                          value={formik.values.credit_limit || "0.00"}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase">
                          PRIMARY CURRENCY <span className="text-amber-600">*</span>
                        </label>
                        <select
                          name="currency_id"
                          value={formik.values.currency_id || ""}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-medium focus:outline-none focus:border-sky-500"
                        >
                          <option value="">-- Select Primary Currency --</option>
                          {rawCurrencies.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.currency_name} ({c.currency_code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase">OPENING BALANCE AMOUNT</label>
                        <input
                          type="number"
                          step="0.01"
                          name="opening_balance"
                          value={formik.values.opening_balance || "0.00"}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-mono focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase">OPENING BALANCE ACCOUNT (A/P ONLY)</label>
                        <select
                          name="opening_balance_account_id"
                          value={formik.values.opening_balance_account_id || ""}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                        >
                          <option value="">-- Select Accounts Payable Account --</option>
                          {apOptions.map((acc: any) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.account_number} - {acc.account_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* TAX INFORMATION & STATUTORY GROUP */}
                  <div className="pt-2">
                    <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider border-b border-slate-300 pb-1 mb-2">
                      TAX INFORMATION & STATUTORY
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase">GST NO. / GSTIN</label>
                        <input
                          type="text"
                          name="gstin"
                          value={formik.values.gstin || ""}
                          onChange={formik.handleChange}
                          placeholder="22AAAAA0000A1Z5"
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 uppercase focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase">TIN NO.</label>
                        <input
                          type="text"
                          name="tin_no"
                          value={formik.values.tin_no || ""}
                          onChange={formik.handleChange}
                          placeholder="TIN Number"
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 uppercase focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase">AADHAR NO. (OPTIONAL)</label>
                        <input
                          type="text"
                          name="aadhar_no"
                          value={formik.values.aadhar_no || ""}
                          onChange={formik.handleChange}
                          placeholder="12-digit Aadhaar Number"
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase">PAN AVAILABILITY</label>
                        <select
                          name="pan_avl_id"
                          value={formik.values.pan_avl_id || ""}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                        >
                          <option value="">-- Select PAN Availability --</option>
                          {rawPanAvailabilities.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 uppercase">REGISTRATION TYPE</label>
                        <select
                          name="registration_type_id"
                          value={formik.values.registration_type_id || ""}
                          onChange={formik.handleChange}
                          className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 focus:outline-none focus:border-sky-500"
                        >
                          <option value="">-- Select Registration Type --</option>
                          {rawRegistrationTypes.map((r: any) => (
                            <option key={r.id} value={r.id}>
                              {r.registration_type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              id: "subsidiaries",
              label: "Subsidiaries",
              badge: subsidiarySublist.length,
              content: (
                <SublistTable
                  title="Subsidiary Assignment Sublist"
                  columns={subsidiaryColumns}
                  data={subsidiarySublist}
                  onAddRow={(newRow) => setSubsidiarySublist([...subsidiarySublist, newRow])}
                  onUpdateRow={(idx, row) => {
                    const copy = [...subsidiarySublist];
                    copy[idx] = row;
                    setSubsidiarySublist(copy);
                  }}
                  onRemoveRow={(idx) => setSubsidiarySublist(subsidiarySublist.filter((_, i) => i !== idx))}
                  onDraftChange={(draft) => setSubsidiaryDraft(draft)}
                />
              ),
            },
          ]}
        >
          {/* SECTION 1: PRIMARY INFORMATION */}
          <RecordSection title="Primary Information" defaultOpen={true}>
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                TYPE
              </label>
              <div className="flex items-center space-x-4 pt-1">
                <label className="inline-flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="vendor_type"
                    value="COMPANY"
                    checked={formik.values.vendor_type === "COMPANY"}
                    onChange={() => formik.setFieldValue("vendor_type", "COMPANY")}
                    className="w-3.5 h-3.5 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="ml-1.5 uppercase text-[11px]">COMPANY</span>
                </label>
                <label className="inline-flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="vendor_type"
                    value="INDIVIDUAL"
                    checked={formik.values.vendor_type === "INDIVIDUAL"}
                    onChange={() => formik.setFieldValue("vendor_type", "INDIVIDUAL")}
                    className="w-3.5 h-3.5 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="ml-1.5 uppercase text-[11px]">INDIVIDUAL</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col space-y-1 md:col-span-2">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                COMPANY NAME {formik.values.vendor_type === "COMPANY" && <span className="text-amber-600">*</span>}
              </label>
              <input
                type="text"
                name="company_name"
                value={formik.values.company_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Vendor Company Name"
                className={`h-7 text-xs bg-white border rounded-xs px-2 py-0.5 focus:outline-none ${formik.touched.company_name && formik.errors.company_name
                    ? "border-red-500"
                    : "border-slate-300 focus:border-sky-500"
                  }`}
              />
              {formik.touched.company_name && formik.errors.company_name && (
                <span className="text-[10px] text-red-600">{formik.errors.company_name}</span>
              )}
            </div>

            {formik.values.vendor_type === "INDIVIDUAL" && (
              <>
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                    SALUTATION
                  </label>
                  <select
                    name="salutation"
                    value={formik.values.salutation || "MR"}
                    onChange={formik.handleChange}
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 py-0.5"
                  >
                    <option value="MR">MR.</option>
                    <option value="MS">MS.</option>
                    <option value="MRS">MRS.</option>
                    <option value="DR">DR.</option>
                    <option value="PROF">PROF.</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                    FIRST NAME <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formik.values.first_name || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="First Name"
                    className={`h-7 text-xs bg-white border rounded-xs px-2 py-0.5 focus:outline-none ${formik.touched.first_name && formik.errors.first_name ? "border-red-500" : "border-slate-300 focus:border-sky-500"
                      }`}
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                    MIDDLE NAME
                  </label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formik.values.middle_name || ""}
                    onChange={formik.handleChange}
                    placeholder="Middle Name"
                    className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 py-0.5 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                    LAST NAME <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formik.values.last_name || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Last Name"
                    className={`h-7 text-xs bg-white border rounded-xs px-2 py-0.5 focus:outline-none ${formik.touched.last_name && formik.errors.last_name ? "border-red-500" : "border-slate-300 focus:border-sky-500"
                      }`}
                  />
                </div>
              </>
            )}
          </RecordSection>

          {/* SECTION 2: EMAIL | PHONE */}
          <RecordSection title="Email | Phone" defaultOpen={true}>
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                EMAIL
              </label>
              <input
                type="email"
                name="email"
                value={formik.values.email || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="vendor@company.com"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 py-0.5 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                PHONE
              </label>
              <input
                type="text"
                name="phone"
                value={formik.values.phone || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="10-digit phone number"
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 py-0.5 focus:outline-none focus:border-sky-500"
              />
            </div>
          </RecordSection>

          {/* SECTION 3: CLASSIFICATION */}
          <RecordSection title="Classification" defaultOpen={true}>
            <div className="flex flex-col space-y-1">
              <label className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                PRIMARY SUBSIDIARY <span className="text-amber-600">*</span>
              </label>
              <select
                name="primary_subsidiary_id"
                value={formik.values.primary_subsidiary_id || formik.values.subsidiary_id || ""}
                onChange={(e) => {
                  formik.setFieldValue("primary_subsidiary_id", e.target.value);
                  formik.setFieldValue("subsidiary_id", e.target.value);
                }}
                className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 py-0.5 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select Primary Subsidiary --</option>
                {rawSubsidiaries.map((sb: any) => (
                  <option key={sb.id} value={sb.id}>
                    {sb.subsidiary_name || sb.name}
                  </option>
                ))}
              </select>
            </div>
          </RecordSection>
        </RecordPageLayout>
      </form>
    );
  }

  // ── RENDER 3: LIST VIEW ──
  return (
    <div className="flex flex-col space-y-3 max-w-full font-sans text-slate-800">
      {/* TOP TITLE BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-300 pb-2">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-[#1e2d3d] tracking-tight">Vendors</h1>
        </div>
        <div className="flex items-center space-x-3 text-xs font-semibold text-sky-700">
          <button onClick={() => setViewMode("list")} className="hover:underline flex items-center space-x-1">
            <ListIcon className="!w-3.5 !h-3.5" />
            <span>List</span>
          </button>
          <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="hover:underline flex items-center space-x-1">
            <Search className="!w-3.5 !h-3.5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* VIEW CONTROL RIBBON */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-300 p-2 rounded-xs">
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="font-semibold text-slate-600 uppercase text-[10px]">VIEW</span>
            <select className="h-7 text-xs bg-white border border-slate-300 rounded-xs px-2 font-medium focus:outline-none focus:border-sky-500">
              <option value="Ignitive Vendor List">Ignitive Vendor List</option>
              <option value="All Vendors">All Vendors</option>
              <option value="Active Vendors">Active Vendors</option>
            </select>
          </div>

          {canCreate("vendor") && (
            <button
              onClick={handleAddVendor}
              className="h-7 px-3 bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-xs shadow-2xs transition-colors flex items-center space-x-1"
            >
              <Add className="!w-4 !h-4" />
              <span>New Vendor</span>
            </button>
          )}
        </div>
      </div>

      {/* COLLAPSIBLE FILTERS PANEL */}
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
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">State Filter</label>
              <select
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
                className="w-full h-7 bg-white border border-slate-300 rounded-xs px-2 text-xs"
              >
                <option value="all">All States</option>
                {rawStates.map((st: any) => (
                  <option key={st.id} value={st.id}>
                    {st.state_name || st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Subsidiary Filter</label>
              <select
                value={selectedSubsidiaryFilter}
                onChange={(e) => setSelectedSubsidiaryFilter(e.target.value)}
                className="w-full h-7 bg-white border border-slate-300 rounded-xs px-2 text-xs"
              >
                <option value="all">All Subsidiaries</option>
                {rawSubsidiaries.map((sb: any) => (
                  <option key={sb.id} value={sb.id}>
                    {sb.subsidiary_name || sb.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ACTION TOOLBAR */}
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
              <option value="ID Ascending">ID Ascending</option>
            </select>
          </div>

          <span className="font-bold text-slate-700 uppercase text-[11px]">
            TOTAL: {filteredVendors.length}
          </span>
        </div>
      </div>

      {/* NETSUITE VENDOR DATA TABLE GRID */}
      <div className="border border-slate-300 rounded-xs overflow-x-auto bg-white shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-300 select-none">
            <tr>
              <th className="px-3 py-2 border-r border-slate-300 w-24">EDIT | VIEW</th>
              <th className="px-3 py-2 border-r border-slate-300">INTERNAL ID</th>
              <th className="px-3 py-2 border-r border-slate-300">ID</th>
              <th className="px-3 py-2 border-r border-slate-300">NAME</th>
              <th className="px-3 py-2 border-r border-slate-300">PRIMARY CONTACT</th>
              <th className="px-3 py-2 border-r border-slate-300">PHONE</th>
              <th className="px-3 py-2 border-r border-slate-300">EMAIL</th>
              <th className="px-3 py-2 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {isVendorsLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                  Loading vendors list...
                </td>
              </tr>
            ) : filteredVendors.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                  No vendor records found matching criteria.
                </td>
              </tr>
            ) : (
              filteredVendors.map((row: any, idx: number) => {
                const vendorCode = `VEND${String(row.id).padStart(4, "0")}`;
                return (
                  <tr
                    key={row.id || idx}
                    className={`hover:bg-amber-50/70 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                  >
                    <td className="px-3 py-1.5 border-r border-slate-200 whitespace-nowrap text-sky-700 font-semibold">
                      <button
                        onClick={() => handleEdit(row.id)}
                        className="hover:underline mr-1 text-sky-700"
                      >
                        Edit
                      </button>
                      <span className="text-slate-300 font-normal">|</span>
                      <button
                        onClick={() => handleView(row.id)}
                        className="hover:underline ml-1 text-sky-700"
                      >
                        View
                      </button>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-slate-500">
                      {row.id}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono font-semibold text-slate-800">
                      {vendorCode}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-900">
                      {row.company_name || row.vendor_name}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-medium">
                      {row.first_name || row.last_name
                        ? `${row.salutation || ""} ${row.first_name || ""} ${row.last_name || ""}`.trim()
                        : row.user?.FirstName
                          ? `${row.user?.FirstName} ${row.user?.LastName || ""}`
                          : "N/A"}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 font-mono">
                      {row.phone || row.user?.Phone || "N/A"}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 text-sky-700">
                      {row.email || row.user?.Email || "N/A"}
                    </td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {canDelete("vendor") && (
                        <button
                          onClick={() => {
                            setDeleteVendorId(row.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800 font-semibold text-[11px] hover:underline"
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
        title="Delete Vendor"
        message="Are you sure you want to delete this vendor master record?"
        onConfirm={() => deleteVendorId && handleDelete(deleteVendorId)}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteVendorId(null);
        }}
      />
    </div>
  );
};

export default VendorComp;