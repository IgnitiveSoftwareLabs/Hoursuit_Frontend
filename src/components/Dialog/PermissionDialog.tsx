import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface Permission {
  id: number;
  name: string;
  module: string;
  action: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface PermissionsDialogProps {
  open: boolean;
  onClose: () => void;
  permissions: Permission[];
  userName: string;
}

const PermissionsDialog: React.FC<PermissionsDialogProps> = ({
  open,
  onClose,
  permissions,
  userName,
}) => {
  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "success";
      case "read":
        return "info";
      case "update":
        return "warning";
      case "delete":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6">
            Permissions for {userName}
          </Typography>
          <Chip 
            label={`${permissions.length} permissions`} 
            size="small" 
            color="primary" 
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {Object.keys(groupedPermissions).length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No permissions assigned to this user.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            {Object.entries(groupedPermissions).map(([module, modulePermissions], index) => (
              <Accordion key={module} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                    <Typography variant="subtitle1" sx={{ 
                      textTransform: "capitalize", 
                      fontWeight: "bold",
                      color: "primary.main"
                    }}>
                      {module.replace("_", " ")}
                    </Typography>
                    <Chip 
                      label={`${modulePermissions.length} permissions`} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails sx={{ pt: 0 }}>
                  <List dense>
                    {modulePermissions.map((permission, idx) => (
                      <React.Fragment key={permission.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Chip
                                  label={permission.action}
                                  size="small"
                                  color={getActionColor(permission.action) as any}
                                  variant="filled"
                                />
                                <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                  {permission.name}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {permission.description}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {idx < modulePermissions.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
        
        {/* Summary Section */}
        {permissions.length > 0 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Permission Summary:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                <Chip
                  key={module}
                  label={`${module}: ${modulePermissions.length}`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary" sx={{ textTransform: "none" }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionsDialog;