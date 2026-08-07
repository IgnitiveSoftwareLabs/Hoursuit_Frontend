import React, { useState } from "react";

import { Add, Delete, Edit, RemoveCircleOutline } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useAppSelector } from "../Hooks/Reduxhook/hooks";
import { usePermissions } from "../Hooks/usePermissions";
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
import {
  useCreateQualityInspectionMutation,
  useDeleteQualityInspectionMutation,
  useGetGRNsQuery,
  useGetPurchaseOrdersQuery,
  useGetQualityInspectionsQuery,
  useUpdateQualityInspectionMutation,
} from "../RTK/services/purchaseApi";
import { useGetVendorsQuery } from "../RTK/services/vendorApi";
import { useGetItemsQuery } from "../RTK/services/itemApi";
import DynamicTable from "./Tables";

const OVERALL_STATUS_OPTIONS = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "APPROVED",
  "REJECTED",
  "PARTIAL",
] as const;

const QC_STATUS_OPTIONS = ["APPROVED", "REJECTED", "PARTIAL", "HOLD"] as const;

interface QualityInspectionHeader {
  qcNumber: string;
  grnHeaderId: string;
  poHeaderId: string;
  vendorId: string;
  inspectionDate: string;
  inspectedBy: string;
  approvedBy: string;
  overallStatus: string;
  remarks: string;
  user_id: number | string;
}

interface QualityInspectionLine {
  qcHeaderId?: string;
  grnLineId: string;
  itemId: string;
  batchNo: string;
  receivedQty: number;
  inspectedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  damagedQty: number;
  holdQty: number;
  qcStatus: string;
  rejectionReason: string;
  remarks: string;
}

