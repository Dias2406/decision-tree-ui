import React, { useState, useEffect } from 'react';
import { FaQuestionCircle, FaTimes } from 'react-icons/fa';
import { MdHelp } from 'react-icons/md';
import './HelpFeatures.css';

const HelpFeatures = () => {
  const [showVideo, setShowVideo] = useState(false);
  const [showHelpBar, setShowHelpBar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [primaryIconFailed, setPrimaryIconFailed] = useState(false);

  const SCRIBE_URL = "https://scribehow.com/shared/How_to_use_the_L4WB-i_Policy_Decisions_Tree__k5Us3SdtS-SNezl31O-WMg";

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

  // Handle scroll locking (only for desktop modal)
  useEffect(() => {
    if (!isMobile && showVideo) {
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
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    }
  }, [showVideo, isMobile]);

  const handleHelpClick = () => {
    if (isMobile) {
      window.open(SCRIBE_URL, '_blank');
    } else {
      setShowVideo(true);
    }
  };

  return (
    <>
      {/* Desktop Elements */}
      {!isMobile && (
        <>
          {/* Floating Help Button - Desktop only */}
          <button 
            className="floating-help-button"
            onClick={handleHelpClick}
            title="Need help?"
          >
            {!primaryIconFailed ? (
              <FaQuestionCircle 
                onError={() => setPrimaryIconFailed(true)}
                className="help-icon primary"
              />
            ) : (
              <MdHelp className="help-icon backup" />
            )}
          </button>

          {/* Help Bar - Desktop only */}
          <div className={`help-bar ${showHelpBar ? 'visible' : ''}`}>
            <div className="help-bar-content">
              <span>Need some help?</span>
              <button 
                className="help-bar-button"
                onClick={handleHelpClick}
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

          {/* Video Modal - Desktop only */}
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
      )}

      {/* Mobile Help Button */}
      {isMobile && (
        <button 
          className="mobile-help-button"
          onClick={handleHelpClick}
        >
          Need Help?
        </button>
      )}
    </>
  );
};

export default HelpFeatures; 