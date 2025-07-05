import React from 'react';
import { FaSpinner } from 'react-icons/fa';
import './Loading.css';

export default function Loading() {
    return (
        <div className="loading-container">
            <FaSpinner className="spinner" />
            <p>Loading...</p>
        </div>
    );
} 