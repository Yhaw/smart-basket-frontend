import React from 'react';
import './register.css';
import { useNavigate } from 'react-router-dom';
const Register = () => {
 
  const handleRegistration = () => {
    navigate('/signup');

   };

    const navigate = useNavigate();


  return (
    <div className="containers">
      <h1>WELCOME TO OUR SHOP!</h1>
       
     <button onClick={handleRegistration}>Click To Register</button>
    
    </div>
  );
};

export default Register;
