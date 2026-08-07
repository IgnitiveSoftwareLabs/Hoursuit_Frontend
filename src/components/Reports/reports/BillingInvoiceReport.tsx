import React, { useState } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import {
  Receipt as InvoiceIcon,
  AttachMoney as AmountIcon,
  AccountBalance as PaidIcon,
  PendingActions as PendingIcon,
} from "@mui/icons-material";
import ReportFilters from "../ReportFilters";
import ReportTable from "../ReportTable";
import StatCards from "../StatCards";
import type { StatCardData } from "../StatCards";
import {
  useGetBillingInvoicesQuery,
  useGetBillingInvoiceStatsQuery,
} from "../services/reportsApi";
import Layout from "../../Layout";
import apiInstance from "../../../Services/apiservice/apiInstance";

const BillingInvoiceReport: React.FC = () => {
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    customerId: "",
    status: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to format date properly (avoiding timezone issues)
  const formatDateForAPI = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Prepare API query parameters
  const queryParams = {
    dateFrom: filters.dateFrom?.toISOString().split("T")[0],
    dateTo: filters.dateTo?.toISOString().split("T")[0],
    customerId: filters.customerId || undefined,
    invoiceStatus: (filters.status || "") as
      | ""
      | "paid"
      | "partial"
      | "pending",
    page: page + 1,
    limit: rowsPerPage,
  };

  // API calls with refetch capability
  const {
    data: billingData,
    isLoading,
    refetch: refetchBillingData,
  } = useGetBillingInvoicesQuery(queryParams);

  const { data: statsData, refetch: refetchStatsData } =
    useGetBillingInvoiceStatsQuery({
      dateFrom: filters.dateFrom?.toISOString().split("T")[0],
      dateTo: filters.dateTo?.toISOString().split("T")[0],
      customerId: filters.customerId || undefined,
      invoiceStatus: (filters.status || "") as
        | ""
        | "paid"
        | "partial"
        | "pending",
    });

  const invoices = billingData?.result || [];
  const stats = statsData?.result;

  const statCards: StatCardData[] = [
    {
      title: "Total Invoices",
      value: stats?.totalInvoices || 0,
      trend: "neutral",
      trendValue: `${stats?.totalInvoices || 0} invoices`,
      icon: <InvoiceIcon />,
      color: "primary",
      subtitle: "This period",
    },
    {
      title: "Total Amount",
      value: stats?.totalInvoiceAmount || 0,
      unit: "₹",
      trend: "neutral",
      trendValue: `₹${(stats?.totalInvoiceAmount || 0).toLocaleString()}`,
      icon: <AmountIcon />,
      color: "success",
      subtitle: "Total invoice value",
    },
    {
      title: "Average Invoice",
      value: stats?.averageInvoiceValue || 0,
      unit: "₹",
      trend: "neutral",
      trendValue: `₹${(stats?.averageInvoiceValue || 0).toLocaleString()}`,
      icon: <PaidIcon />,
      color: "info",
      subtitle: "Average per invoice",
    },
    {
      title: "Outstanding Amount",
      value: stats?.totalOutstanding || 0,
      unit: "₹",
      trend: (stats?.totalOutstanding || 0) > 0 ? "down" : "neutral",
      trendValue: `₹${(stats?.totalOutstanding || 0).toLocaleString()}`,
      icon: <PendingIcon />,
      color: "warning",
      subtitle: "Pending payments",
    },
  ];
  const columns = [
    { id: "invoiceNumber", label: "Invoice No", sortable: true, minWidth: 120 },
    { id: "invoiceDate", label: "Invoice Date", sortable: true, minWidth: 120 },
    { id: "customerName", label: "Customer", sortable: true, minWidth: 150 },
    {
      id: "totalBills",
      label: "Bills Count",
      sortable: true,
      minWidth: 100,
      align: "center" as const,
    },
    {
      id: "totalAmount",
      label: "Total Amount (₹)",
      sortable: true,
      minWidth: 140,
      align: "right" as const,
      format: (value: number | string) =>
        `₹${(Number(value) || 0).toLocaleString()}`,
    },
    {
      id: "totalPaidAmount",
      label: "Paid Amount (₹)",
      sortable: true,
      minWidth: 140,
      align: "right" as const,
      format: (value: number | string) =>
        `₹${(Number(value) || 0).toLocaleString()}`,
    },
    {
      id: "subtotal",
      label: "Subtotal (₹)",
      sortable: true,
      minWidth: 130,
      align: "right" as const,
      format: (value: number | string) =>
        `₹${(Number(value) || 0).toLocaleString()}`,
    },
    {
      id: "gstAmount",
      label: "GST Amount (₹)",
      sortable: true,
      minWidth: 140,
      align: "right" as const,
      format: (value: number | string) =>
        `₹${(Number(value) || 0).toLocaleString()}`,
    },

    {
      id: "outstandingAmount",
      label: "Outstanding (₹)",
      sortable: true,
      minWidth: 140,
      align: "right" as const,
      format: (value: number | string) =>
        `₹${(Number(value) || 0).toLocaleString()}`,
    },
    {
      id: "paymentStatus",
      label: "Payment Status",
      sortable: true,
      minWidth: 120,
      format: (value: string) => {
        const statusColors = {
          paid: "#4caf50",
          partial: "#ff9800",
          pending: "#f44336",
        };
        return (
          <span
            style={{
              color: statusColors[value as keyof typeof statusColors] || "#666",
              fontWeight: 500,
              textTransform: "capitalize",
            }}
          >
            {value}
          </span>
        );
      },
    },
  ];

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleApplyFilters = () => {
    // RTK Query will automatically refetch when filters change
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refetch both billing data and stats
      await Promise.all([refetchBillingData(), refetchStatsData()]);
      console.log("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      console.log("Exporting billing invoice report in Excel format");

      const exportData = {
        reportType: "billing-invoice",
        format: "excel",
        filters: {
          dateFrom: formatDateForAPI(filters.dateFrom),
          dateTo: formatDateForAPI(filters.dateTo),
          customerId: filters.customerId || undefined,
          invoiceStatus: filters.status || undefined,
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
      let filename = `billing-invoice-report-${
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

      console.log("Excel export completed successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      // You might want to show a toast notification here
      alert("Failed to export Excel file. Please try again.");
    }
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleView = (row: any) => {
    console.log("View invoice details:", row);
    // TODO: Implement view functionality - could open invoice details modal
  };

  return (
    <Layout>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Typography variant="h4" gutterBottom>
          Billing & Invoice Report
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Comprehensive overview of invoices with billing details, payment
          status, and financial metrics
        </Typography>

        <StatCards stats={statCards} />

        <Card>
          <CardContent>
            <ReportFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApplyFilters={handleApplyFilters}
              onRefresh={handleRefresh}
              onExportExcel={handleExportExcel}
              showDateRange={true}
              showCustomer={true}
              showWarehouse={false}
              showCommodity={false}
              showStatus={true}
              statusOptions={[
                { value: "", label: "All Status" },
                { value: "paid", label: "Paid" },
                { value: "partial", label: "Partial" },
                { value: "pending", label: "Pending" },
              ]}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
            />

            <ReportTable
              columns={columns}
              data={invoices}
              isLoading={isLoading}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={billingData?.pagination?.total || 0}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onView={handleView}
              showActions={true}
              emptyMessage="No invoices found for the selected filters"
            />
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default BillingInvoiceReport;
