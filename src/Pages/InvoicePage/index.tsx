import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import DynamicTable from "../../components/Tables";
import { useGetInvoicesQuery } from "../../RTK/services/invoiceApi";
import { InvoicePDF } from "../../components/Print/InvoicePrint";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Print } from "@mui/icons-material";
import { usePermissions } from "../../Hooks/usePermissions";

const InvoiceComp: React.FC = () => {
  const [page, setPage] = React.useState(1);
  const { canRead } = usePermissions();

  // Check read permission for invoices
  if (!canRead('invoice')) {
    return (
      <Layout>
        <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
          <Typography variant="h4" sx={{ textAlign: 'center', mt: 4, color: 'error.main' }}>
            Access Denied: Insufficient permissions to view invoices
          </Typography>
        </Box>
      </Layout>
    );
  }

  const { data: invoices } = useGetInvoicesQuery({ page });

  const columns = [
    { key: "invoice_number", label: "Invoice Number" },
    {
      key: "customer",
      label: "Customer Name",
      render: (row: any) => row.customer?.name || "N/A",
    },
    {
      key: "subtotal",
      label: "Subtotal",
      render: (row: any) => `₹${row.subtotal.toFixed(2)}`,
    },
    {
      key: "gst_percentage",
      label: "GST Percentage",
      render: (row: any) => (row.gst_percentage ? `${row.gst_percentage}%` : "N/A"),
    },
    {
      key: "gst_amount",
      label: "GST Amount",
      render: (row: any) => `₹${row.gst_amount.toFixed(2)}`,
    },
    {
      key: "total_amount",
      label: "Total Amount",
      render: (row: any) => `₹${row.total_amount.toFixed(2)}`,
    },
    {
      key: "bills",
      label: "Number of Bills",
      render: (row: any) => row.bills?.length || 0,
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (row: any) =>
        new Date(row.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "Print Invoice",
      label: "Actions",
      render: (row: any) => (
        <PDFDownloadLink
          document={<InvoicePDF invoice={row} />}
          fileName={`Invoice_${row.invoice_number}.pdf`}
        >
          {({ loading }) => (
            <IconButton color="primary" disabled={loading}>
              <Print />
            </IconButton>
          )}
        </PDFDownloadLink>
      ),
    },
  ];

  return (
    <Layout>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Typography variant="h3" gutterBottom>
          Invoices
        </Typography>
        <DynamicTable
          columns={columns}
          data={invoices?.result || []}
          getRowId={(row) => row.id}
          page={page}
        totalPages={invoices?.pagination?.totalPages || 1}
        onPageChange={(_event, value) => setPage(value)}
        />
      </Box>
    </Layout>
  );
};

export default InvoiceComp;