import dayjs from 'dayjs';

export const mockStudents = {
  '12345': { id: '12345', name: 'Aisha Khan', photo: '/images/placeholder-avatar.png', passType: 'Half-Day', validUntil: dayjs().add(2, 'hours'), status: 'valid' },
  '67890': { id: '67890', name: 'John Doe', photo: '/images/placeholder-avatar.png', passType: 'Full-Day', validUntil: dayjs().subtract(1, 'hour'), status: 'expired' },
  '11223': { id: '11223', name: 'Jane Smith', photo: '/images/placeholder-avatar.png', passType: 'Half-Day', validUntil: dayjs().add(30, 'minutes'), status: 'valid' },
};
