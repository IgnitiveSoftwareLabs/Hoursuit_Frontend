import { useEffect, useRef, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AppNavbar from "../../components/AppNavbar";
import SideMenu from "../../components/SideMenu";
import AppTheme from "../../shared-theme/AppTheme";
import MainHeader from "../MainHeader";
import { useFetchCompanyQuery } from "../../RTK/services/companyApi";

const HEADER_HEIGHT = 64;

export default function Layout({ children, disableCustomTheme }: any) {
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const { data: companyData, isLoading } = useFetchCompanyQuery();
  const [reminders, setReminders] = useState<any[]>([]);
  const [openReminder, setOpenReminder] = useState(false);

  // Function to generate a unique key for current reminders
  // This creates a unique key based on the reminder content so that if reminders change,
  // the skip will be reset and new reminders will be shown
  const generateReminderKey = (reminders: any[]) => {
    const sortedReminders = reminders
      .map((r) => `${r.category}-${r.name}-${r.validTill}`)
      .sort()
      .join("|");
    return `reminder_skip_${btoa(sortedReminders)}`;
  };

  // Function to check if reminders should be skipped
  const shouldSkipReminders = (reminders: any[]) => {
    if (reminders.length === 0) return true;
    const reminderKey = generateReminderKey(reminders);
    return localStorage.getItem(reminderKey) === "true";
  };

  // Function to skip reminders
  const handleSkipReminders = () => {
    if (reminders.length > 0) {
      const reminderKey = generateReminderKey(reminders);
      localStorage.setItem(reminderKey, "true");
      setOpenReminder(false);
    }
  };

  // Function to clear all skipped reminders (utility function)
  const clearAllSkippedReminders = () => {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("reminder_skip_")
    );
    keys.forEach((key) => localStorage.removeItem(key));
  };

  // Expose function globally for debugging (optional)
  useEffect(() => {
    (window as any).clearAllSkippedReminders = clearAllSkippedReminders;
  }, []);

  // Function to check expiry status
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

      // Check company attachments
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

      // Check expiring insurances
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

      // Check expiring warehouse attachments
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
        // Only show reminder if not skipped in localStorage
        if (!shouldSkipReminders(alerts)) {
          setOpenReminder(true);
        }
      }
    }
  }, [companyData, isLoading]);
  return (
    <AppTheme {...disableCustomTheme}>
      <CssBaseline enableColorScheme />
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <MainHeader />
        {/* Content area below the fixed header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: 'column', md: 'row' },
            width: '100%',
            marginTop: `${HEADER_HEIGHT}px`,
            minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
          }}
        >
          <SideMenu />
          <AppNavbar />
          <Box
            component="main"
            ref={mainScrollRef}
            sx={{
              flexGrow: 1,
              backgroundColor: '#F0F2F5',
              overflow: "auto",
              height: `calc(100vh - ${HEADER_HEIGHT}px)`,
              pt: 3,
            }}
          >
            <Stack
              spacing={3}
              sx={{ 
                alignItems: "center", 
                mx: 'auto', 
                maxWidth: '1600px',
                width: '100%',
                pb: 5, 
                px: { xs: 2, md: 3 } 
              }}
            >
              {children}
            </Stack>
          </Box>
        </Box>
      </Box>

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
