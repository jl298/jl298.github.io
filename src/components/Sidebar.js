import React, { useState, useEffect } from 'react';
import { INDICATORS, REGIONS } from '../utils/constants';
import { getUniqueCountries, searchCountries } from '../utils/realDataLoader';

const Sidebar = ({ 
  state, 
  onYearChange, 
  onIndicatorToggle, 
  onRegionToggle, 
  onCountrySelection,
  onToggleCaseStudy,
  data 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2 && data) {
      const results = searchCountries(data.countries, searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, data]);

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCountrySelect = (country) => {
    const currentSelection = state.selectedCountries;
    const isSelected = currentSelection.includes(country);
    
    if (isSelected) {
      onCountrySelection(currentSelection.filter(c => c !== country));
    } else {
      onCountrySelection([...currentSelection, country]);
    }
    
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const clearSelectedCountries = () => {
    onCountrySelection([]);
  };

  return (
    <aside className="sidebar">
      <div>
        <h1>Authoritarianism vs Democracy</h1>
        <p className="subtitle">Global Analysis 2000-2024</p>
      </div>

      <div className="control-section">
        <h3>Year Selection</h3>
        <div className="year-slider-container">
          <input
            type="range"
            min={data?.timeRange?.[0] || 2000}
            max={data?.timeRange?.[1] || 2024}
            value={state.selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="year-slider"
          />
          <div className="year-display">{state.selectedYear}</div>
        </div>
        {data?.timeRange && (
          <div style={{ 
            fontSize: '12px', 
            color: '#9ca3af', 
            marginTop: '8px',
            textAlign: 'center'
          }}>
            Data available range: {data.timeRange[0]}-{data.timeRange[1]}
            <br />
            <span style={{ fontSize: '11px' }}>
              Data before 2019 may be limited
            </span>
          </div>
        )}
      </div>

      <div className="control-section">
        <h3>Key Indicators</h3>
        <div className="indicators-grid">
          {INDICATORS.map(indicator => (
            <div
              key={indicator.id}
              className={`indicator-toggle ${state.activeIndicators.includes(indicator.id) ? 'active' : ''}`}
              onClick={() => onIndicatorToggle(indicator.id)}
            >
              <input
                type="checkbox"
                checked={state.activeIndicators.includes(indicator.id)}
                onChange={() => onIndicatorToggle(indicator.id)}
                className="indicator-checkbox"
                onClick={(e) => e.stopPropagation()}
              />
              <div>
                <div className="indicator-label">{indicator.name}</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
                  {indicator.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="control-section">
        <h3>Region Filter</h3>
        <div className="region-filters">
          {REGIONS.map(region => (
            <div
              key={region.id}
              className="region-item"
              onClick={() => onRegionToggle(region.id)}
            >
              <input
                type="checkbox"
                checked={state.activeRegions.includes(region.id)}
                onChange={() => onRegionToggle(region.id)}
                className="region-checkbox"
                onClick={(e) => e.stopPropagation()}
              />
              <span>{region.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="control-section">
        <h3>Country Search</h3>
        <div className="country-search">
          <input
            type="text"
            placeholder="Enter country name..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            className="search-input"
          />
          
          {showSearchResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(country => (
                <div
                  key={country}
                  className="search-result"
                  onClick={() => handleCountrySelect(country)}
                >
                  {country}
                  {state.selectedCountries.includes(country) && (
                    <span style={{ 
                      float: 'right', 
                      color: '#059669', 
                      fontWeight: '600' 
                    }}>
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {state.selectedCountries.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                Selected Countries ({state.selectedCountries.length})
              </span>
              <button
                onClick={clearSelectedCountries}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fbbf24',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline'
                }}
              >
                Clear All
              </button>
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px' 
            }}>
              {state.selectedCountries.map(country => (
                <div
                  key={country}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px'
                  }}
                >
                  <span>{country}</span>
                  <button
                    onClick={() => handleCountrySelect(country)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '0',
                      width: '16px',
                      height: '16px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="control-section">
        <button
          className="case-study-button"
          onClick={onToggleCaseStudy}
        >
          🇰🇷 South Korea Case Study
        </button>
      </div>

      <div className="control-section" style={{ 
        fontSize: '12px', 
        opacity: 0.7, 
        borderTop: '1px solid rgba(255,255,255,0.1)', 
        paddingTop: '16px' 
      }}>
        <div>Data Sources:</div>
        <div>• Polity5 Project</div>
        <div>• V-Dem Institute</div>
        <div>• Freedom House</div>
        <div>• RSF Press Freedom</div>
      </div>
    </aside>
  );
};

export default Sidebar;
