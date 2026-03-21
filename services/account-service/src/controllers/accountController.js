const User = require('../models/User');
const { ADMIN_EMAIL } = require('../config/env');
const { isAdminCredentials, getAdminOverview } = require('../services/adminService');

function health(req, res) {
  res.json({ status: 'ok', service: 'account-service' });
}

async function register(req, res) {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: 'name, email and password are required' });
  }

  if (String(email).trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({
      message: 'This email is reserved for the system administrator',
    });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({ name, email, password });
    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Error registering user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  if (isAdminCredentials(email, password)) {
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: 'admin',
        role: 'admin',
        name: 'Administrator',
        email: ADMIN_EMAIL,
      },
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'user',
      },
    });
  } catch (err) {
    console.error('Error logging in user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function adminOverview(req, res) {
  const { adminEmail, adminPassword } = req.body || {};
  if (!isAdminCredentials(adminEmail, adminPassword)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const users = await User.find()
      .select('name email _id')
      .sort({ createdAt: -1 })
      .lean();
    const overview = await getAdminOverview(users);
    return res.json(overview);
  } catch (err) {
    console.error('Admin overview error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getUserById(req, res) {
  try {
    if (req.params.id === 'admin') {
      return res.json({
        id: 'admin',
        name: 'Administrator',
        email: ADMIN_EMAIL,
        role: 'admin',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateUser(req, res) {
  const { name, email, password } = req.body || {};

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (password !== undefined) user.password = password;

    await user.save();

    return res.json({
      message: 'User updated successfully',
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  health,
  register,
  login,
  adminOverview,
  getUserById,
  updateUser,
  deleteUser,
};
