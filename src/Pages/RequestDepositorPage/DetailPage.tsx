import type { } from "@mui/x-date-pickers/themeAugmentation";
import type { } from "@mui/x-charts/themeAugmentation";
import type { } from "@mui/x-data-grid-pro/themeAugmentation";
import type { } from "@mui/x-tree-view/themeAugmentation";
import Layout from "../../components/Layout/index";
import CompanyInfo from "../../Common/ProfileComponent";
import { useParams } from "react-router-dom";
import Spinner from "../../Common/Spinner";
import { useFetchSingleRequestDepositorQuery } from "../../RTK/services/requestDepositorApi";

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const requestId = id ? id : ""; // Ensure requestId is always a string
  const {
    data: requests,
    error,
    isLoading,
    isError,
  } = useFetchSingleRequestDepositorQuery(requestId);

  if (isLoading) {
    return (
      <div style={{ height: "100vh" }}>
        <Spinner centered size={60} color="secondary" />
      </div>
    );
  }
  if (isError)
    return <p>Error: {(error as any)?.message || "Failed to load request"}</p>;
  const requestsResult = requests?.result;
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

  const getDisplayValue = (key: string, value: any) => {
    if (
      typeof value === "string" &&
      (key.toLowerCase().includes("date") ||
        key.toLowerCase().includes("created") ||
        key.toLowerCase().includes("updated"))
    ) {
      return formatDate(value);
    } else if (typeof value === "object" && value !== null) {
      // Try to extract a single meaningful value (like name)
      const nestedValue = Object.values(value)[0];
      return typeof nestedValue === "string" || typeof nestedValue === "number"
        ? nestedValue
        : JSON.stringify(nestedValue);
    }
    return value?.toString() ?? "N/A";
  };

  const attachments = (requestsResult?.attachments || []).map(
    (attachment: any) => ({
      label: attachment.type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char: string) => char.toUpperCase()),
      value: `<a href="http://localhost:8004/${attachment.filePath}" target="_blank" rel="noopener noreferrer">${attachment.fileName}</a>`,
    })
  );
  const gatePasses = (requestsResult?.gatePasses || []).map(
    (pass: any, index: number) => ({
      label: `Gate Pass ${index + 1}`,
      value: `
          <div>
            <strong>Vehicle Number:</strong> ${pass.vehicle_number}<br />
            <strong>Warehouse Name:</strong> ${pass.warehouse.warehouseName
        }<br />
            <strong>Godown Name:</strong> ${pass.godown.godownName}<br />
            <strong>Stack Name:</strong> ${pass.stack.stackName}<br />
            <strong>No. of Bags:</strong> ${pass.no_of_bags}<br />
            <strong>Weight:</strong> ${pass.weight} ${pass.weightUnit}<br />
            <strong>Status:</strong> ${pass.status}<br />
            <strong>In Time:</strong> ${formatDate(pass.in_time)}<br />
            <strong>Out Time:</strong> ${formatDate(pass.out_time)}<br />
          </div>
        `,
    })
  );
  const deliveries = (requestsResult?.deliveries || []).map(
    (delivery: any, index: number) => ({
      label: `Delivery ${index + 1}`,
      value: `
          <div>
            <strong>Delivery Note Number:</strong> ${delivery.delivery_note_number
        }<br />
            <strong>Withdrawal Date:</strong> ${formatDate(
          delivery.withdrawal_date
        )}<br />
            <strong>Delivery Note Issue Date:</strong> ${formatDate(
          delivery.delivery_note_issue_date
        )}<br />
            <strong>No. of Bags:</strong> ${delivery.details_of_number_of_bags_sacks
        }<br />
            <strong>Weight:</strong> ${delivery.measurment_or_weight} ${delivery.weightUnit
        }<br />
            <strong>Total Cost:</strong> ${delivery.total_cost_of_goods}<br />
            <strong>Withdrawal Ledger Page:</strong> ${delivery.withdrawal_ledger_page_number
        }<br />
          </div>
        `,
    })
  );

  const generateFields = (data: Record<string, any>) => {
    return Object.entries(data)
      .filter(
        ([key]) =>
          key !== "attachments" &&
          key !== "gatePasses" &&
          key !== "deliveries" &&
          key !== "weightUnit"
      )
      .map(([key, value]) => {
        const label = key
          .replace(/_/g, " ") // snake_case → snake case
          .replace(/([A-Z])/g, " $1") // camelCase → camel Case
          .replace(/\s+/g, " ") // collapse multiple spaces
          .replace(/^./, (str) => str.toUpperCase());

        let displayValue = getDisplayValue(key, value);

        // Combine measurement_or_weight with weightUnit
        if (key === "measurment_or_weight" || key === "measurement_or_weight") {
          const weightUnit = data.weightUnit || data.weight_unit || "";
          displayValue = weightUnit
            ? `${value} ${weightUnit}`
            : value?.toString() ?? "N/A";
        }

        return {
          label,
          value: displayValue,
        };
      });
  };

  const companyData = {
    companyName: requestsResult?.id || "N/A", // or any unique field to display
    fields: [
      ...generateFields(requestsResult || {}),
      ...attachments, // Append attachments at the end
      ...gatePasses,
      ...deliveries,
    ],
  };

  return (
    <Layout>
      <CompanyInfo title="Request Detail" {...companyData} />
    </Layout>
  );
}
