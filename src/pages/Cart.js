import React, { useState, useEffect ,useContext} from 'react';
import './cart.css';
import { useNavigate } from 'react-router-dom';
import UserContext from '../UserContext';
import io from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';

const Cart = () => {
  const navigate = useNavigate();
  const socket = io('http://localhost:8080'); // Replace with your server endpoint
  const { userId } = useContext(UserContext);
  
  // const userid = '6d50fa5e-c2e5-4a8d-8caf-e2e2ef7644b0'; // Replace with the actual userid

  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
 
  var userid = userId.message.userid;
  var cartnumber = userId.message.cartnumber;
  useEffect(() => {
    // Emit 'getCartItems' event with userid
    // socket.emit('setup', {cartnumber,userid });

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
  }, []);

  const handleDeleteItem = (productId) => {
    console.log('Delete item:', productId);
    socket.emit('deleteItemFromCart', { productid: productId, userid: userid });
  };

  const handleCheckout = () => {
    // Add your logic for the checkout functionality
    navigate('/checkout'); // Replace '/checkout' with the appropriate route for your checkout page
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh the cart items and total price every second
      socket.emit('getCartItems', { userid });
      socket.emit('getTotalPrice', { userid });
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="contain">
      <h1>WELCOME TO YOUR CART</h1>
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
                <td>
                  <FontAwesomeIcon
                    icon={faTrashAlt}
                    className="delete-icon"
                    onClick={() => handleDeleteItem(item.productid)}
                  />
                </td>
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
                <button onClick={handleCheckout}>Checkout</button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default Cart;
