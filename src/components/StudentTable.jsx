import React from 'react';
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

  return (
    <Table
      columns={columns}
      dataSource={students.map((student, index) => ({ ...student, key: student._id || index }))}
      pagination={{ pageSize: 10 }} // Optional: Add pagination
      rowKey="_id" // Assuming _id is unique for each student
    />
  );
};

export default StudentTable;
