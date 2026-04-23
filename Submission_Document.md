# Lost & Found Item Management System - Project Submission

## 1. Code

### Backend Code

#### \ackend/server.js\
\\\javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');

app.use('/api', authRoutes);
app.use('/api/items', itemRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

\\\

#### \ackend/models/User.js\
\\\javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

\\\

#### \ackend/models/Item.js\
\\\javascript
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Lost', 'Found'],
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  contactInfo: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);

\\\

#### \ackend/routes/authRoutes.js\
\\\javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @route   POST /api/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Duplicate email registration' });
    }

    user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid login credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid login credentials' });
    }

    // Return jsonwebtoken
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

\\\

#### \ackend/routes/itemRoutes.js\
\\\javascript

\\\

#### \ackend/middleware/auth.js\
\\\javascript
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;

\\\

### Frontend Code

#### \rontend/src/App.jsx\
\\\jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div className="container mt-4">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const Home = () => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div className="container mt-4">Loading...</div>;
  if (user) return <Navigate to="/dashboard" />;
  
  return (
    <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--primary)' }}>Campus Lost & Found</h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        A unified platform to report and find lost items on campus.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <a href="/register" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.125rem' }}>Get Started</a>
        <a href="/login" className="btn btn-outline" style={{ padding: '0.75rem 2rem', fontSize: '1.125rem' }}>Login</a>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;

\\\

#### \rontend/src/index.css\
\\\css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --secondary: #10b981;
  --bg-color: #f8fafc;
  --card-bg: #ffffff;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --danger: #ef4444;
  --danger-hover: #dc2626;
  --warning: #f59e0b;
  --radius: 12px;
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  line-height: 1.5;
}

a {
  text-decoration: none;
  color: inherit;
}

/* Utilities */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.text-center { text-align: center; }
.text-danger { color: var(--danger); }
.text-success { color: var(--secondary); }
.mt-4 { margin-top: 1rem; }
.mb-4 { margin-bottom: 1rem; }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
}

.btn-danger {
  background-color: var(--danger);
  color: white;
}

.btn-danger:hover {
  background-color: var(--danger-hover);
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--border);
  color: var(--text-main);
}

.btn-outline:hover {
  background-color: #f1f5f9;
}

.btn-ghost {
  background-color: transparent;
  color: var(--text-main);
}

.btn-ghost:hover {
  background-color: #f1f5f9;
}

/* Forms */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: var(--text-main);
}

.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
  background-color: #f8fafc;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  background-color: white;
}

select.form-control {
  cursor: pointer;
}

/* Auth Cards */
.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 2rem;
}

.auth-card {
  background: var(--card-bg);
  padding: 2.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
}

/* Navbar */
.navbar {
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--primary);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Dashboard */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2rem 0;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-bar {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  max-width: 500px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Item Card */
.item-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.item-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.item-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-lost {
  background-color: #fee2e2;
  color: #991b1b;
}

.badge-found {
  background-color: #d1fae5;
  color: #065f46;
}

.item-body {
  flex-grow: 1;
}

.item-detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.item-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--card-bg);
  padding: 2rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
}

\\\

