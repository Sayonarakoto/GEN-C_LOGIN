import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Typography,
  Box,
} from '@mui/material';

const StudentTable = ({ students }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const columns = [
    { title: 'Student ID', dataField: 'studentId' },
    { title: 'Full Name', dataField: 'fullName' },
    { title: 'Email', dataField: 'email' },
    { title: 'Department', dataField: 'department' },
    { title: 'Year', dataField: 'year' },
    {
      title: 'Temporary Password',
      dataField: 'tempPassword',
      formatter: (text) => (typeof text === 'string' ? text : ''),
    },
  ];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - students.length) : 0;

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="student table">
          <TableHead>
            <TableRow>
              {columns.map((col, idx) => (
                <TableCell key={idx} sx={{ fontWeight: 'bold' }}>
                  {col.title}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="subtitle1">No students found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              (rowsPerPage > 0
                ? students.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : students
              ).map((student, rowIndex) => (
                <TableRow hover role="checkbox" tabIndex={-1} key={student._id || `student-${rowIndex}`}>
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex}>
                      {col.formatter ? col.formatter(student[col.dataField]) : student[col.dataField]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={columns.length} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
        component="div"
        count={students.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default StudentTable;
