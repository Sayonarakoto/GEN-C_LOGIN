import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import axios from 'axios'
function Signup() {
    const[uid,setuid]=useState()
     const[password,setpass]=useState()
     const handleSubmit=(e)=>{
        e.preventDefault()
        axios.post('http://localhost:3001/signin',{uid,password})
        .then(result=> console.log(result))
        .catch(err => console.log(err))
     }
    return (
        <>
            <div className="container">
                <div className="row min-vh-100 justify-content-center align-items-center">
                    <div className="col-md-4">
                        <form  method="post" onSubmit={handleSubmit}>
                            <div className="form-controls">
                                <h1 className="ml-4 text-center">LOGIN</h1>
                                <input className="form-control mb-3" type="text" placeholder="uid" onChange={(e)=> setuid(e.target.value)}/>
                                <input className="form-control mb-3" type="password" placeholder="password" onChange={(e)=> setpass(e.target.value)}/>
                                <input className="btn btn-primary w-100"type="submit" value="Login" />
                            </div>
                        </form>
                        <p className="mt-3 text-center">
                            <Link to="/forget">Forgot Password?</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Signup;
