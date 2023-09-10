import React, { useState } from 'react';
import './Admin.css';
import io from 'socket.io-client';

const Admin = () => {
  const [productname, setproductname] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productnumber, setproductnumber] = useState(''); // New state for Product Number
  const [products, setProducts] = useState([]);
  const socket = io('http://localhost:8080'); // Replace with your server endpoint
    
  const handleproductnameChange = (e) => {
    setproductname(e.target.value);
  };

  const handleProductPriceChange = (e) => {
    setProductPrice(e.target.value);
  };

  const handleproductnumberChange = (e) => { // Handle changes in Product Number field
    setproductnumber(e.target.value);
  };

  const handleAddProduct = () => {
    // Create an object with the form data
    const formData = {
      productname,
      productnumber,
      productprice: parseFloat(productPrice),
    };

    // Emit the form data through Socket.io
    socket.emit('addProduct', formData);
    console.log(formData);
    // Add the form data to the products list (if needed)
    setProducts([...products, formData]);

    // Clear input fields
    setproductname('');
    setProductPrice('');
    setproductnumber('');
  };

  const handleClearDatabase = () => {
    // Emit a "clearDatabase" event through Socket.io
    socket.emit('dropProductsTable');

    // Clear the products list (if needed)
    setProducts([]);
  };

  const handleClearCart= () => {
    // Emit a "clearDatabase" event through Socket.io
    socket.emit('dropTables');

     
  };

  return (
    <div className="form">
      <h1>Add Products</h1>
      <label htmlFor="productname">Product Name:</label>
      <input
        type="text"
        id="productname"
        className="input-field"
        value={productname}
        onChange={handleproductnameChange}
      />

      <label htmlFor="productnumber">Product Number:</label>
      <input
        type="text"
        id="productnumber"
        className="input-field"
        value={productnumber}
        onChange={handleproductnumberChange}
      />

      <label htmlFor="productPrice">Product Price:</label>
      <input
        type="number"
        id="productPrice"
        className="input-field"
        value={productPrice}
        onChange={handleProductPriceChange}
      />

      <button className="add-button" onClick={handleAddProduct}>
        Add Product
      </button>

      <button className="clear-cart" onClick={handleClearCart}>
        Clear Cart
      </button>

      <button className="clear-button" onClick={handleClearDatabase}>
        Clear Database
      </button>

      <h2>Product List</h2>
      <ul>
        {products.map((product, index) => (
          <li key={index}>
            <strong>Product Name:</strong> {product.productname}, <strong>Product Number:</strong> {product.productnumber}, <strong>Price:</strong> ${product.productPrice}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Admin;
