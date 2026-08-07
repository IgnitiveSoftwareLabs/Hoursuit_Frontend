import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Breadcrumbs, { breadcrumbsClasses } from '@mui/material/Breadcrumbs';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { useLocation, Link } from 'react-router-dom';

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  [`& .${breadcrumbsClasses.separator}`]: {
    color: (theme.vars || theme).palette.action.disabled,
    margin: 1,
  },
  [`& .${breadcrumbsClasses.ol}`]: {
    alignItems: 'center',
  },
}));

// Define a mapping of paths to breadcrumb labels
const breadcrumbNameMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/companyprofile': 'Company Details',
  '/warehouses': 'Warehouses',
  '/clients': 'Clients',
  '/settings': 'Settings',
  '/about': 'About',
  '/feedback': 'Feedback',
};

export default function NavbarBreadcrumbs() {
  const location = useLocation();

  // Split the current path into segments
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRoundedIcon fontSize="small" />}
    >
      {/* Home breadcrumb */}
      <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Typography variant="body1">Home</Typography>
      </Link>

      {/* Generate breadcrumbs dynamically */}
      {pathnames.map((value, index) => {
  let to = `/${pathnames.slice(0, index + 1).join('/')}`;
  const isLast = index === pathnames.length - 1;

  // Custom override: if the segment is "godown", we want it to go to `/warehouses/<id>`
  if (value === 'godown' && pathnames[index - 1]) {
    to = `/warehouses/${pathnames[index - 1]}`;
  }

  return isLast ? (
    <Typography
      key={to}
      variant="body1"
      sx={{ color: 'text.primary', fontWeight: 600 }}
    >
      {breadcrumbNameMap[to] || value}
    </Typography>
  ) : (
    <Link
      key={to}
      to={to}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Typography variant="body1">{breadcrumbNameMap[to] || value}</Typography>
    </Link>
  );
})}

    </StyledBreadcrumbs>
  );
}