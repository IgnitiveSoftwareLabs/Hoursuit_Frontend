import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  TablePagination,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Edit, Delete, Add, Print } from "@mui/icons-material";
import toast from "react-hot-toast";
import {
  useCreateRequestDeliveryMutation,
  useDeleteRequestDeliveryMutation,
  useFetchRequestDeliveriesQuery,
  useUpdateRequestDeliveryMutation,
} from "../RTK/services/requestDeliveryApi";
import { useFetchRequestDepositorsQuery } from "../RTK/services/requestDepositorApi";
import ConfirmationDialog from "./Dialog/ConfirmationDialog";
import { Link } from "react-router-dom";
import GatePassForm from "../components/Dialog/GatePassForm"; // Import GatePassForm
import { PDFDownloadLink } from "@react-pdf/renderer";
import DeliveryRequestPDF from "./Print/DeliveryPrint";
import { usePermissions } from "../Hooks/usePermissions";

interface RequestDeliveryType {
  id?: number;
  deposit_reference_id: number;
  withdrawal_date: string;
  delivery_note_issue_date: string;
  withdrawal_ledger_page_number: number;
  measurment_or_weight: number;
  total_cost_of_goods: number;
  details_of_number_of_bags_sacks: number;
  CompanyId?: number;
  delivery_note_number: number;
  weightUnit: string;
  gate_passes: Array<{
    gatePassId: number;
    withdrawn_weight: number;
    withdrawn_bags: number;
    weightUnit: string;
  }>;
}

