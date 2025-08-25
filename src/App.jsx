import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './Pages/Signup';
import Forgetpass from './Pages/Forgetpass';
import Frontpage from './Pages/Frontpage';
import StudentDashboard from './Dashbaords/StudentDashboard'
import FacultyDashboard from './Dashbaords/FacultyDashboard';
import StudentEntryForm from './faculty/StudentEntryForm';
import EmailInput from './Pages/EmailInput';
import Register from './Pages/Register';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/sent-rest" element={<EmailInput/>} />
        <Route path="/regsister" element={<Register/>} />
        <Route path="/home" element={<Frontpage />} />
        <Route path="/signin" element={<Signup />} />
        <Route path="/forget" element={<Forgetpass />} />
          <Route path='/faculty' element={<FacultyDashboard/>}/>
        <Route path='/student' element={<StudentDashboard/>}/>
        <Route path='/StudentForm' element={<StudentEntryForm/>} />
      </Routes>
    </Router>
  );
}

export default App;
