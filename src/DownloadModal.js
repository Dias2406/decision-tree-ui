import React, { useState, useEffect } from 'react';

function DownloadModal({ onClose, onDownload }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for the animation to finish before closing
  };

  return (
    <div className={`modal ${isVisible ? 'visible' : ''}`}>
      <div className="modal-content">
        <h2>Download Options</h2>
        <p>Choose a format to download your selected papers:</p>
        <button onClick={() => onDownload('csv')}>Download as CSV</button>
        <button onClick={() => onDownload('xlsx')}>Download as XLSX</button>
        <button className="cancel-button" onClick={handleClose}>Cancel</button>
      </div>
    </div>
  );
}

export default DownloadModal;
