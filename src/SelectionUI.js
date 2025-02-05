// © 2024 Learning for Well-Being Institute. All rights reserved.
// Policy Decision Tree
// policydecisions.org

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SelectionUI.css';
import { FaInfoCircle } from 'react-icons/fa';

function SelectionUI({ setSelections, setRelevantPapers, setUserCriteria, onRenderComplete }) {
  const [categories, setCategories] = useState({});
  const [categoryMappings, setCategoryMappings] = useState({});
  const [localSelections, setLocalSelections] = useState({});
  const [userCriteria, setLocalUserCriteria] = useState({});
  const [optionCounts, setOptionCounts] = useState({});
  const [rotatingCategories, setRotatingCategories] = useState({});
  const [categoryDefinitions, setCategoryDefinitions] = useState({});
  const [showTooltip, setShowTooltip] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const tooltipRefs = useRef({});
  const mobileTooltipRef = useRef(null);

  // Function to detect touch screen capability
  const isTouchDevice = () => {
    return (('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0));
  };

  // Function to update links in a container to open in new tab
  const updateLinks = (container) => {
    if (!container) return;
    const links = container.getElementsByTagName('a');
    for (let link of links) {
      // Remove old event listeners and data
      const oldHandler = link._clickHandler;
      if (oldHandler) {
        link.removeEventListener('click', oldHandler);
      }

      // Set the attributes
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      
      // Create new handler with a flag to prevent multiple triggers
      const clickHandler = (e) => {
        e.preventDefault();
        if (!link._isProcessing) {
          link._isProcessing = true;
          window.open(link.href, '_blank', 'noopener,noreferrer');
          setTimeout(() => {
            link._isProcessing = false;
          }, 100);
        }
      };

      // Store the handler reference for cleanup
      link._clickHandler = clickHandler;
      link.addEventListener('click', clickHandler);
    }
  };

  // Cleanup function for links
  const cleanupLinks = (container) => {
    if (!container) return;
    const links = container.getElementsByTagName('a');
    for (let link of links) {
      if (link._clickHandler) {
        link.removeEventListener('click', link._clickHandler);
        delete link._clickHandler;
        delete link._isProcessing;
      }
    }
  };

  // Ref callback for tooltips
  const setTooltipRef = useCallback((element, category) => {
    if (element) {
      // Cleanup old refs if they exist
      if (tooltipRefs.current[category]) {
        cleanupLinks(tooltipRefs.current[category]);
      }
      tooltipRefs.current[category] = element;
      updateLinks(element);
    }
  }, []);

  // Effect to update mobile tooltip links
  useEffect(() => {
    if (mobileTooltipRef.current) {
      updateLinks(mobileTooltipRef.current);
    }
    
    // Capture the current value of the ref for cleanup
    const currentTooltipRef = mobileTooltipRef.current;
    
    // Cleanup on unmount or category change
    return () => {
      if (currentTooltipRef) {
        cleanupLinks(currentTooltipRef);
      }
    };
  }, [categoryDefinitions, activeCategory]);

  // Add instruction blurb component
  const InstructionBlurb = () => (
    <div className="instruction-blurb">
      <div className="instruction-content">
        <FaInfoCircle className="info-icon" />
        <p>You'll be presented with many selection options below. Take your time to select all relevant criteria for your context. Your selections will help find the most relevant policy research for you.</p>
      </div>
    </div>
  );

  const handleMobileClick = (category, event) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveCategory(null);
  };

  const determineTooltipPosition = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const centerPoint = windowWidth / 2;
    return rect.left > centerPoint ? 'right-aligned' : 'left-aligned';
  };

  // Update the click outside handler to handle touch devices
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.info-icon-container')) {
        if (Object.values(showTooltip).some(Boolean)) {
          setShowTooltip({});
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showTooltip]);

  useEffect(() => {
    fetch('/api/category-definitions')
      .then(response => response.json())
      .then(data => {
        console.log('Received category definitions:', data);
        setCategoryDefinitions(data);
      })
      .catch(error => console.error('Error fetching category definitions:', error));
  }, []);

  const updateUserCriteria = useCallback((selections) => {
    const criteria = Object.entries(selections).reduce((acc, [category, options]) => {
      if (options.length > 0) {
        acc[category] = options;
      }
      return acc;
    }, {});
    setLocalUserCriteria(criteria);
    setUserCriteria(criteria);
    console.log('User Criteria:', criteria);
  }, [setUserCriteria]);

  const updatePaperCount = useCallback((criteria) => {
    console.log('Sending criteria:', criteria);
    fetch('/api/paper-count', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criteria),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Received data:', data);
        setRelevantPapers(data.count);
      })
      .catch(error => console.error('Error fetching paper count:', error));
  }, [setRelevantPapers]);

  const fetchOptionCount = useCallback((category, option) => {
    fetch('/api/paper-count-for-option', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userCriteria, category, option }),
    })
      .then(response => response.json())
      .then(data => {
        setOptionCounts(prev => ({
          ...prev,
          [category]: {
            ...prev[category],
            [option]: data.count,
          },
        }));
      })
      .catch(error => console.error('Error fetching option count:', error));
  }, [userCriteria, setOptionCounts]);

  useEffect(() => {
    let categoriesFetched = false;
    let mappingsFetched = false;

    console.log('Fetching categories...');
    fetch('/api/categories')
      .then(response => response.json())
      .then(data => {
        console.log('Received categories:', data);
        setCategories(data);
        setLocalSelections(Object.fromEntries(Object.keys(data).map(key => [key, []])));
        categoriesFetched = true;
        checkRenderComplete();
      })
      .catch(error => console.error('Error fetching categories:', error));

    console.log('Fetching category mappings...');
    fetch('/api/category-mappings')
      .then(response => response.json())
      .then(data => {
        console.log('Received category mappings:', data);
        const mappings = data.reduce((acc, { main_category, sub_category }) => {
          if (!acc[main_category]) acc[main_category] = {};
          acc[main_category][sub_category] = [];
          return acc;
        }, {});
        setCategoryMappings(mappings);
        mappingsFetched = true;
        checkRenderComplete();
      })
      .catch(error => console.error('Error fetching category mappings:', error));

    function checkRenderComplete() {
      if (categoriesFetched && mappingsFetched) {
        onRenderComplete();
      }
    }
  }, [onRenderComplete]);

  useEffect(() => {
    setSelections(localSelections);
    updateUserCriteria(localSelections);
  }, [localSelections, setSelections, updateUserCriteria]);

  useEffect(() => {
    if (Object.keys(userCriteria).length > 0) {
      updatePaperCount(userCriteria);
    } else {
      fetch('/api/paper-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
        .then(response => response.json())
        .then(data => {
          setRelevantPapers(data.count);
        })
        .catch(error => console.error('Error fetching total paper count:', error));
    }
  }, [userCriteria, updatePaperCount, setRelevantPapers]); // Added setRelevantPapers to the dependency array

  useEffect(() => {
    // Prefetch option counts for all categories and options
    Object.keys(categories).forEach(category => {
      categories[category].forEach(option => {
        fetchOptionCount(category, option);
      });
    });
  }, [categories, fetchOptionCount]);

  const handleSelect = (category, option) => {
    console.log('Handling select:', category, option);
    setRelevantPapers(null); // Reset relevantPapers to null
    setLocalSelections(prev => {
      const newSelections = { ...prev };
      if (option === 'All') {
        newSelections[category] = categories[category] ? categories[category].filter(opt => opt !== 'All') : [];
      } else {
        if (newSelections[category].includes(option)) {
          newSelections[category] = newSelections[category].filter(item => item !== option);
        } else {
          newSelections[category] = [...newSelections[category], option];
        }
      }
      console.log('New selections:', newSelections);
      return newSelections;
    });
  };

  const handleResetCategory = (mainCategory) => {
    setRelevantPapers(null); // Reset relevantPapers to null
    setLocalSelections(prev => {
      const newSelections = { ...prev };
      Object.keys(categoryMappings[mainCategory]).forEach(subCategory => {
        newSelections[subCategory] = [];
      });
      return newSelections;
    });
    setRotatingCategories(prev => ({ ...prev, [mainCategory]: true }));
    setTimeout(() => setRotatingCategories(prev => ({ ...prev, [mainCategory]: false })), 1500);
  };

  const sortedOptions = (category) => {
    if (!categories[category] || !optionCounts[category]) return [];
    
    const options = categories[category].filter(option => {
      if (option === 'All') return false;
      if (option === 'Other' && (!optionCounts[category]['Other'] || optionCounts[category]['Other'] === 0)) return false;
      return true;
    });

    if (category === 'Country' || category === 'Region') {
      return options.sort((a, b) => a.localeCompare(b));
    }

    return options.sort((a, b) => {
      const countDiff = (optionCounts[category][b] || 0) - (optionCounts[category][a] || 0);
      return countDiff !== 0 ? countDiff : a.localeCompare(b);
    });
  };

  console.log('Rendering SelectionUI. Categories:', categories);

  return (
    <div className="selection-ui">
      <InstructionBlurb />
      <div className="selection-grid">
        {Object.entries(categoryMappings).map(([mainCategory, subcategories]) => (
          <div key={mainCategory} className="main-category">
            <h2>{mainCategory}</h2>
            <button className="reset-button" onClick={() => handleResetCategory(mainCategory)} title="Reset all options in this category">
              <i className={`fas fa-sync-alt ${rotatingCategories[mainCategory] ? 'rotate' : ''}`}></i>
            </button>
            <div className="subcategory-grid">
              {Object.entries(subcategories).map(([category]) => (
                <div key={category} className="category">
                  <div className="category-header">
                    <h3>{category}</h3>
                    {isTouchDevice() ? (
                      // Touch device version
                      <div className="info-icon-container">
                        <FaInfoCircle 
                          className="info-icon"
                          onClick={(e) => handleMobileClick(category, e)}
                        />
                      </div>
                    ) : (
                      // Non-touch device version
                      <div 
                        className="info-icon-container"
                        onMouseMove={(e) => {
                          e.currentTarget.className = `info-icon-container ${determineTooltipPosition(e)}`;
                        }}
                      >
                        <FaInfoCircle className="info-icon" />
                        <div className="criteria-box">
                          <div ref={(el) => setTooltipRef(el, category)} dangerouslySetInnerHTML={{ 
                            __html: categoryDefinitions[category] || `Definition for ${category}` 
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <select
                    value={localSelections[category] && localSelections[category].length === categories[category].length ? 'All' : ''}
                    onChange={(e) => handleSelect(category, e.target.value)}
                  >
                    <option value="">Select an option...</option>
                    <option value="All">All</option>
                    {sortedOptions(category).map(option => (
                      <option key={option} value={option}>
                        {option} ({optionCounts[category]?.[option] || 0} papers)
                      </option>
                    ))}
                  </select>
                  <div className="selected-options">
                    {localSelections[category] && localSelections[category].map(option => (
                      <span key={option} className="selected-option">
                        {option}
                        <button onClick={() => handleSelect(category, option)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Modal for touch devices - Always render but control visibility with CSS */}
      <div className={`mobile-modal ${isModalOpen ? 'active' : ''}`}>
        <div className="mobile-backdrop" onClick={handleCloseModal} />
        {activeCategory && (
          <div className="mobile-modal-content">
            <button className="mobile-close" onClick={handleCloseModal}>×</button>
            <div 
              ref={mobileTooltipRef} 
              className="mobile-tooltip-content"
              dangerouslySetInnerHTML={{ 
                __html: categoryDefinitions[activeCategory] || `Definition for ${activeCategory}` 
              }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SelectionUI;
