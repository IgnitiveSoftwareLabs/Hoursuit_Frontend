import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

// Enhanced styles with modern design
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    lineHeight: 1.4,
  },
  header: {
    borderBottom: "3px solid #2563eb",
    marginBottom: 25,
    paddingBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2563eb",
    letterSpacing: 1,
    marginBottom: 5,
  },
  companySection: {
    textAlign: "right",
    maxWidth: "40%",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  companyDetail: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 3,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    gap: 20,
  },
  detailCard: {
    width: "47%",
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 8,
    border: "1px solid #e2e8f0",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: "2px solid #2563eb",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#475569",
    width: "35%",
    marginRight: 8,
  },
  detailValue: {
    fontSize: 9,
    color: "#1e293b",
    flex: 1,
  },
  tableSection: {
    marginBottom: 25,
  },
  tableTitleContainer: {
    backgroundColor: "#1e293b",
    padding: 12,
    marginBottom: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
  },
  tableDataRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1e293b",
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    textAlign: "center",
    flex: 1,
  },
  tableCell: {
    fontSize: 8,
    color: "#374151",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    textAlign: "center",
    flex: 1,
  },
  lastHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1e293b",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    textAlign: "center",
    flex: 1,
  },
  lastCell: {
    fontSize: 8,
    color: "#374151",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    textAlign: "center",
    flex: 1,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 30,
  },
  totalCard: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 8,
    minWidth: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 12,
    color: "#bfdbfe",
  },
  totalValue: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "bold",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid #bfdbfe",
  },
  footer: {
    borderTop: "2px solid #e2e8f0",
    paddingTop: 20,
    marginTop: "auto",
    textAlign: "center",
  },
  thankYouText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 8,
  },
  footerNote: {
    fontSize: 8,
    color: "#64748b",
    fontStyle: "italic",
    marginBottom: 5,
  },
  highlightAmount: {
    backgroundColor: "#fef3c7",
    padding: 2,
    borderRadius: 3,
    color: "#92400e",
    fontWeight: "bold",
  },
});

// PDF component
export const InvoicePDF: React.FC<{ invoice: any }> = ({ invoice }) => {
  const bills = invoice.bills;
  const customer = invoice.customer;
  const company = invoice.company;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };


  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
          </View>
          <View style={styles.companySection}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companyDetail}>GST: {company.gstNumber}</Text>
            <Text style={styles.companyDetail}>Ph: {company.phone}</Text>
            <Text style={styles.companyDetail}>{company.address}</Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Customer Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>
                {customer.name} ({customer.category})
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact:</Text>
              <Text style={styles.detailValue}>{customer.contact}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{customer.email}</Text>
            </View>
            {customer.gstNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>GST:</Text>
                <Text style={styles.detailValue}>{customer.gstNumber}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>
                {[
                  customer.address,
                  customer.village,
                  customer.tehsil,
                  customer.district,
                  customer.city,
                  customer.state,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Invoice Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice #:</Text>
              <Text style={styles.detailValue}>{invoice.invoice_number}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.createdAt)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>Generated</Text>
            </View>
          </View>
        </View>

        {/* Table Section */}
        <View style={styles.tableSection}>
          <View style={styles.tableTitleContainer}>
            <Text style={styles.tableTitle}>Bill Details</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.tableHeaderCell}>WHR No</Text>
              <Text style={styles.tableHeaderCell}>Delivery</Text>
              <Text style={styles.tableHeaderCell}>Commodity</Text>
              <Text style={styles.tableHeaderCell}>Bags</Text>
              <Text style={styles.tableHeaderCell}>Weight</Text>
              <Text style={styles.tableHeaderCell}>Period</Text>
              <Text style={styles.tableHeaderCell}>Rate</Text>
              <Text style={styles.lastHeaderCell}>Amount</Text>
            </View>
            {bills.map((bill: any, index: number) => (
              <View style={styles.tableDataRow} key={index}>
                <Text style={styles.tableCell}>{bill.whr_no}</Text>
                <Text style={styles.tableCell}>{bill.delivery}</Text>
                <Text style={styles.tableCell}>{bill.commodityDetail.name}</Text>
                <Text style={styles.tableCell}>{bill.no_of_bags}</Text>
                <Text style={styles.tableCell}>
                  {bill.weight} {bill.weight_unit}
                </Text>
                <Text style={styles.tableCell}>
                  {formatDate(bill.from)} - {formatDate(bill.to)} (
                  {bill.total_months_of_period} months)
                </Text>
                <Text style={styles.tableCell}>
                  ₹{bill.requestDepositer.rent_amount} /{" "}
                  {bill.rentDetail.rate_unit}
                </Text>
                <Text style={styles.lastCell}>
                  <Text style={styles.highlightAmount}>
                    {bill.amount}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total Section */}
        <View style={styles.totalContainer}>
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>
                {invoice.subtotal}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {/* GST ({invoice.gst_percentage}%): */}
                {invoice.gst_percentage ? `GST (${invoice.gst_percentage}%):` : ""}
              </Text>
              <Text style={styles.totalValue}>
                {/* {invoice.gst_amount} */}
                {invoice.gst_percentage ? invoice.gst_amount : ""}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>
                {invoice.total_amount}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          <Text style={styles.thankYouText}>Thank you for your business!</Text>
          <Text style={styles.footerNote}>This is a computer-generated invoice.</Text>
          <Text style={styles.footerNote}>
            For any queries, please contact us at {company.phone}
          </Text>
        </View>
      </Page>
    </Document>
  );
};