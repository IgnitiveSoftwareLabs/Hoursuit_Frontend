import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  Add,
  Assessment,
  Cancel,
  CheckCircleOutline,
  Delete,
  Edit,
  RemoveCircleOutline,
  ReceiptLong,
} from "@mui/icons-material";
import Grid from "@mui/material/Grid";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from "@mui/material";

const createDefaultLineItem = () => ({
  purchaseOrderLineId: "",
  itemId: "",
  orderedQty: 0,
  receivedQty: 0,
  acceptedQty: 0,
  rejectedQty: 0,
  batchNo: "",
  serialNo: "",
  manufacturingDate: "",
  expiryDate: "",
  qcRequired: false,
  status: "PENDING",
  remarks: "",
});

import { useGetTransportationModesQuery } from "../RTK/services/transportationModeApi";
import { useFetchWarehousesQuery } from "../RTK/services/warehouseApi";
import { useFetchGodownsQuery } from "../RTK/services/godownApi";
import { useFetchStacksQuery } from "../RTK/services/stackApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import { usePermissions } from "../Hooks/usePermissions";
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
import {
  useGetPurchaseOrdersQuery,
  useGetGRNsQuery,
  useCreateGRNMutation,
  useDeleteGRNMutation,
  useUpdateGRNMutation,
  useUpdateGRNStatusMutation,
} from "../RTK/services/purchaseApi";
import { useGetJournalEntryByIdQuery } from "../RTK/services/journalEntryApi";
import DynamicTable from './Tables';

