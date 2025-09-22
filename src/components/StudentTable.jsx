import React, { useMemo } from 'react';
import { Table, Tag } from 'antd';

const StudentTable = ({ students }) => {
  const columns = [
    {
      title: 'Student ID',
      dataIndex: 'studentId',
      key: 'studentId',
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
    },
    
    {
      title: 'Temporary Password',
      dataIndex: 'tempPassword',
      key: 'tempPassword',
      render: () => <Tag color="blue">••••••••</Tag>, // Hidden password
    },
  ];

  const dataSource = useMemo(
    () =>
      students.map((student, index) => ({
        ...student,
        key: student._id || `student-${index}`,
      })),
    [students]
  );

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      pagination={{ pageSize: 10 }} // Optional: Add pagination
      rowKey="key" // Use the computed key property
    />
  );
};

export default StudentTable;