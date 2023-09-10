import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Register from './pages/Register';
import Signup from './pages/Signup';
import Cart from './pages/Cart';
import UserContext from './UserContext';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';

function App() {
  const [userId, setUserId] = useState('');

  return (
    <Router>
      <UserContext.Provider value={{ userId, setUserId }}>

          <Routes>
            <Route path="/" element={<Register />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin" element={<Admin />} />

            {/* 
            <Route path="/propage" element={<Propage />} />
            <Route path="/field" element={<Field/>} /> */}

          </Routes>
       </UserContext.Provider>
    </Router>
  );
}

export default App;
