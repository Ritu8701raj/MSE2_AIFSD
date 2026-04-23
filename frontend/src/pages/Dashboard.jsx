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
