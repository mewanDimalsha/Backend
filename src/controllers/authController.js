const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
    const { name, password, role } = req.body;

    // Validate required fields
    if (!name || !password) {
        return res.status(400).json({ message: 'Name and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ name });
    if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      name,
      password: hashedPassword,
      role: role || 'user', // Default to 'user' if no role provided
    });

    await newUser.save();

    res.status(201).json({ message: `User ${name} registered successfully` });

    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error' });
    }

}
const login = async (req, res) => {
try {
  // Login logic here
  const { name, password } = req.body;
  
  // Check if name and password are provided
  if (!name || !password) {
    return res.status(400).json({ message: 'Name and password are required' });
  }

  const user = await User.findOne({ name });
  if (!user) {
    return res.status(404).json({ message: `User ${name} not found` });
  }

  // Compare the provided password with the stored hashed password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  // Generate a JWT token
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({ message: `Login ${name} successful`, token });
} catch (error) {
  console.error('Error during login:', error);
  res.status(500).json({ message: 'Server error' });
}
}
module.exports = { login, register }