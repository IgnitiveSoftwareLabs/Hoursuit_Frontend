import { useEffect, useRef, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AppTheme from "../../shared-theme/AppTheme";
import AppLayout from "./AppLayout";
import { useFetchCompanyQuery } from "../../RTK/services/companyApi";

export default function Layout({ children, disableCustomTheme }: any) {
  const { data: companyData, isLoading } = useFetchCompanyQuery();
  const [reminders, setReminders] = useState<any[]>([]);
  const [openReminder, setOpenReminder] = useState(false);

  const generateReminderKey = (reminders: any[]) => {
    const sortedReminders = reminders
      .map((r) => `${r.category}-${r.name}-${r.validTill}`)
      .sort()
      .join("|");
    return `reminder_skip_${btoa(sortedReminders)}`;
  };

  const shouldSkipReminders = (reminders: any[]) => {
    if (reminders.length === 0) return true;
    const reminderKey = generateReminderKey(reminders);
    return localStorage.getItem(reminderKey) === "true";
  };

  const handleSkipReminders = () => {
    if (reminders.length > 0) {
      const reminderKey = generateReminderKey(reminders);
      localStorage.setItem(reminderKey, "true");
      setOpenReminder(false);
    }
  };

  const clearAllSkippedReminders = () => {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("reminder_skip_")
    );
    keys.forEach((key) => localStorage.removeItem(key));
  };

  useEffect(() => {
    (window as any).clearAllSkippedReminders = clearAllSkippedReminders;
  }, []);

  const checkExpiry = (validTill: string, type: string) => {
    if (!validTill) return null;
    const today = new Date();
    const expiryDate = new Date(validTill);
    const diffDays = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return { type, status: "Expired", days: diffDays };
    } else if (diffDays <= 30) {
      return { type, status: "Expiring Soon", days: diffDays };
    }
    return null;
  };

  useEffect(() => {
    if (!isLoading && companyData?.result) {
      const alerts: any[] = [];

      if (companyData.result.attachments?.length) {
        companyData.result.attachments.forEach((doc: any) => {
          const alert = checkExpiry(doc.validTill, doc.type.replace(/_/g, " "));
          if (alert) {
            alerts.push({
              ...alert,
              category: "Company Document",
              name: doc.type.replace(/_/g, " "),
              validTill: doc.validTill,
            });
          }
        });
      }

      if (companyData.result.expiringInsurances?.length) {
        companyData.result.expiringInsurances.forEach((insurance: any) => {
          const alert = checkExpiry(insurance.end_date, "Insurance");
          if (alert) {
            alerts.push({
              ...alert,
              category: "Insurance",
              name: insurance.insurance_company_name,
              validTill: insurance.end_date,
              amount: insurance.amount_for_insurance,
            });
          }
        });
      }

      if (companyData.result.expiringWarehouseAttachments?.length) {
        companyData.result.expiringWarehouseAttachments.forEach(
          (attachment: any) => {
            const alert = checkExpiry(
              attachment.validTill,
              "Warehouse Document"
            );
            if (alert) {
              alerts.push({
                ...alert,
                category: "Warehouse Document",
                name: `${attachment.type.replace(/_/g, " ")} - ${
                  attachment.warehouseName
                }`,
                validTill: attachment.validTill,
                warehouseName: attachment.warehouseName,
              });
            }
          }
        );
      }

      if (alerts.length > 0) {
        setReminders(alerts);
        if (!shouldSkipReminders(alerts)) {
          setOpenReminder(true);
        }
      }
    }
  }, [companyData, isLoading]);

  return (
    <AppTheme {...disableCustomTheme}>
      <CssBaseline enableColorScheme />
      <AppLayout>{children}</AppLayout>

      {/* Reminder Modal */}
      <Dialog
        open={openReminder}
        onClose={() => setOpenReminder(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            ⚠️ Expiration Reminders ({reminders.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Items expiring within the next 30 days
          </Typography>
        </DialogTitle>
        <DialogContent>
          {reminders.map((r, idx) => (
            <Box
              key={idx}
              sx={{
                mb: 2,
                p: 2,
                border: 1,
                borderColor:
                  r.status === "Expired" ? "error.main" : "warning.main",
                borderRadius: 1,
                backgroundColor:
                  r.status === "Expired" ? "error.50" : "warning.50",
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {r.category}: {r.name}
              </Typography>
              <Typography
                variant="body2"
                color={r.status === "Expired" ? "error.main" : "warning.main"}
                fontWeight="medium"
              >
                Status: {r.status}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {r.status === "Expired"
                  ? `Expired ${Math.abs(r.days)} days ago`
                  : `Expires in ${r.days} days`}
              </Typography>
              {r.amount && (
                <Typography variant="body2" color="text.secondary">
                  Amount: ₹{r.amount}
                </Typography>
              )}
              {r.warehouseName && (
                <Typography variant="body2" color="text.secondary">
                  Warehouse: {r.warehouseName}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Valid Till: {new Date(r.validTill).toLocaleDateString()}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
          <Button
            onClick={handleSkipReminders}
            variant="outlined"
            color="secondary"
          >
            Skip (Don't show again)
          </Button>
          <Button
            onClick={() => setOpenReminder(false)}
            variant="contained"
            color="primary"
          >
            Remind Me Later
          </Button>
        </DialogActions>
      </Dialog>
    </AppTheme>
  );
}
