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
