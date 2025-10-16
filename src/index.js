const express = require('express');
const dotenv = require('dotenv').config();
const dbConnect = require('./config/dbConnect');

// Connect to the database
dbConnect();

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Sample route

//start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});