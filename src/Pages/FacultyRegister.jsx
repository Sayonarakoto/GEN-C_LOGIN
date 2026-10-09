import RegisterPage from '../components/auth/RegisterPage';
import { DEPARTMENTS, DESIGNATIONS } from '../components/auth/registerOptions';

const facultyConfig = {
  title: 'Register',
  endpoint: '/auth/register',
  fields: [
    { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Full Name' },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'Email' },
    { name: 'employeeId', label: 'Faculty ID', type: 'text', placeholder: 'Faculty ID' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Password' },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'Confirm Password',
      matchWith: 'password',
    },
    {
      name: 'department',
      label: 'Department',
      type: 'select',
      options: DEPARTMENTS,
      placeholder: 'Select Department',
    },
    {
      name: 'designation',
      label: 'Designation/Role',
      type: 'select',
      options: DESIGNATIONS,
      placeholder: 'Select Role',
    },
  ],
  file: {
    name: 'profilePhoto',
    label: 'Profile Photo',
    accept: '.jpg,.jpeg,.png',
    mimeTypes: ['image/jpeg', 'image/png'],
    maxSizeMB: 5,
    sizeError: 'Profile photo must be smaller than 5MB!',
    typeError: 'Only JPG/PNG files are allowed!',
  },
};

const FacultyRegister = () => <RegisterPage config={facultyConfig} />;

export default FacultyRegister;
