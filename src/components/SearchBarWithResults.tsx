import * as React from 'react';
import {
  Box,
  InputBase,
  Popper,
  Paper,
  List,
  ListItem,
  ClickAwayListener,
  Typography,
  Fade,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';

const iconMap: Record<string, React.ReactElement> = {
  Project: <WorkOutlineIcon fontSize="small" color="primary" />,
  Task: <BugReportOutlinedIcon fontSize="small" color="warning" />,
  Employee: <PersonOutlineIcon fontSize="small" color="success" />,
  Client: <BusinessOutlinedIcon fontSize="small" color="info" />,
};

const mockResults = [
  { type: 'Project', label: 'Redesign Website' },
  { type: 'Task', label: 'Fix login bug' },
  { type: 'Employee', label: 'John Doe' },
  { type: 'Client', label: 'Acme Corp' },
];

export default function SearchBarWithResults() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredResults, setFilteredResults] = React.useState<typeof mockResults>([]);

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim().length > 0) {
      const filtered = mockResults.filter((item) =>
        item.label.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredResults(filtered);
      setAnchorEl(inputRef.current?.parentElement || null);
    } else {
      setFilteredResults([]);
      setAnchorEl(null);
    }
  };

  const handleClickAway = () => {
    setAnchorEl(null);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative' }}>
        {/* Search Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 0.5,
            minWidth: { xs: '100%', sm: 300 },
            width: { xs: '100%', md: 'auto' },
            borderLeft: '1px solid #eee',
            backgroundColor: '#fff',
            borderRadius: 1,
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
          <InputBase
            placeholder="Search for project, task, employee or client..."
            sx={{ flex: 1, fontSize: 14 }}
            inputRef={inputRef}
            value={searchTerm}
            onChange={handleChange}
          />
        </Box>

        {/* Results Popper */}
        <Popper
          open={Boolean(anchorEl) && filteredResults.length > 0}
          anchorEl={anchorEl}
          placement="bottom-start"
          transition
          sx={{ zIndex: 1300, width: { xs: '100%', sm: 360 }, maxWidth: { xs: '100%', sm: '360px' }, mt: 1 }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={200}>
              <Paper
                elevation={4}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              >
                <List dense>
                  {filteredResults.map((item, index) => (
                    <ListItem
                      key={index}
                      onClick={() => {
                        alert(`You selected ${item.label}`);
                        setAnchorEl(null);
                      }}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                        px: 2,
                        py: 1.2,
                        gap: 1,
                      }}
                    >
                      {iconMap[item.type] || <SearchIcon fontSize="small" />}
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {item.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.type}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Fade>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
