import React, { useState, useEffect} from 'react';
import './App.css';
import Navbar from './navbar';
import SelectionUI from './SelectionUI';
import { FaInfoCircle, FaCircle, FaTable, FaList, FaExternalLinkAlt } from 'react-icons/fa';
import LoadingScreen from './LoadingScreen';

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
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [expandedFindings, setExpandedFindings] = useState({});
  const [paperData, setPaperData] = useState({});
  const [expandedChallenges, setExpandedChallenges] = useState({});
  const [viewMode, setViewMode] = useState('list');

  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const totalCheckpoints = 5; // Set this to the total number of checkpoints you want

  const [isOverlayLoading, setIsOverlayLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

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

  const updateProgress = (checkpoint) => {
    const newProgress = (checkpoint / totalCheckpoints) * 100;
    setLoadingProgress(newProgress);
    if (checkpoint === totalCheckpoints) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial loading tasks
    updateProgress(1); // First checkpoint

    // Simulating other loading tasks
    setTimeout(() => updateProgress(2), 100); // Second checkpoint
    setTimeout(() => updateProgress(3), 250); // Third checkpoint
    setTimeout(() => updateProgress(4), 250); // Fourth checkpoint
    setTimeout(() => updateProgress(5), 1000); // Final checkpoint

    // You can replace these setTimeout calls with actual loading tasks
  }, []);

  useEffect(() => {
    let intervalId;
    if (isOverlayLoading && loadingProgress < 95) {
      const intervalSpeed = dataLoaded ? 30 : 200; // 0.05 seconds if data loaded, else 0.2 seconds
      intervalId = setInterval(() => {
        setLoadingProgress(prevProgress => {
          const increment = dataLoaded ? Math.random() * 20 : Math.random() * 10;
          return Math.min(prevProgress + increment, 95);
        });
      }, intervalSpeed);
    } else if (dataLoaded && loadingProgress >= 95) {
      // Data is loaded and progress is at least 95%, complete the loading
      setLoadingProgress(100);
      setTimeout(() => {
        setIsOverlayLoading(false);
      }, 500); // Wait for 500ms to show 100% before hiding loading screen
    }
    return () => clearInterval(intervalId);
  }, [isOverlayLoading, loadingProgress, dataLoaded]);

  const handleSubmit = () => {
    console.log(JSON.stringify(selections, null, 2));
    setOverlayVisible(true);
    setIsOverlayLoading(true);
    setLoadingProgress(0);
    setDataLoaded(false);
    document.body.classList.add('no-scroll');

    fetch('/api/paper-hashes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userCriteria),
    })
      .then(response => response.json())
      .then(data => {
        setPaperDescriptors(data.descriptors);
        setDataLoaded(true);
      })
      .catch(error => {
        console.error('Error fetching paper descriptors:', error);
        setDataLoaded(true);
      });

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

  const toggleDescriptionExpansion = (hash) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [hash]: !prev[hash]
    }));
  };

  const toggleFindingsExpansion = (hash) => {
    setExpandedFindings(prev => ({
      ...prev,
      [hash]: !prev[hash]
    }));
  };

  const toggleChallengesExpansion = (hash) => {
    setExpandedChallenges(prev => ({
      ...prev,
      [hash]: !prev[hash]
    }));
  };

  const fetchPaperData = (hash) => {
    fetch(`/api/paper/${hash}`)
      .then(response => response.json())
      .then(data => setPaperData(prevState => ({ ...prevState, [hash]: data })))
      .catch(error => console.error('Error fetching paper data:', error));
  };

  const getEffectColor = (effect) => {
    switch (effect?.toLowerCase()) {
      case 'positive':
        return '#28a745';  // Green
      case 'negative':
        return '#dc3545';  // Red
      case 'mixed':
        return '#ffc107';  // Yellow
      case 'no effect':
      default:
        return '#6c757d';  // Grey
    }
  };

  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'list' ? 'table' : 'list');
  };

  const renderTableView = () => (
    <div className="table-view-container">
      <div className="table-scroll-wrapper">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Policy Description</th>
              <th>Findings</th>
              <th>Effect</th>
              <th>Challenges</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {paperDescriptors.map(descriptor => (
              <tr key={descriptor.hash}>
                <td>
                  <div className="title-info-container">
                    <strong>{descriptor.data.title}</strong>
                    <div className="info-icon-container-table">
                      <FaInfoCircle 
                        className="info-icon-table" 
                        onMouseEnter={() => fetchPaperData(descriptor.hash)}
                      />
                      {paperData[descriptor.hash] && (
                        <div className="criteria-box-table">
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
                </td>
                <td>
                  <div className="expandable-cell">
                    <p>{descriptor.data['description of the intervention/policy option summary']}</p>
                    <button onClick={() => toggleDescriptionExpansion(descriptor.hash)} className="expand-button">
                      {expandedDescriptions[descriptor.hash] ? 'Hide Details' : 'Show Details'}
                    </button>
                    <div className={`expanded-details ${expandedDescriptions[descriptor.hash] ? 'expanded' : ''}`}>
                      <p>{descriptor.data['description of the intervention/policy option']}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="expandable-cell">
                    <p>{descriptor.data['findings summary']}</p>
                    <button onClick={() => toggleFindingsExpansion(descriptor.hash)} className="expand-button">
                      {expandedFindings[descriptor.hash] ? 'Hide Details' : 'Show Details'}
                    </button>
                    <div className={`expanded-details ${expandedFindings[descriptor.hash] ? 'expanded' : ''}`}>
                      <p>{descriptor.data['findings']}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="effect-indicator" style={{backgroundColor: getEffectColor(descriptor.data.effect)}}>
                    {descriptor.data.effect?.toUpperCase()}
                    {descriptor.data.explanation && (
                      <span className="effect-explanation">{descriptor.data.explanation}</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="expandable-cell">
                    {descriptor.data.challenges && 
                     descriptor.data.challenges.trim() !== '' && 
                     descriptor.data.challenges.toLowerCase() !== 'na' && (
                      <>
                        <button onClick={() => toggleChallengesExpansion(descriptor.hash)} className="expand-button">
                          {expandedChallenges[descriptor.hash] ? 'Hide Challenges' : 'Show Challenges'}
                        </button>
                        <div className={`expanded-details ${expandedChallenges[descriptor.hash] ? 'expanded' : ''}`}>
                          <p>{descriptor.data.challenges}</p>
                        </div>
                      </>
                    )}
                  </div>
                </td>
                <td>
                  {descriptor.data.link && (
                    <a href={descriptor.data.link} target="_blank" rel="noopener noreferrer" className="table-link">
                      <FaExternalLinkAlt /> View
                    </a>
                  )}
                  {descriptor.data.pdf && (
                    <a href={descriptor.data.pdf} target="_blank" rel="noopener noreferrer" className="table-link">
                      <FaExternalLinkAlt /> PDF
                    </a>
                  )}
                  {descriptor.data.doi && (
                    <a href={`https://doi.org/${descriptor.data.doi}`} target="_blank" rel="noopener noreferrer" className="table-link">
                      <FaExternalLinkAlt /> DOI
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="App">
      
      {isLoading && <LoadingScreen progress={loadingProgress} />}

      <Navbar />

      <div style={{
        position: 'absolute',
        top: '0px', // Adjust this value to position it below the navbar
        left: '0',
        width: '100%',
        textAlign: 'center',
        zIndex: '1',
        color: '#666',
        fontSize: '5px'
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

      <div style={{ backgroundColor: '#EFEFEF', padding: '20px', height: '230px', position: 'relative' }}>
        <div style={{ maxWidth: '700px', margin: '80px auto 0', textAlign: 'center' }}>
          <p className="small-text-bold">
            This interactive tool helps policymakers identify evidence-based recommendations for improving child outcomes in various contexts.
          </p>
          <p className="small-text">
            Select your areas of interest, target population, and context using the dropdown menus. The tool will then generate tailored policy recommendations based on current evidence. Use the results to inform your decision-making process and explore effective interventions in your specific setting.
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '50px 10px 10px 10px'}}>
        <SelectionUI setSelections={setSelections} setRelevantPapers={setRelevantPapers} setUserCriteria={setUserCriteria} />
      </div>

      <div className="floating-papers-count">
        {Object.keys(userCriteria).length === 0 ? (
          <span>All {relevantPapers} papers available. Apply filters or proceed to view all results.</span>
        ) : (
          <span>Number of relevant papers: {relevantPapers}</span>
        )}
      </div>

      <div style={{ backgroundColor: '#EFEFEF', padding: '20px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <button onClick={handleSubmit} className="submit-button" style={{ fontSize: '1.5em', padding: '15px 30px', width: '300px' }}>View Relevant Papers</button>
      </div>

      <footer className="footer">
        Copyright © 2024 | Learning for Well-being – 
        <a href="https://l4wb-i.org/privacy-policy/"> Privacy Policy</a> – 
        <a href="https://l4wb-i.org/cookies-policy/"> Cookies policy</a> – 
        <a href="https://l4wb-i.org/general-terms-and-conditions/"> General terms and conditions</a> – 
        <a href="https://l4wb-i.org/legal-notice/"> Legal notice</a>
      </footer>

      <div className={`overlay ${overlayVisible ? 'visible' : ''}`}>
        {isOverlayLoading ? (
          <LoadingScreen progress={loadingProgress} />
        ) : (
          <div className="overlay-content">
            <div className="overlay-header">
              <button onClick={handleCloseOverlay} className="overlay-button">Back</button>
              <h2></h2>
              <div className="view-toggle">
                <FaList className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} />
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={viewMode === 'table'} 
                    onChange={toggleViewMode}
                  />
                  <span className="slider round"></span>
                </label>
                <FaTable className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')} />
              </div>
            </div>
            {viewMode === 'list' ? (
              // Existing list view code
              paperDescriptors.length > 0 ? (
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
                    
                    {/* Add this new section for links right after the title */}
                    <div className="paper-links">
                      {descriptor.data.link && (
                        <a href={descriptor.data.link} target="_blank" rel="noopener noreferrer" className="paper-link">
                          View Paper
                        </a>
                      )}
                      {descriptor.data.pdf && (
                        <a href={descriptor.data.pdf} target="_blank" rel="noopener noreferrer" className="paper-link">
                          PDF
                        </a>
                      )}
                      {descriptor.data.doi && (
                        <a href={`https://doi.org/${descriptor.data.doi}`} target="_blank" rel="noopener noreferrer" className="paper-link">
                          DOI
                        </a>
                      )}
                    </div>

                    <div className="description-header" onClick={() => toggleDescriptionExpansion(descriptor.hash)}>
                      <h4 className="highlight-color">Policy Description</h4>
                      <div className="expand-indicator">
                        <span>{expandedDescriptions[descriptor.hash] ? 'Read less' : 'Read more'}</span>
                        <span className={`arrow ${expandedDescriptions[descriptor.hash] ? 'expanded' : ''}`}>▶</span>
                      </div>
                    </div>
                    <p>{descriptor.data['description of the intervention/policy option summary']}</p>
                    <div className={`expandable-content ${expandedDescriptions[descriptor.hash] ? 'expanded' : ''}`}>
                      <h4 className="highlight-color">Details:</h4>
                      <p>{descriptor.data['description of the intervention/policy option']}</p>
                    </div>
                    <div className="description-header" onClick={() => toggleFindingsExpansion(descriptor.hash)}>
                      <div className="findings-header">
                        <h4 className="highlight-color">Findings</h4>
                        {descriptor.data.effect && (
                          <div className="effect-indicator" style={{backgroundColor: getEffectColor(descriptor.data.effect)}}>
                            {descriptor.data.effect.toUpperCase()}
                            {descriptor.data.explanation && (
                              <span className="effect-explanation">{descriptor.data.explanation}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="expand-indicator">
                        <span>{expandedFindings[descriptor.hash] ? 'Read less' : 'Read more'}</span>
                        <span className={`arrow ${expandedFindings[descriptor.hash] ? 'expanded' : ''}`}>▶</span>
                      </div>
                    </div>
                    <p>{descriptor.data['findings summary']}</p>
                    <div className={`expandable-content ${expandedFindings[descriptor.hash] ? 'expanded' : ''}`}>
                      <h4 className="highlight-color">Details:</h4>
                      <p>{descriptor.data['findings']}</p>
                    </div>
                    
                    {/* Add the Challenges section */}
                    {descriptor.data.challenges && 
                     descriptor.data.challenges.trim() !== '' && 
                     descriptor.data.challenges.toLowerCase() !== 'na' && (
                      <>
                        <div className="description-header" onClick={() => toggleChallengesExpansion(descriptor.hash)}>
                          <h4 className="highlight-color">Challenges</h4>
                          <div className="expand-indicator">
                            <span>{expandedChallenges[descriptor.hash] ? 'Read less' : 'Read more'}</span>
                            <span className={`arrow ${expandedChallenges[descriptor.hash] ? 'expanded' : ''}`}>▶</span>
                          </div>
                        </div>
                        <div className={`expandable-content ${expandedChallenges[descriptor.hash] ? 'expanded' : ''}`}>
                          <p>{descriptor.data.challenges}</p>
                        </div>
                      </>
                    )}
                    
                    {/* Add the new Citation section */}
                    {descriptor.data.citation && descriptor.data.citation.trim() !== '' && (
                      <div className="citation-section">
                        <h4 className="highlight-color">Citation</h4>
                        <p className="citation-text">{descriptor.data.citation}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>No papers found matching your criteria.</p>
              )
            ) : (
              // New table view
              renderTableView()
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;