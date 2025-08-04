import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Signup from './Signup';
import Forgetpass from './Forgetpass';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<Signup />} />
         <Route path="/forget" element={<Forgetpass />} />
      </Routes>
    </Router>
    
  );
}

export default App;
