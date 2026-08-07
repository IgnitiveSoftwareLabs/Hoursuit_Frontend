// components/DynamicTable.tsx
import {
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    IconButton,
    Pagination,
  } from '@mui/material';
  import { Edit, Delete } from '@mui/icons-material';
  
  interface ColumnConfig {
    key: string;
    label: string;
    render?: (row: any, index: number) => React.ReactNode;
  }
  
  // interface DynamicTableProps {
  //   columns: ColumnConfig[];
  //   data: any[];
  //   onEdit?: (id: string) => void;
  //   onDelete?: (id: string) => void;
  //   getRowId: (row: any) => string;
  //   page?: number;
  // totalPages?: number;
  // onPageChange?: (event: React.ChangeEvent<unknown>, value: number) => void;
  // }
  interface DynamicTableProps {
    columns: ColumnConfig[];
    data: any[];
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    getRowId: (row: any) => string;
    page?: number;
    totalPages?: number;
    onPageChange?: (event: React.ChangeEvent<unknown>, value: number) => void;
    renderActions?: (row: any, index: number) => React.ReactNode; 
    rowsPerPage?: number;
  }
  
  
  export default function DynamicTable({
    columns,
    data,
    onEdit,
    onDelete,
    getRowId,
    page = 1,
  totalPages = 1,
  onPageChange,
  rowsPerPage = 10,
  }: DynamicTableProps) {
    return (
      <Card
        variant="outlined"
        sx={{ boxShadow: 'none', backgroundColor: 'transparent', border: 'none' }}
      >
        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ textTransform: 'uppercase' }}>Sr. No.</TableCell>
                {columns.map((col) => (
                  <TableCell key={col.key} sx={{ textTransform: 'uppercase' }}>
                    {col.label}
                  </TableCell>
                ))}
                {(onEdit || onDelete) && (
                  <TableCell sx={{ textTransform: 'uppercase' }}>Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((row, index) => (
                <TableRow
                  key={getRowId(row)}
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: (theme) => theme.palette.action.hover,
                    },
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.action.selected,
                    },
                  }}
                >
                  <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(row, index) : row[col.key] || 'N/A'}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete) && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {onEdit && (
                          <IconButton color="primary" onClick={() => onEdit(getRowId(row))}>
                            <Edit />
                          </IconButton>
                        )}
                        {onDelete && (
                          <IconButton color="error" onClick={() => onDelete(getRowId(row))}>
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
  {totalPages && totalPages > 1 && (
    <Pagination
      count={totalPages}
      page={page}
      onChange={onPageChange}
      color="primary"
    />
  )}
</Box>

      </Card>
    );
  }
  