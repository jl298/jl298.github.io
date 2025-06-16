import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import WorldMap from './components/WorldMap';
import BubbleChart from './components/BubbleChart';
import ParallelCoordinates from './components/ParallelCoordinates';
import CaseStudyPanel from './components/CaseStudyPanel';
import { loadAllData } from './utils/dataProcessor';
import { DEFAULT_STATE } from './utils/constants';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardState, setDashboardState] = useState(DEFAULT_STATE);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const mainContentRef = useRef(null);

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

  const toggleCaseStudy = () => {
    updateState({ showCaseStudy: !dashboardState.showCaseStudy });
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
    
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  };

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
        fontWeight: '500'
      }}>
        <div className="loading-spinner-small"></div>
        Processing data...
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
      
      {/* 사이드바 토글 버튼 (사이드바가 숨겨진 상태일 때만) */}
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
          <h1 className="dashboard-title">Political Freedom Analysis Dashboard</h1>
          <p className="dashboard-subtitle">
            Global Political System Trends Analysis and Composite Indicators (2000-2024)
          </p>
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
      
      <CaseStudyPanel 
        isOpen={dashboardState.showCaseStudy}
        onClose={toggleCaseStudy}
        data={data}
        state={dashboardState}
      />
    </div>
  );
}

export default App;
