import React, { useState, useEffect } from 'react';
import { FaQuestionCircle, FaTimes } from 'react-icons/fa';
import './HelpFeatures.css';

const HelpFeatures = () => {
  const [showVideo, setShowVideo] = useState(false);
  const [showHelpBar, setShowHelpBar] = useState(false);

  useEffect(() => {
    // Show help bar after 2 seconds
    const timer = setTimeout(() => {
      setShowHelpBar(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Floating Help Button */}
      <button 
        className="floating-help-button"
        onClick={() => setShowVideo(true)}
        title="Need help?"
      >
        <FaQuestionCircle />
      </button>

      {/* Help Bar */}
      <div className={`help-bar ${showHelpBar ? 'visible' : ''}`}>
        <div className="help-bar-content">
          <span>Need some help?</span>
          <button 
            className="help-bar-button"
            onClick={() => setShowVideo(true)}
          >
            Read Tutorial
          </button>
          <button 
            className="help-bar-close"
            onClick={() => setShowHelpBar(false)}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="video-modal">
          <div className="video-modal-content">
            <button 
              className="video-modal-close"
              onClick={() => setShowVideo(false)}
            >
              <FaTimes />
            </button>
            <iframe 
              src="https://scribehow.com/embed/How_to_use_the_L4WB-i_Policy_Decisions_Tree__k5Us3SdtS-SNezl31O-WMg?removeLogo=true&as=scrollable" 
              width="100%" 
              height="640" 
              allowFullScreen 
              frameBorder="0"
              title="How to use the L4WB-i Policy Decisions Tree"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default HelpFeatures; 