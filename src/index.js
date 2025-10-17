const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const dbConnect = require('./config/dbConnect');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Connect to the database
dbConnect();

const app = express();

// CORS middleware - MUST come before other middleware
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sample route
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

//start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});