import React, { useState, useEffect ,useContext} from 'react';
import './checkout.css';
import io from 'socket.io-client';
import html2pdf from 'html2pdf.js';
import UserContext from '../UserContext';
 
const Checkout = () => {
  const ip = process.env.REACT_APP_IP;
  const socket = io('http://'+ip+':8080'); // Replace with your server endpoint

  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const { userId } = useContext(UserContext);
  var userid = userId.message.userid; // Replace with the actual userid
  var uemail = userId.message.email; 
  var uname = userId.message.name; 
  var ucontact = userId.message.contact; 
  var ucart = userId.message.cartnumber; 
  
  useEffect(() => {
    // Emit 'getCartItems' event with userid
    socket.emit('getCartItems', { userid });
     // Listen for 'cartItems' event from the server
    socket.on('cartItems', (data) => {
      const { items } = data;
      console.log(items);
      setCartItems(items);
    });

    socket.on('deleteItemError', (data) => {
      const { error } = data;
      console.log('Delete item error:', error);
    });

    // Listen for 'deleteItemSuccess' event from the server
    socket.on('deleteItemSuccess', (data) => {
      const { message } = data;
      console.log('Delete item success:', message);
    });

    socket.emit('getTotalPrice', { userid });

    socket.on('totalPrice', (data) => {
      const { total } = data;
      console.log('Total price:', total);
      setTotalPrice(total);
    });

    // Clean up the event listeners on component unmount
    return () => {
      socket.off('getCartItems');
      socket.off('cartItems');
      socket.off('getTotalPrice');
      socket.off('totalPrice');
      socket.off('deleteItemError');
      socket.off('deleteItemSuccess');
    };
  }, [socket]);

  const handlecheckout = () => {
    fetch('http://localhost:3080/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cartnumber: userId.message.cartnumber,
        userid:userId.message.userid
      }),
    })
      .then(response => response.json())
      .then(data => {
        // Handle the response data
        console.log(data);
      })
      .catch(error => {
        // Handle any errors
        console.error(error);
      });
  };

  const handleDownload = () => {
    handlecheckout()
    const element = document.querySelector('.checkout');

    const options = {
      filename: `${userid}.pdf`, // Set the filename as the user ID
      jsPDF: { format: 'a4' },
      html2canvas: { scale: 2 },
    };

    html2pdf().set(options).from(element).save();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh the cart items and total price every second
      socket.emit('getCartItems', { userid });
      socket.emit('getTotalPrice', { userid });
    //    getInfo();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [socket]);

  useEffect(() => {
    const updateDateTime = () => {
      const currentDate = new Date();
      const dateTimeString = currentDate.toLocaleString();
      setCurrentDateTime(dateTimeString);
    };

    // Update date and time every second
    const interval = setInterval(updateDateTime, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="checkout">
      <h1 className="receipt-title">RECEIPT</h1>
      <div className="receipt-info">
        <div className="receipt-info-item">
          <span className="receipt-label">Customer Name:</span>
          <span className="receipt-value">{uname}</span>
        </div>
        <div className="receipt-info-item">
          <span className="receipt-label">Customer Email:</span>
          <span className="receipt-value">{uemail}</span>
        </div>
        <div className="receipt-info-item">
          <span className="receipt-label">Customer Contact:</span>
          <span className="receipt-value">{ucontact}</span>
        </div>
        <div className="receipt-info-item">
          <span className="receipt-label">Cart Number:</span>
          <span className="receipt-value">{ucart}</span>
        </div>
        <div className="receipt-info-item">
          <span className="receipt-label">Date/Time:</span>
          <span className="receipt-value">{currentDateTime}</span>
        </div>
      </div>
      <div className="cart-items">
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item) => (
              <tr key={item.id}>
                <td>{item.item_name}</td>
                <td>GH¢ {item.item_price}</td>
                <td></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total:</td>
              <td colSpan="2">GH¢ {totalPrice}</td>
            </tr>
            <tr>
              <td colSpan="3">
                <button onClick={handleDownload}>DOWNLOAD RECEIPT</button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default Checkout;
