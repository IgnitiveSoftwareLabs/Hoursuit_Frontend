import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { Box } from '@mui/material';

import { useFetchCompanyQuery } from '../RTK/services/companyApi';
import MenuButton from './MenuButton';
import MenuContent from './MenuContent';

interface SideMenuMobileProps {
  open: boolean | undefined;
  toggleDrawer: (newOpen: boolean) => () => void;
}
export default function SideMenuMobile({ open, toggleDrawer }: SideMenuMobileProps) {

  const { data: companyData, isLoading: isCompanyLoading, error } = useFetchCompanyQuery();
  const navigate = useNavigate();
  const handleLogout = () => {
    if (localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      navigate('/login', { replace: true });
    }
  };
  if (isCompanyLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }
  if (error) {
    console.error('Error fetching company data:', error);
    toast.error('Failed to fetch company data');
    return null; // or handle the error appropriately
  }
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={toggleDrawer(false)}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        [`& .${drawerClasses.paper}`]: {
          width: 'min(86vw, 320px)',
          backgroundImage: 'none',
          backgroundColor: '#F3F4F6',
          color: 'rgba(0,0,0,0.87)',
        },
      }}
    >
      <Stack
        sx={{
          width: 'min(86vw, 320px)',
          height: '100%',
        }}
      >
        <Stack direction="row" sx={{ p: 2, pb: 0, gap: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Stack
            direction="row"
            sx={{ gap: 1, alignItems: 'center', flexGrow: 1, p: 1 }}
          >
            <Avatar
              sizes="small"
              alt="User"
              sx={{ width: 28, height: 28, bgcolor: '#2563EB', fontSize: '0.85rem' }}
            >
              {companyData?.result?.user?.FirstName?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography component="p" variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 700 }}>
                {companyData ? `${companyData.result.user.FirstName} ${companyData.result.user.LastName}` : 'Loading...'}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)' }}>
                {companyData?.result?.name || 'WMS Enterprise'}
              </Typography>
            </Box>
          </Stack>
          <MenuButton showBadge>
            <NotificationsRoundedIcon sx={{ color: 'rgba(255,255,255,0.88)' }} />
          </MenuButton>
        </Stack>
        <Divider />
        <Stack sx={{ flexGrow: 1, overflowY: 'auto', px: 0.5, pt: 1 }}>
          <MenuContent />
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mt: 1 }} />
        </Stack>

        <Stack sx={{ p: 2 }}>
          <Button variant="outlined" fullWidth startIcon={<LogoutRoundedIcon />} onClick={handleLogout}>
            Logout
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
