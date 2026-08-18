import React, { useMemo, useState } from "react";
import {
  Add,
  Assessment,
  Cancel,
  CheckCircleOutline,
  Delete,
  Edit,
  Visibility,
} from "@mui/icons-material";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import * as Yup from "yup";
import {
  Box,
  Button,
  Chip,
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

import { useGetVendorsQuery } from "../RTK/services/vendorApi";
import { usePermissions } from "../Hooks/usePermissions";
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
import DynamicTable from "./Tables";
import {
  useGetDebitNotesQuery,
  useCreateDebitNoteMutation,
  useUpdateDebitNoteMutation,
  useDeleteDebitNoteMutation,
} from "../RTK/services/debitNoteApi";
import { useGetJournalEntryByIdQuery } from "../RTK/services/journalEntryApi";

const STATUS_OPTIONS = ["Draft", "Approved", "Posted", "Cancelled"] as const;
type DebitNoteStatus = (typeof STATUS_OPTIONS)[number];

interface DebitNoteForm {
  debitNoteNumber: string;
  vendorId: string | number;
  debitNoteDate: string;
  amount: number;
  reason: string;
  status: DebitNoteStatus;
  remarks: string;
}

export default function DebitNoteComp() {
  const { canCreate, canUpdate, canDelete } = usePermissions();

  const [isOpen, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [glModalOpen, setGlModalOpen] = useState(false);
  const [selectedNoteForGl, setSelectedNoteForGl] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<any>(null);

  const { data: debitNotesData } = useGetDebitNotesQuery({ page: 1, limit: 50 });
  const { data: vendorsData } = useGetVendorsQuery({ option: true });

  const { data: journalData, isLoading: isJournalLoading } = useGetJournalEntryByIdQuery(
    {
      id: Number(selectedNoteForGl?.id ?? 0),
      source: "DEBIT_NOTE",
    },
    {
      skip: !selectedNoteForGl?.id,
    }
  );

  const [createDebitNote] = useCreateDebitNoteMutation();
  const [updateDebitNote] = useUpdateDebitNoteMutation();
  const [deleteDebitNote] = useDeleteDebitNoteMutation();

  const debitNotes = useMemo(() => {
    if (!debitNotesData) return [];
    return Array.isArray(debitNotesData) ? debitNotesData : debitNotesData?.result ?? [];
  }, [debitNotesData]);

  const vendors = useMemo(() => {
    if (!vendorsData) return [];
    return Array.isArray(vendorsData) ? vendorsData : vendorsData?.result ?? [];
  }, [vendorsData]);

  const formik = useFormik<DebitNoteForm>({
    initialValues: {
      debitNoteNumber: "",
      vendorId: "",
      debitNoteDate: new Date().toISOString().split("T")[0],
      amount: 0,
      reason: "",
      status: "Draft",
      remarks: "",
    },
    validationSchema: Yup.object({
      vendorId: Yup.string().required("Vendor is required"),
      debitNoteDate: Yup.date().required("Date is required"),
      amount: Yup.number().min(0.01, "Amount must be greater than 0").required("Amount is required"),
      status: Yup.string().required("Status is required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const payload = {
          debitNoteNumber: values.debitNoteNumber || `DN-${Date.now()}`,
          vendorId: Number(values.vendorId),
          debitNoteDate: values.debitNoteDate,
          amount: Number(values.amount),
          reason: values.reason,
          status: values.status,
          remarks: values.remarks,
        };

        if (isEdit && editId) {
          await updateDebitNote({ id: editId, body: payload }).unwrap();
          toast.success("Debit Note updated successfully!");
        } else {
          await createDebitNote(payload).unwrap();
          toast.success("Debit Note created successfully!");
        }

        setOpen(false);
        setIsEdit(false);
        setEditId(null);
        resetForm();
      } catch (err: any) {
        toast.error(err?.data?.message || err?.message || "Action failed");
      }
    },
  });

  const handleCreateNew = () => {
    setIsEdit(false);
    setEditId(null);
    formik.resetForm();
    formik.setFieldValue("debitNoteNumber", `DN-${Date.now().toString().slice(-6)}`);
    setOpen(true);
  };

  const handleEdit = (record: any) => {
    setIsEdit(true);
    setEditId(record.id);
    formik.setValues({
      debitNoteNumber: record.debitNoteNumber || record.note_number || "",
      vendorId: record.vendorId || record.vendor_id || "",
      debitNoteDate: record.debitNoteDate ? record.debitNoteDate.split("T")[0] : new Date().toISOString().split("T")[0],
      amount: Number(record.amount || 0),
      reason: record.reason || "",
      status: record.status || "Draft",
      remarks: record.remarks || "",
    });
    setOpen(true);
  };

  const handleStatusUpdate = async (id: number | string, newStatus: DebitNoteStatus) => {
    try {
      await updateDebitNote({ id, body: { status: newStatus } }).unwrap();
      toast.success(`Debit Note marked as ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;
    try {
      await deleteDebitNote(noteToDelete.id).unwrap();
      toast.success("Debit Note deleted successfully!");
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to delete");
    }
  };

  const columns = [
    { field: "debitNoteNumber", headerName: "Debit Note #" },
    {
      field: "vendor",
      headerName: "Vendor",
      render: (row: any) => {
        const v = vendors.find((item: any) => item.id === (row.vendorId || row.vendor_id));
        return v?.vendor_name || row.vendorName || row.vendor_name || "N/A";
      },
    },
    { field: "debitNoteDate", headerName: "Date" },
    {
      field: "amount",
      headerName: "Amount",
      render: (row: any) => `₹${Number(row.amount || 0).toLocaleString()}`,
    },
    {
      field: "status",
      headerName: "Status",
      render: (row: any) => {
        const s = row.status || "Draft";
        let color: "default" | "success" | "warning" | "error" | "info" = "default";
        if (s === "Approved" || s === "Posted") color = "success";
        else if (s === "Draft") color = "info";
        else if (s === "Cancelled") color = "error";
        return <Chip label={s} color={color} size="small" />;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      render: (row: any) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            size="small"
            color="info"
            onClick={() => {
              setSelectedNote(row);
              setViewModalOpen(true);
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color="secondary"
            title="GL Impact"
            onClick={() => {
              setSelectedNoteForGl(row);
              setGlModalOpen(true);
            }}
          >
            <Assessment fontSize="small" />
          </IconButton>

          {row.status === "Draft" && canUpdate && (
            <IconButton
              size="small"
              color="success"
              title="Approve & Post GL"
              onClick={() => handleStatusUpdate(row.id, "Posted")}
            >
              <CheckCircleOutline fontSize="small" />
            </IconButton>
          )}

          {row.status !== "Posted" && canUpdate && (
            <IconButton size="small" color="primary" onClick={() => handleEdit(row)}>
              <Edit fontSize="small" />
            </IconButton>
          )}

          {row.status !== "Cancelled" && canUpdate && (
            <IconButton
              size="small"
              color="warning"
              title="Cancel"
              onClick={() => handleStatusUpdate(row.id, "Cancelled")}
            >
              <Cancel fontSize="small" />
            </IconButton>
          )}

          {canDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setNoteToDelete(row);
                setDeleteDialogOpen(true);
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <NavbarBreadcrumbs
        items={[
          { label: "Purchase", path: "/purchase-order" },
          { label: "Finance Debit Notes", path: "/finance/debit-notes" },
        ]}
      />

      <Box
        sx={{
          display: "flex",
          justify: "space-between",
          alignItems: "center",
          mb: 3,
          mt: 2,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Finance Debit Notes
        </Typography>

        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={handleCreateNew}>
            New Debit Note
          </Button>
        )}
      </Box>

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <DynamicTable columns={columns} data={debitNotes} />
      </Paper>

      {/* Form Modal */}
      <Dialog open={isOpen} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? "Edit Debit Note" : "Create Finance Debit Note"}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>Debit Note #</FormLabel>
                  <TextField
                    name="debitNoteNumber"
                    value={formik.values.debitNoteNumber}
                    onChange={formik.handleChange}
                    size="small"
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(formik.touched.vendorId && formik.errors.vendorId)}>
                  <FormLabel>Vendor *</FormLabel>
                  <Select
                    name="vendorId"
                    value={formik.values.vendorId}
                    onChange={formik.handleChange}
                    size="small"
                  >
                    <MenuItem value="">Select Vendor</MenuItem>
                    {vendors.map((v: any) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.vendor_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.vendorId && formik.errors.vendorId && (
                    <FormHelperText>{formik.errors.vendorId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(formik.touched.debitNoteDate && formik.errors.debitNoteDate)}>
                  <FormLabel>Date *</FormLabel>
                  <TextField
                    type="date"
                    name="debitNoteDate"
                    value={formik.values.debitNoteDate}
                    onChange={formik.handleChange}
                    size="small"
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(formik.touched.amount && formik.errors.amount)}>
                  <FormLabel>Amount (₹) *</FormLabel>
                  <TextField
                    type="number"
                    name="amount"
                    value={formik.values.amount}
                    onChange={formik.handleChange}
                    size="small"
                  />
                  {formik.touched.amount && formik.errors.amount && (
                    <FormHelperText>{formik.errors.amount}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name="status"
                    value={formik.values.status}
                    onChange={formik.handleChange}
                    size="small"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <MenuItem key={st} value={st}>
                        {st}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <FormLabel>Reason</FormLabel>
                  <TextField
                    name="reason"
                    value={formik.values.reason}
                    onChange={formik.handleChange}
                    size="small"
                    multiline
                    rows={2}
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <FormLabel>Remarks</FormLabel>
                  <TextField
                    name="remarks"
                    value={formik.values.remarks}
                    onChange={formik.handleChange}
                    size="small"
                  />
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </Box>
        </form>
      </Dialog>

      {/* View Detail Modal */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Debit Note Details</DialogTitle>
        <DialogContent dividers>
          {selectedNote && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography>
                <strong>Debit Note #:</strong> {selectedNote.debitNoteNumber || selectedNote.note_number}
              </Typography>
              <Typography>
                <strong>Date:</strong> {selectedNote.debitNoteDate}
              </Typography>
              <Typography>
                <strong>Amount:</strong> ₹{Number(selectedNote.amount || 0).toLocaleString()}
              </Typography>
              <Typography>
                <strong>Status:</strong> {selectedNote.status}
              </Typography>
              <Typography>
                <strong>Reason:</strong> {selectedNote.reason || "N/A"}
              </Typography>
              <Typography>
                <strong>Remarks:</strong> {selectedNote.remarks || "N/A"}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => setViewModalOpen(false)}>Close</Button>
        </Box>
      </Dialog>

      {/* GL Impact Modal */}
      <Dialog open={glModalOpen} onClose={() => setGlModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>GL Impact - Journal Voucher Preview</DialogTitle>
        <DialogContent dividers>
          {isJournalLoading ? (
            <Typography>Loading accounting entries...</Typography>
          ) : journalData?.result?.lines?.length ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell>Description / Memo</TableCell>
                    <TableCell align="right">Debit (DR)</TableCell>
                    <TableCell align="right">Credit (CR)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {journalData.result.lines.map((line: any, idx: number) => (
                    <TableRow key={line.id || idx}>
                      <TableCell>
                        <strong>
                          {line.account ? `${line.account.account_number} - ${line.account.account_name}` : line.account_name || `Account #${line.account_id}`}
                        </strong>
                      </TableCell>
                      <TableCell>{line.narration || line.memo || "-"}</TableCell>
                      <TableCell align="right" sx={{ color: Number(line.debit_amount || line.debit) > 0 ? "success.main" : "text.secondary", fontWeight: Number(line.debit_amount || line.debit) > 0 ? "bold" : "normal" }}>
                        {Number(line.debit_amount || line.debit || 0) > 0 ? `₹${Number(line.debit_amount || line.debit).toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell align="right" sx={{ color: Number(line.credit_amount || line.credit) > 0 ? "error.main" : "text.secondary", fontWeight: Number(line.credit_amount || line.credit) > 0 ? "bold" : "normal" }}>
                        {Number(line.credit_amount || line.credit || 0) > 0 ? `₹${Number(line.credit_amount || line.credit).toLocaleString()}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell colSpan={2} align="right">
                      <strong>Total</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>₹{Number(journalData.result.total_debit || 0).toLocaleString()}</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>₹{Number(journalData.result.total_credit || 0).toLocaleString()}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">
              No GL postings recorded for this document yet. Transitioning status to 'Posted' or 'Approved' will record accounting vouchers.
            </Typography>
          )}
        </DialogContent>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => setGlModalOpen(false)}>Close</Button>
        </Box>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Debit Note</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this debit note record?</Typography>
        </DialogContent>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
