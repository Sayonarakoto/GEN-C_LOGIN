import RegisterPage from '../components/auth/RegisterPage';
import { DEPARTMENTS, YEARS } from '../components/auth/registerOptions';

const studentConfig = {
  title: 'Student Register',
  endpoint: '/auth/register/student',
  narrow: true,
  fields: [
    { name: 'studentId', label: 'Student ID', type: 'text' },
    { name: 'fullName', label: 'Full Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    {
      name: 'department',
      label: 'Department',
      type: 'select',
      options: DEPARTMENTS,
      placeholder: 'Select Department',
    },
    {
      name: 'year',
      label: 'Year',
      type: 'select',
      options: YEARS,
      placeholder: 'Select Year',
    },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Password' },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'Confirm Password',
      matchWith: 'password',
    },
  ],
};

const StudentRegister = () => <RegisterPage config={studentConfig} />;

export default StudentRegister;
