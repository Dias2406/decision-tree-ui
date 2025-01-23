// © 2024 Learning for Well-Being Institute. All rights reserved.
// Policy Decision Tree
// policydecisions.org

import React, { useState, useEffect, useCallback } from 'react';
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

  // Add instruction blurb component
  const InstructionBlurb = () => (
    <div className="instruction-blurb">
      <div className="instruction-content">
        <FaInfoCircle className="info-icon" />
        <p>You'll be presented with many selection options below. Take your time to select all relevant criteria for your context. Your selections will help find the most relevant policy research for you.</p>
      </div>
    </div>
  );

  const determineTooltipPosition = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const centerPoint = windowWidth / 2;
    
    return rect.left > centerPoint ? 'right-aligned' : 'left-aligned';
  };

  const handleTooltipTouch = (category, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Store current scroll position
    const scrollPos = window.scrollY;
    
    // Close any other open tooltips
    const newTooltipState = {};
    Object.keys(showTooltip).forEach(key => {
      newTooltipState[key] = key === category ? !showTooltip[category] : false;
    });
    setShowTooltip(newTooltipState);

    // Toggle body scroll lock while maintaining scroll position
    if (!showTooltip[category]) {
      document.body.classList.add('tooltip-open');
      document.body.style.top = `-${scrollPos}px`;
    } else {
      document.body.classList.remove('tooltip-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollPos);
    }

    // Only apply position class on desktop
    if (window.innerWidth > 768) {
      const position = determineTooltipPosition(event);
      event.currentTarget.className = `info-icon-container ${position}`;
    }
  };

  // Update the click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.info-icon-container')) {
        if (Object.values(showTooltip).some(Boolean)) {
          const scrollPos = parseInt(document.body.style.top || '0', 10);
          setShowTooltip({});
          document.body.classList.remove('tooltip-open');
          document.body.style.top = '';
          window.scrollTo(0, Math.abs(scrollPos));
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.classList.remove('tooltip-open');
      document.body.style.top = '';
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
                    <div 
                      className="info-icon-container"
                      onTouchStart={(e) => handleTooltipTouch(category, e)}
                      onMouseEnter={(e) => {
                        const position = determineTooltipPosition(e);
                        e.currentTarget.className = `info-icon-container ${position}`;
                      }}
                    >
                      <FaInfoCircle className="info-icon" />
                      <div 
                        className={`criteria-box ${showTooltip[category] ? 'show' : ''}`}
                        dangerouslySetInnerHTML={{ __html: categoryDefinitions[category] || `Definition for ${category}` }}
                      />
                    </div>
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
    </div>
  );
}

export default SelectionUI;
