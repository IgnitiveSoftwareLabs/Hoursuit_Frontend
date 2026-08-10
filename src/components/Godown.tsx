import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useParams, useLocation, Link } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import toast from "react-hot-toast";
import {
  useCreateGodownMutation,
  useDeleteGodownMutation,
  useFetchGodownsQuery,
  useUpdateGodownMutation,
} from "../RTK/services/godownApi";
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
import ConfirmationDialog from "./Dialog/ConfirmationDialog";
import ReusableFormDialog from "./Dialog/ReusableFormDialog";
import { usePermissions } from "../Hooks/usePermissions";
import { BASE_URL } from "../utils/Base_Url";

const fields = [
  // Basic Information
  {
    name: "name",
    label: "Godown Name *",
    placeholder: "Enter godown name",
    gridSize: { xs: 12, sm: 12 },
  },
  {
    name: "location",
    label: "Location *",
    placeholder: "Enter location",
    gridSize: { xs: 12, sm: 6 },
  },

  // Capacity
  {
    name: "capacity",
    label: "Capacity *",
    placeholder: "Enter capacity",
    gridSize: { xs: 12, sm: 6 },
  },
  {
    name: "capacityUnit",
    label: "Capacity Unit *",
    placeholder: "Select unit",
    gridSize: { xs: 12, sm: 6 },
    type: "select",
    options: ["kg", "tons", "quintals", "liters"],
  },

  // Dimensions
  {
    name: "length",
    label: "Length *",
    placeholder: "Length",
    gridSize: { xs: 12, sm: 3 },
  },
  {
    name: "breadth",
    label: "Breadth *",
    placeholder: "Breadth",
    gridSize: { xs: 12, sm: 3 },
  },
  {
    name: "height",
    label: "Height *",
    placeholder: "Height",
    gridSize: { xs: 12, sm: 3 },
  },
  {
    name: "sizeUnit",
    label: "Size Unit *",
    placeholder: "Select unit",
    gridSize: { xs: 12, sm: 3 },
    type: "select",
    options: ["meters", "feet", "inches", "centimeters"],
  },

  {
    name: "autoCreateStacks",
    label: "Enable Auto Stack Creation",
    type: "checkbox",
    gridSize: { xs: 12 },
  },

  // Stack Template Configuration (Accordion)
  {
    name: "stackTemplate.capacity",
    label: "Stack Capacity *",
    placeholder: "Enter stack capacity",
    gridSize: { xs: 12, sm: 6 },
    accordion: "Auto Create Stacks",
  },
  {
    name: "stackTemplate.capacityUnit",
    label: "Capacity Unit *",
    placeholder: "Select unit",
    gridSize: { xs: 12, sm: 6 },
    accordion: "Auto Create Stacks",
    type: "select",
    options: ["kg", "tons", "quintals", "liters"],
  },
  {
    name: "stackTemplate.length",
    label: "Length *",
    placeholder: "Length",
    gridSize: { xs: 12, sm: 3 },
    accordion: "Auto Create Stacks",
  },
  {
    name: "stackTemplate.breadth",
    label: "Breadth *",
    placeholder: "Breadth",
    gridSize: { xs: 12, sm: 3 },
    accordion: "Auto Create Stacks",
  },
  {
    name: "stackTemplate.height",
    label: "Height *",
    placeholder: "Height",
    gridSize: { xs: 12, sm: 3 },
    accordion: "Auto Create Stacks",
  },
  {
    name: "stackTemplate.sizeUnit",
    label: "Size Unit *",
    placeholder: "Select unit",
    gridSize: { xs: 12, sm: 3 },
    accordion: "Auto Create Stacks",
    type: "select",
    options: ["meters", "feet", "inches", "centimeters"],
  },
];
const validationSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  capacity: Yup.number()
    .typeError("Capacity must be a number")
    .required("Capacity is required")
    .positive("Must be positive"),
  location: Yup.string().required("Location is required"),
  capacityUnit: Yup.string().required("Capacity unit is required"),
  length: Yup.number()
    .typeError("Length must be a number")
    .required("Length is required"),
  breadth: Yup.number()
    .typeError("Breadth must be a number")
    .required("Breadth is required"),
  height: Yup.number()
    .typeError("Height must be a number")
    .required("Height is required"),
  sizeUnit: Yup.string().required("Size unit is required"),
  autoCreateStacks: Yup.boolean(),
  stackTemplate: Yup.object().when(
    "autoCreateStacks",
    (autoCreateStacks, schema) => {
      return Boolean(autoCreateStacks[0]) === true
        ? schema.shape({
          capacity: Yup.number()
            .typeError("Required")
            .required("Required")
            .positive("Must be positive")
            .test(
              "capacity-not-greater",
              "Stack capacity cannot exceed godown capacity",
              function (value) {
                const godownCapacity = this.options.context?.capacity;
                return value <= godownCapacity;
              }
            ),
          capacityUnit: Yup.string()
            .required("Required")
            .test(
              "unit-match",
              "Stack capacity unit must match godown unit",
              function (value) {
                const godownCapacityUnit = this.options.context?.capacityUnit;
                return value === godownCapacityUnit;
              }
            ),
          length: Yup.number()
            .typeError("Required")
            .required("Required")
            .positive("Must be positive")
            .test(
              "length-not-greater",
              "Stack length cannot exceed godown length",
              function (value) {
                const godownLength = this.options.context?.length;
                return value <= godownLength;
              }
            ),
          breadth: Yup.number()
            .typeError("Required")
            .required("Required")
            .positive("Must be positive")
            .test(
              "breadth-not-greater",
              "Stack breadth cannot exceed godown breadth",
              function (value) {
                const godownBreadth = this.options.context?.breadth;
                return value <= godownBreadth;
              }
            ),
          height: Yup.number()
            .typeError("Required")
            .required("Required")
            .positive("Must be positive")
            .test(
              "height-not-greater",
              "Stack height cannot exceed godown height",
              function (value) {
                const godownHeight = this.options.context?.height;
                return value <= godownHeight;
              }
            ),
          sizeUnit: Yup.string()
            .required("Required")
            .test(
              "size-unit-match",
              "Stack size unit must match godown size unit",
              function (value) {
                const godownSizeUnit = this.options.context?.sizeUnit;
                return value === godownSizeUnit;
              }
            ),
        })
        : schema.nullable();
    }
  ),
});

