import React, { useState, useEffect } from 'react';
import { FaQuestionCircle, FaTimes } from 'react-icons/fa';
import './HelpFeatures.css';

const HELP_URL = 'https://scribehow.com/shared/How_to_use_the_L4WB-i_Policy_Decisions_Tree__k5Us3SdtS-SNezl31O-WMg';

const HelpFeatures = () => {
  const [showVideo, setShowVideo] = useState(false);
  const [showHelpBar, setShowHelpBar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Show help bar after 2 seconds (only on desktop)
    const timer = !isMobile ? setTimeout(() => {
      setShowHelpBar(true);
    }, 2000) : null;

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (timer) clearTimeout(timer);
    };
  }, [isMobile]);

  // Handle scroll locking
  useEffect(() => {
    if (showVideo) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    }
  }, [showVideo]);

  const handleHelpClick = () => {
    if (isMobile) {
      window.open(HELP_URL, '_blank');
    } else {
      setShowVideo(true);
    }
  };

  return (
    <>
      {/* Help Button */}
      <button 
        className="floating-help-button"
        onClick={handleHelpClick}
        title="Need help?"
      >
        <FaQuestionCircle size={isMobile ? 24 : 20} />
      </button>

      {/* Help Bar - Only on desktop */}
      {!isMobile && (
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
      )}

      {/* Video Modal - Only on desktop */}
      {!isMobile && showVideo && (
        <div className="video-modal">
          <div className="video-modal-content">
            <button 
              className="video-modal-close"
              onClick={() => setShowVideo(false)}
            >
              <FaTimes />
            </button>
            <iframe 
              src={`${HELP_URL}?removeLogo=true&as=scrollable`}
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