const QualityCheckComp: React.FC = () => {
  const { canRead, canCreate, canUpdate, canDelete } = usePermissions();
  const currentUser = useAppSelector((state) => state.currentUser.user);
  const userId = currentUser?.id;

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<any>(null);

  const { data: qualityInspectionsData } = useGetQualityInspectionsQuery({ page: 1, limit: 20 });
  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery({ page: 1, limit: 50 });
  const { data: grnsData } = useGetGRNsQuery({ page: 1, limit: 50 });
  const { data: vendorsData } = useGetVendorsQuery({ option: true });
  const { data: itemsData } = useGetItemsQuery({ page: 1, limit: 100 });
  const [createQualityInspection] = useCreateQualityInspectionMutation();
  const [updateQualityInspection] = useUpdateQualityInspectionMutation();
  const [deleteQualityInspection] = useDeleteQualityInspectionMutation();

  const qualityInspections = Array.isArray(qualityInspectionsData)
    ? qualityInspectionsData
    : qualityInspectionsData?.result ?? [];
  const purchaseOrders = Array.isArray(purchaseOrdersData)
    ? purchaseOrdersData
    : purchaseOrdersData?.result ?? [];
  const grns = Array.isArray(grnsData) ? grnsData : grnsData?.result ?? [];
  const vendors = Array.isArray(vendorsData) ? vendorsData : vendorsData?.result ?? [];
  const items = Array.isArray(itemsData) ? itemsData : itemsData?.result ?? [];

  const formik = useFormik<{
    header: QualityInspectionHeader;
    lineItems: QualityInspectionLine[];
  }>({
    initialValues: {
      header: {
        qcNumber: "",
        grnHeaderId: "",
        poHeaderId: "",
        vendorId: "",
        inspectionDate: new Date().toISOString().split("T")[0],
        inspectedBy: "",
        approvedBy: "",
        overallStatus: "PENDING",
        remarks: "",
        user_id: userId ?? "",
      },
      lineItems: [
        {
          qcHeaderId: undefined,
          grnLineId: "",
          itemId: "",
          batchNo: "",
          receivedQty: 0,
          inspectedQty: 0,
          acceptedQty: 0,
          rejectedQty: 0,
          damagedQty: 0,
          holdQty: 0,
          qcStatus: "HOLD",
          rejectionReason: "",
          remarks: "",
        },
      ],
    },
    validationSchema: Yup.object({
      header: Yup.object({
        qcNumber: Yup.string().required("QC Number is required"),
        grnHeaderId: Yup.string().required("GRN is required"),
        inspectionDate: Yup.date().required("Inspection date is required"),
        overallStatus: Yup.string()
          .oneOf([...OVERALL_STATUS_OPTIONS], "Invalid overall status")
          .required("Overall status is required"),
      }),
      lineItems: Yup.array()
        .of(
          Yup.object({
            grnLineId: Yup.string().required("GRN line is required"),
            itemId: Yup.string().required("Item is required"),
            receivedQty: Yup.number()
              .min(0, "Received quantity must be 0 or greater")
              .required("Received quantity is required"),
            inspectedQty: Yup.number()
              .min(0, "Inspected quantity must be 0 or greater")
              .required("Inspected quantity is required"),
            acceptedQty: Yup.number()
              .min(0, "Accepted quantity must be 0 or greater")
              .required("Accepted quantity is required"),
            rejectedQty: Yup.number().min(0, "Rejected quantity must be 0 or greater"),
            damagedQty: Yup.number().min(0, "Damaged quantity must be 0 or greater"),
            holdQty: Yup.number().min(0, "Hold quantity must be 0 or greater"),
            qcStatus: Yup.string()
              .oneOf([...QC_STATUS_OPTIONS], "Invalid QC status")
              .required("QC status is required"),
          })
        )
        .min(1, "At least one QC line item is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          header: {
            ...values.header,
            poHeaderId: values.header.poHeaderId ? Number(values.header.poHeaderId) : null,
            grnHeaderId: Number(values.header.grnHeaderId),
            vendorId: values.header.vendorId ? Number(values.header.vendorId) : null,
            inspectedBy: values.header.inspectedBy ? Number(values.header.inspectedBy) : null,
            approvedBy: values.header.approvedBy ? Number(values.header.approvedBy) : null,
            user_id: userId ?? values.header.user_id,
          },
          lineItems: values.lineItems.map((item) => ({
            ...item,
            qcHeaderId: item.qcHeaderId ? Number(item.qcHeaderId) : undefined,
            grnLineId: Number(item.grnLineId),
            itemId: Number(item.itemId),
            receivedQty: Number(item.receivedQty),
            inspectedQty: Number(item.inspectedQty),
            acceptedQty: Number(item.acceptedQty),
            rejectedQty: Number(item.rejectedQty),
            damagedQty: Number(item.damagedQty),
            holdQty: Number(item.holdQty),
          })),
        };

        if (isEdit && editId) {
          await updateQualityInspection({ id: editId, body: payload }).unwrap();
          toast.success("Quality inspection updated successfully");
        } else {
          await createQualityInspection(payload).unwrap();
          toast.success("Quality inspection created successfully");
        }
        setOpen(false);
        setIsEdit(false);
        setEditId(null);
        formik.resetForm();
      } catch (error: any) {
        toast.error(error?.data?.message || "Unable to save quality inspection");
      }
    },
  });

  const getFieldError = (field: string) => {
    const error = field.split(".").reduce((obj: any, key: string) => obj?.[key], formik.errors);
    const touched = field.split(".").reduce((obj: any, key: string) => obj?.[key], formik.touched);
    return touched && error ? String(error) : "";
  };

  const updateLineItemField = (index: number, field: keyof QualityInspectionLine, value: any) => {
    const lineItems = [...formik.values.lineItems];
    lineItems[index] = { ...lineItems[index], [field]: value };
    formik.setFieldValue("lineItems", lineItems);
  };

  const handleAddLineItem = () => {
    formik.setFieldValue("lineItems", [
      ...formik.values.lineItems,
      {
        qcHeaderId: undefined,
        grnLineId: "",
        itemId: "",
        batchNo: "",
        receivedQty: 0,
        inspectedQty: 0,
        acceptedQty: 0,
        rejectedQty: 0,
        damagedQty: 0,
        holdQty: 0,
        qcStatus: "HOLD",
        rejectionReason: "",
        remarks: "",
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    const lineItems = [...formik.values.lineItems];
    lineItems.splice(index, 1);
    formik.setFieldValue("lineItems", lineItems);
  };

  const handleEdit = (record: any) => {
    if (!canUpdate("quality_report")) {
      toast.error("No permission to edit quality inspection");
      return;
    }

    const header = record?.header ?? record;
    const lineSource = record?.lineItems ?? record?.line_items ?? [];

    formik.setValues({
      header: {
        qcNumber: header?.qcNumber ?? header?.qc_number ?? "",
        grnHeaderId: header?.grnHeaderId ?? header?.grn_header_id ?? "",
        poHeaderId: header?.poHeaderId ?? header?.po_header_id ?? "",
        vendorId: header?.vendorId ?? header?.vendor_id ?? "",
        inspectionDate: header?.inspectionDate ?? header?.inspection_date ?? new Date().toISOString().split("T")[0],
        inspectedBy: header?.inspectedBy ?? header?.inspected_by ?? "",
        approvedBy: header?.approvedBy ?? header?.approved_by ?? "",
        overallStatus: header?.overallStatus ?? header?.overall_status ?? "PENDING",
        remarks: header?.remarks ?? "",
        user_id: header?.user_id ?? userId ?? "",
      },
      lineItems: Array.isArray(lineSource) && lineSource.length
        ? lineSource.map((item: any) => ({
            qcHeaderId: item?.qcHeaderId ?? item?.qc_header_id ?? undefined,
            grnLineId: item?.grnLineId ?? item?.grn_line_id ?? "",
            itemId: item?.itemId ?? item?.item_id ?? "",
            batchNo: item?.batchNo ?? item?.batch_no ?? "",
            receivedQty: Number(item?.receivedQty ?? item?.received_qty ?? 0),
            inspectedQty: Number(item?.inspectedQty ?? item?.inspected_qty ?? 0),
            acceptedQty: Number(item?.acceptedQty ?? item?.accepted_qty ?? 0),
            rejectedQty: Number(item?.rejectedQty ?? item?.rejected_qty ?? 0),
            damagedQty: Number(item?.damagedQty ?? item?.damaged_qty ?? 0),
            holdQty: Number(item?.holdQty ?? item?.hold_qty ?? 0),
            qcStatus: item?.qcStatus ?? item?.qc_status ?? "HOLD",
            rejectionReason: item?.rejectionReason ?? item?.rejection_reason ?? "",
            remarks: item?.remarks ?? "",
          }))
        : [
            {
              qcHeaderId: undefined,
              grnLineId: "",
              itemId: "",
              batchNo: "",
              receivedQty: 0,
              inspectedQty: 0,
              acceptedQty: 0,
              rejectedQty: 0,
              damagedQty: 0,
              holdQty: 0,
              qcStatus: "HOLD",
              rejectionReason: "",
              remarks: "",
            },
          ],
    });

    setEditId(record?.id ?? null);
    setIsEdit(true);
    setOpen(true);
  };

  const handleDeleteRequest = (record: any) => {
    if (!canDelete("quality_report")) {
      toast.error("No permission to delete quality inspection");
      return;
    }
    setInspectionToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!inspectionToDelete?.id) {
      setDeleteDialogOpen(false);
      setInspectionToDelete(null);
      return;
    }

    try {
      await deleteQualityInspection(inspectionToDelete.id).unwrap();
      toast.success("Quality inspection deleted successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete quality inspection");
    } finally {
      setDeleteDialogOpen(false);
      setInspectionToDelete(null);
    }
  };

  const canReadQualityInspection = canRead("quality_report") || canRead("quality_report");
  const canCreateQualityInspection = canCreate("quality_report") || canCreate("quality_report");

  const columns = [
    { key: "qcNumber", label: "QC Number" },
    { key: "poHeaderId", label: "Purchase Order" },
    { key: "grnHeaderId", label: "GRN" },
    { key: "vendorId", label: "Vendor" },
    { key: "inspectionDate", label: "Inspection Date" },
    { key: "inspectedBy", label: "Inspected By" },
    { key: "approvedBy", label: "Approved By" },
    { key: "status", label: "Status" },
    {
      key: "actions",
      label: "Actions",
      render: (row: any) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          {(canUpdate("quality_report")) && (
            <IconButton size="small" color="primary" onClick={() => handleEdit(row)} aria-label="Edit quality inspection">
              <Edit />
            </IconButton>
          )}
          {(canDelete("quality_report")) && (
            <IconButton size="small" color="error" onClick={() => handleDeleteRequest(row)} aria-label="Delete quality inspection">
              <Delete />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  if (!canReadQualityInspection) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view Quality Inspections.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1810px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h3">Quality Inspections</Typography>
          <NavbarBreadcrumbs />
        </Box>
        {canCreateQualityInspection && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setOpen(true);
              setIsEdit(false);
              setEditId(null);
              formik.resetForm();
            }}
          >
            New Quality Inspection
          </Button>
        )}
      </Box>

      {/* <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Recent Quality Inspections
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>QC Number</TableCell>
                <TableCell>PO</TableCell>
                <TableCell>GRN</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Inspection Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {qualityInspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No quality inspections found.
                  </TableCell>
                </TableRow>
              ) : (
                qualityInspections.map((inspection: any) => (
                  <TableRow key={inspection.id ?? inspection.qcNumber ?? inspection._id}>
                    <TableCell>{inspection.qcNumber}</TableCell>
                    <TableCell>{inspection.poHeaderId}</TableCell>
                    <TableCell>{inspection.grnHeaderId}</TableCell>
                    <TableCell>{inspection.vendorId}</TableCell>
                    <TableCell>{inspection.inspectionDate}</TableCell>
                    <TableCell>{inspection.overallStatus}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper> */}

      <DynamicTable columns={columns} data={qualityInspections} getRowId={(row: any) => row.id} />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this quality inspection?</Typography>
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

      <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>{isEdit ? "Edit Quality Inspection" : "Create Quality Inspection"}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.qcNumber"))}>
                  <FormLabel>QC Number</FormLabel>
                  <TextField
                    name="header.qcNumber"
                    placeholder="Enter QC number"
                    value={formik.values.header.qcNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    fullWidth
                    size="small"
                  />
                  <FormHelperText>{getFieldError("header.qcNumber")}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.poHeaderId"))}>
                  <FormLabel>Purchase Order</FormLabel>
                  <Select
                    name="header.poHeaderId"
                    value={formik.values.header.poHeaderId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Select PO</em>
                    </MenuItem>
                    {purchaseOrders.map((po: any) => (
                      <MenuItem key={po.id ?? po._id} value={String(po.id ?? po._id)}>
                        {po.purchaseNo ?? po.purchase_no ?? `PO-${po.id ?? po._id}`}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{getFieldError("header.poHeaderId")}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.grnHeaderId"))}>
                  <FormLabel>GRN</FormLabel>
                  <Select
                    name="header.grnHeaderId"
                    value={formik.values.header.grnHeaderId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Select GRN</em>
                    </MenuItem>
                    {grns.map((grn: any) => (
                      <MenuItem key={grn.id ?? grn._id} value={String(grn.id ?? grn._id)}>
                        {grn.grnNumber ?? grn.grn_number ?? `GRN-${grn.id ?? grn._id}`}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{getFieldError("header.grnHeaderId")}</FormHelperText>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.vendorId"))}>
                  <FormLabel>Vendor</FormLabel>
                  <Select
                    name="header.vendorId"
                    value={formik.values.header.vendorId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Select vendor</em>
                    </MenuItem>
                    {vendors.map((vendor: any) => (
                      <MenuItem key={vendor.id ?? vendor._id} value={String(vendor.id ?? vendor._id)}>
                        {vendor.vendor_name ?? vendor.name ?? `Vendor-${vendor.id ?? vendor._id}`}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{getFieldError("header.vendorId")}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.inspectionDate"))}>
                  <FormLabel>Inspection Date</FormLabel>
                  <TextField
                    name="header.inspectionDate"
                    type="date"
                    value={formik.values.header.inspectionDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <FormHelperText>{getFieldError("header.inspectionDate")}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Inspected By</FormLabel>
                  <TextField
                    name="header.inspectedBy"
                    type="text"
                    placeholder="Inpected By"
                    value={formik.values.header.inspectedBy}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    fullWidth
                    size="small"
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <FormLabel>Approved By</FormLabel>
                  <TextField
                    name="header.approvedBy"
                    type="text"
                    placeholder="Approved By"
                    value={formik.values.header.approvedBy}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    fullWidth
                    size="small"
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(getFieldError("header.overallStatus"))}>
                  <FormLabel>Overall Status</FormLabel>
                  <Select
                    name="header.overallStatus"
                    value={formik.values.header.overallStatus}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    size="small"
                  >
                    {OVERALL_STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{getFieldError("header.overallStatus")}</FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <FormLabel>Remarks</FormLabel>
                <TextField
                  name="header.remarks"
                  placeholder="Enter any remarks"
                  value={formik.values.header.remarks}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  fullWidth
                  size="small"
                />
              </FormControl>
            </Grid>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Line Items
              </Typography>
              <Box>
                <Button variant="outlined" onClick={handleAddLineItem} startIcon={<Add />}>
                  Add Line Item
                </Button>
              </Box>
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%' }}>
              <Table size="small" sx={{ minWidth: 2000 }}>
                <TableHead>
                  <TableRow>
                    <TableCell width="10%">GRN Line</TableCell>
                    <TableCell width="10%">Item</TableCell>
                    <TableCell width="10%">Batch No</TableCell>
                    <TableCell width="6%">Received Qty</TableCell>
                    <TableCell width="6%">Inspected Qty</TableCell>
                    <TableCell width="6%">Accepted Qty</TableCell>
                    <TableCell width="6%">Rejected Qty</TableCell>
                    <TableCell width="6%">Damaged Qty</TableCell>
                    <TableCell width="6%">Hold Qty</TableCell>
                    <TableCell width="8%">QC Status</TableCell>
                    <TableCell width="10%">Rejection Reason</TableCell>
                    <TableCell width="10%">Remarks</TableCell>
                    <TableCell width="5%">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formik.values.lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ minWidth: 140 }}>
                        <FormControl fullWidth error={Boolean(getFieldError(`lineItems.${index}.grnLineId`))}>
                          <TextField
                            type="number"
                            name={`lineItems.${index}.grnLineId`}
                            value={item.grnLineId}
                            onChange={(e) => updateLineItemField(index, "grnLineId", e.target.value)}
                            size="small"
                          />
                          <FormHelperText>{getFieldError(`lineItems.${index}.grnLineId`)}</FormHelperText>
                        </FormControl>
                      </TableCell>
                      <TableCell sx={{ minWidth: 170 }}>
                        <FormControl fullWidth error={Boolean(getFieldError(`lineItems.${index}.itemId`))}>
                          <Select
                            name={`lineItems.${index}.itemId`}
                            value={item.itemId}
                            onChange={(e) => updateLineItemField(index, "itemId", e.target.value)}
                            size="small"
                          >
                            <MenuItem value="">
                              <em>Select item</em>
                            </MenuItem>
                            {items.map((product: any) => (
                              <MenuItem key={product.id ?? product._id} value={String(product.id ?? product._id)}>
                                {product.name ?? product.itemName ?? `Item-${product.id ?? product._id}`}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>{getFieldError(`lineItems.${index}.itemId`)}</FormHelperText>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          name={`lineItems.${index}.batchNo`}
                          placeholder="Batch number"
                          value={item.batchNo}
                          onChange={(e) => updateLineItemField(index, "batchNo", e.target.value)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          name={`lineItems.${index}.receivedQty`}
                          value={item.receivedQty}
                          onChange={(e) => updateLineItemField(index, "receivedQty", Number(e.target.value))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          name={`lineItems.${index}.inspectedQty`}
                          value={item.inspectedQty}
                          onChange={(e) => updateLineItemField(index, "inspectedQty", Number(e.target.value))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          name={`lineItems.${index}.acceptedQty`}
                          value={item.acceptedQty}
                          onChange={(e) => updateLineItemField(index, "acceptedQty", Number(e.target.value))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          name={`lineItems.${index}.rejectedQty`}
                          value={item.rejectedQty}
                          onChange={(e) => updateLineItemField(index, "rejectedQty", Number(e.target.value))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          name={`lineItems.${index}.damagedQty`}
                          value={item.damagedQty}
                          onChange={(e) => updateLineItemField(index, "damagedQty", Number(e.target.value))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          name={`lineItems.${index}.holdQty`}
                          value={item.holdQty}
                          onChange={(e) => updateLineItemField(index, "holdQty", Number(e.target.value))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth error={Boolean(getFieldError(`lineItems.${index}.qcStatus`))}>
                          <Select
                            name={`lineItems.${index}.qcStatus`}
                            value={item.qcStatus}
                            onChange={(e) => updateLineItemField(index, "qcStatus", e.target.value)}
                            size="small"
                          >
                            {QC_STATUS_OPTIONS.map((status) => (
                              <MenuItem key={status} value={status}>
                                {status}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>{getFieldError(`lineItems.${index}.qcStatus`)}</FormHelperText>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          name={`lineItems.${index}.rejectionReason`}
                          placeholder="Rejection reason"
                          value={item.rejectionReason}
                          onChange={(e) => updateLineItemField(index, "rejectionReason", e.target.value)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          name={`lineItems.${index}.remarks`}
                          placeholder="Remarks"
                          value={item.remarks}
                          onChange={(e) => updateLineItemField(index, "remarks", e.target.value)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleRemoveLineItem(index)} disabled={formik.values.lineItems.length === 1}>
                          <RemoveCircleOutline />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>



            <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
              <Button onClick={() => setOpen(false)} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={!canCreateQualityInspection}>
                {isEdit ? "Update" : "Create"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default QualityCheckComp;
