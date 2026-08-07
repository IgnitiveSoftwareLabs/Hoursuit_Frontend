import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  IconButton,
  TextField,
  Typography,
  Select,
  MenuItem,
  Chip,
  Divider,
} from "@mui/material";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import StoreIcon from "@mui/icons-material/Store";
import LayersIcon from "@mui/icons-material/Layers";
import SpeedIcon from "@mui/icons-material/Speed";
import { Add, InfoOutlined } from "@mui/icons-material";
import toast from "react-hot-toast";
import { useLazyFetchWarehousesQuery } from "../../RTK/services/warehouseApi";
import { useGetCommoditiesQuery } from "../../RTK/services/commodityApi";
import {
  useFetchGodownsQuery,
  useLazyFetchGodownsQuery,
} from "../../RTK/services/godownApi";
import { useLazyGetCustomersQuery } from "../../RTK/services/customerApi";
import CustomerModal from "../../components/Dialog/CustomerModal";
import InfiniteScrollAutocomplete from "../../Common/InfiniteScroll";
import apiInstance from "../../Services/apiservice/apiInstance";
import RequestDepositorForm from "../../components/Dialog/RequestDepositorForm";
import ConfirmationDialog from "../Dialog/ConfirmationDialog";
import { getstackapicall } from "../../Services/Admin/StackApiService";
import { setStack } from "../../Redux/StackSlice";
import { useAppDispatch, useAppSelector } from "../../Hooks/Reduxhook/hooks";
import {
  deleteGatePass,
  updateGatePass,
  createGatePass,
} from "../../Services/Admin/GatePassApiService/index";
import {
  setAddGatePasss,
  setUpdateGatePasss,
  setDeleteGatePasss,
} from "../../Redux/GatePassSlice";

// Types
interface GatePassType {
  id?: number;
  clientId: number;
  mobile_number?: string;
  name?: string;
  date: string;
  vehicle_number: string;
  warehouseId: number;
  godownId: number;
  stack_id: number;
  CommodityId: number;
  no_of_bags: number;
  weight: number;
  weightUnit: string;
  deposit_delivery: string;
  in_time: string;
  out_time: string;
  requestDeliveryId?: number; // Add this field
  customer?: { name: string };
  warehouse?: { name: string };
  godown?: { name: string };
  stack?: { name: string };
  remaining_weight?: number;
  remaining_bags?: number;
}

interface RequestDepositorType {
  clientId: number;
  Deposit_date: string;
  warehouseId: number;
  godown_id: number;
  stack_id: number;
  CommodityId: number;
  stock_registr_page_number: number;
  deposit_ledger_page_number: number;
  Description_of_goods: string;
  grade_or_quality: string;
  details_of_number_of_bags_sacks: number;
  any_marks_on_bags_detail: string;
  measurment_or_weight: number;
  market_price: number;
  total_cost_of_goods: number;
  damp_proof: string;
  proof_of_weight: string;
  attachments?: {
    Attachment: File | null;
    damp_proof: File | null;
    proof_of_weight: File | null;
  };
  clientName?: string;
  warehouseName?: string;
  godownName?: string;
  stackName?: string;
  commodityName?: string;
  rent_id?: number;
  weightUnit: string;
  warehouses?: any[];
  godowns?: any[];
  stacks?: any[];
  gatePassDetails?: {
    id: number;
    name: string;
    warehouse: { name: string };
    godown: { name: string };
    stack: { name: string };
    bags: number;
    weight: string;
  }[];
}

