import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Navbar from './navbar';
import SelectionUI from './SelectionUI';
import { FaInfoCircle, FaTable, FaList, FaExternalLinkAlt } from 'react-icons/fa';
import LoadingScreen from './LoadingScreen';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import FeedbackModal from './FeedbackModal';

function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

function App() {
  const [selections, setSelections] = useState({});
  const [relevantPapers, setRelevantPapers] = useState(null);
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

  // New state for the download modal
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [isSelectionUIReady, setIsSelectionUIReady] = useState(false);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showFeedbackLink, setShowFeedbackLink] = useState(true);

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

  const updateProgress = useCallback((checkpoint) => {
    const newProgress = (checkpoint / totalCheckpoints) * 100;
    setLoadingProgress(newProgress);
    if (checkpoint === totalCheckpoints && isSelectionUIReady) {
      setIsLoading(false);
    }
  }, [isSelectionUIReady]);

  useEffect(() => {
    // Initial loading tasks
    updateProgress(1); // First checkpoint

    // Simulating other loading tasks
    setTimeout(() => updateProgress(2), 100); // Second checkpoint
    setTimeout(() => updateProgress(3), 250); // Third checkpoint
    setTimeout(() => updateProgress(4), 250); // Fourth checkpoint
    // Note: We're not calling the final checkpoint here anymore
  }, [updateProgress]);

  const handleSelectionUIRender = useCallback(() => {
    setIsSelectionUIReady(true);
    updateProgress(totalCheckpoints); // Final checkpoint
  }, [updateProgress]);

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

  useEffect(() => {
    let intervalId;
    if (isDownloading && downloadProgress < 95) {
      intervalId = setInterval(() => {
        setDownloadProgress(prevProgress => {
          const increment = Math.random() * 15;
          return Math.min(prevProgress + increment, 95);
        });
      }, 200);
    }
    return () => clearInterval(intervalId);
  }, [isDownloading, downloadProgress]);

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
                  <div className="effect-indicator" style={{ backgroundColor: getEffectColor(descriptor.data.effect) }}>
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
                    <a href={`https://${descriptor.data.doi}`} target="_blank" rel="noopener noreferrer" className="table-link">
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

  // New function to handle the download button click
  const handleDownload = () => {
    setShowDownloadModal(true);
  };

  // New function to handle export
  const handleExport = (format) => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setShowDownloadModal(false);

    // Simulate initial delay
    setTimeout(() => {
      // Fetch any missing paper data
      const hashesToFetch = paperDescriptors.map(descriptor => descriptor.hash);
      const hashesNotFetched = hashesToFetch.filter(hash => !paperData[hash]);

      if (hashesNotFetched.length > 0) {
        Promise.all(hashesNotFetched.map(hash =>
          fetch(`/api/paper/${hash}`)
            .then(response => response.json())
            .then(data => ({ hash, data }))
        )).then(results => {
          // Update paperData state
          const newPaperData = {};
          results.forEach(({ hash, data }) => {
            newPaperData[hash] = data;
          });
      
          // Create a local variable with the updated paperData
          const updatedPaperData = { ...paperData, ...newPaperData };
          setPaperData(updatedPaperData);
      
          // Proceed to generate the file with updatedPaperData
          generateAndDownloadFile(format, updatedPaperData);
        }).catch(error => {
          console.error('Error fetching paper data for download:', error);
          setIsDownloading(false);
          setDownloadProgress(0);
          // Handle error, maybe notify the user
        });
      } else {
        // All data already fetched, proceed to generate file
        generateAndDownloadFile(format, paperData);
      }
    }, 500); // 500ms initial delay
  };

  // Function to generate and download the file
  const generateAndDownloadFile = (format, currentPaperData) => {
    // Exclude certain keys
    const excludedKeys = [
      'hash',
      'title',
      'description of the intervention/policy option',
      'description of the intervention/policy option summary',
      'findings',
      'findings summary',
      'effect',
      'explanation',
      'challenges',
      'link',
      'pdf',
      'doi',
      'citation'
    ];

    // Collect all unique keys from fullData across all descriptors
    const allAdditionalKeys = new Set();

    paperDescriptors.forEach(descriptor => {
      const hash = descriptor.hash;
      const fullData = currentPaperData[hash] || {};
      Object.keys(fullData).forEach(key => {
        if (!excludedKeys.includes(key)) {
          allAdditionalKeys.add(capitalizeWords(key));
        }
      });
    });

    const allAdditionalKeysArray = Array.from(allAdditionalKeys);

    const dataToExport = paperDescriptors.map(descriptor => {
      const hash = descriptor.hash;
      const data = descriptor.data;
      const fullData = currentPaperData[hash] || {};
  
      const additionalData = {};
  
      allAdditionalKeysArray.forEach(key => {
        const originalKey = key.toLowerCase();
        additionalData[key] = Array.isArray(fullData[originalKey])
          ? fullData[originalKey].join(', ')
          : fullData[originalKey] || '';
      });
  
      // Build the row with the specified columns
      return {
        'Title': data.title || '',
        'Description Summary': data['description of the intervention/policy option summary'] || '',
        'Description': data['description of the intervention/policy option'] || '',
        'Findings Summary': data['findings summary'] || '',
        'Findings': data['findings'] || '',
        'Effect': data.effect || '',
        'Effect Details': data.explanation || '',
        'Challenges': data.challenges || '',
        'Link': data.link || '',
        'PDF': data.pdf || '',
        'DOI': data.doi || '',
        ...additionalData
      };
    });

    if (format === 'csv') {
      // Generate CSV
      const csvContent = convertToCSV(dataToExport);
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      setTimeout(() => {
        saveAs(blob, 'table_data.csv');
        finalizeDownload();
      }, 1000); // Delay to show 95% for a moment
    } else if (format === 'xlsx') {
      // Generate XLSX
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      // Download XLSX
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      setTimeout(() => {
        saveAs(blob, 'table_data.xlsx');
        finalizeDownload();
      }, 1000); // Delay to show 95% for a moment
    }
  };

  const finalizeDownload = () => {
    setDownloadProgress(100);
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadProgress(0);
      setShowFeedbackModal(true); // Show feedback modal after download
      setShowFeedbackLink(false); // Hide the feedback link
    }, 500); // Show 100% for half a second before hiding
  };

  const convertToCSV = (data) => {
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    data.forEach(row => {
      const values = headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`);
      csvRows.push(values.join(','));
    });
    return csvRows.join('\r\n');
  };

  useEffect(() => {
    const tableWrapper = document.querySelector('.table-scroll-wrapper');
    if (tableWrapper) {
      const handleScroll = () => {
        const { scrollLeft, scrollWidth, clientWidth } = tableWrapper;
        const isAtStart = scrollLeft === 0;
        const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1; // -1 to account for rounding errors

        tableWrapper.classList.toggle('show-left-gradient', !isAtStart);
        tableWrapper.classList.toggle('show-right-gradient', !isAtEnd);
      };

      tableWrapper.addEventListener('scroll', handleScroll);
      handleScroll(); // Call once to set initial state

      return () => tableWrapper.removeEventListener('scroll', handleScroll);
    }
  }, [viewMode]); // Add viewMode as a dependency to re-run when view changes

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });
      
      if (response.ok) {
        setShowFeedbackModal(false);
        alert('Thank you for your feedback!');
        setShowFeedbackLink(true); // Show the feedback link again
      } else {
        alert('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('An error occurred while submitting feedback. Please try again.');
    }
  };

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

      <div style={{ backgroundColor: 'white', padding: '50px 10px 10px 10px' }}>
        <SelectionUI 
          setSelections={setSelections} 
          setRelevantPapers={setRelevantPapers} 
          setUserCriteria={setUserCriteria}
          onRenderComplete={handleSelectionUIRender}
        />
      </div>

      <div className="floating-papers-count">
        {relevantPapers === null ? (
          <span>Number of relevant papers: <span className="loading-dots">...</span></span>
        ) : Object.keys(userCriteria).length === 0 ? (
          <span>All {relevantPapers} papers available. Apply filters or proceed to view all results.</span>
        ) : (
          <span>Number of relevant papers: {relevantPapers}</span>
        )}
      </div>

      <div style={{ backgroundColor: '#EFEFEF', padding: '20px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <button onClick={handleSubmit} className="submit-button" style={{ fontSize: '1.5em', padding: '15px 30px', width: '300px' }}>View Relevant Papers</button>
      </div>

      {showFeedbackLink && (
        <div className="feedback-link-container">
          <span 
            className="feedback-link" 
            onClick={() => setShowFeedbackModal(true)}
          >
            Please provide feedback
          </span>
        </div>
      )}

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
              <div className="overlay-header-left">
                <button onClick={handleCloseOverlay} className="overlay-button">Back</button>
              </div>
              <div className="overlay-header-center">
                <button onClick={handleDownload} className="overlay-button">Download Table Data</button>
              </div>
              <div className="overlay-header-right">
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
                    
                    <div className="paper-links">
                      {descriptor.data.link && (
                        <a href={descriptor.data.link} target="_blank" rel="noopener noreferrer" className="paper-link">
                          View Paper <FaExternalLinkAlt />
                        </a>
                      )}
                      {descriptor.data.pdf && (
                        <a href={descriptor.data.pdf} target="_blank" rel="noopener noreferrer" className="paper-link">
                          PDF <FaExternalLinkAlt />
                        </a>
                      )}
                      {descriptor.data.doi && (
                        <a href={`https://${descriptor.data.doi}`} target="_blank" rel="noopener noreferrer" className="paper-link">
                          DOI <FaExternalLinkAlt />
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

      {/* Modal for selecting download format */}
      {showDownloadModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Select Download Format</h3>
            <button onClick={() => handleExport('csv')}>CSV</button>
            <button onClick={() => handleExport('xlsx')}>XLSX</button>
            <button class = "cancel-button" onClick={() => setShowDownloadModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {isDownloading && (
        <LoadingScreen 
          progress={downloadProgress} 
          message={downloadProgress < 100 ? "Preparing download..." : "Download complete!"}
        />
      )}

      {showFeedbackModal && (
        <FeedbackModal
          onClose={() => {
            setShowFeedbackModal(false);
            setShowFeedbackLink(true); // Show the feedback link when modal is closed
          }}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
}

export default App;