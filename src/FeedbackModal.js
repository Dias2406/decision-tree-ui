// © 2024 Learning for Well-Being Institute. All rights reserved.
// Policy Decision Tree
// policydecisions.org

import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';

function FeedbackModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(null);
  const [hover, setHover] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, email, organization, feedback, rating });
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for the animation to finish before closing
  };

  return (
    <div className={`modal ${isVisible ? 'visible' : ''}`}>
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <h2>Please Provide Feedback</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
          <textarea
            placeholder="Your feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required
          ></textarea>
          <div className="rating-container">
            <span>Rate your overall experience:</span>
            <div className="star-rating">
              {[...Array(10)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                  <FaStar
                    key={index}
                    color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                    size={20}
                    onClick={() => setRating(ratingValue)}
                    onMouseEnter={() => setHover(ratingValue)}
                    onMouseLeave={() => setHover(rating)}
                  />
                );
              })}
            </div>
          </div>
          <button type="submit" className="submit-button">Submit Feedback</button>
          <button type="button" className="cancel-button" onClick={handleClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
}

export default FeedbackModal;