interface GatePassFormProps {
  open: boolean;
  isEdit: boolean;
  editGatePassId: number | null;
  gatePasses: any[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  setEditGatePassId: React.Dispatch<React.SetStateAction<number | null>>;
  setDepositorFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedGatePasses: number[];
  setSelectedGatePasses: React.Dispatch<React.SetStateAction<number[]>>;
  fetchGatePass: any;
  isDepositorFormOpen?: boolean;
  newValues?: any;
}

// Constants
const validationSchema = Yup.object({
  clientId: Yup.number()
    .min(1, "Please select a customer")
    .required("Customer is required"),
  mobile_number: Yup.string(),
  name: Yup.string(),
  date: Yup.string().required("Date is required"),
  vehicle_number: Yup.string(),
  warehouseId: Yup.number()
    .min(1, "Please select a warehouse")
    .required("Warehouse is required"),
  godownId: Yup.number()
    .min(1, "Please select a godown")
    .required("Godown is required"),
  stack_id: Yup.number()
    .min(1, "Please select a stack")
    .required("Stack is required"),
  CommodityId: Yup.number()
    .min(1, "Please select a commodity")
    .required("Commodity is required"),
  no_of_bags: Yup.number()
    .min(0, "Number of bags must be non-negative")
    .required("Number of bags is required"),
  weight: Yup.number()
    .min(0, "Weight must be non-negative")
    .required("Weight is required"),
  weightUnit: Yup.string()
    .oneOf(["kg", "tons", "quintals", "liters"], "Invalid weight unit")
    .required("Weight unit is required"),
  deposit_delivery: Yup.string().required("Deposit/Delivery is required"),
  in_time: Yup.string().required("In time is required"),
  out_time: Yup.string(),
});

const DEPOSIT_DELIVERY_OPTIONS = ["deposit", "delivery"];
const WEIGHT_UNIT_OPTIONS = [
  { value: "kg", label: "Kg" },
  { value: "tons", label: "Tons" },
  { value: "quintals", label: "Quintals" },
  { value: "liters", label: "Liters" },
];

// Helper functions
const getCurrentDateTime = () => new Date().toISOString().slice(0, 16);
const getCurrentDate = () => new Date().toISOString().slice(0, 10);

const convertWeightToQuintals = (weight: number, unit: string): number => {
  switch (unit) {
    case "tons":
      return weight * 10;
    case "kg":
      return weight / 100;
    case "liters":
      return weight / 100;
    case "quintals":
    default:
      return weight;
  }
};

// Custom hooks
const useInitialValues = () =>
  useMemo(
    () => ({
      customer: { name: "" },
      warehouse: { name: "" },
      godown: { name: "" },
      stack: { name: "" },
      mobile_number: "",
      clientId: 0,
      name: "",
      date: getCurrentDate(),
      vehicle_number: "",
      warehouseId: 0,
      godownId: 0,
      stack_id: 0,
      CommodityId: 0,
      no_of_bags: 0,
      weight: 0,
      weightUnit: "kg" as const,
      deposit_delivery: "",
      in_time: getCurrentDateTime(),
      out_time: getCurrentDateTime(),
      requestDeliveryId: undefined, // Add this field
    }),
    []
  );

const useGatePassOperations = (
  dispatch: any,
  formik: any,
  setOpen: any,
  setIsEdit: any,
  fetchGatePass: any
) => {
  const handleSubmit = useCallback(
    async (
      values: GatePassType,
      {
        isEdit,
        editGatePassId,
      }: { isEdit: boolean; editGatePassId: number | null }
    ) => {
      try {
        const response: any =
          isEdit && editGatePassId
            ? await updateGatePass(editGatePassId, values)
            : await createGatePass(values);

        if (response.success) {
          if (isEdit) {
            dispatch(setUpdateGatePasss(response.result));
          } else {
            dispatch(setAddGatePasss(response.result));
          }
          toast.success(response.message);
          setOpen(false);
          setIsEdit(false);
          formik.resetForm();

          // Call fetchGatePass to refresh parent component data (e.g., delivery status)
          if (fetchGatePass && typeof fetchGatePass === "function") {
            fetchGatePass();
          }
        }
      } catch (error: any) {
        console.error("Error creating/updating gate pass:", error);
        toast.error(error?.response?.data?.message || "Something went wrong");
      }
    },
    [dispatch, formik, setOpen, setIsEdit, fetchGatePass]
  );

  const handleDelete = useCallback(
    async (id: any) => {
      try {
        const response: any = await deleteGatePass(id);
        if (response.success) {
          dispatch(setDeleteGatePasss(id));
          toast.success(response.message);
          return true;
        }
        return false;
      } catch (error: any) {
        toast.error("Some records are associated with this gate pass");
        return false;
      }
    },
    [dispatch]
  );

  return { handleSubmit, handleDelete };
};

// Main Component
const GatePassForm: React.FC<GatePassFormProps> = ({
  open,
  isEdit,
  editGatePassId,
  gatePasses,
  setOpen,
  setIsEdit,
  setEditGatePassId,
  setDepositorFormOpen,
  selectedGatePasses,
  setSelectedGatePasses,
  isDepositorFormOpen,
  fetchGatePass,
  newValues,
}) => {
  const dispatch = useAppDispatch();
  const stacks = useAppSelector((state: any) => state.stack.value);

  // State
  const [utilizationResult, setUtilizationResult] = useState<null | {
    warehouse: { id: number; name: string };
    godown: { id: number; name: string };
    stack: { id: number; name: string };
    weightUtilization: string;
  }>(null);
  const [utilizationDialogOpen, setUtilizationDialogOpen] = useState(false);
  const [warehouseOptions, setWarehouseOptions] = useState<any[]>([]);
  const [warehousePagination, setWarehousePagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [deleteGatePassId, setDeleteGatePassId] = useState<number | null>(null);
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [customerPagination, setCustomerPagination] = useState({
    page: 1,
    hasMore: true,
  });

  // API hooks
  const [triggerGetCustomers] = useLazyGetCustomersQuery();
  const [triggerFetchWarehouses] = useLazyFetchWarehousesQuery();
  const [triggerFetchGodowns] = useLazyFetchGodownsQuery();
  const { data: commodities } = useGetCommoditiesQuery();

  // Memoized values
  const commodityOptions = useMemo(
    () => commodities?.result || [],
    [commodities]
  );
  const initialValues = useInitialValues();

  // Form setup
  const formik = useFormik<GatePassType>({
    initialValues,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      await handleSubmit(values, { isEdit, editGatePassId });
    },
  });

  const { handleSubmit, handleDelete } = useGatePassOperations(
    dispatch,
    formik,
    setOpen,
    setIsEdit,
    fetchGatePass
  );

  // Conditional data fetching
  const warehouseId = formik.values.warehouseId;
  const { data: godowns, isLoading: isGodownsLoading } = useFetchGodownsQuery(
    { warehouseId, page: 1, limit: 10 },
    { skip: !warehouseId || warehouseId === 0 }
  );

  // Fetch functions
  const fetchWarehouses = useCallback(
    async (page: number, limit: number, search: string, append: boolean) => {
      try {
        const response = await triggerFetchWarehouses({
          page,
          limit,
          search,
        }).unwrap();
        if (response.success) {
          setWarehouseOptions((prev) =>
            append ? [...prev, ...response.result] : response.result
          );
          setWarehousePagination({
            total: response.pagination.total,
            page: response.pagination.page,
            limit: response.pagination.limit,
            totalPages: response.pagination.totalPages,
          });
        }
      } catch (error: any) {
        toast.error(error?.data?.message || "Failed to fetch warehouses");
      }
    },
    [triggerFetchWarehouses]
  );

  const fetchCustomers = useCallback(
    async (page: number, limit: number, search: string, append: boolean) => {
      try {
        const response = await triggerGetCustomers({ page, search }).unwrap();
        const result = response?.result || [];
        const pagination = response?.pagination || { page: 1, totalPages: 1 };

        setCustomerOptions((prev) => (append ? [...prev, ...result] : result));
        setCustomerPagination({
          page,
          hasMore: pagination.page < pagination.totalPages,
        });
      } catch (error) {
        toast.error("Failed to load customers");
      }
    },
    [triggerGetCustomers]
  );

  const fetchStacks = useCallback(
    async (godownId: number) => {
      try {
        const res = await getstackapicall(godownId);
        if (res.success) {
          dispatch(setStack(res.result));
        }
      } catch (error) {
        console.error("Failed to fetch stacks:", error);
        toast.error("Failed to fetch stacks");
      }
    },
    [dispatch]
  );

  // Event handlers
  const handleUtilizationFetch = useCallback(async () => {
    const { no_of_bags, weight, weightUnit } = formik.values;
    if (!no_of_bags || !weight || !weightUnit) {
      toast.error("Please fill Number of Bags, Weight and Weight Unit");
      return;
    }

    try {
      const response = await apiInstance.post("utilization/max", {
        numBags: no_of_bags,
        totalWeight: weight,
        weightUnit: weightUnit,
      });

      const data = response.data;
      setUtilizationResult(data);

      // Update form values
      await formik.setFieldValue("warehouseId", data.warehouse.id);
      await triggerFetchGodowns({
        warehouseId: data.warehouse.id,
        page: 1,
        limit: 10,
      }).unwrap();
      await formik.setFieldValue("godownId", data.godown.id);

      const stackResponse = await getstackapicall(data.godown.id);
      if (stackResponse.success) {
        dispatch(setStack(stackResponse.result));
      }

      await formik.setFieldValue("stack_id", data.stack.id);
      setUtilizationDialogOpen(true);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Error fetching utilization data"
      );
    }
  }, [
    formik.values.no_of_bags,
    formik.values.weight,
    formik.values.weightUnit,
    formik,
    triggerFetchGodowns,
    dispatch,
  ]);

