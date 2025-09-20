import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message } from 'antd';
import api from '../api/client';

function LateEntriesApprovals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    console.log('Starting API call to fetch pending requests');
    setLoading(true);
    try {
      const res = await api.get('/api/latecomers/pending');
      console.log('API Response:', res);
      console.log('Response Data:', res.data);
      console.log('Response Status:', res.status);
      setRows(res.data.entries || []);
    } catch (err) {
      console.error('API Error Details:', err);
      console.error('Error Response:', err.response);
      console.error('Error Message:', err.message);
      message.error(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/latecomers/${id}/status`, { status });
      message.success(`Marked as ${status}`);
      setRows((prev) => prev.filter((r) => String(r._id) !== String(id)));
    } catch (err) {
      message.error(err.response?.data?.message || 'Update failed');
    }
  };

  useEffect(() => {
    console.log('LateEntriesApprovals component mounted');
    load();
  }, []);

  const columns = [
    { title: 'Student ID', dataIndex: ['student', 'studentId'] },
    { title: 'Name', dataIndex: ['student', 'fullName'] },
    { title: 'Department', dataIndex: ['student', 'department'] },
    { title: 'Entry Time', dataIndex: 'entryTime', render: (t) => new Date(t).toLocaleString() },
    { title: 'Reason', dataIndex: 'reason' },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => updateStatus(record._id, 'Approved')} type="primary">Approve</Button>
          <Button onClick={() => updateStatus(record._id, 'Declined')} danger>Decline</Button>
        </Space>
      )
    },
  ];

  return <Table rowKey="_id" loading={loading} dataSource={rows} columns={columns} />;
}

export default LateEntriesApprovals;