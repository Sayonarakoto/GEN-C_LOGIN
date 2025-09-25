import React, {  useState } from 'react';
import { Table, Pagination } from 'react-bootstrap';

const StudentTable = ({ students }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

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

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(students.length / studentsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <>
      <Table striped bordered hover responsive className="dark-theme-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentStudents.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center">No students found.</td>
            </tr>
          ) : (
            currentStudents.map((student, rowIndex) => (
              <tr key={student._id || `student-${rowIndex}`}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex}>
                    {col.formatter ? col.formatter(student[col.dataField]) : student[col.dataField]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <Pagination className="justify-content-center">
        {pageNumbers.map(number => (
          <Pagination.Item key={number} active={number === currentPage} onClick={() => paginate(number)}>
            {number}
          </Pagination.Item>
        ))}
      </Pagination>
    </>
  );
};

export default StudentTable;
