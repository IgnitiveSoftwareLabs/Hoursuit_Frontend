// MainHeader.tsx - Topbar Header
import { Box, Typography, Avatar, Stack } from '@mui/material';
import OptionsMenu from './OptionsMenu';
import { useFetchCompanyQuery } from '../RTK/services/companyApi';
import toast from 'react-hot-toast';
import NotificationDropdown from './Notification';
import SearchBarWithResults from './SearchBarWithResults';

export default function MainHeader() {
    const { data: companyData, isLoading: isCompanyLoading, error } = useFetchCompanyQuery();

  //fetch data when the companyData is not available
  if (isCompanyLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '64px' }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }
  if (error) {
    console.error('Error fetching company data:', error);
    toast.error('Failed to load company data');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '64px' }}>
        <Typography variant="h6">Error loading company data</Typography>
      </Box>
    );
  }
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        height: '64px',
        px: 2.5,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Left: Logo and Search */}
      <Stack direction="row" alignItems="center" spacing={{ xs: 1, md: 4 }} sx={{ width: { xs: '100%', md: 'auto' }, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            }}
          >
            <img
              src="/Frame 34759.svg"
              alt="Company Logo"
              style={{ width: 20, height: 20 }}
              onError={(e) => {
                // Fallback if SVG doesn't exist
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </Box>
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '15px',
                color: '#111827',
                lineHeight: 1.2,
                letterSpacing: '-0.3px',
              }}
            >
              WMS
            </Typography>
            <Typography
              sx={{
                fontSize: '11px',
                color: '#9CA3AF',
                lineHeight: 1.2,
              }}
            >
              warehouse management
            </Typography>
          </Box>
        </Box>

        {/* Search Bar */}
        <SearchBarWithResults />
      </Stack>

      {/* Right: Notification and Profile */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'space-between', md: 'flex-end' }, mt: { xs: 1, md: 0 } }}
      >
        {/* Notification Icon */}
        <NotificationDropdown />

        {/* Profile Info */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box textAlign="right">
            <Typography
              sx={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#1F2937',
                lineHeight: 1.3,
              }}
            >
              {companyData
                ? companyData?.result?.user.FirstName + ' ' + companyData?.result?.user.LastName
                : 'Loading...'}
            </Typography>
            <Typography
              sx={{
                fontSize: '11.5px',
                color: '#9CA3AF',
                lineHeight: 1.2,
              }}
            >
              Admin Profile
            </Typography>
          </Box>

          <Avatar
            sx={{
              bgcolor: '#3B82F6',
              width: 36,
              height: 36,
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {companyData
              ? (
                  companyData?.result?.user.FirstName.charAt(0) +
                  companyData?.result?.user.LastName.charAt(0)
                ).toUpperCase()
              : 'U'}
          </Avatar>
          <OptionsMenu />
        </Stack>
      </Stack>
    </Box>
  );
}
