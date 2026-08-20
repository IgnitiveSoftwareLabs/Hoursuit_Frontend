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
  '/purchase-order': 'Purchase Order',
  '/purchase_order': 'Purchase Order',
  '/grn': 'GRN',
  '/purchase-invoice': 'Purchase Bill',
  '/purchase-return': 'Purchase Return',
  '/purchase-payment': 'Purchase Payment',
};

const transactionRoutes = [
  'purchase-order',
  'purchase_order',
  'grn',
  'purchase-invoice',
  'purchase_invoice',
  'purchase-return',
  'purchase_return',
  'purchase-payment',
  'purchase_payment',
  'sales-order',
  'sales_order',
  'sales-return',
  'sales_return',
  'delivery-challan',
  'debit-note',
  'vendor-credit',
];

export default function NavbarBreadcrumbs() {
  const location = useLocation();

  // Split the current path into segments
  const pathnames = location.pathname.split('/').filter((x) => x);
  const firstSegment = pathnames[0];
  const isTransactionPage = firstSegment && transactionRoutes.includes(firstSegment);

  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRoundedIcon fontSize="small" />}
    >
      {/* Home breadcrumb */}
      <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Typography variant="body1">Home</Typography>
      </Link>

      {/* Insert non-clickable Transaction breadcrumb for transaction routes */}
      {isTransactionPage && (
        <Typography key="transaction-header" variant="body1" sx={{ color: 'text.secondary' }}>
          Transaction
        </Typography>
      )}

      {/* Generate breadcrumbs dynamically */}
      {pathnames.map((value, index) => {
        let to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        // Custom override: if the segment is "godown", we want it to go to `/warehouses/<id>`
        if (value === 'godown' && pathnames[index - 1]) {
          to = `/warehouses/${pathnames[index - 1]}`;
        }

        const label =
          breadcrumbNameMap[to] ||
          value.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

        return isLast ? (
          <Typography
            key={to}
            variant="body1"
            sx={{ color: 'text.primary', fontWeight: 600 }}
          >
            {label}
          </Typography>
        ) : (
          <Link
            key={to}
            to={to}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Typography variant="body1">{label}</Typography>
          </Link>
        );
      })}
    </StyledBreadcrumbs>
  );
}