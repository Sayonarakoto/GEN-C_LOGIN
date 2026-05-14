import React from 'react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h1>Coming Soon</h1>
            <p>The Librarian module is currently under maintenance or development.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
                Return to Homepage
            </button>
        </div>
    );
};

export default ComingSoon;
