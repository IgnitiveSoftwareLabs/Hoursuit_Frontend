import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import {
  Receipt,
  TrendingUp,
  MonetizationOn,
  Refresh,
  FileDownload,
} from "@mui/icons-material";
import ReportFilters from "../ReportFilters";
import ReportTable from "../ReportTable";
import StatCards from "../StatCards";
import type { StatCardData } from "../StatCards";
import {
  useGetRentCollectionQuery,
  useGetRentCollectionStatsQuery,
} from "../services/reportsApi";
import Layout from "../../Layout";
import type { RentCollectionData } from "../services/reportsApi";
import apiInstance from "../../../Services/apiservice/apiInstance";

const RentCollectionReport: React.FC = () => {
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    warehouseId: "",
    customerId: "",
    commodityId: "",
    status: "" as "" | "invoiced" | "pending",
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Handler functions for table pagination
  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Helper function to format date properly (avoiding timezone issues)
  const formatDateForAPI = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Prepare API filters
  const apiFilters = {
    ...filters,
    dateFrom: formatDateForAPI(filters.dateFrom),
    dateTo: formatDateForAPI(filters.dateTo),
    page: page + 1, // API expects 1-based page
    limit: rowsPerPage,
  };

  // API calls
  const {
    data: rentCollectionResponse,
    isLoading: loading,
    refetch: refetchRentCollection,
  } = useGetRentCollectionQuery(apiFilters);

  const { data: statsResponse, refetch: refetchStats } =
    useGetRentCollectionStatsQuery({
      dateFrom: formatDateForAPI(filters.dateFrom),
      dateTo: formatDateForAPI(filters.dateTo),
      warehouseId: filters.warehouseId || undefined,
      customerId: filters.customerId || undefined,
      commodityId: filters.commodityId || undefined,
      status: filters.status || undefined,
    });

  const data = rentCollectionResponse?.result || [];
  const totalCount = rentCollectionResponse?.pagination?.total || 0;
  const stats = statsResponse?.result;

  // Get currency from backend with proper default
  const currency = stats?.currency || "₹";

  // Loading state for statistics
  const isStatsLoading = !statsResponse || !stats;

  const statCards: StatCardData[] = [
    {
      title: "Total Bills",
      value: stats?.totalBills || 0,
      unit: "bills",
      trend: (stats?.billsTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.billsTrendValue || "0",
      icon: <Receipt />,
      color: "primary",
      subtitle: "Selected period",
    },
    {
      title: "Total Rent Amount",
      value: stats?.totalRentAmount || 0,
      unit: currency,
      trend: (stats?.amountTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.amountTrendValue || "0%",
      icon: <MonetizationOn />,
      color: "success",
      subtitle: "Selected period",
    },
    {
      title: "Invoiced Amount",
      value: stats?.invoicedAmount || 0,
      unit: currency,
      trend: (stats?.collectionTrend as "up" | "down" | "neutral") || "neutral",
      trendValue: stats?.collectionTrendValue || "0%",
      icon: <TrendingUp />,
      color: "info",
      subtitle: `${stats?.invoicedBills || 0} bills invoiced`,
    },
    {
      title: "Pending Amount",
      value: stats?.pendingAmount || 0,
      unit: currency,
      trend: "neutral",
      trendValue: "0%",
      icon: <Receipt />,
      color: "warning",
      subtitle: `${stats?.pendingBills || 0} bills pending`,
    },
  ];

  const columns = [
    {
      id: "id",
      label: "ID",
      sortable: true,
    },
    {
      id: "whrNo",
      label: "WHR No",
      sortable: true,
      render: (row: RentCollectionData) => (
        <Typography variant="body2" fontWeight="medium">
          {row.whrNo}
        </Typography>
      ),
    },
    {
      id: "customerName",
      label: "Customer",
      sortable: true,
      render: (row: RentCollectionData) => (
        <Typography variant="body2">{row.customerName}</Typography>
      ),
    },
    {
      id: "commodityName",
      label: "Commodity",
      sortable: true,
      render: (row: RentCollectionData) => (
        <Typography variant="body2">{row.commodityName}</Typography>
      ),
    },
    {
      id: "warehouseName",
      label: "Warehouse",
      sortable: true,
      render: (row: RentCollectionData) => (
        <Typography variant="body2">{row.warehouseName}</Typography>
      ),
    },
    {
      id: "weight",
      label: "Weight",
      sortable: true,
      align: "right" as const,
      render: (row: RentCollectionData) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {parseFloat(row.weight.toString()).toFixed(2)} {row.weightUnit}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Orig: {row.originalWeight} {row.originalWeightUnit}
          </Typography>
        </Box>
      ),
    },
    {
      id: "numberOfBags",
      label: "Bags",
      sortable: true,
      align: "center" as const,
      render: (row: RentCollectionData) => (
        <Typography variant="body2">{row.numberOfBags}</Typography>
      ),
    },
    {
      id: "period",
      label: "Period",
      sortable: false,
      render: (row: RentCollectionData) => (
        <Box>
          <Typography variant="body2">
            {new Date(row.fromDate).toLocaleDateString()} -{" "}
            {new Date(row.toDate).toLocaleDateString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.totalMonths} months
          </Typography>
        </Box>
      ),
    },
    {
      id: "rentRate",
      label: "Rate",
      sortable: true,
      align: "right" as const,
      render: (row: RentCollectionData) => (
        <Typography variant="body2">
          {currency}
          {parseFloat(row.rentRate.toString()).toFixed(2)}
        </Typography>
      ),
    },
    {
      id: "totalAmount",
      label: "Amount",
      sortable: true,
      align: "right" as const,
      render: (row: RentCollectionData) => (
        <Typography variant="body2" fontWeight="medium">
          {currency}
          {parseFloat(row.totalAmount.toString()).toFixed(2)}
        </Typography>
      ),
    },
    {
      id: "invoiceTotal",
      label: "Invoice Total",
      sortable: true,
      align: "right" as const,
      render: (row: RentCollectionData) => (
        <Typography variant="body2" fontWeight="medium" color="primary">
          {row.invoiceTotal ? (
            `${currency}${parseFloat(row.invoiceTotal.toString()).toFixed(2)}`
          ) : (
            <Typography variant="caption" color="text.secondary">
              Not invoiced
            </Typography>
          )}
        </Typography>
      ),
    },
    {
      id: "status",
      label: "Status",
      sortable: true,
      align: "center" as const,
      render: (row: RentCollectionData) => (
        <Chip
          label={row.status === "invoiced" ? "Invoiced" : "Pending"}
          color={row.status === "invoiced" ? "success" : "warning"}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: "invoiceInfo",
      label: "Invoice",
      sortable: false,
      render: (row: RentCollectionData) => (
        <Box>
          {row.invoiceId ? (
            <>
              <Typography variant="body2" fontWeight="medium">
                {row.invoiceNumber || `INV-${row.invoiceId}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {row.invoiceId}
              </Typography>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Not invoiced
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: "billDate",
      label: "Bill Date",
      sortable: true,
      render: (row: RentCollectionData) => (
        <Typography variant="body2">
          {new Date(row.billDate).toLocaleDateString()}
        </Typography>
      ),
    },
  ];

  const handleRefresh = () => {
    refetchRentCollection();
    refetchStats();
  };

  const handleExport = async () => {
    try {
      const exportData = {
        reportType: "rent-collection",
        format: "excel",
        filters: {
          dateFrom: formatDateForAPI(filters.dateFrom),
          dateTo: formatDateForAPI(filters.dateTo),
          warehouseId: filters.warehouseId || undefined,
          customerId: filters.customerId || undefined,
          commodityId: filters.commodityId || undefined,
          status: filters.status || undefined,
        },
      };

      // Use apiInstance for the request with responseType 'blob' for file download
      const response = await apiInstance.post("/reports/export", exportData, {
        responseType: "blob", // Important: tells axios to expect binary data
      });

      // Get the blob data from response
      const blob = response.data;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Get filename from response header or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `rent-collection-report-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("Rent collection Excel export completed successfully");
    } catch (error) {
      console.error("Error exporting rent collection report to Excel:", error);
    }
  };

  return (
    <Layout>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Rent Collection Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track rent collection, billing status, and invoice management
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<FileDownload />}
              onClick={handleExport}
              disabled={loading}
            >
              Export Excel
            </Button>
          </Stack>
        </Box>

        {/* Statistics Cards */}
        <Box sx={{ mb: 3 }}>
          {isStatsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Loading statistics...
              </Typography>
            </Box>
          ) : (
            <StatCards stats={statCards} />
          )}
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <ReportFilters
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={() => {}}
            />
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <ReportTable
              data={data}
              columns={columns}
              isLoading={loading}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              emptyMessage="No rent collection data found"
            />
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default RentCollectionReport;