#### \rontend/src/pages/Login.jsx\
\\\jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        {error && <div className="text-danger mb-4 text-center">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : <><LogIn size={18} /> Login</>}
          </button>
        </form>
        
        <div className="text-center mt-4 text-muted" style={{ fontSize: '0.875rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

\\\

#### \rontend/src/pages/Register.jsx\
\\\jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create an Account</h2>
        {error && <div className="text-danger mb-4 text-center">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : <><UserPlus size={18} /> Register</>}
          </button>
        </form>
        
        <div className="text-center mt-4 text-muted" style={{ fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

\\\

#### \rontend/src/pages/Dashboard.jsx\
\\\jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ItemCard from '../components/ItemCard';
import { Plus, Search, X } from 'lucide-react';

const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', type: 'Lost', location: '', date: '', contactInfo: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (err) {
      console.error('Failed to fetch items');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      let url = '/items/search?';
      if (searchQuery) url += `name=${searchQuery}&`;
      if (filterType) url += `type=${filterType}`;
      
      const res = await api.get(url);
      setItems(res.data);
    } catch (err) {
      console.error('Search failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/items/${id}`);
        setItems(items.filter(item => item._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        type: item.type,
        location: item.location,
        date: new Date(item.date).toISOString().split('T')[0],
        contactInfo: item.contactInfo
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '', description: '', type: 'Lost', location: '', date: '', contactInfo: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const res = await api.put(`/items/${editingItem._id}`, formData);
        setItems(items.map(item => item._id === editingItem._id ? res.data : item));
      } else {
        const res = await api.post('/items', formData);
        setItems([res.data, ...items]);
      }
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  if (loading || !user) return <div className="container" style={{ marginTop: '2rem' }}>Loading...</div>;

  return (
    <div className="container">
      <div className="dashboard-header">
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            className="form-control"
            placeholder="Search items by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="form-control" 
            style={{ width: 'auto' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Lost">Lost</option>
            <option value="Found">Found</option>
          </select>
          <button type="submit" className="btn btn-primary">
            <Search size={18} /> Search
          </button>
        </form>
        
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Report Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
          <p>No items found.</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <ItemCard 
              key={item._id} 
              item={item} 
              onEdit={openModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editingItem ? 'Edit Item' : 'Report Item'}</h2>
              <button className="btn btn-ghost" onClick={closeModal} style={{ padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input type="text" className="form-control" required 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" required rows="3"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-control" required
                  value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Lost">Lost</option>
                  <option value="Found">Found</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location (Lost/Found At)</label>
                <input type="text" className="form-control" required 
                  value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" required 
                  value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Info (Email/Phone)</label>
                <input type="text" className="form-control" required 
                  value={formData.contactInfo} onChange={e => setFormData({...formData, contactInfo: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update Item' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

\\\

#### \rontend/src/components/Navbar.jsx\
\\\jsx
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Search, LogOut, Package } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <Package className="icon" />
          <span>CampusLost&Found</span>
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              <span className="welcome-text">Welcome, {user.name}</span>
              <button onClick={handleLogout} className="btn btn-outline btn-logout">
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

\\\

#### \rontend/src/components/ItemCard.jsx\
\\\jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Calendar, Phone, Edit, Trash2 } from 'lucide-react';

const ItemCard = ({ item, onEdit, onDelete }) => {
  const { user } = useContext(AuthContext);
  
  const isOwner = user && item.user && item.user._id === user.id;
  const isLost = item.type === 'Lost';
  
  return (
    <div className="item-card">
      <div className="item-header">
        <h3 className="item-title">{item.name}</h3>
        <span className={`item-badge ${isLost ? 'badge-lost' : 'badge-found'}`}>
          {item.type}
        </span>
      </div>
      
      <div className="item-body">
        <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>{item.description}</p>
        
        <div className="item-detail">
          <MapPin size={16} />
          <span>{item.location}</span>
        </div>
        
        <div className="item-detail">
          <Calendar size={16} />
          <span>{new Date(item.date).toLocaleDateString()}</span>
        </div>
        
        <div className="item-detail">
          <Phone size={16} />
          <span>{item.contactInfo}</span>
        </div>
        
        {item.user && item.user.name && (
          <div className="item-detail" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
            <span>Posted by: {item.user.name}</span>
          </div>
        )}
      </div>
      
      {isOwner && (
        <div className="item-footer">
          <button className="btn btn-outline" onClick={() => onEdit(item)} style={{ padding: '0.25rem 0.5rem' }}>
            <Edit size={16} /> Edit
          </button>
          <button className="btn btn-danger" onClick={() => onDelete(item._id)} style={{ padding: '0.25rem 0.5rem' }}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ItemCard;

\\\

#### \rontend/src/services/api.js\
\\\javascript

\\\

---

## 2. Code Output (Screenshots)
*[Please insert your screenshots of the React Frontend running locally here]*

---

## 3. Postman/Thunder Client HTTP Requests
*[Please insert your Postman/Thunder Client screenshots testing the APIs here]*

---

## 4. MongoDB Items Storage Part
*[Please insert your MongoDB Compass screenshots showing the database storage here]*

---

## 5. Render Deployment Successful
*[Please insert the screenshot of your Render dashboard showing a successful deployment here]*

---

## 6. Render Testing Live URL for each end-point
*[Please insert screenshots of Postman testing the live Render URLs here]*

