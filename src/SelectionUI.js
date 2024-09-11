import React, { useState, useEffect } from 'react';
import './SelectionUI.css';

function SelectionUI({ setSelections, setRelevantPapers, setUserCriteria }) {
  const [categories, setCategories] = useState({});
  const [categoryMappings, setCategoryMappings] = useState({});
  const [localSelections, setLocalSelections] = useState({});
  const [userCriteria, setLocalUserCriteria] = useState({});
  const [optionCounts, setOptionCounts] = useState({});
  const [rotate, setRotate] = useState(false); // New state variable
  const [rotatingCategories, setRotatingCategories] = useState({}); // New state for category-specific rotation

  useEffect(() => {
    console.log('Fetching categories...');
    fetch('http://68.183.9.132/api/categories')
      .then(response => response.json())
      .then(data => {
        console.log('Received categories:', data);
        setCategories(data);
        setLocalSelections(Object.fromEntries(Object.keys(data).map(key => [key, []])));
      })
      .catch(error => console.error('Error fetching categories:', error));

    console.log('Fetching category mappings...');
    fetch('http://68.183.9.132/api/category-mappings')
      .then(response => response.json())
      .then(data => {
        console.log('Received category mappings:', data);
        const mappings = data.reduce((acc, { main_category, sub_category }) => {
          if (!acc[main_category]) acc[main_category] = {};
          acc[main_category][sub_category] = [];
          return acc;
        }, {});
        setCategoryMappings(mappings);
      })
      .catch(error => console.error('Error fetching category mappings:', error));
  }, []);

  useEffect(() => {
    setSelections(localSelections);
    updateUserCriteria(localSelections);
  }, [localSelections, setSelections]);

  useEffect(() => {
    if (Object.keys(userCriteria).length > 0) {
      updatePaperCount(userCriteria);
    } else {
      fetch('http://68.183.9.132/api/paper-count', {
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
  }, [userCriteria]);

  useEffect(() => {
    // Prefetch option counts for all categories and options
    Object.keys(categories).forEach(category => {
      categories[category].forEach(option => {
        fetchOptionCount(category, option);
      });
    });
  }, [categories, userCriteria]);

  const updateUserCriteria = (selections) => {
    const criteria = Object.entries(selections).reduce((acc, [category, options]) => {
      if (options.length > 0) {
        acc[category] = options;
      }
      return acc;
    }, {});
    setLocalUserCriteria(criteria);
    setUserCriteria(criteria);
    console.log('User Criteria:', criteria);
  };

  const updatePaperCount = (criteria) => {
    console.log('Sending criteria:', criteria);
    fetch('http://68.183.9.132/api/paper-count', {
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
  };

  const handleSelect = (category, option) => {
    console.log('Handling select:', category, option);
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

  const fetchOptionCount = (category, option) => {
    fetch('http://68.183.9.132/api/paper-count-for-option', {
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
  };

  const handleResetCategory = (mainCategory) => {
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
    
    return categories[category]
      .filter(option => option !== 'All')
      .sort((a, b) => {
        const countDiff = (optionCounts[category][b] || 0) - (optionCounts[category][a] || 0);
        return countDiff !== 0 ? countDiff : a.localeCompare(b);
      });
  };

  console.log('Rendering SelectionUI. Categories:', categories);

  return (
    <div className="selection-ui">
      {Object.entries(categoryMappings).map(([mainCategory, subcategories]) => (
        <div key={mainCategory} className="main-category">
          <h2>{mainCategory}</h2>
          <button className="reset-button" onClick={() => handleResetCategory(mainCategory)} title="Reset all options in this category">
            <i className={`fas fa-sync-alt ${rotatingCategories[mainCategory] ? 'rotate' : ''}`}></i>
          </button>
          {Object.entries(subcategories).map(([category]) => (
            <div key={category} className="category">
              <h3>{category}</h3>
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
      ))}
    </div>
  );
}

export default SelectionUI;