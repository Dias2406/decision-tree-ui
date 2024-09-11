import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './navbar';
import SelectionUI from './SelectionUI';
import { FaInfoCircle } from 'react-icons/fa';

// Add this function at the top of your file, outside of the App component
function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

function App() {
  const [selections, setSelections] = useState({});
  const [relevantPapers, setRelevantPapers] = useState(0);
  const [userCriteria, setUserCriteria] = useState({});
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [paperDescriptors, setPaperDescriptors] = useState([]);
  const [expandedPapers, setExpandedPapers] = useState({});
  const [paperData, setPaperData] = useState({});

  useEffect(() => {
    // Remove the existing useEffect that updates relevantPapers
  }, []);

  useEffect(() => {
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 0;

    function handleScroll() {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > lastScrollTop && scrollTop > navbarHeight * 2) {
        // Scrolling down & past twice the navbar height
        navbar.classList.add('navbar--hidden');
      } else if (scrollTop < lastScrollTop || scrollTop <= navbarHeight) {
        // Scrolling up or near the top
        navbar.classList.remove('navbar--hidden');
      }
      
      lastScrollTop = scrollTop;
    }

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSubmit = () => {
    console.log(JSON.stringify(selections, null, 2));
    setOverlayVisible(true);
    document.body.classList.add('no-scroll'); // Lock scroll

    // Fetch paper descriptors based on user criteria
    fetch('http://68.183.9.1321/api/paper-hashes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userCriteria),
    })
      .then(response => response.json())
      .then(data => {
        setPaperDescriptors(data.descriptors);
      })
      .catch(error => console.error('Error fetching paper descriptors:', error));

    // Force navbar to appear with animation
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.classList.remove('navbar--hidden');
      navbar.style.transition = 'transform 0.3s ease-in-out';
      navbar.style.transform = 'translateY(0)';
      
      // Reset the transition after it's complete
      setTimeout(() => {
        navbar.style.transition = '';
      }, 300);
    }
  };

  const handleCloseOverlay = () => {
    setOverlayVisible(false);
    document.body.classList.remove('no-scroll'); // Unlock scroll

    // Reset navbar to its original state
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.style.transition = '';
      navbar.style.transform = '';
    }
  };

  const togglePaperExpansion = (hash) => {
    setExpandedPapers(prev => ({
      ...prev,
      [hash]: !prev[hash]
    }));
  };

  const fetchPaperData = (hash) => {
    fetch(`http://68.183.9.1321/api/paper/${hash}`)
      .then(response => response.json())
      .then(data => setPaperData(prevState => ({ ...prevState, [hash]: data })))
      .catch(error => console.error('Error fetching paper data:', error));
  };

  return (
    <div className="App">
      
      <Navbar />

      <div style={{
        position: 'absolute',
        top: '0px', // Adjust this value to position it below the navbar
        left: '0',
        width: '100%',
        textAlign: 'center',
        zIndex: '1',
        color: '#666',
        fontSize: '10px'
      }}>
        Made by Frederico Leite Richardson and Dias Jakupov<br></br>frederico@l4wb-i.org<br></br>dias@l4wb-i.org
      </div>

      <div style={{ backgroundColor: '#EFEFEF', padding: '20px', height: '150px', position: 'relative' }}>
        {/* Content for the first gray section */}
      </div>

      <div className="red-box-container">
        <div className="red-box">
          <span className="big-text-white-red-box">POLICY DECISION TREE</span>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', height: '230px', position: 'relative' }}>
        <div style={{ maxWidth: '700px', margin: '80px auto 0', textAlign: 'center' }}>
          <p className="small-text-bold">
            This interactive tool helps policymakers identify evidence-based recommendations for improving child outcomes in various contexts.
          </p>
          <p className="small-text">
            Select your areas of interest, target population, and context using the dropdown menus. The tool will then generate tailored policy recommendations based on current evidence. Use the results to inform your decision-making process and explore effective interventions in your specific setting.
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: '#EFEFEF', padding: '20px'}}>
        <SelectionUI setSelections={setSelections} setRelevantPapers={setRelevantPapers} setUserCriteria={setUserCriteria} />
      </div>

      <div className="floating-papers-count">
        {Object.keys(userCriteria).length === 0 ? (
          <span>All {relevantPapers} papers available. Apply filters or proceed to view all results.</span>
        ) : (
          <span>Number of relevant papers: {relevantPapers}</span>
        )}
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', height: '500px' }}>
        <button onClick={handleSubmit} className="submit-button">Submit</button>
      </div>

      <div style={{ backgroundColor: '#EFEFEF', padding: '20px' }}>
        {/* Additional content */}
      </div>

      <footer className="footer">
        Copyright © 2024 | Learning for Well-being – 
        <a href="https://l4wb-i.org/privacy-policy/"> Privacy Policy</a> – 
        <a href="https://l4wb-i.org/cookies-policy/"> Cookies policy</a> – 
        <a href="https://l4wb-i.org/general-terms-and-conditions/"> General terms and conditions</a> – 
        <a href="https://l4wb-i.org/legal-notice/"> Legal notice</a>
      </footer>

      <div className={`overlay ${overlayVisible ? 'visible' : ''}`}>
        <div className="overlay-content">
          <div className="overlay-header">
            <button onClick={handleCloseOverlay} className="overlay-button">Back</button>
            <h2></h2>
          </div>
          {paperDescriptors.length > 0 ? (
            paperDescriptors.map(descriptor => (
              <div key={descriptor.hash} className="paper-box">
                <div className="paper-header">
                  <h3>{descriptor.data.title}</h3>
                  <div className="info-icon-container">
                    <FaInfoCircle 
                      className="info-icon" 
                      onMouseEnter={() => fetchPaperData(descriptor.hash)}
                    />
                    {paperData[descriptor.hash] && (
                      <div className="criteria-box">
                        <h4>Paper Descriptors:</h4>
                        <ul>
                          {Object.entries(paperData[descriptor.hash]).map(([key, value]) => (
                            !['hash', 'title', 'description of the intervention/policy option', 'description of the intervention/policy option summary', 'findings'].includes(key) && (
                              <li key={key}>
                                <strong>{capitalizeWords(key)}:</strong> {Array.isArray(value) ? value.join(', ') : value}
                              </li>
                            )
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="description-header" onClick={() => togglePaperExpansion(descriptor.hash)}>
                  <h4 className="highlight-color">Policy Description</h4>
                  <div className="expand-indicator">
                    <span>{expandedPapers[descriptor.hash] ? 'Read less' : 'Read more'}</span>
                    <span className={`arrow ${expandedPapers[descriptor.hash] ? 'expanded' : ''}`}>▶</span>
                  </div>
                </div>
                <p>{descriptor.data['description of the intervention/policy option summary']}</p>
                <div className={`expandable-content ${expandedPapers[descriptor.hash] ? 'expanded' : ''}`}>
                  <h4 className="highlight-color">Details:</h4>
                  <p>{descriptor.data['description of the intervention/policy option']}</p>
                </div>
                <h4 className="highlight-color">Findings</h4>
                <p>{descriptor.data['findings']}</p>
              </div>
            ))
          ) : (
            <p>No papers found matching your criteria.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;