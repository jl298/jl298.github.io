import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import WorldMap from './components/WorldMap';
import BubbleChart from './components/BubbleChart';
import ParallelCoordinates from './components/ParallelCoordinates';
import NarrativeCaseStudy from './components/narrative/NarrativeCaseStudy';
import { loadAllData } from './utils/dataProcessor';
import { DEFAULT_STATE } from './utils/constants';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardState, setDashboardState] = useState(DEFAULT_STATE);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showNarrativeCaseStudy, setShowNarrativeCaseStudy] = useState(false);
  const [narrativeBoxVisible, setNarrativeBoxVisible] = useState(false);
  const [showSimpleHint, setShowSimpleHint] = useState(false);
  const [showAttentionGuide, setShowAttentionGuide] = useState(false);
  const [hintCycle, setHintCycle] = useState(null);
  const mainContentRef = useRef(null);
  const narrativeBoxRef = useRef(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        console.log('Loading dashboard data...');
        const loadedData = await loadAllData();
        setData(loadedData);
        
        window.dashboardData = loadedData;
        console.log('[V] Dashboard data loaded successfully and debugging ready');
        console.log('[#] Run DashboardDebugger.diagnose() in browser console');
        console.log('[T] Tutorial functions available: window.resetSouthKoreaTutorial()');
        
        setTimeout(() => setNarrativeBoxVisible(true), 800);
        setTimeout(() => setShowAttentionGuide(true), 2000);
        
        startHintCycle();
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    const checkScrollable = () => {
      if (mainContentRef.current) {
        const { scrollHeight, clientHeight } = mainContentRef.current;
        setShowScrollIndicator(scrollHeight > clientHeight);
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);

    return () => window.removeEventListener('resize', checkScrollable);
  }, [data, dashboardState]);

  const updateState = (updates) => {
    setDashboardState(prev => ({ ...prev, ...updates }));
  };

  const handleCountrySelection = (countries) => {
    updateState({ selectedCountries: countries });
  };

  const handleYearChange = (year) => {
    updateState({ selectedYear: year });
  };

  const handleIndicatorToggle = (indicatorId) => {
    const { activeIndicators } = dashboardState;
    const updated = activeIndicators.includes(indicatorId)
      ? activeIndicators.filter(id => id !== indicatorId)
      : [...activeIndicators, indicatorId];
    updateState({ activeIndicators: updated });
  };

  const handleRegionToggle = (regionId) => {
    const { activeRegions } = dashboardState;
    const updated = activeRegions.includes(regionId)
      ? activeRegions.filter(id => id !== regionId)
      : [...activeRegions, regionId];
    updateState({ activeRegions: updated });
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
    
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  };

  const toggleCaseStudy = () => {
    setShowNarrativeCaseStudy(!showNarrativeCaseStudy);
  };

  const handleNarrativeCaseStudyClose = () => {
    setShowNarrativeCaseStudy(false);
  };

  const resetSouthKoreaTutorial = () => {
    try {
      console.log('🔄 Resetting South Korea tutorial from App');
      
      sessionStorage.setItem('southKoreaTutorialSeen', '0');
      
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 999999;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        animation: slideInRight 0.3s ease-out;
      `;
      notification.textContent = '✅ Tutorial reset! Go to Scene 0 in South Korea story to see it again.';
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to reset tutorial:', error);
    }
  };
  
  useEffect(() => {
    window.resetSouthKoreaTutorial = resetSouthKoreaTutorial;
    
    return () => {
      delete window.resetSouthKoreaTutorial;
    };
  }, []);

  const handleAttentionGuideClick = () => {
    setShowAttentionGuide(false);
    
    setTimeout(() => {
      if (!showNarrativeCaseStudy) {
        setShowAttentionGuide(true);
      }
    }, 10000);
  };

  const startHintCycle = () => {
    if (hintCycle) {
      clearTimeout(hintCycle);
    }
    
    const firstHint = setTimeout(() => {
      if (!showNarrativeCaseStudy) {
        setShowSimpleHint(true);
        scheduleNextHintCycle();
      }
    }, 5000);
    
    setHintCycle(firstHint);
  };
  
  const scheduleNextHintCycle = () => {
    const hideHint = setTimeout(() => {
      setShowSimpleHint(false);
      
      const showAgain = setTimeout(() => {
        if (!showNarrativeCaseStudy) {
          setShowSimpleHint(true);
          scheduleNextHintCycle();
        }
      }, 3000);
      
      setHintCycle(showAgain);
    }, 3000);
    
    setHintCycle(hideHint);
  };
  
  const stopHintCycle = () => {
    if (hintCycle) {
      clearTimeout(hintCycle);
      setHintCycle(null);
    }
    setShowSimpleHint(false);
  };

  useEffect(() => {
    if (showNarrativeCaseStudy) {
      setShowAttentionGuide(false);
      stopHintCycle();
    }
  }, [showNarrativeCaseStudy]);
  
  useEffect(() => {
    return () => {
      if (hintCycle) {
        clearTimeout(hintCycle);
      }
    };
  }, [hintCycle]);

  if (loading) {
    return (
      <div className="loading-overlay" style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px',
        fontWeight: '500',
        flexDirection: 'column',
        gap: '16px',
        animation: 'fadeIn 0.3s ease-in'
      }}>
        <div className="loading-spinner-small"></div>
        <div>Processing data for narrative visualization...</div>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>
          Preparing Visual Narrative components
        </div>
        <div style={{ 
          fontSize: '12px', 
          opacity: 0.6, 
          marginTop: '8px',
          textAlign: 'center',
          maxWidth: '300px'
        }}>
          This includes enhanced South Korea case study with interactive storytelling
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#fef2f2',
        color: '#dc2626',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <h2>Data Loading Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '12px 24px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '16px'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        state={dashboardState}
        onYearChange={handleYearChange}
        onIndicatorToggle={handleIndicatorToggle}
        onRegionToggle={handleRegionToggle}
        onCountrySelection={handleCountrySelection}
        onToggleCaseStudy={toggleCaseStudy}
        data={data}
        className={sidebarVisible ? '' : 'hidden'}
        onToggleSidebar={toggleSidebar}
      />
      
      {!sidebarVisible && (
        <button
          onClick={toggleSidebar}
          className="sidebar-toggle"
          title="Show Sidebar"
        >
          ▶
        </button>
      )}
      
      <main className={`main-content ${!sidebarVisible ? 'expanded' : ''}`} ref={mainContentRef}>
        {showScrollIndicator && (
          <div 
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              padding: '8px',
              borderRadius: '50%',
              fontSize: '12px',
              zIndex: 10,
              animation: 'bounce 2s infinite',
              cursor: 'pointer'
            }}
            onClick={() => {
              mainContentRef.current?.scrollTo({
                top: mainContentRef.current.scrollTop + 300,
                behavior: 'smooth'
              });
            }}
            title="Scroll down to see more charts"
          >
            ↓
          </div>
        )}
        
        <header className="dashboard-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="dashboard-title">Political Freedom Analysis Dashboard</h1>
              <p className="dashboard-subtitle">
                Global Political System Trends Analysis and Composite Indicators (2000-2024)
              </p>
            </div>

            {!showNarrativeCaseStudy && narrativeBoxVisible && (
              <div 
                ref={narrativeBoxRef}
                className="narrative-case-study-container"
                style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  color: 'white',
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 1,
                  maxWidth: '320px',
                  animation: narrativeBoxVisible ? 'narrativeBoxReveal 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                }}
              >
                {showAttentionGuide && (
                  <>
                    <div className="attention-spotlight" />
                    <div 
                      className="attention-tooltip"
                      onClick={handleAttentionGuideClick}
                      style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                    >
                      💡 New Feature: Interactive Storytelling!
                    </div>
                  </>
                )}

                {showSimpleHint && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#10b981',
                      color: 'white',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      animation: 'pulse 2s infinite',
                      zIndex: 2
                    }}
                  >
                    NEW!
                  </div>
                )}
                
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '18px', 
                  fontWeight: '600'
                }}>
                  📖 Visual Narrative Case Study
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', opacity: 0.9, lineHeight: 1.5 }}>
                  Click the button below to experience South Korea's democratization through an interactive story.
                </p>
                <button
                  onClick={() => {
                    handleAttentionGuideClick();
                    stopHintCycle();
                    toggleCaseStudy();
                  }}
                  className="narrative-cta-button"
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#667eea',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'relative',
                    zIndex: 1
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  🚀 Open Interactive Story →
                </button>
              </div>
            )}
          </div>
        </header>
        
        <div className="dashboard-grid">
          <div className="chart-container">
            <div className="chart-header">
              <h3 className="chart-title">Overview</h3>
              <span className="chart-info">Democracy vs Liberal Index</span>
            </div>
            <div className="chart-content">
              <Overview 
                data={data} 
                state={dashboardState} 
                onCountryClick={handleCountrySelection}
                sidebarVisible={sidebarVisible}
              />
            </div>
          </div>
          
          <div className="chart-container">
            <div className="chart-header">
              <h3 className="chart-title">World Map</h3>
              <span className="chart-info">Political System Distribution by Region</span>
            </div>
            <div className="chart-content">
              <WorldMap 
                data={data} 
                state={dashboardState} 
                onCountryClick={handleCountrySelection}
                sidebarVisible={sidebarVisible}
              />
            </div>
          </div>
          
          <div className="chart-container">
            <div className="chart-header">
              <h3 className="chart-title">Composite Indicator Analysis</h3>
              <span className="chart-info">Press Freedom vs Civil Liberties</span>
            </div>
            <div className="chart-content">
              <BubbleChart 
                data={data} 
                state={dashboardState} 
                onCountryClick={handleCountrySelection}
                sidebarVisible={sidebarVisible}
              />
            </div>
          </div>
          
          <div className="chart-container">
            <div className="chart-header">
              <h3 className="chart-title">Multi-dimensional Profile</h3>
              <span className="chart-info">Comprehensive Indicators by Country</span>
            </div>
            <div className="chart-content">
              <ParallelCoordinates 
                data={data} 
                state={dashboardState} 
                onCountryHighlight={handleCountrySelection}
                sidebarVisible={sidebarVisible}
              />
            </div>
          </div>
        </div>
      </main>

      {showNarrativeCaseStudy && createPortal(
        <NarrativeCaseStudy 
          isOpen={showNarrativeCaseStudy}
          onClose={handleNarrativeCaseStudyClose}
          data={data}
          state={dashboardState}
        />,
        document.body
      )}
    </div>
  );
}

export default App;