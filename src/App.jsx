import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './Pages/Signup';
import Forgetpass from './Pages/Forgetpass';
import Frontpage from './Pages/Frontpage';
import Dashboard from './Dashbaords/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/dashboard' element={<Dashboard/>}/>
        <Route path="/home" element={<Frontpage />} />
        <Route path="/signin" element={<Signup />} />
        <Route path="/forget" element={<Forgetpass />} />
      </Routes>
    </Router>
  );
}

export default App;
