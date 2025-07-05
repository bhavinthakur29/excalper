import React from 'react';
import { Link } from 'react-router-dom';
import './NavCard.css';

export default function NavCard({ link, icon: Icon, name, color = 'var(--color-primary)' }) {
    return (
        <Link to={link} className="nav-card">
            <div className="nav-card-content">
                <div className="nav-card-icon" style={{ color }}>
                    <Icon />
                </div>
                <h3 className="nav-card-title">{name}</h3>
            </div>
        </Link>
    );
} 