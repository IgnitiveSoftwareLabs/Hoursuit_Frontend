
import { styled } from '@mui/material/styles';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import MenuContent from './MenuContent';
import { useFetchCompanyQuery } from '../RTK/services/companyApi';

const drawerWidth = 220;
const HEADER_HEIGHT = 64;

const Drawer = styled(MuiDrawer)(() => ({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
    top: `${HEADER_HEIGHT}px`,
    height: `calc(100vh - ${HEADER_HEIGHT}px)`,
    backgroundColor: '#F3F4F6',
    borderRight: '1px solid rgba(0,0,0,0.08)',
    boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
    overflowX: 'hidden',
  },
}));

export default function SideMenu() {
  const { data: companyData, isLoading: isCompanyLoading, error } = useFetchCompanyQuery();

  if (isCompanyLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: drawerWidth, backgroundColor: '#111827' }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, fontSize: '13px' }}>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: drawerWidth, backgroundColor: '#111827' }}>
        <Typography sx={{ color: '#EF4444', fontSize: '13px' }}>Error loading data</Typography>
      </Box>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Company Logo/Header Area */}
        <Box
          sx={{
            p: 2,
            pb: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: '16px',
                letterSpacing: '-0.5px',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.35)',
              }}
            >
              W
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#252323',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                WMS Portal
              </Typography>
              <Typography
                sx={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'rgba(24, 23, 23, 0.45)',
                  letterSpacing: '0.02em',
                }}
              >
                {companyData?.result?.name || 'Enterprise'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.07)' }} />

        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            px: 0.5,
            pt: 1,
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'transparent',
              borderRadius: '4px',
            },
            '&:hover::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255,255,255,0.15)',
            },
          }}
        >
          <MenuContent />
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography sx={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', letterSpacing: '0.05em' }}>
            v1.0.0 • OmniCoreERP
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}