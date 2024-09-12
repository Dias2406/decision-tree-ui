import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ progress }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <p className="loading-text">Loading, please wait</p>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