interface GodownType {
  autoCreateStacks?: boolean | undefined;
  id?: number;
  name: string;
  capacity: string;
  location?: string;
  capacityUnit?: string;
  length?: string;
  breadth?: string;
  height?: string;
  sizeUnit?: string;
  WarehouseId?: number;
  stackTemplate?: {
    capacity?: string;
    capacityUnit?: string;
    length?: string;
    breadth?: string;
    height?: string;
    sizeUnit?: string;
  } | null;
}

interface WarehouseType {
  id: number;
  name: string;
  location: string;
  CompanyId?: number;
  licenseNumber?: string;
  attachments?: any;
}
const limit = 10;
const Godowns: React.FC = () => {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions();

  const { id } = useParams<{ id: string }>(); // Warehouse ID from URL
  const location = useLocation();
  const warehouseData = location.state?.item as WarehouseType | undefined;
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isOpen, setOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [editGodownId, setEditGodownId] = useState<number | null>(null);
  const [deleteGodownId, setDeleteGodownId] = useState<number | null>(null);

  const warehouseId = Number(id);
  const [page, setPage] = useState(1);

  const { data: godowns } = useFetchGodownsQuery({ warehouseId, page, limit });

  const [createGodown] = useCreateGodownMutation();
  const [updateGodown] = useUpdateGodownMutation();
  const [deleteGodown, { isLoading: isDeleting }] = useDeleteGodownMutation();

  const formik = useFormik<GodownType>({
    initialValues: {
      name: "",
      capacity: "",
      location: "",
      capacityUnit: "",
      length: "",
      breadth: "",
      height: "",
      sizeUnit: "",
      WarehouseId: warehouseId,
      autoCreateStacks: false,
      stackTemplate: {
        capacity: "",
        capacityUnit: "",
        length: "",
        breadth: "",
        height: "",
        sizeUnit: "",
      },
    },
    validationSchema: validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        const payload = { ...values, WarehouseId: warehouseId };

        if (isEdit && editGodownId) {
          if (!canUpdate("godown")) {
            toast.error("You do not have permission to update godowns");
            return;
          }
          await updateGodown({ id: editGodownId, ...payload }).unwrap();
          toast.success("Godown updated successfully");
        } else {
          if (!canCreate("godown")) {
            toast.error("You do not have permission to create godowns");
            return;
          }
          await createGodown(payload).unwrap();
          toast.success("Godown created successfully");
        }

        setOpen(false);
        setIsEdit(false);
        formik.resetForm();
      } catch (error: any) {
        toast.error(error.data?.message || "Something went wrong");
      }
    },
  });

  const handleDelete = async (godownId: number) => {
    if (!canDelete("godown")) {
      toast.error("You do not have permission to delete godowns");
      return;
    }

    try {
      await deleteGodown(godownId).unwrap();
      toast.success("Godown deleted successfully");
      setDeleteDialogOpen(false);
      setDeleteGodownId(null);
    } catch (error) {
      toast.error("Failed to delete godown");
    }
  };

  const handleEdit = (id: number) => {
    if (!canUpdate("godown")) {
      toast.error("You do not have permission to edit godowns");
      return;
    }

    const godownToEdit = godowns?.result?.find((item: any) => item.id === id);
    if (godownToEdit) {
      formik.setValues({
        name: godownToEdit.name,
        capacity: godownToEdit.capacity,
        location: godownToEdit.location || "",
        capacityUnit: godownToEdit.capacityUnit || "",
        length: godownToEdit.length?.toString() || "",
        breadth: godownToEdit.breadth?.toString() || "",
        height: godownToEdit.height?.toString() || "",
        sizeUnit: godownToEdit.sizeUnit || "",
        WarehouseId: godownToEdit.WarehouseId || warehouseId,
      });
      setEditGodownId(id);
      setIsEdit(true);
      setOpen(true);
    }
  };

  const handleAddGodown = () => {
    if (!canCreate("godown")) {
      toast.error("You do not have permission to create godowns");
      return;
    }

    setOpen(true);
    setIsEdit(false);
    formik.resetForm();
  };

  if (!canRead("godown")) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <Typography variant="h6" color="error">
            Access Denied: You do not have permission to view godowns.
          </Typography>
        </Box>
      </Box>
    );
  }

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
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Godowns for Warehouse: {warehouseData?.name || "Loading..."}
          </Typography>
          <NavbarBreadcrumbs />
        </Box>
        {canCreate("godown") && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddGodown}
            sx={{ textTransform: "none" }}
          >
            <Add sx={{ mr: 1 }} /> Add Godown
          </Button>
        )}
      </Box>

      {/* Warehouse Details */}
      {warehouseData && (
        <Card
          variant="outlined"
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            backgroundColor: (theme) => theme.palette.background.paper,
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Warehouse Details
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "row", gap: 5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Name:
                </Typography>
                <Typography variant="body1">{warehouseData.name}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Location:
                </Typography>
                <Typography variant="body1">
                  {warehouseData.location}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  License Number:
                </Typography>
                <Typography variant="body1">
                  {warehouseData.licenseNumber || "Not provided"}
                </Typography>
              </Box>
              <Box>
                {warehouseData.attachments?.length > 0 ? (
                  warehouseData.attachments.map(
                    (attachment: any, index: number) => (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Type: {attachment.type}
                        </Typography>
                        <a
                          key={index}
                          href={`${BASE_URL}/${attachment.filePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#1976d2",
                            textDecoration: "none",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          View / Download
                        </a>
                      </>
                    )
                  )
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No attachments available.
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <ReusableFormDialog
        open={isOpen}
        title={isEdit ? "Edit Godown" : "Add Godown"}
        formik={formik}
        onClose={() => setOpen(false)}
        isEdit={isEdit}
        fields={fields}
        accordionSections={["Auto Create Stacks"]}
        showAccordion={formik.values.autoCreateStacks}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteGodownId(null);
        }}
        onConfirm={() => {
          if (deleteGodownId !== null) {
            handleDelete(deleteGodownId);
          }
        }}
        variant="delete"
        title="Delete Godown"
        message={`Are you sure you want to delete Godown? This action cannot be undone.`}
        loading={isDeleting}
      />
      {/* Godowns Table */}
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
                <TableCell sx={{ textTransform: "uppercase" }}>Name</TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Capacity
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Available Capacity
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Location
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Length
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Breadth
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Height
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Size Unit
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {godowns?.result?.map((item: any, index: number) => (
                <TableRow
                  key={item.id}
                  sx={{
                    "&:nth-of-type(odd)": {
                      backgroundColor: (theme) => theme.palette.action.hover,
                    },
                    "&:hover": {
                      backgroundColor: (theme) => theme.palette.action.selected,
                    },
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Link
                      to={`/warehouses/${item.WarehouseId}/godown/${item.id}`}
                      state={{ item, warehouseData }}
                      style={{ textDecoration: "none" }}
                    >
                      {item.name}
                    </Link>
                  </TableCell>

                  <TableCell>
                    {item.capacity} {item.capacityUnit}
                  </TableCell>
                  <TableCell>
                    {item.availableCapacity} {item.capacityUnit}
                  </TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>{item.length}</TableCell>
                  <TableCell>{item.breadth}</TableCell>
                  <TableCell>{item.height}</TableCell>
                  <TableCell>{item.sizeUnit}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {canUpdate("godown") && (
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(item.id)}
                        >
                          <Edit />
                        </IconButton>
                      )}
                      {canDelete("godown") && (
                        <IconButton
                          color="error"
                          onClick={() => {
                            setDeleteGodownId(item.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default Godowns;
