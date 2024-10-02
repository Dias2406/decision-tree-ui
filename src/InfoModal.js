import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

function InfoModal({ onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling on the main page
    return () => {
      document.body.style.overflow = 'visible'; // Re-enable scrolling when component unmounts
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      document.body.style.overflow = 'visible'; // Re-enable scrolling
    }, 300);
  };

  return (
    <div className={`modal ${isVisible ? 'visible' : ''}`}>
      <div className="modal-content info-modal large-modal">
        <button className="close-button" onClick={handleClose}>
          <FaTimes />
        </button>
        <div className="info-grid">
          <div className="info-box how-to-use">
            <h2>How to Use This Tool</h2>
            <div className="scrollable-box-content">
              <ol>
                <li>Select options in the decision tree menu relevant to your context using the dropdown menus.</li>
                <li>Click 'View Relevant Papers' to filter papers based on your criteria.</li>
                <li>Review the filtered papers presented in list and table views.</li>
                <li>You can download the table as a CSV or Excel file by clicking the 'Download' button.</li>
                <li>Use the results to inform your decision-making process and explore effective interventions for your specific setting.</li>
              </ol>
            </div>
          </div>
          <div className="info-box literature-source">
            <h2>Where This Literature Comes From</h2>
            <div className="scrollable-box-content">
              <p>
                The literature featured in this tool is the result of a compilation process carried out by our team. We employ a combination of automated search tools and manual research techniques, using carefully selected search terms to gather relevant papers.
              </p>
              <p>
                Our team then conducts a thorough assessment of each paper. We evaluate them based on several key criteria, including conceptual coherence, methodological appropriateness, and scientific validity, ensuring that only high-quality, relevant research makes it into our tool.
              </p>
              <p>
                After the selection process, our team extracts the most pertinent information, distilling complex research into accessible insights. This extracted knowledge is then compiled and organized to create what you see on this website.
              </p>
            </div>
          </div>
          <div className="info-box definitions">
            <h2>Definitions</h2>
            <div className="scrollable-content">
              <h3>Sorry for the inconvenience!</h3>
              <p>Our team is working on adding definitions to the tool. Please check back soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InfoModal;