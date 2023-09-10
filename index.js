const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const cors = require('cors');
//sudo -u postgres psql cart_user

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});

app.use(bodyParser.json());
app.use(express.json());
app.use(cors('*'));
app.use(bodyParser.urlencoded({ extended: true }));
var bal;


const pool = new Pool({
    user: 'shop',
    host: '::',
    database: 'cart_user',
    password: 'cart1255',
    port: 5432, // Default PostgreSQL port
  });
  
  // Function to generate a UUID for userid
  const generateUUID = () => uuidv4();
  
var pid;
// let items = [];
// let total = 0;

io.on('connection', (socket) => {
  console.log('Client connected');


socket.on('cardnumber', async (data) => {
    const cartnumber = data.basketNumber;
    const productId = data.rfidNumber;
    var userId;


    getUserIdByCartNumber(cartnumber)
    .then((userid) => {
      if (userid) {
        userId = userid
        
        addItemToCart(productId,userId)
       
       } else {
        console.log(`No user found for cartnumber ${cartnumber}`);
      }
    })
    .catch((error) => {
      console.error('Error occurred:', error);
    });

    // socket.emit('info', { message: 'Item Added',balance: bal });

});



socket.on('addProduct', async (data) => {
  const { productname, productnumber, productprice } = data;

  try {
    const client = await pool.connect();
    const checkQuery = 'SELECT COUNT(*) FROM products WHERE productnumber = $1';
    const checkValues = [productnumber];

    const checkResult = await client.query(checkQuery, checkValues);
    const count = parseInt(checkResult.rows[0].count, 10);

    if (count > 0) {
      client.release();
      socket.emit('productExists', { message: 'Product number already exists. Please choose a different product number.' });
      return;
    }

    const insertQuery = 'INSERT INTO products (productname, productnumber, productprice) VALUES ($1, $2, $3)';
    const insertValues = [productname, productnumber, productprice];

    await client.query(insertQuery, insertValues);

    client.release();

    console.log('Product added successfully!');
    socket.emit('addProductSuccess', { message: 'Product added successfully!' });
  } catch (error) {
    console.error('Error adding product:', error);
    socket.emit('addProductError', { error: 'An error occurred while adding the product' });
  }
});


async function getUserIdByCartNumber(cartnumber) {
  try {
     const client = await pool.connect();
    const result = await client.query('SELECT userid FROM users WHERE cartnumber = $1', [cartnumber]);
    client.release();
    if (result.rows.length > 0) {
      return result.rows[0].userid;
    } else {
      return null; // If no matching cartnumber found
    }
  } catch (error) {
    console.error('Error occurred:', error);
    throw error;
  }
}


async function addItemToCart(productnumber, userid) {
  const productid = productnumber; // Set productid as productnumber

  try {
    const client = await pool.connect();

    // Check if the product already exists in the cart
    const checkExistingQuery = 'SELECT COUNT(*) FROM cart WHERE userid = $1 AND productid = $2';
    const checkExistingValues = [userid, productid];
    const checkExistingResult = await client.query(checkExistingQuery, checkExistingValues);
    const count = parseInt(checkExistingResult.rows[0].count, 10);

    if (count > 0) {
      // Product already exists in the cart, delete it
      const deleteQuery = 'DELETE FROM cart WHERE userid = $1 AND productid = $2';
      const deleteValues = [userid, productid];
      await client.query(deleteQuery, deleteValues);

      console.log('Product already exists in the cart. Item deleted.');
      getTotalPrice(userid).then(totalPrice => {
      socket.emit('info', { message: 'Item deleted', balance: totalPrice });
       });
    } else {
      // Fetch productname and productprice based on productnumber
      const fetchProductQuery = 'SELECT productname, productprice FROM products WHERE productnumber = $1';
      const fetchProductValues = [productnumber];
      const productResult = await client.query(fetchProductQuery, fetchProductValues);
      const product = productResult.rows[0];

      if (!product) {
        // Product with the specified productnumber does not exist
        client.release();
        console.error('Product not found');
         getTotalPrice(userid).then(totalPrice => {
          socket.emit('info', { message: 'No Product', balance: totalPrice });
           });
        return { error: 'Product not found' };
      }

      const { productname, productprice } = product;

      const insertQuery = 'INSERT INTO cart (userid, productid, item_name, item_price) VALUES ($1, $2, $3, $4)';
      const insertValues = [userid, productid, productname, productprice];

      await client.query(insertQuery, insertValues);

      console.log('Item added to cart successfully!');
       getTotalPrice(userid).then(totalPrice => {
        socket.emit('info', { message: 'Item added', balance: totalPrice });
         });
      return { message: 'Item added to cart successfully!' };
    }

    client.release();

  } catch (error) {
    console.error('Error adding item to cart:', error);
     getTotalPrice(userid).then(totalPrice => {
      socket.emit('info', { message: 'Error item', balance: totalPrice });
       });
    return { error: 'An error occurred while adding item to cart' };
  }
}


async function getTotalPrice(userid) {
  try {
    const client = await pool.connect();
    const query = 'SELECT SUM(item_price) AS total_price FROM cart WHERE userid = $1';
    const values = [userid];

    const result = await client.query(query, values);
    const totalPrice = result.rows[0].total_price;

    client.release();

    console.log('Total price fetched successfully!');
    return totalPrice;
  } catch (error) {
    console.error('Error fetching total price:', error);
    return { error: 'An error occurred while fetching total price' };
  }
}


 
















  // socket.on('addItemToCart', async (data) => {
  //   const { productnumber, userid } = data;
  //   const productid = productnumber; // Set productid as productnumber
  
  //   try {
  //     const client = await pool.connect();
  
  //     // Check if the product already exists in the cart
  //     const checkExistingQuery = 'SELECT COUNT(*) FROM cart WHERE userid = $1 AND productid = $2';
  //     const checkExistingValues = [userid, productid];
  //     const checkExistingResult = await client.query(checkExistingQuery, checkExistingValues);
  //     const count = parseInt(checkExistingResult.rows[0].count, 10);
  
  //     if (count > 0) {
  //       // Product already exists in the cart
  //       client.release();
  //       console.error('Product already exists in the cart');
  //       socket.emit('addItemError', { error: 'Product already exists in the cart' });
  //       return;
  //     }
  
  //     // Fetch productname and productprice based on productnumber
  //     const fetchProductQuery = 'SELECT productname, productprice FROM products WHERE productnumber = $1';
  //     const fetchProductValues = [productnumber];
  //     const productResult = await client.query(fetchProductQuery, fetchProductValues);
  //     const product = productResult.rows[0];
  
  //     if (!product) {
  //       // Product with the specified productnumber does not exist
  //       client.release();
  //       console.error('Product not found');
  //       socket.emit('addItemError', { error: 'Product not found' });
  //       return;
  //     }
  
  //     const { productname, productprice } = product;
  
  //     const insertQuery = 'INSERT INTO cart (userid, productid, item_name, item_price) VALUES ($1, $2, $3, $4)';
  //     const insertValues = [userid, productid, productname, productprice];
  
  //     await client.query(insertQuery, insertValues);
  
  //     client.release();
  
  //     console.log('Item added to cart successfully!');
  //     socket.emit('addItemSuccess', { message: 'Item added to cart successfully!' });
  //   } catch (error) {
  //     console.error('Error adding item to cart:', error);
  //     socket.emit('addItemError', { error: 'An error occurred while adding item to cart' });
  //   }
  // });
  
  
  

  socket.on('getCartItems', async (data) => {
     const {userid} = data;
     console.log(userid)
    try {
      const client = await pool.connect();
      const query = 'SELECT * FROM cart WHERE userid = $1';
      const values = [userid];

      const result = await client.query(query, values);
      const cartItems = result.rows;
      console.log(cartItems)
      client.release();

      console.log('Cart items fetched successfully!');
      socket.emit('cartItems',  { items: cartItems });
    } catch (error) {
      console.error('Error fetching cart items:', error);
      socket.emit('cartItemsError', { error: 'An error occurred while fetching cart items' });
    }
  });

  socket.on('deleteItemFromCart', async (data) => {
    const {productid,userid} = data;
    console.log(productid)
    try {
        const client = await pool.connect();
        const query = 'DELETE FROM cart WHERE productid = $1 AND userid = $2';
        const values = [productid, userid];
    
        await client.query(query, values);
    
        client.release();
    
        console.log('Item deleted from cart successfully!');
        socket.emit('deleteItemSuccess', { message: 'Item deleted from cart successfully!' });
      } catch (error) {
        console.error('Error deleting item from cart:', error);
        socket.emit('deleteItemError', { error: 'An error occurred while deleting item from cart' });
      }
    });

    socket.on('getTotalPrice', async (data) => {
        const {userid} = data;
        try {
          const client = await pool.connect();
          const query = 'SELECT SUM(item_price) AS total_price FROM cart WHERE userid = $1';
          const values = [userid];
      
          const result = await client.query(query, values);
          const totalPrice = result.rows[0].total_price;
      
          client.release();
      
          console.log('Total price fetched successfully!');
          socket.emit('totalPrice', { total: totalPrice });
        } catch (error) {
          console.error('Error fetching total price:', error);
          socket.emit('totalPriceError', { error: 'An error occurred while fetching total price' });
        }
      });


      socket.on('dropProductsTable', async () => {
        try {
          const client = await pool.connect();
      
          // Query to drop the "products" table
          const dropTableQuery = 'DROP TABLE IF EXISTS products';
      
          // Execute the query to drop the table
          await client.query(dropTableQuery);
      
          client.release();
      
          console.log('Products table dropped successfully!');
          socket.emit('productsTableDropped', { message: 'Products table dropped successfully!' });
        } catch (error) {
          console.error('Error dropping products table:', error);
          socket.emit('productsTableDropError', { error: 'An error occurred while dropping the products table' });
        }
      });

      
      socket.on('dropTables', async () => {
        try {
          const client = await pool.connect();
      
          // Query to drop the "users" table
          const dropUsersTableQuery = 'DROP TABLE IF EXISTS users';
      
          // Query to drop the "cart" table
          const dropCartTableQuery = 'DROP TABLE IF EXISTS cart';
      
          // Execute the query to drop the "users" table
          await client.query(dropUsersTableQuery);
      
          // Execute the query to drop the "cart" table
          await client.query(dropCartTableQuery);
      
          client.release();
      
          console.log('Users and Cart tables dropped successfully!');
          socket.emit('tablesDropped', { message: 'Users and Cart tables dropped successfully!' });
        } catch (error) {
          console.error('Error dropping tables:', error);
          socket.emit('tablesDropError', { error: 'An error occurred while dropping the tables' });
        }
      });
      
      socket.on('deleteProduct', async (data) => {
        const {productnumber} = data;
        try {
          const client = await pool.connect();
          const checkQuery = 'SELECT COUNT(*) FROM products WHERE productnumber = $1';
          const checkValues = [productnumber];
      
          const checkResult = await client.query(checkQuery, checkValues);
          const count = parseInt(checkResult.rows[0].count, 10);
      
          if (count === 0) {
            client.release();
            socket.emit('productNotFound', { message: 'Product does not exist.' });
            return;
          }
      
          const deleteQuery = 'DELETE FROM products WHERE productnumber = $1';
          const deleteValues = [productnumber];
      
          await client.query(deleteQuery, deleteValues);
      
          client.release();
      
          console.log('Product deleted successfully!');
          socket.emit('deleteProductSuccess', { message: 'Product deleted successfully!' });
        } catch (error) {
          console.error('Error deleting product:', error);
          socket.emit('deleteProductError', { error: 'An error occurred while deleting the product' });
        }
      });

      
      socket.on('getAllProducts', async () => {
        try {
          const client = await pool.connect();
          const query = 'SELECT * FROM products';
          const result = await client.query(query);
          const products = result.rows;
          client.release();
      
          console.log('Products fetched successfully!');
          socket.emit('allProducts', { products });
        } catch (error) {
          console.error('Error fetching products:', error);
          socket.emit('allProductsError', { error: 'An error occurred while fetching products' });
        }
      });
      

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


const createTables = async () => {
    try {
      const client = await pool.connect();
      const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        contact VARCHAR(255),
        email VARCHAR(255),
        cartnumber VARCHAR(255),
        userid TEXT,
        checkout BOOLEAN
      )
      `;
      const createCartTableQuery = `
        CREATE TABLE IF NOT EXISTS cart (
          id SERIAL PRIMARY KEY,
          userid TEXT,
          productid TEXT,
          item_name VARCHAR(255),
          item_price DECIMAL(10, 2)
        )
      `;

      const createProductTableQuery = `
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          productname VARCHAR(255),
          productnumber VARCHAR(255),
          productprice NUMERIC(10, 2)
        )
      `;
  
      await client.query(createUsersTableQuery);
      await client.query(createCartTableQuery);
      await client.query(createProductTableQuery);

      client.release();
  
      console.log('Users, Cart and Products tables created successfully!');
    } catch (error) {
      console.error('Error creating tables:', error);
    }
  };

  // API endpoint to handle signup POST request
  app.post('/signup', async (req, res) => {
    const { name, contact, email, cartnumber } = req.body;
    const checkout = false;
    const userid = generateUUID();
    console.log(userid);
  
    try {
      const client = await pool.connect();
  
      // Check if the cartnumber is assigned to any user
      const checkCartQuery = 'SELECT * FROM users WHERE cartnumber = $1';
      const checkCartValues = [cartnumber];
      const checkCartResult = await client.query(checkCartQuery, checkCartValues);
      const existingUser = checkCartResult.rows[0];
  
      if (existingUser && !existingUser.checkout) {

        // Cartnumber is already assigned to a user
        client.release();
        console.log('Cart is busy. Customer has not checked out.');
        return res.status(409).json({ error: 'Cart is busy. Customer has not checked out.' });
      }
  
      const query = 'INSERT INTO users (name, contact, email, cartnumber, userid, checkout) VALUES ($1, $2, $3, $4, $5, $6)';
      const values = [name, contact, email, cartnumber, userid, checkout];
  
      await client.query(query, values);
  
      const query1 = 'SELECT * FROM users WHERE userid = $1';
      const values1 = [userid];
  
      const result = await client.query(query1, values1);
  
      const userDetails = result.rows[0]; // Assuming the query returns only one row
  
      res.status(200).json({ message: userDetails});
      client.release();
  
      console.log('User signed up successfully!');
    } catch (error) {
      console.error('Error signing up user:', error);
      res.status(500).json({ error: 'An error occurred while signing up the user' });
    }
  });
  
  
  

  app.post('/getInfo', async (req, res) => {
    const { userid } = req.body;
  
    try {
      const client = await pool.connect();
  
      // Query user details from the database based on the userid
      const query = 'SELECT * FROM users WHERE userid = $1';
      const values = [userid];
  
      const result = await client.query(query, values);
  
      client.release();
  
      const userDetails = result.rows[0]; // Assuming the query returns only one row
  
      res.status(200).json({ message: userDetails });
    } catch (error) {
      console.error('Error querying user details:', error);
      res.status(500).json({ error: 'An error occurred while querying user details' });
    }
  });


  // Create the users table and start the server
  createTables().then(() => {
    const ports = 3080;
    app.listen(ports, () => {
      console.log(`Server listening on port ${ports}`);
    });
  });

  app.post('/checkout', async (req, res) => {
    const { cartnumber, userid } = req.body;
  
    try {
      const client = await pool.connect();
  
      // Update the checkout value to true
      const updateQuery = 'UPDATE users SET checkout = true WHERE cartnumber = $1 AND userid = $2';
      const updateValues = [cartnumber, userid];
      await client.query(updateQuery, updateValues);
  
      client.release();
  
      console.log('Checkout updated successfully!');
      res.status(200).json({ message: 'Checkout updated successfully!' });
    } catch (error) {
      console.error('Error updating checkout:', error);
      res.status(500).json({ error: 'An error occurred while updating checkout' });
    }
  });


  app.post('/admin_checkout', async (req, res) => {
    const { cartnumber } = req.body;
  
    try {
      // Update the 'checkout' field for all matching cartnumbers
      const updateQuery = 'UPDATE users SET checkout = true WHERE cartnumber = $1';
      const updateValues = [cartnumber];
      const result = await pool.query(updateQuery, updateValues);
  
      // Check if any rows were affected
      if (result.rowCount > 0) {
        res.status(200).json({ success: true, message: 'Checkout updated successfully' });
      } else {
        res.status(200).json({ success: false, message: 'No rows found for update' });
      }
    } catch (error) {
      console.error('Error occurred while updating checkout:', error);
      res.status(500).json({ success: false, message: 'Failed to update checkout' });
    }
  });
  
  
  
const port = 8080;
server.listen(port, () => {
  console.log(`WebSocket server listening on port ${port}`);
});
