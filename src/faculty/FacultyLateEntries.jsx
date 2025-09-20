import React, { useState, useEffect } from 'react';
import { Table, message, Form, DatePicker, Select, Button, Input } from 'antd';
import api from '../api/client';

const { Option } = Select;

const FacultyLateEntries = () => {
  const [form] = Form.useForm();
  const [lateEntries, setLateEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowEdits, setRowEdits] = useState({}); // { [id]: { status, remarks } }

  const fetchLateEntries = async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/api/lateentries', { params });
      setLateEntries(response.data.entries);
      // Initialize rowEdits with current status and remarks
      const initialEdits = {};
      response.data.entries.forEach(entry => {
        initialEdits[entry._id] = { status: entry.status, remarks: entry.remarks };
      });
      setRowEdits(initialEdits);
    } catch (error) {
      console.error('Error fetching late entries:', error);
      message.error(error.response?.data?.message || 'Failed to fetch late entries');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLateEntries();
  }, []);

  const onFinish = (values) => {
    fetchLateEntries(values);
  };

  const handleChange = (id, field, value) => {
    setRowEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleUpdate = async (id) => {
    try {
      const { status, remarks } = rowEdits[id] || {};
      if (!status) return message.warning('Please select a status');
      await api.patch(`/api/lateentries/${id}/status`, { status, remarks });
      message.success('Updated successfully');
      // Refresh data after update
      fetchLateEntries(form.getFieldsValue());
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Update failed');
    }
  };

  const columns = [
    {
      title: 'Student ID',
      dataIndex: ['student', 'studentId'],
      key: 'studentId',
    },
    {
      title: 'Student Name',
      dataIndex: ['student', 'fullName'],
      key: 'studentName',
    },
    {
      title: 'Department',
      dataIndex: ['student', 'department'],
      key: 'department',
    },
    {
      title: 'Recorded At',
      dataIndex: 'recordedAt',
      key: 'recordedAt',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: 'Gate',
      dataIndex: 'gate',
      key: 'gate',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        const id = record._id;
        const current = rowEdits[id] || { status: record.status, remarks: record.remarks };
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              placeholder="Status"
              value={current.status}
              onChange={(val) => handleChange(id, 'status', val)}
              style={{ width: 140 }}
            >
              <Option value="recorded">Recorded</Option>
              <Option value="acknowledged">Acknowledged</Option>
              <Option value="reviewed">Reviewed</Option>
            </Select>
            <Input
              placeholder="Remarks"
              value={current.remarks}
              onChange={(e) => handleChange(id, 'remarks', e.target.value)}
              style={{ width: 200 }}
            />
            <Button type="primary" onClick={() => handleUpdate(id)}>Save</Button>
          </div>
        );
      }
    },
  ];

  return (
    <div>
      <h1>Late Entries</h1>
      <Form form={form} layout="inline" onFinish={onFinish} style={{ marginBottom: '24px' }}>
        <Form.Item name="department">
          <Input placeholder="Department" />
        </Form.Item>
        <Form.Item name="from">
          <DatePicker placeholder="From" />
        </Form.Item>
        <Form.Item name="to">
          <DatePicker placeholder="To" />
        </Form.Item>
        <Form.Item name="status">
          <Select placeholder="Status" allowClear>
            <Option value="recorded">Recorded</Option>
            <Option value="acknowledged">Acknowledged</Option>
            <Option value="reviewed">Reviewed</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Filter
          </Button>
        </Form.Item>
      </Form>
      <Table
        dataSource={lateEntries}
        columns={columns}
        loading={loading}
        rowKey="_id"
      />
    </div>
  );
};

export default FacultyLateEntries;
