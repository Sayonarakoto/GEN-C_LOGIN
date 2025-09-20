import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, message, Table } from 'antd';
import dayjs from 'dayjs';
import api from '../api/client';

export default function StudentLateEntry() {
  const [loading, setLoading] = useState(false);
  const [lateEntries, setLateEntries] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);

  const fetchLateEntries = async () => {
    setTableLoading(true);
    try {
      const res = await api.get('/api/latecomers/mine');
      setLateEntries(res.data.entries || []);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch late entries');
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchLateEntries();
  }, []);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const payload = {
        reason: values.reason,
        entryTime: values.entryTime ? values.entryTime.toISOString() : undefined,
      };
      const res = await api.post('/api/latecomers', payload);
      if (res.data.success) {
        message.success('Late entry submitted');
        fetchLateEntries(); // Refresh the list after submission
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Entry Time', dataIndex: 'entryTime', render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm') },
    { title: 'Reason', dataIndex: 'reason' },
    { title: 'Status', dataIndex: 'status' },
  ];

  return (
    <div>
      <h2>Submit New Late Entry</h2>
      <Form layout="vertical" onFinish={onFinish} style={{ maxWidth: 500 }}>
        <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Please enter a reason' }]}>
          <Input.TextArea rows={4} placeholder="Describe why you were late" />
        </Form.Item>
        <Form.Item name="entryTime" label="Entry Time">
          <DatePicker showTime defaultValue={dayjs()} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>Submit</Button>
      </Form>

      <h2 style={{ marginTop: '20px' }}>My Late Entries</h2>
      <Table
        dataSource={lateEntries}
        columns={columns}
        rowKey="_id"
        loading={tableLoading}
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
}