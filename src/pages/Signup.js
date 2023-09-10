import React, { useState,useContext } from 'react';
import './signup.css';
import { useNavigate } from 'react-router-dom';
import UserContext from '../UserContext';
require('dotenv').config()

const Signup = () => {
  const [name, setCustomerName] = useState('');
  const [email, setCustomerEmail] = useState('');
  const [contact, setCustomerContact] = useState('');
  const [cartnumber, setCartNumber] = useState('');
  const navigate = useNavigate();
  const { setUserId } = useContext(UserContext);
  const ip = process.env.IP;
  const handleNameChange = (event) => {
    setCustomerName(event.target.value);
  };

  const handleEmailChange = (event) => {
    setCustomerEmail(event.target.value);
  };

  const handleContactChange = (event) => {
    setCustomerContact(event.target.value);
  };

  const handleCartNumberChange = (event) => {
    setCartNumber(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = {
      name,
      email,
      contact,
      cartnumber
    };

    // Send form data to the server
    fetch(ip + ':3080/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then((response) => response.json()
      
      )
      .then((data) => {
        
        const userId = data.message.userid;
        setUserId(data); // Update the userId in the context
        console.log(userId);
        navigate('/cart');
        // Reset form fields
        setCustomerName('');
        setCustomerEmail('');
        setCustomerContact('');
        setCartNumber('');
      })
      .catch((error) => {
        console.error('Error registering:', error);
        alert('Error registering: Cart is Busy');


      });
  };

  return (
    <div className="case">
      <h2>Registration Form</h2>
      <button className='clear'>Clear</button>
      <form onSubmit={handleSubmit}>
        <label>
          Customer Name:
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            required
          />
        </label>
        <label>
          Customer Email:
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
        </label>
        <label>
          Customer Contact:
          <input
            type="tel"
            value={contact}
            onChange={handleContactChange}
            required
          />
        </label>
        <label>
          Cart Number:
          <input
            type="text"
            value={cartnumber}
            onChange={handleCartNumberChange}
            required
          />
        </label>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Signup;
