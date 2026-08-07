import * as React from 'react';
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import Divider, { dividerClasses } from '@mui/material/Divider';
import { paperClasses } from '@mui/material/Paper';
import { listClasses } from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';

const MenuItem = styled(MuiMenuItem)({
  margin: '2px 0',
});

// Dummy notifications
const notifications = [
  { id: 1, title: 'New user registered', time: '2 min ago' },
  { id: 2, title: 'Server error reported', time: '30 min ago' },
  { id: 3, title: 'New comment on blog', time: '1 hour ago' },
];

export default function NotificationDropdown() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <React.Fragment>
      <Badge color="primary" variant="dot" overlap="circular">
        <IconButton
          aria-label="notifications"
          onClick={handleClick}
          sx={{ borderRadius: '50%', padding: 0.5, backgroundColor: '#E9E8FF' }}
        >
          <NotificationsNoneOutlinedIcon />
        </IconButton>
      </Badge>

      <Menu
        anchorEl={anchorEl}
        id="notification-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          [`& .${listClasses.root}`]: {
            padding: '4px',
          },
          [`& .${paperClasses.root}`]: {
            padding: 0,
            width: 320,
          },
          [`& .${dividerClasses.root}`]: {
            margin: '4px -4px',
          },
        }}
      >
        <MenuItem disabled>
          <ListItemText primary="Notifications" />
        </MenuItem>
        <Divider />

        {notifications.map((notif) => (
          <MenuItem key={notif.id} onClick={handleClose}>
            <ListItemText
              primary={notif.title}
              secondary={notif.time}
              primaryTypographyProps={{ fontSize: 14 }}
              secondaryTypographyProps={{ fontSize: 12, color: 'text.secondary' }}
            />
          </MenuItem>
        ))}

        {notifications.length === 0 && (
          <MenuItem disabled>
            <ListItemText primary="No new notifications" />
          </MenuItem>
        )}
      </Menu>
    </React.Fragment>
  );
}