const GRNComp: React.FC = () => {
  const navigate = useNavigate();
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const [isEdit, setIsEdit] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [grnToDelete, setGrnToDelete] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<"lineItems" | "transport">("lineItems");

  const [selectedGrnForGl, setSelectedGrnForGl] = useState<any>(null);
  const [glImpactOpen, setGlImpactOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [grnToCancel, setGrnToCancel] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [hasOpenedForm, setHasOpenedForm] = useState(false);

  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery(
    { page: 1, limit: 50 },
    { skip: !hasOpenedForm }
  );
  const { data: warehousesData } = useFetchWarehousesQuery(
    { page: 1, limit: 100 },
    { skip: !hasOpenedForm }
  );
  const { data: transportationModeData } = useGetTransportationModesQuery(
    undefined,
    { skip: !hasOpenedForm }
  );
  const { data: itemsData } = useGetItemsQuery(
    { page: 1, limit: 100 },
    { skip: !hasOpenedForm }
  );
  const { data: grnsData, refetch: refetchGRNs } = useGetGRNsQuery({ page: 1, limit: 10 });

  const {
    data: journalEntriesData,
    isLoading: isJournalLoading,
    error: journalError,
    refetch: refetchJournalEntries,
  } = useGetJournalEntryByIdQuery(
    {
      id: selectedGrnForGl?.id as number,
      source: "GRN",
    },
    {
      skip: !selectedGrnForGl?.id,
    }
  );

  useEffect(() => {
    if (glImpactOpen && selectedGrnForGl?.id && typeof refetchJournalEntries === "function") {
      refetchJournalEntries().catch(() => {});
    }
  }, [glImpactOpen, selectedGrnForGl?.id, refetchJournalEntries]);

  const purchaseOrders = useMemo(
    () => (Array.isArray(purchaseOrdersData) ? purchaseOrdersData : purchaseOrdersData?.result ?? []),
    [purchaseOrdersData]
  );
  const transportationModes = Array.isArray(transportationModeData)
    ? transportationModeData
    : transportationModeData?.result ?? [];
  const warehouses = Array.isArray(warehousesData) ? warehousesData : warehousesData?.result ?? [];
  const items = Array.isArray(itemsData) ? itemsData : itemsData?.result ?? [];
  const grns = Array.isArray(grnsData) ? grnsData : grnsData?.result ?? [];
  const journalHeader = journalEntriesData?.result;

  const journalEntries = journalHeader?.lines ?? [];

  const [createGRN] = useCreateGRNMutation();
  const [updateGRN] = useUpdateGRNMutation();
  const [updateGRNStatus] = useUpdateGRNStatusMutation();
  const [deleteGRN] = useDeleteGRNMutation();

  const getPoLineItems = (record: any) => {
    const candidates = [
      record?.lineItems,
      record?.line_items,
      record?.purchaseOrderLines,
      record?.purchase_order_lines,
      record?.purchaseOrderLineItems,
      record?.purchase_order_line_items,
      record?.details,
      record?.data?.lineItems,
      record?.data?.purchaseOrderLines,
      record?.data?.purchase_order_lines,
      record?.header?.lineItems,
      record?.header?.purchaseOrderLines,
      record?.header?.purchase_order_lines,
    ];

    const matchedArray = candidates.find((value) => Array.isArray(value));
    return matchedArray ?? [];
  };

  const mapPoLineToGrnLine = (line: any) => ({
    purchaseOrderLineId: line?.purchaseOrderLineId ?? line?.purchase_order_line_id ?? line?.poLineId ?? line?.id ?? line?.lineId ?? "",
    itemId: line?.itemId ?? line?.item_id ?? line?.item?.id ?? line?.item?.item_id ?? "",
    orderedQty: Number(line?.orderedQty ?? line?.ordered_quantity ?? line?.quantity ?? line?.qty ?? line?.ordered_qty ?? 0),
    receivedQty: 0,
    acceptedQty: 0,
    rejectedQty: 0,
    batchNo: line?.batchNo ?? line?.batch_no ?? "",
    serialNo: line?.serialNo ?? line?.serial_no ?? "",
    manufacturingDate: line?.manufacturingDate ?? line?.manufacturing_date ?? "",
    expiryDate: line?.expiryDate ?? line?.expiry_date ?? "",
    qcRequired: line?.qcRequired ?? line?.qc_required ?? false,
    status: line?.status ?? "PENDING",
    remarks: line?.remarks ?? "",
  });

  const handleStatusChange = async (id: number | string, newStatus: string) => {
    try {
      await updateGRNStatus({ id, body: { status: newStatus } }).unwrap();
      toast.success(`GRN status updated to ${newStatus}`);
      refetchGRNs();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update GRN status");
    }
  };

  const handleGrnCancelRequest = (grn: any) => {
    setGrnToCancel(grn);
    setConfirmCancelOpen(true);
  };

  const handleConfirmCancelGrn = async () => {
    if (!grnToCancel) return;
    await handleStatusChange(grnToCancel.id, "CANCELLED");
    setConfirmCancelOpen(false);
    setGrnToCancel(null);
  };

  const formik = useFormik({
    initialValues: {
      header: {
        grnNo: "",
        purchaseOrderId: "",
        warehouseId: "",
        godownId: "",
        stackId: "",
        grnDate: new Date().toISOString().split("T")[0],
        transportation_mode_id: "",
        transporterName: "",
        driverName: "",
        driverPhone: "",
        vehicleNo: "",
        status: "DRAFT",
        remarks: "",
      },
      lineItems: [
        {
          purchaseOrderLineId: "",
          itemId: "",
          orderedQty: 0,
          receivedQty: 0,
          acceptedQty: 0,
          rejectedQty: 0,
          batchNo: "",
          serialNo: "",
          manufacturingDate: "",
          expiryDate: "",
          qcRequired: false,
          status: "PENDING",
          remarks: "",
        },
      ],
    },
    validationSchema: Yup.object({
      header: Yup.object({
        grnNo: Yup.string().nullable(),
        grnDate: Yup.date().required("GRN Date is required"),
        warehouseId: Yup.string().required("Warehouse is required"),
      }),
      lineItems: Yup.array()
        .of(
          Yup.object({
            itemId: Yup.string().required("Item is required"),
            orderedQty: Yup.number().min(0.01, "Ordered qty must be > 0").required("Ordered qty is required"),
            receivedQty: Yup.number().min(0, "Received qty must be >= 0"),
            acceptedQty: Yup.number().min(0, "Accepted qty must be >= 0"),
            rejectedQty: Yup.number().min(0, "Rejected qty must be >= 0"),
          })
        )
        .min(1, "At least one line item is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          header: values.header,
          lineItems: values.lineItems,
        };

        if (isEdit && editId) {
          await updateGRN({ id: editId, body: payload }).unwrap();
          toast.success("GRN updated successfully");
        } else {
          await createGRN(payload).unwrap();
          toast.success("GRN created successfully");
        }

        setOpen(false);
        setIsEdit(false);
        setEditId(null);
        formik.resetForm();
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong");
      }
    },
  });

  const selectedWarehouseId = formik.values.header.warehouseId;
  const { data: godownsData } = useFetchGodownsQuery(
    { warehouseId: Number(selectedWarehouseId), page: 1, limit: 50 },
    { skip: !selectedWarehouseId }
  );

  const selectedGodownId = formik.values.header.godownId;
  const { data: stacksData } = useFetchStacksQuery(
    { godownId: Number(selectedGodownId), page: 1, limit: 50 },
    { skip: !selectedGodownId }
  );

  const godowns = Array.isArray(godownsData) ? godownsData : godownsData?.result ?? [];
  const stacks = Array.isArray(stacksData) ? stacksData : stacksData?.result ?? [];

  useEffect(() => {
    const selectedPoId = formik.values.header.purchaseOrderId;
    const selectedPo = purchaseOrders.find((po: any) => String(po.id) === String(selectedPoId));

    if (!selectedPoId || !selectedPo || isEdit) {
      return;
    }

    const poLineItems = getPoLineItems(selectedPo);
    const mappedLineItems = Array.isArray(poLineItems)
      ? poLineItems.map(mapPoLineToGrnLine)
      : [];

    formik.setValues({
      header: {
        ...formik.values.header,
        warehouseId: selectedPo.warehouse_id ?? selectedPo.warehouseId ?? selectedPo.header?.warehouse_id ?? selectedPo.header?.warehouseId ?? "",
        godownId: selectedPo.godown_id ?? selectedPo.godownId ?? selectedPo.header?.godown_id ?? selectedPo.header?.godownId ?? "",
        stackId: selectedPo.stack_id ?? selectedPo.stackId ?? selectedPo.header?.stack_id ?? selectedPo.header?.stackId ?? "",
        transportation_mode_id: selectedPo.transportation_mode_id ?? selectedPo.header?.transportation_mode_id ?? "",
        transporterName: selectedPo.transporterName ?? selectedPo.transporter_name ?? selectedPo.header?.transporterName ?? selectedPo.header?.transporter_name ?? "",
        driverName: selectedPo.driverName ?? selectedPo.driver_name ?? selectedPo.header?.driverName ?? selectedPo.header?.driver_name ?? "",
        driverPhone: selectedPo.driverPhone ?? selectedPo.driver_phone ?? selectedPo.header?.driverPhone ?? selectedPo.header?.driver_phone ?? "",
        vehicleNo: selectedPo.vehicleNumber ?? selectedPo.vehicle_number ?? selectedPo.header?.vehicleNumber ?? selectedPo.header?.vehicle_number ?? formik.values.header.vehicleNo,
      },
      lineItems: mappedLineItems.length ? mappedLineItems : [createDefaultLineItem()],
    });
    setActiveSection("lineItems");
  }, [formik.values.header.purchaseOrderId, purchaseOrders, isEdit]);

  const updateLineItemField = (index: number, field: string, value: any) => {
    const lineItems = [...formik.values.lineItems];
    let finalValue = value;

    if (["receivedQty", "acceptedQty", "rejectedQty"].includes(field)) {
      const numVal = Number(value || 0);
      const ordered = Number(lineItems[index]?.orderedQty || 0);
      if (numVal > ordered && ordered > 0) {
        const fieldLabel =
          field === "receivedQty"
            ? "Received"
            : field === "acceptedQty"
              ? "Accepted"
              : "Rejected";
        toast.error(
          `${fieldLabel} quantity cannot be greater than ordered quantity (${ordered})!`,
          { id: `qty-warning-${index}-${field}` }
        );
        finalValue = ordered;
      }
    }

    lineItems[index] = { ...lineItems[index], [field]: finalValue };
    formik.setFieldValue("lineItems", lineItems);
  };

  const handleAddLineItem = () => {
    formik.setFieldValue("lineItems", [
      ...formik.values.lineItems,
      {
        purchaseOrderLineId: "",
        itemId: "",
        orderedQty: 0,
        receivedQty: 0,
        acceptedQty: 0,
        rejectedQty: 0,
        // warehouseId: "",
        // godownId: "",
        // stackId: "",
        batchNo: "",
        serialNo: "",
        manufacturingDate: "",
        expiryDate: "",
        qcRequired: true,
        status: "PENDING",
        remarks: "",
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    const newLineItems = [...formik.values.lineItems];
    newLineItems.splice(index, 1);
    formik.setFieldValue("lineItems", newLineItems);
  };

  const handleEdit = (record: any) => {
    if (!canUpdate("grn")) {
      toast.error("No permission to edit GRN");
      return;
    }

    const header = record?.header ?? record;
    const initialPoId = header?.purchaseOrderId ?? header?.purchase_order_id ?? record?.purchaseOrderId ?? record?.purchase_order_id ?? "";

    setIsEdit(true);
    setEditId(record?.id ?? null);
    setSelectedGrnForGl(record);
    setHasOpenedForm(true);

    const lineSource = record?.lineItems ?? record?.line_items ?? [];

    formik.setValues({
      header: {
        grnNo: header?.grnNo ?? header?.grn_no ?? "",
        purchaseOrderId: header?.purchaseOrderId ?? header?.purchase_order_id ?? "",
        warehouseId: header?.warehouseId ?? header?.warehouse_id ?? "",
        godownId: header?.godownId ?? header?.godown_id ?? "",
        stackId: header?.stackId ?? header?.stack_id ?? "",
        grnDate: header?.grnDate ?? header?.grn_date ? String(header?.grnDate ?? header?.grn_date).slice(0, 10) : new Date().toISOString().split("T")[0],
        transportation_mode_id: header?.transportation_mode_id ?? "",
        transporterName: header?.transporterName ?? header?.transporter_name ?? "",
        driverName: header?.driverName ?? header?.driver_name ?? "",
        driverPhone: header?.driverPhone ?? header?.driver_phone ?? "",
        vehicleNo: header?.vehicleNo ?? header?.vehicle_number ?? "",
        status: header?.status ?? "DRAFT",
        remarks: header?.remarks ?? "",
      },
      lineItems: Array.isArray(lineSource) && lineSource.length
        ? lineSource.map((line: any) => ({
          purchaseOrderLineId: line?.purchaseOrderLineId ?? line?.purchase_order_line_id ?? "",
          itemId: line?.itemId ?? line?.item_id ?? "",
          orderedQty: Number(line?.orderedQty ?? line?.ordered_qty ?? 0),
          receivedQty: Number(line?.receivedQty ?? line?.received_qty ?? 0),
          acceptedQty: Number(line?.acceptedQty ?? line?.accepted_qty ?? 0),
          rejectedQty: Number(line?.rejectedQty ?? line?.rejected_qty ?? 0),
          batchNo: line?.batchNo ?? line?.batch_no ?? "",
          serialNo: line?.serialNo ?? line?.serial_no ?? "",
          manufacturingDate: line?.manufacturingDate ?? line?.manufacturing_date ?? "",
          expiryDate: line?.expiryDate ?? line?.expiry_date ?? "",
          qcRequired: line?.qcRequired ?? false,
          status: line?.status ?? "PENDING",
          remarks: line?.remarks ?? "",
        }))
        : [createDefaultLineItem()],
    });

    setOpen(true);
  };

  const handleDeleteRequest = (record: any) => {
    if (!canDelete("grn")) {
      toast.error("No permission to delete GRN");
      return;
    }
    setGrnToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!grnToDelete?.id) {
      setDeleteDialogOpen(false);
      setGrnToDelete(null);
      return;
    }

    try {
      await deleteGRN(grnToDelete.id).unwrap();
      toast.success("GRN deleted successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete GRN");
    } finally {
      setDeleteDialogOpen(false);
      setGrnToDelete(null);
    }
  };

  const columns = [
    {
      key: "grnNo",
      label: "GRN No",
      render: (row: any) => (
        <Button
          size="small"
          variant="text"
          onClick={() => {
            setSelectedGrnForGl(row);
            setViewOpen(true);
          }}
        >
          {row.grnNo || row.grn_number || `#${row.id}`}
        </Button>
      ),
    },
    { key: "purchaseOrder", label: "Purchase Order", render: (row: any) => row.purchaseOrder?.purchaseNo || row.purchase_order?.purchaseNo || (row.purchaseOrderId ? `#${row.purchaseOrderId}` : "N/A") },
    { key: "warehouse", label: "Warehouse", render: (row: any) => row.warehouse?.name || (row.warehouseId ? `ID: ${row.warehouseId}` : "N/A") },
    {
      key: "grnDate",
      label: "GRN Date",
      render: (row: any) => (row.grnDate ? new Date(row.grnDate).toLocaleDateString() : ""),
    },
    {
      key: "status",
      label: "Status",
      render: (row: any) => {
        let bg = "#f5f5f5";
        let color = "#616161";
        const status = row.status || "DRAFT";
        if (status === "APPROVED" || status === "RECEIVED") { bg = "#e8f5e9"; color = "#2e7d32"; }
        else if (status === "CANCELLED") { bg = "#ffebee"; color = "#c62828"; }
        else if (status === "PENDING" || status === "DRAFT") { bg = "#fff8e1"; color = "#f57f17"; }

        return (
          <Box
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: bg,
              color: color,
              fontSize: "0.75rem",
              fontWeight: "bold",
              textAlign: "center"
            }}
          >
            {status}
          </Box>
        );
      }
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: any) => {
        const isDraft = String(row.status || "DRAFT").toUpperCase() === "DRAFT";
        const isApproved = row.status === "APPROVED" || row.status === "RECEIVED" || row.status === "COMPLETED";

        return (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {isApproved && (
              <>
                <IconButton
                  size="small"
                  color="secondary"
                  onClick={() => navigate("/purchase-invoice")}
                  aria-label="View Purchase Invoice"
                  title="Go to Purchase Invoice"
                >
                  <ReceiptLong />
                </IconButton>

                <IconButton
                  size="small"
                  color="info"
                  onClick={() => {
                    setSelectedGrnForGl(row);
                    setGlImpactOpen(true);
                  }}
                  aria-label="GL impact"
                >
                  <Assessment />
                </IconButton>
              </>
            )}

            {canUpdate("grn") && (
              <IconButton
                size="small"
                color="primary"
                disabled={!isDraft}
                onClick={() => {
                  if (!isDraft) {
                    toast.error("Only DRAFT GRNs can be updated.");
                    return;
                  }
                  handleEdit(row);
                }}
                aria-label="Edit GRN"
              >
                <Edit />
              </IconButton>
            )}

            {canDelete("grn") && (
              <IconButton
                size="small"
                color="error"
                disabled={!isDraft}
                onClick={() => {
                  if (!isDraft) {
                    toast.error("Only DRAFT GRNs can be deleted.");
                    return;
                  }
                  handleDeleteRequest(row);
                }}
                aria-label="Delete GRN"
              >
                <Delete />
              </IconButton>
            )}

            <IconButton
              size="small"
              color="warning"
              disabled={!isDraft}
              onClick={() => {
                if (!isDraft) {
                  toast.error("Only DRAFT GRNs can be cancelled.");
                  return;
                }
                handleGrnCancelRequest(row);
              }}
              aria-label="Cancel GRN"
            >
              <Cancel />
            </IconButton>
          </Box>
        );
      }
    }
  ];

  if (!canRead("grn")) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view GRNs.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h3">GRN</Typography>
          <NavbarBreadcrumbs />
        </Box>
        {canCreate("grn") && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setHasOpenedForm(true);
              setOpen(true);
              setSelectedGrnForGl(null);
              setIsEdit(false);
              setEditId(null);
              formik.resetForm();
            }}
          >
            Add GRN
          </Button>
        )}
      </Box>

      <DynamicTable columns={columns} data={grns} getRowId={(row: any) => row.id} />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this GRN?</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* View GRN Dialog (read-only) */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>View GRN - {selectedGrnForGl?.grnNo || selectedGrnForGl?.id}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2">GRN Number</Typography>
                <Typography>{selectedGrnForGl?.grnNo || selectedGrnForGl?.grn_number || `#${selectedGrnForGl?.id}`}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2">Purchase Order</Typography>
                <Typography>{selectedGrnForGl?.purchaseOrder?.purchaseNo || selectedGrnForGl?.purchase_order?.purchaseNo || selectedGrnForGl?.purchaseOrderId}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2">GRN Date</Typography>
                <Typography>{selectedGrnForGl?.grnDate ? new Date(selectedGrnForGl.grnDate).toLocaleDateString() : ""}</Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Line Items</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell>PO Line</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Ordered</TableCell>
                    <TableCell align="right">Received</TableCell>
                    <TableCell align="right">Accepted</TableCell>
                    <TableCell align="right">Rejected</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedGrnForGl?.lineItems && selectedGrnForGl.lineItems.length ? (
                    selectedGrnForGl.lineItems.map((li: any) => (
                      <TableRow key={li.id || li.purchaseOrderLineId}>
                        <TableCell>{li.purchaseOrderLineId || li.poLineId || "-"}</TableCell>
                        <TableCell>{li.item?.item_name || li.itemName || li.itemId || "-"}</TableCell>
                        <TableCell align="right">{Number(li.orderedQty ?? li.quantity ?? 0).toLocaleString()}</TableCell>
                        <TableCell align="right">{Number(li.receivedQty ?? li.received_qty ?? 0).toLocaleString()}</TableCell>
                        <TableCell align="right">{Number(li.acceptedQty ?? li.accepted_qty ?? 0).toLocaleString()}</TableCell>
                        <TableCell align="right">{Number(li.rejectedQty ?? li.rejected_qty ?? 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No line items available.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">GL Impact</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell align="right">Debit (DR)</TableCell>
                    <TableCell align="right">Credit (CR)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isJournalLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">Loading GL entries...</TableCell>
                    </TableRow>
                  ) : journalEntries.length ? (
                    journalEntries.map((entry: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{entry?.account?.account_name || entry?.account_name || entry?.accountId || `Acct ${idx + 1}`}</TableCell>
                        <TableCell align="right" sx={{ color: Number(entry?.debit_amount ?? entry?.dr ?? 0) > 0 ? "success.main" : "text.secondary", fontWeight: Number(entry?.debit_amount ?? entry?.dr ?? 0) > 0 ? 600 : 400 }}>
                          {Number(entry?.debit_amount ?? entry?.dr ?? 0) > 0
                            ? `₹${Number(entry?.debit_amount ?? entry?.dr ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "-"}
                        </TableCell>
                        <TableCell align="right" sx={{ color: Number(entry?.credit_amount ?? entry?.cr ?? 0) > 0 ? "error.main" : "text.secondary", fontWeight: Number(entry?.credit_amount ?? entry?.cr ?? 0) > 0 ? 600 : 400 }}>
                          {Number(entry?.credit_amount ?? entry?.cr ?? 0) > 0
                            ? `₹${Number(entry?.credit_amount ?? entry?.cr ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">No GL postings found for this GRN.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={() => setViewOpen(false)}>Close</Button>
            <Button variant="contained" onClick={() => { setViewOpen(false); setOpen(true); formik.setValues({ ...formik.values, header: { ...formik.values.header } }); }}>Open Editor</Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* GL Impact View Dialog */}
      <Dialog open={glImpactOpen} onClose={() => setGlImpactOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>GL Journal Posting Impact - GRN #{selectedGrnForGl?.grnNo || selectedGrnForGl?.id}</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" mb={2}>
              Accrued Financial Ledger Impact generated upon goods receipt approval:
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell>Narration</TableCell>
                    <TableCell align="right">Debit (DR)</TableCell>
                    <TableCell align="right">Credit (CR)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isJournalLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Loading GL entries...
                      </TableCell>
                    </TableRow>
                  ) : journalEntries.length > 0 ? (
                    <>
                      {journalEntries.map((line: any) => {
                        const debit = parseFloat(line.debit_amount || 0);
                        const credit = parseFloat(line.credit_amount || 0);

                        return (
                          <TableRow key={line.id}>
                            <TableCell>
                              {line.account?.account_number ? `${line.account.account_number} - ` : ""}
                              {line.account?.account_name || line.account_name || `Account #${line.account_id}`}
                            </TableCell>

                            <TableCell>
                              {line.narration || line.description || journalHeader?.narration || "-"}
                            </TableCell>

                            <TableCell align="right" sx={{ color: debit > 0 ? "success.main" : "text.secondary", fontWeight: debit > 0 ? 600 : 400 }}>
                              {debit > 0
                                ? `₹${debit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "-"}
                            </TableCell>

                            <TableCell align="right" sx={{ color: credit > 0 ? "error.main" : "text.secondary", fontWeight: credit > 0 ? 600 : 400 }}>
                              {credit > 0
                                ? `₹${credit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      <TableRow sx={{ bgcolor: "grey.100" }}>
                        <TableCell colSpan={2} align="right">
                          <strong>Total</strong>
                        </TableCell>

                        <TableCell align="right" sx={{ color: "success.main" }}>
                          <strong>
                            ₹{Number(journalHeader?.total_debit ?? journalEntries.reduce((sum: number, l: any) => sum + Number(l.debit_amount || 0), 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </TableCell>

                        <TableCell align="right" sx={{ color: "error.main" }}>
                          <strong>
                            ₹{Number(journalHeader?.total_credit ?? journalEntries.reduce((sum: number, l: any) => sum + Number(l.credit_amount || 0), 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        {journalError
                          ? "Unable to load GL entries."
                          : "No GL postings found for this GRN."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmCancelOpen} onClose={() => setConfirmCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Cancel GRN</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel GRN #{grnToCancel?.grnNo || grnToCancel?.id}? This will prevent any further receipt or inventory posting.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={() => setConfirmCancelOpen(false)}>
              No
            </Button>
            <Button variant="contained" color="error" onClick={handleConfirmCancelGrn}>
              Yes, Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>{isEdit ? "Edit GRN" : "Create GRN"}</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Purchase Order</FormLabel>
                  <Select
                    size="small"
                    name="header.purchaseOrderId"
                    value={formik.values.header.purchaseOrderId}
                    onChange={formik.handleChange}
                    displayEmpty
                    disabled={isEdit}
                  >
                    <MenuItem value="">Select Purchase Order</MenuItem>
                    {purchaseOrders?.map((po: any) => (
                      <MenuItem key={po?.id} value={po?.id}>
                        {po?.purchaseNo || `#${po?.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={formik.touched.header?.grnDate && !!formik.errors.header?.grnDate}>
                  <FormLabel>GRN Date</FormLabel>
                  <TextField
                    size="small"
                    type="date"
                    name="header.grnDate"
                    value={formik.values.header.grnDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    InputLabelProps={{ shrink: true }}
                    error={formik.touched.header?.grnDate && !!formik.errors.header?.grnDate}
                    helperText={formik.touched.header?.grnDate && (formik.errors.header as any)?.grnDate}
                  />
                </FormControl>
              </Grid>

              {/* PO Read-Only Reference Details */}
              {(() => {
                const selectedPo = purchaseOrders.find(
                  (po: any) => String(po.id) === String(formik.values.header.purchaseOrderId)
                );
                if (!selectedPo) return null;
                const vendorName =
                  selectedPo.vendor?.vendor_name || selectedPo.vendor?.name || selectedPo.vendor_name || "-";
                const poDate = selectedPo.purchaseDate
                  ? selectedPo.purchaseDate.slice(0, 10)
                  : selectedPo.purchase_date
                    ? selectedPo.purchase_date.slice(0, 10)
                    : "-";
                const locationName = selectedPo.city?.city_name || "-";
                const subsidiaryName = selectedPo.subsidiary?.subsidiary_name || "-";
                const shippedFrom = selectedPo.shipped_from || "-";
                const shippedTo = selectedPo.shipped_to || "-";
                return (
                  <>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <FormLabel>Vendor (PO Reference)</FormLabel>
                        <TextField size="small" value={vendorName} disabled />
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <FormLabel>PO Date</FormLabel>
                        <TextField size="small" value={poDate} disabled />
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <FormLabel>Location</FormLabel>
                        <TextField size="small" value={locationName} disabled />
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <FormLabel>Subsidiary</FormLabel>
                        <TextField size="small" value={subsidiaryName} disabled />
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <FormLabel>Shipped From</FormLabel>
                        <TextField size="small" value={shippedFrom} disabled />
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <FormLabel>Shipped To</FormLabel>
                        <TextField size="small" value={shippedTo} disabled />
                      </FormControl>
                    </Grid>
                  </>
                );
              })()}

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={formik.touched.header?.warehouseId && !!formik.errors.header?.warehouseId}>
                  <FormLabel>Warehouse</FormLabel>
                  <Select
                    size="small"
                    name="header.warehouseId"
                    value={formik.values.header.warehouseId}
                    onChange={formik.handleChange}
                    displayEmpty
                    disabled={true}
                  >
                    <MenuItem value="">Select Warehouse</MenuItem>
                    {warehouses.map((w: any) => (
                      <MenuItem key={w.id} value={w.id}>
                        {w.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Godown</FormLabel>
                  <Select
                    size="small"
                    name="header.godownId"
                    value={formik.values.header.godownId}
                    onChange={formik.handleChange}
                    displayEmpty
                    disabled={true}
                  >
                    <MenuItem value="">Select Godown</MenuItem>
                    {godowns.map((g: any) => (
                      <MenuItem key={g.id} value={g.id}>
                        {g.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Stack</FormLabel>
                  <Select
                    size="small"
                    name="header.stackId"
                    value={formik.values.header.stackId}
                    onChange={formik.handleChange}
                    displayEmpty
                    disabled={true}
                  >
                    <MenuItem value="">Select Stack</MenuItem>
                    {stacks.map((s: any) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <FormLabel>Remarks</FormLabel>
                <TextField
                  size="small"
                  multiline
                  placeholder="Enter Remark"
                  name="header.remarks"
                  value={formik.values.header.remarks}
                  onChange={formik.handleChange}
                />
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }} my={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant={activeSection === 'lineItems' ? 'contained' : 'outlined'}
                  onClick={() => setActiveSection('lineItems')}
                >
                  Line Items
                </Button>
                <Button
                  size="small"
                  variant={activeSection === 'transport' ? 'contained' : 'outlined'}
                  onClick={() => setActiveSection('transport')}
                >
                  Transport Details
                </Button>
              </Box>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {activeSection === 'transport' ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} my={2}>
                  <Typography variant="h6" color="primary">Transport Details</Typography>
                </Box>
                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%', mb: 2 }}>
                  <Table size="small" sx={{ minWidth: 1200 }}>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell width="20%">Transportation Mode</TableCell>
                        <TableCell width="20%">Transporter Name</TableCell>
                        <TableCell width="20%">Driver Name</TableCell>
                        <TableCell width="20%">Driver Phone</TableCell>
                        <TableCell width="20%">Vehicle Number</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <FormControl fullWidth>
                            <Select
                              size="small"
                              name="header.transportation_mode_id"
                              value={formik.values.header.transportation_mode_id}
                              onChange={formik.handleChange}
                              displayEmpty
                              disabled={true}
                            >
                              <MenuItem value="">Select Transportation Mode</MenuItem>
                              {transportationModes?.map((t: any) => (
                                <MenuItem key={t.id} value={t.id}>
                                  {t.mode_name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            name="header.transporterName"
                            value={formik.values.header.transporterName}
                            onChange={formik.handleChange}
                            placeholder="Transporter Name"
                            disabled={true}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            name="header.driverName"
                            value={formik.values.header.driverName}
                            onChange={formik.handleChange}
                            placeholder="Driver Name"
                            disabled={true}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            name="header.driverPhone"
                            value={formik.values.header.driverPhone}
                            onChange={formik.handleChange}
                            placeholder="Driver Phone"
                            disabled={true}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            name="header.vehicleNo"
                            value={formik.values.header.vehicleNo}
                            onChange={formik.handleChange}
                            placeholder="Vehicle Number"
                            disabled={true}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : activeSection === "lineItems" ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="primary">Line Items</Typography>
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%' }}>
                  <Table size="small" sx={{ minWidth: 1000 }}>
                    <TableHead sx={{ bgcolor: "grey.100" }}>
                      <TableRow>
                        <TableCell width="25%">Item</TableCell>
                        <TableCell width="15%">Ordered Qty</TableCell>
                        <TableCell width="15%">Received Qty</TableCell>
                        <TableCell width="15%">Accepted Qty</TableCell>
                        <TableCell width="15%">Rejected Qty</TableCell>
                        <TableCell width="15%">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formik.values.lineItems.map((lineItem, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              fullWidth
                              size="small"
                              value={lineItem.itemId}
                              onChange={(e) => updateLineItemField(index, "itemId", e.target.value)}
                              displayEmpty
                              disabled={true}
                            >
                              <MenuItem value="">Select Item</MenuItem>
                              {items.map((item: any) => (
                                <MenuItem key={item.id} value={item.id}>
                                  {item.item_name || item.name || `#${item.id}`}
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              disabled={true}
                              inputProps={{ min: 0, step: 0.01 }}
                              value={lineItem.orderedQty}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              inputProps={{ min: 0, max: lineItem.orderedQty, step: 0.01 }}
                              value={lineItem.receivedQty}
                              onChange={(e) => updateLineItemField(index, "receivedQty", Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              inputProps={{ min: 0, max: lineItem.orderedQty, step: 0.01 }}
                              value={lineItem.acceptedQty}
                              onChange={(e) => updateLineItemField(index, "acceptedQty", Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              inputProps={{ min: 0, max: lineItem.orderedQty, step: 0.01 }}
                              value={lineItem.rejectedQty}
                              onChange={(e) => updateLineItemField(index, "rejectedQty", Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => handleRemoveLineItem(index)}>
                              <RemoveCircleOutline />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : null}

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
              <Button variant="outlined" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained">
                {isEdit ? "Update GRN" : "Create GRN"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default GRNComp;