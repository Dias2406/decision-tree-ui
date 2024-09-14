import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ progress, message }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <p className="loading-text">Loading, please wait</p>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${progress}%` }}
          ></div>
          <p className="progress-text">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
