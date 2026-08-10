import type { } from "@mui/x-date-pickers/themeAugmentation";
import type { } from "@mui/x-charts/themeAugmentation";
import type { } from "@mui/x-data-grid-pro/themeAugmentation";
import type { } from "@mui/x-tree-view/themeAugmentation";
import Layout from "../../components/Layout/index";
import CompanyInfo from "../../Common/ProfileComponent";
import { useGetSingleCustomerQuery } from "../../RTK/services/customerApi";
import { useParams } from "react-router-dom";
import Spinner from "../../Common/Spinner";
import { BASE_URL } from "../../utils/Base_Url";

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const customerId = id ? id : ""; // Ensure customerId is always a string
  const {
    data: customer,
    error,
    isLoading,
    isError,
  } = useGetSingleCustomerQuery(customerId);

  if (isLoading) {
    return (
      <div style={{ height: "100vh" }}>
        <Spinner centered size={60} color="secondary" />
      </div>
    );
  }
  if (isError)
    return <p>Error: {(error as any)?.message || "Failed to load customer"}</p>;
  const customerResult = customer?.result;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const attachments = (customerResult?.attachments || []).map(
    (attachment: any) => ({
      label: attachment.type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char: string) => char.toUpperCase()), // e.g., "farmer_photo" -> "Farmer Photo"
      value: `<a href="${BASE_URL}/${attachment.filePath}" target="_blank" rel="noopener noreferrer">${attachment.fileName}</a>`,
    })
  );

  const companyData = {
    companyName: customerResult?.name || "N/A",
    fields: [
      ...Object.entries(customerResult || {})
        .filter(([key]) => key !== "name" && key !== "attachments")
        .map(([key, value]) => {
          let formattedValue = value;

          if (
            (key === "createdAt" || key === "updatedAt") &&
            typeof value === "string"
          ) {
            formattedValue = formatDate(value);
          }

          return {
            label: key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase()),
            value: String(formattedValue),
          };
        }),
      ...attachments, // Append formatted attachments here
    ],
  };

  return (
    <Layout>
      <CompanyInfo title="Customer Profile" {...companyData} />
    </Layout>
  );
}
