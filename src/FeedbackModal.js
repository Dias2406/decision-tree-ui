import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

function FeedbackModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, email, organization, feedback, rating });
  };

  return (
    <div className="modal">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <h2>Provide Feedback</h2>
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
                    color={ratingValue <= rating ? "#ffc107" : "#e4e5e9"}
                    size={20}
                    onClick={() => setRating(ratingValue)}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </div>
          </div>
          <button type="submit" className="submit-button">Submit Feedback</button>
          <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
}

export default FeedbackModal;