  const handleDialogClose = useCallback(() => {
    setOpen(false);
    setIsEdit(false);
    formik.resetForm();
  }, [formik, setOpen, setIsEdit]);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteGatePassId !== null) {
      const success = await handleDelete(deleteGatePassId);
      if (success) {
        setDeleteDialogOpen(false);
        setDeleteGatePassId(null);
      }
    }
  }, [deleteGatePassId, handleDelete]);

  const getPreFilledDepositorData = useCallback((): RequestDepositorType => {
    const selectedPasses =
      gatePasses?.filter((item: any) => selectedGatePasses.includes(item.id)) ||
      [];

    const defaultData = {
      clientId: 0,
      clientName: "",
      Deposit_date: getCurrentDate(),
      warehouseId: 0,
      warehouseName: "",
      godown_id: 0,
      godownName: "",
      stack_id: 0,
      stackName: "",
      CommodityId: 0,
      commodityName: "",
      stock_registr_page_number: 0,
      deposit_ledger_page_number: 0,
      Description_of_goods: "",
      grade_or_quality: "",
      details_of_number_of_bags_sacks: 0,
      any_marks_on_bags_detail: "",
      measurment_or_weight: 0,
      weightUnit: "quintals" as const,
      market_price: 0,
      total_cost_of_goods: 0,
      damp_proof: "",
      proof_of_weight: "",
      rent_id: 0,
      attachments: {
        Attachment: null,
        damp_proof: null,
        proof_of_weight: null,
      },
      warehouses: [],
      godowns: [],
      stacks: [],
      gatePassDetails: [],
      requestDeliveryId: undefined,
    };

    if (selectedPasses.length === 0) return defaultData;

    const clientId = selectedPasses[0].clientId;
    const CommodityId = selectedPasses[0].CommodityId;

    const isValidSelection = selectedPasses.every(
      (pass: any) =>
        pass.clientId === clientId && pass.CommodityId === CommodityId
    );

    if (!isValidSelection) {
      toast.error(
        "All selected gate passes must have the same customer and commodity."
      );
      return defaultData;
    }

    const totalBags = selectedPasses.reduce(
      (sum: number, pass: GatePassType) => sum + (pass.remaining_bags || 0),
      0
    );
    const totalWeight = selectedPasses.reduce(
      (sum: number, pass: GatePassType) => {
        const weight = parseFloat((pass.remaining_weight || 0).toString());
        return sum + convertWeightToQuintals(weight, pass.weightUnit);
      },
      0
    );

    return {
      ...defaultData,
      clientId,
      clientName: selectedPasses[0]?.customer?.name || "Unknown Customer",
      CommodityId,
      commodityName: selectedPasses[0]?.commodity?.name || "Unknown Commodity",
      warehouseId: selectedPasses[0].warehouseId,
      warehouseName: selectedPasses[0]?.warehouse?.name || "Unknown Warehouse",
      godown_id: selectedPasses[0].godownId,
      godownName: selectedPasses[0]?.godown?.name || "Unknown Godown",
      stack_id: selectedPasses[0].stack_id || 0,
      stackName: selectedPasses[0]?.stack?.name || "Unknown Stack",
      details_of_number_of_bags_sacks: totalBags,
      measurment_or_weight: totalWeight,
      warehouses: Array.from(
        new Set(
          selectedPasses.map((pass: any) => JSON.stringify(pass.warehouse))
        )
      ).map((warehouse: any) => JSON.parse(warehouse)),
      godowns: Array.from(
        new Set(selectedPasses.map((pass: any) => JSON.stringify(pass.godown)))
      ).map((godown: any) => JSON.parse(godown)),
      stacks: Array.from(
        new Set(selectedPasses.map((pass: any) => JSON.stringify(pass.stack)))
      ).map((stack: any) => JSON.parse(stack)),
      gatePassDetails: selectedPasses.map((pass: any) => ({
        id: pass.id,
        name: pass.name,
        warehouse: { name: pass?.warehouse?.name || "Unknown Warehouse" },
        godown: { name: pass?.godown?.name || "Unknown Godown" },
        stack: { name: pass?.stack?.name || "Unknown Stack" },
        bags: pass.remaining_bags,
        weight: `${pass.remaining_weight} ${pass.weightUnit}`,
      })),
    };
  }, [gatePasses, selectedGatePasses]);

  const handleRequestDepositorSuccess = useCallback(() => {
    setSelectedGatePasses([]);
    fetchGatePass();
  }, [setSelectedGatePasses, fetchGatePass]);

  // Effects
  useEffect(() => {
    if (!isEdit && !newValues) {
      formik.setFieldValue("godownId", 0);
    }
  }, [warehouseId, isEdit, newValues]);

  useEffect(() => {
    if (!isEdit && !newValues) {
      formik.setFieldValue("stack_id", 0);
    }
  }, [formik.values.godownId, isEdit, newValues]);

  useEffect(() => {
    const godownId = formik.values.godownId;
    if (godownId !== 0 && !isEdit && !newValues) {
      fetchStacks(godownId);
    }
  }, [formik.values.godownId, isEdit, fetchStacks, newValues]);

  useEffect(() => {
    if (isEdit && editGatePassId) {
      const gatePassToEdit = gatePasses?.find(
        (item: any) => item.id === editGatePassId
      );
      if (gatePassToEdit) {
        formik.setValues({
          clientId: gatePassToEdit.clientId || 0,
          mobile_number: gatePassToEdit.mobile_number || "",
          name: gatePassToEdit.name || "",
          date: gatePassToEdit.date || getCurrentDate(),
          vehicle_number: gatePassToEdit.vehicle_number || "",
          warehouseId: gatePassToEdit.warehouseId || 0,
          godownId: gatePassToEdit.godownId || 0,
          stack_id: gatePassToEdit.stack_id || 0,
          CommodityId: gatePassToEdit.CommodityId || 0,
          no_of_bags: gatePassToEdit.no_of_bags || 0,
          weight: parseFloat(gatePassToEdit.weight) || 0,
          weightUnit: gatePassToEdit.weightUnit || "kg",
          deposit_delivery: gatePassToEdit.deposit_delivery || "",
          in_time: gatePassToEdit.in_time?.slice(0, 16) || getCurrentDateTime(),
          out_time:
            gatePassToEdit.out_time?.slice(0, 16) || getCurrentDateTime(),
          // include requestDeliveryId so it is present in form values and sent on submit
          requestDeliveryId: gatePassToEdit.requestDeliveryId || undefined,
          customer: { name: gatePassToEdit?.customer?.name || "" },
          warehouse: { name: gatePassToEdit?.warehouse?.name || "" },
          godown: { name: gatePassToEdit?.godown?.name || "" },
          stack: { name: gatePassToEdit?.stack?.name || "" },
        });

        // Load warehouse in options if editing and warehouse is set
        if (gatePassToEdit.warehouseId && gatePassToEdit.warehouse) {
          setWarehouseOptions((prev) => {
            const exists = prev.some(
              (w) => w.id === gatePassToEdit.warehouseId
            );
            if (!exists) {
              return [
                {
                  id: gatePassToEdit.warehouseId,
                  name: gatePassToEdit.warehouse.name,
                },
                ...prev,
              ];
            }
            return prev;
          });
        }

        // Load customer in options if editing and customer is set
        if (gatePassToEdit.clientId && gatePassToEdit.customer) {
          setCustomerOptions((prev) => {
            const exists = prev.some((c) => c.id === gatePassToEdit.clientId);
            if (!exists) {
              return [
                {
                  id: gatePassToEdit.clientId,
                  name: gatePassToEdit.customer.name,
                },
                ...prev,
              ];
            }
            return prev;
          });
        }

        // Fetch stacks for the selected godown in edit mode
        if (gatePassToEdit.godownId) {
          fetchStacks(gatePassToEdit.godownId);
        }
      }
    }
  }, [isEdit, editGatePassId, gatePasses]);

  // Render helpers
  const renderFormField = (
    field: string,
    label: string,
    type = "text",
    options?: any
  ) => (
    <FormControl>
      <FormLabel htmlFor={field}>{label}</FormLabel>
      <TextField
        id={field}
        type={type}
        {...formik.getFieldProps(field)}
        placeholder={label}
        fullWidth
        variant="outlined"
        error={formik.touched[field] && !!formik.errors[field]}
        helperText={formik.touched[field] && formik.errors[field]}
        {...options}
      />
    </FormControl>
  );

  const renderSelectField = (
    field: string,
    label: string,
    options: any[],
    disabled = false
  ) => (
    <FormControl error={formik.touched[field] && !!formik.errors[field]}>
      <FormLabel htmlFor={`${field}-label`}>{label}</FormLabel>
      <Select
        labelId={`${field}-label`}
        id={field}
        {...formik.getFieldProps(field)}
        disabled={disabled}
      >
        <MenuItem value={0} disabled>
          Select {label}
        </MenuItem>
        {options.map((option: any) => (
          <MenuItem
            key={option.id || option.value || option.commodity_id}
            value={option.id || option.value || option.commodity_id}
          >
            {option.name || option.label}
          </MenuItem>
        ))}
      </Select>
      {formik.touched[field] && formik.errors[field] && (
        <Typography variant="caption" color="error">
          {formik.errors[field]}
        </Typography>
      )}
    </FormControl>
  );
  useEffect(() => {
    if (newValues) {
      formik.setValues({
        clientId: newValues.clientId || 0,
        mobile_number: "",
        name: "",
        date: getCurrentDate(),
        vehicle_number: "",
        warehouseId: newValues.warehouseId || 0,
        godownId: newValues.godownId || 0,
        stack_id: newValues.stack_id || 0,
        CommodityId: newValues.CommodityId || 0,
        no_of_bags: newValues.no_of_bags || 0,
        weight: parseFloat(newValues.weight) || 0,
        weightUnit: newValues.weightUnit || "kg",
        deposit_delivery: newValues.deposit_delivery || "",
        in_time: newValues.in_time?.slice(0, 16) || getCurrentDateTime(),
        out_time: newValues.out_time?.slice(0, 16) || getCurrentDateTime(),
        customer: { name: newValues?.customer?.name || "" },
        warehouse: { name: newValues?.warehouse?.name || "" },
        godown: { name: newValues?.godown?.name || "" },
        stack: { name: newValues?.stack?.name || "" },
        requestDeliveryId: newValues.requestDeliveryId || undefined,
      });

      // Load warehouse in options if warehouse is set
      if (newValues.warehouseId && newValues.warehouse) {
        setWarehouseOptions((prev) => {
          const exists = prev.some((w) => w.id === newValues.warehouseId);
          if (!exists) {
            return [
              { id: newValues.warehouseId, name: newValues.warehouse.name },
              ...prev,
            ];
          }
          return prev;
        });
      }

      // Load customer in options if customer is set
      if (newValues.clientId && newValues.customer) {
        setCustomerOptions((prev) => {
          const exists = prev.some((c) => c.id === newValues.clientId);
          if (!exists) {
            return [
              { id: newValues.clientId, name: newValues.customer.name },
              ...prev,
            ];
          }
          return prev;
        });
      }

      // Fetch stacks for the selected godown
      if (newValues.godownId) {
        fetchStacks(newValues.godownId);
      }

      console.log("Formik Values:", formik.values);
    }
    //disable all the prefilled values except mobile_number, name, date, vehicle_number
  }, [newValues]);
  return (
    <>
      <Dialog open={open} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? "Edit Gate Pass" : "Add Gate Pass"}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              {/* Customer Field */}
              <Box sx={{ display: "flex", alignItems: "end", gap: 1 }}>
                {(formik.values.clientId && isEdit) || newValues ? (
                  <FormControl fullWidth>
                    <FormLabel htmlFor="clientId">Customer</FormLabel>
                    <TextField
                      id="clientId"
                      value={formik.values.customer?.name || ""}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                  </FormControl>
                ) : (
                  <>
                    <InfiniteScrollAutocomplete
                      id="clientId"
                      label="Customer"
                      placeholder="Select Customer"
                      options={customerOptions}
                      getOptionLabel={(option) => option?.name || ""}
                      fetchData={fetchCustomers}
                      formikField="clientId"
                      formik={formik}
                      disabled={false}
                      setOptions={setCustomerOptions}
                      setPagination={setCustomerPagination}
                      pagination={customerPagination}
                    />
                    <IconButton
                      color="primary"
                      onClick={() => setCustomerDialogOpen(true)}
                      sx={{ width: "9%" }}
                    >
                      <Add />
                    </IconButton>
                  </>
                )}
              </Box>

              {/* Basic Fields */}
              {renderFormField("name", "Driver Name")}
              {renderFormField("mobile_number", "Driver Mobile Number")}
              {renderFormField("date", "Date", "date")}
              {renderFormField("vehicle_number", "Vehicle Number")}

              {/* Commodity Field */}
              {renderSelectField(
                "CommodityId",
                "Commodity",
                commodityOptions.map((c: any) => ({
                  id: c.commodity_id,
                  name: c.name,
                }))
              )}

              {/* Bags and Weight */}
              {renderFormField("no_of_bags", "Number of Bags", "number")}

              <Box sx={{ display: "flex", alignItems: "end", gap: 1 }}>
                {renderFormField("weight", "Weight", "number")}
                <FormControl fullWidth>
                  <FormLabel htmlFor="weightUnit">Weight Unit</FormLabel>
                  <TextField
                    id="weightUnit"
                    {...formik.getFieldProps("weightUnit")}
                    select
                    variant="outlined"
                    error={
                      formik.touched.weightUnit && !!formik.errors.weightUnit
                    }
                    helperText={
                      formik.touched.weightUnit && formik.errors.weightUnit
                    }
                  >
                    {WEIGHT_UNIT_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Box>

              {/* Warehouse Field */}
              <Box sx={{ display: "flex", alignItems: "end", gap: 1 }}>
                {/* {(formik.values.warehouseId && isEdit ) || newValues? (
                  <FormControl fullWidth>
                    <FormLabel htmlFor="warehouseId">Warehouse</FormLabel>
                    <TextField
                      id="warehouseId"
                      value={formik.values.warehouse?.name || ''}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                  </FormControl>
                ) : (
                  <>
                    <InfiniteScrollAutocomplete
                      id="warehouseId"
                      label="Warehouse"
                      placeholder="Select Warehouse"
                      options={warehouseOptions}
                      getOptionLabel={(option: any) => option.name || ''}
                      fetchData={fetchWarehouses}
                      formikField="warehouseId"
                      formik={formik}
                      dependentFieldReset={[{ field: 'godownId', value: 0 }]}
                      setOptions={setWarehouseOptions}
                      setPagination={setWarehousePagination}
                      pagination={warehousePagination}
                    />
                    
                  </>
                )} */}
                <>
                  <InfiniteScrollAutocomplete
                    id="warehouseId"
                    label="Warehouse"
                    placeholder="Select Warehouse"
                    options={warehouseOptions}
                    getOptionLabel={(option: any) => option.name || ""}
                    fetchData={fetchWarehouses}
                    formikField="warehouseId"
                    formik={formik}
                    dependentFieldReset={[{ field: "godownId", value: 0 }]}
                    setOptions={setWarehouseOptions}
                    setPagination={setWarehousePagination}
                    pagination={warehousePagination}
                  />
                </>
                <IconButton
                  color="primary"
                  onClick={handleUtilizationFetch}
                  sx={{ width: "9%" }}
                  title="Get Best Fit Stack"
                >
                  <InfoOutlined />
                </IconButton>
              </Box>

              {/* Godown Field */}
              {/* {(formik.values.godownId && isEdit ) || newValues ? (
                <FormControl fullWidth>
                  <FormLabel htmlFor="godownId">Godown</FormLabel>
                  <TextField
                    id="godownId"
                    value={formik.values.godown?.name || ''}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </FormControl>
              ) : (
                renderSelectField('godownId', 'Godown', godowns?.result || [], !formik.values.warehouseId)
              )} */}
              {renderSelectField(
                "godownId",
                "Godown",
                godowns?.result || [],
                !formik.values.warehouseId
              )}
              {/* Stack Field */}
              {/* {(formik.values.stack_id && isEdit) || newValues ? (
                <FormControl fullWidth>
                  <FormLabel htmlFor="stack_id">Stack</FormLabel>
                  <TextField
                    id="stack_id"
                    value={formik.values.stack?.name || ''}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </FormControl>
              ) : (
                renderSelectField('stack_id', 'Stack', stacks || [], !formik.values.godownId)
              )} */}
              {renderSelectField(
                "stack_id",
                "Stack",
                stacks || [],
                !formik.values.godownId
              )}
              {/* Deposit/Delivery Field */}
              <FormControl
                error={
                  formik.touched.deposit_delivery &&
                  !!formik.errors.deposit_delivery
                }
              >
                <FormLabel htmlFor="deposit-delivery-label">
                  Deposit/Delivery
                </FormLabel>
                <Select
                  labelId="deposit-delivery-label"
                  id="deposit_delivery"
                  {...formik.getFieldProps("deposit_delivery")}
                >
                  <MenuItem value="" disabled>
                    Select Deposit/Delivery
                  </MenuItem>
                  {DEPOSIT_DELIVERY_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.deposit_delivery &&
                  formik.errors.deposit_delivery && (
                    <Typography variant="caption" color="error">
                      {formik.errors.deposit_delivery}
                    </Typography>
                  )}
              </FormControl>

              {/* Time Fields */}
              {renderFormField("in_time", "In Time", "datetime-local")}
              {renderFormField("out_time", "Out Time", "datetime-local")}
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={formik.isSubmitting}
              sx={{ textTransform: "none" }}
            >
              {isEdit ? "Update" : "Submit"}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDialogClose}
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Utilization Dialog */}
      <Dialog
        open={utilizationDialogOpen}
        onClose={() => setUtilizationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 2 } }}
      >
        <DialogTitle
          sx={{ fontWeight: "bold", fontSize: "1.3rem", color: "#4a4a4a" }}
        >
          Best Fit Stack Found
        </DialogTitle>
        <DialogContent dividers>
          {utilizationResult && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <WarehouseIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Warehouse
                  </Typography>
                  <Typography variant="body1">
                    {utilizationResult.warehouse.name} (ID:{" "}
                    {utilizationResult.warehouse.id})
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box display="flex" alignItems="center" gap={1}>
                <StoreIcon sx={{ color: "#00A676" }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Godown
                  </Typography>
                  <Typography variant="body1">
                    {utilizationResult.godown.name} (ID:{" "}
                    {utilizationResult.godown.id})
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box display="flex" alignItems="center" gap={1}>
                <LayersIcon sx={{ color: "#DB4437" }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Stack
                  </Typography>
                  <Typography variant="body1">
                    {utilizationResult.stack.name} (ID:{" "}
                    {utilizationResult.stack.id})
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box display="flex" alignItems="center" gap={1}>
                <SpeedIcon color="action" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Utilization
                  </Typography>
                  <Chip
                    label={utilizationResult.weightUtilization}
                    color={
                      parseFloat(utilizationResult.weightUtilization) >= 90
                        ? "success"
                        : parseFloat(utilizationResult.weightUtilization) >= 60
                        ? "warning"
                        : "error"
                    }
                    variant="outlined"
                    sx={{ fontWeight: "bold" }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "flex-end", pr: 3 }}>
          <Button
            variant="contained"
            onClick={() => setUtilizationDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Modal */}
      {isCustomerDialogOpen && (
        <CustomerModal
          open={isCustomerDialogOpen}
          onClose={() => setCustomerDialogOpen(false)}
          onSuccess={(newCustomerId) => {
            fetchCustomers(1, 10, "", false);
            if (newCustomerId) {
              formik.setFieldValue("clientId", newCustomerId);
            }
            setCustomerDialogOpen(false);
          }}
        />
      )}

      {/* Request Depositor Form */}
      {isDepositorFormOpen && (
        <RequestDepositorForm
          open={isDepositorFormOpen}
          onClose={() => setDepositorFormOpen(false)}
          isEdit={false}
          initialValues={getPreFilledDepositorData()}
          selectedGatePassIds={selectedGatePasses}
          onSuccess={handleRequestDepositorSuccess}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteGatePassId(null);
        }}
        onConfirm={handleDeleteConfirm}
        variant="delete"
        title="Delete Gate Pass"
        message="Are you sure you want to delete this Gate Pass? This action cannot be undone."
      />
    </>
  );
};

export default GatePassForm;