const RequestDeliveryComp: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  // Check read permission
  if (!canRead("delivery")) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Typography
          variant="h4"
          sx={{ textAlign: "center", mt: 4, color: "error.main" }}
        >
          Access Denied: Insufficient permissions to view delivery requests
        </Typography>
      </Box>
    );
  }

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [editDeliveryId, setEditDeliveryId] = useState<number | null>(null);
  const [deleteDeliveryId, setDeleteDeliveryId] = useState<number | null>(null);
  const [isGatePassFormOpen, setGatePassFormOpen] = useState<boolean>(false); // State for GatePassForm
  const [gatePassInitialValues, setGatePassInitialValues] = useState<
    any | null
  >(null); // State for pre-filled GatePassForm data

  // Pagination and search state
  const [page, setPage] = useState(0); // 0-based for TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(0); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data: requestDeposits } = useFetchRequestDepositorsQuery({
    page: 1,
    limit: 1000,
    search: "",
  });
  const {
    data: deliveries,
    isLoading,
    refetch: refetchDeliveries,
  } = useFetchRequestDeliveriesQuery({
    page: page + 1,
    limit: rowsPerPage,
    search,
  });
  const [createDelivery] = useCreateRequestDeliveryMutation();
  const [updateDelivery] = useUpdateRequestDeliveryMutation();
  const [deleteDelivery] = useDeleteRequestDeliveryMutation();

  const [selectedGatePasses, setSelectedGatePasses] = useState<
    Array<{
      gatePassId: number;
      withdrawn_weight: number;
      withdrawn_bags: number;
      weightUnit: string;
      remaining_delivery_weight: number;
      remaining_delivery_bags: number;
    }>
  >([]);

  const formik = useFormik<RequestDeliveryType>({
    initialValues: {
      deposit_reference_id: 0,
      withdrawal_date: new Date().toISOString().slice(0, 16),
      delivery_note_issue_date: new Date().toISOString().slice(0, 16),
      withdrawal_ledger_page_number: 0,
      measurment_or_weight: 0,
      weightUnit: "kg",
      total_cost_of_goods: 0,
      details_of_number_of_bags_sacks: 0,
      delivery_note_number: 0,
      gate_passes: [],
    },
    validationSchema: Yup.object({
      deposit_reference_id: Yup.number()
        .min(1, "Please select a deposit reference")
        .required("Deposit reference is required"),
      withdrawal_date: Yup.string().required("Withdrawal date is required"),
      delivery_note_issue_date: Yup.string().required(
        "Delivery note iss date is required"
      ),
      withdrawal_ledger_page_number: Yup.number()
        .min(1, "Withdrawal ledger page number must be positive")
        .required("Withdrawal ledger page number is required"),
      measurment_or_weight: Yup.number()
        .min(0, "Measurement or weight must be non-negative")
        .required("Measurement or weight is required"),
      weightUnit: Yup.string()
        .oneOf(["kg", "tons", "quintals", "liters"], "Invalid weight unit")
        .required("Weight unit is required"),
      total_cost_of_goods: Yup.number()
        .min(0, "Total cost must be non-negative")
        .required("Total cost is required"),
      details_of_number_of_bags_sacks: Yup.number()
        .min(0, "Number of bags/sacks must be non-negative")
        .required("Number of bags/sacks is required"),
      delivery_note_number: Yup.number()
        .min(1, "Delivery note number must be positive")
        .required("Delivery note number is required"),
      gate_passes: Yup.array()
        .min(1, "At least one gate pass must be selected")
        .required("Gate passes are required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,
          gate_passes: JSON.stringify(
            selectedGatePasses.map((gp) => ({
              gatePassId: gp.gatePassId,
              withdrawn_weight: gp.withdrawn_weight,
              withdrawn_bags: gp.withdrawn_bags,
              weightUnit: gp.weightUnit,
            }))
          ),
        };
        if (isEdit && editDeliveryId) {
          const response: any = await updateDelivery({
            id: editDeliveryId,
            payload,
          }).unwrap();
          toast.success(response?.message || "Delivery updated successfully");
        } else {
          const response: any = await createDelivery(payload).unwrap();
          toast.success(response?.message || "Delivery created successfully");
        }
        setIsEdit(false);
        setSelectedGatePasses([]);
        formik.resetForm();
      } catch (error: any) {
        toast.error(error?.data?.message || "Something went wrong");
      }
    },
  });

  const handleEdit = (id: number) => {
    if (!canUpdate("delivery")) {
      toast.error(
        "Access denied: Insufficient permissions to edit delivery requests"
      );
      return;
    }

    const deliveryToEdit = deliveries?.result?.find(
      (item: any) => item.id === id
    );
    if (deliveryToEdit) {
      formik.setValues({
        deposit_reference_id: deliveryToEdit.deposit_reference_id,
        withdrawal_date: deliveryToEdit.withdrawal_date.slice(0, 16),
        delivery_note_issue_date: deliveryToEdit.delivery_note_issue_date.slice(
          0,
          16
        ),
        withdrawal_ledger_page_number:
          deliveryToEdit.withdrawal_ledger_page_number,
        measurment_or_weight: parseFloat(deliveryToEdit.measurment_or_weight),
        weightUnit: deliveryToEdit.weightUnit || "kg",
        total_cost_of_goods: parseFloat(deliveryToEdit.total_cost_of_goods),
        details_of_number_of_bags_sacks:
          deliveryToEdit.details_of_number_of_bags_sacks,
        delivery_note_number: deliveryToEdit.delivery_note_number,
        gate_passes:
          deliveryToEdit.gatePasses?.map((gp: any) => ({
            gatePassId: gp.id,
            withdrawn_weight: gp.DeliveryGatePass.withdrawn_weight,
            withdrawn_bags: gp.DeliveryGatePass.withdrawn_bags,
            weightUnit: gp.DeliveryGatePass.weightUnit,
          })) || [],
      });
      setSelectedGatePasses(
        deliveryToEdit.gatePasses?.map((gp: any) => ({
          gatePassId: gp.id,
          withdrawn_weight: gp.DeliveryGatePass.withdrawn_weight,
          withdrawn_bags: gp.DeliveryGatePass.withdrawn_bags,
          weightUnit: gp.DeliveryGatePass.weightUnit,
          remaining_delivery_weight:
            gp.DeliveryGatePass.remaining_delivery_weight,
          remaining_delivery_bags: gp.DeliveryGatePass.remaining_delivery_bags,
        })) || []
      );
      setEditDeliveryId(id);
      setIsEdit(true);
    }
  };

  const handleDelete = async (id: any) => {
    if (!canDelete("delivery")) {
      toast.error(
        "Access denied: Insufficient permissions to delete delivery requests"
      );
      return;
    }

    try {
      await deleteDelivery(id).unwrap();
      toast.success("Request delivery deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteDeliveryId(null);
    } catch (error: any) {
      toast.error("Some records are associated with this delivery");
    }
  };

  // Function to open GatePassForm with pre-filled data
  const handleCreateGatePass = (delivery: any) => {
    if (!canCreate("gatepass")) {
      toast.error(
        "Access denied: Insufficient permissions to create gate passes"
      );
      return;
    }

    const deposit = delivery.deposit;
    const gatePass = delivery.gatePasses?.[0]; // Assuming first gate pass for pre-filling
    const initialValues: any = {
      clientId: deposit.clientId || 0,
      mobile_number: "",
      name: gatePass?.name || "",
      date: new Date().toISOString().slice(0, 10),
      vehicle_number: gatePass?.vehicle_number || "",
      warehouseId: gatePass?.warehouseId || 0,
      godownId: gatePass?.godownId || 0,
      stack_id: gatePass?.stack_id || 0,
      CommodityId: deposit.CommodityId || 0,
      no_of_bags: delivery.details_of_number_of_bags_sacks || 0,
      weight: parseFloat(delivery.measurment_or_weight) || 0,
      weightUnit: delivery.weightUnit || "kg",
      deposit_delivery: "delivery",
      in_time: new Date().toISOString().slice(0, 16),
      out_time: new Date().toISOString().slice(0, 16),
      requestDeliveryId: delivery.id, // Add the request delivery ID
      customer: { name: deposit.client?.name || "" },
      warehouse: { name: gatePass?.warehouse?.name || "" },
      godown: { name: gatePass?.godown?.name || "" },
      stack: { name: gatePass?.stack?.name || "" },
    };
    setGatePassInitialValues(initialValues);
    setGatePassFormOpen(true);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h3" sx={{ mb: 2 }}>
          Request Deliveries
        </Typography>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by ID, Customer, Delivery Note, Status..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
      </Box>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteDeliveryId(null);
        }}
        onConfirm={() =>
          deleteDeliveryId !== null && handleDelete(deleteDeliveryId)
        }
        variant="delete"
        title="Delete Request Delivery"
        message="Are you sure you want to delete this Request Delivery? This action cannot be undone."
      />

      {/* GatePassForm Dialog */}
      <GatePassForm
        open={isGatePassFormOpen}
        isEdit={false}
        editGatePassId={null}
        gatePasses={[]}
        setOpen={setGatePassFormOpen}
        setIsEdit={() => {}} // Not used since isEdit is always false
        setEditGatePassId={() => {}} // Not used since editGatePassId is null
        setDepositorFormOpen={() => {}} // Not used in this context
        selectedGatePasses={[]}
        setSelectedGatePasses={() => {}} // Not used in this context
        fetchGatePass={refetchDeliveries} // Pass refetch function to update delivery data after gate pass creation
        newValues={gatePassInitialValues} // Pass pre-filled values
      />

      <Card
        variant="outlined"
        sx={{
          boxShadow: "none",
          backgroundColor: "transparent",
          border: "none",
        }}
      >
        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Sr. No.
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Delivery Id
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  WHR NO.
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Customer
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Withdrawal Date
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Delivery Note Issue Date
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Ledger Page No.
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Weight
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Total Cost
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Bags/Sacks
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Delivery Note No.
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Status
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Locations
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deliveries?.result?.length > 0 ? (
                deliveries.result.map((item: any, index: number) => (
                  <TableRow
                    key={item.id}
                    sx={{
                      "&:nth-of-type(odd)": {
                        backgroundColor: (theme) => theme.palette.action.hover,
                      },
                      "&:hover": {
                        backgroundColor: (theme) =>
                          theme.palette.action.selected,
                      },
                    }}
                  >
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>
                      <Link
                        to={`/whr/${
                          requestDeposits?.result?.find(
                            (d: any) => d.id === item.deposit_reference_id
                          )?.id || `Deposit ${item.deposit_reference_id}`
                        }`}
                        state={{ item: item.id }}
                        style={{ textDecoration: "none" }}
                      >
                        {requestDeposits?.result?.find(
                          (d: any) => d.id === item.deposit_reference_id
                        )?.id || `Deposit ${item.deposit_reference_id}`}
                      </Link>
                    </TableCell>
                    <TableCell>{item?.deposit?.client?.name}</TableCell>
                    <TableCell>
                      {new Date(item.withdrawal_date).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(item.delivery_note_issue_date).toLocaleString()}
                    </TableCell>
                    <TableCell>{item.withdrawal_ledger_page_number}</TableCell>
                    <TableCell>
                      {item.measurment_or_weight} {item.weightUnit}
                    </TableCell>
                    <TableCell>{item.total_cost_of_goods}</TableCell>
                    <TableCell>
                      {item.details_of_number_of_bags_sacks}
                    </TableCell>
                    <TableCell>{item.delivery_note_number}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          textTransform: "capitalize",
                          color:
                            item.status === "Completed"
                              ? "success.main"
                              : item.status === "Partial"
                              ? "warning.main"
                              : "error.main",
                          fontWeight: "medium",
                        }}
                      >
                        {item.status || "Pending"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.gatePasses?.map((gp: any) => (
                        <Typography key={gp.id} variant="body2">
                          {`Warehouse: ${gp.warehouse?.name}, Godown: ${gp.godown?.name}, Stack: ${gp.stack?.name}`}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {/* {canUpdate('delivery') && (
                        <IconButton color="primary" onClick={() => handleEdit(item.id)} sx={{ color: '#6560F0' }}>
                          <Edit />
                        </IconButton>
                      )}
                      {canDelete('delivery') && (
                        <IconButton
                          sx={{ color: '#F44336' }}
                          onClick={() => {
                            setDeleteDeliveryId(item.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Delete />
                        </IconButton>
                      )} */}
                        {canCreate("gatepass") &&
                          (item.status === "Pending" || !item.status) && (
                            <IconButton
                              color="primary"
                              onClick={() => handleCreateGatePass(item)}
                              sx={{ color: "#00A676" }}
                              title="Create Gate Pass"
                            >
                              <Add />
                            </IconButton>
                          )}
                        <PDFDownloadLink
                          document={<DeliveryRequestPDF data={item} />}
                          fileName={`deposit_receipt_${item.id}.pdf`}
                        >
                          {({ loading }) => (
                            <IconButton color="primary" disabled={loading}>
                              <Print />
                            </IconButton>
                          )}
                        </PDFDownloadLink>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={14} align="center">
                    {isLoading ? "Loading..." : "No deliveries found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={deliveries?.pagination?.total || 0}
          page={page}
          onPageChange={(_e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>
    </Box>
  );
};

export default RequestDeliveryComp;
