import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { narrativeRouter, useNarrativeRouter, NarrativeLink } from './NarrativeRouter';
import { getCountryTimeSeries, formatValue } from '../../utils/dataProcessor';
import { KOREA_EVENTS, COLORS } from '../../utils/constants';
import StemPhase from './StemPhase';
import GlassPhase from './GlassPhase';

const NarrativeCaseStudy = ({ isOpen, onClose, data, state }) => {
  const { currentRoute, navigate } = useNarrativeRouter();
  const [narrativePhase, setNarrativePhase] = useState('stem'); // 'stem' or 'glass'
  const [currentScene, setCurrentScene] = useState(0);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [transitionState, setTransitionState] = useState('idle'); // 'idle', 'opening', 'closing'
  const [phaseTransitionData, setPhaseTransitionData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const checkAndShowTutorial = (sceneIndex) => {
    console.log('🎯 checkAndShowTutorial called for scene:', sceneIndex);
    console.log('StemPhase will handle the actual tutorial logic');
  };
  
  const forceShowTutorial = () => {
    console.log('🚀 Force showing tutorial (View Tutorial pressed)');
    
    if (window.forceSouthKoreaTutorial) {
      window.forceSouthKoreaTutorial();
    } else {
      console.log('🔍 StemPhase tutorial function not found, using fallback');
      sessionStorage.setItem('southKoreaTutorialSeen', '0');
      showFallbackTutorial();
    }
  };
  
  const showTutorial = () => {
    if (window.forceSouthKoreaTutorial) {
      console.log('Calling StemPhase tutorial function');
      window.forceSouthKoreaTutorial();
    } else {
      console.log('🔍 StemPhase tutorial not available, showing fallback');
      showFallbackTutorial();
    }
  };
  
  const showFallbackTutorial = () => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 24px;
      border-radius: 12px;
      font-size: 16px;
      z-index: 999999;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 400px;
      animation: slideDown 0.5s ease-out;
    `;
    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 12px;">🇰🇷 Welcome to South Korea's Story!</div>
      <div style="font-size: 14px; line-height: 1.5;">This interactive visualization will guide you through South Korea's democratic transformation. Navigate through scenes to explore the journey from authoritarianism to democracy.</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.5s ease-out forwards';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 500);
    }, 4000);
  };
  
  useEffect(() => {
    if (isOpen && isInitialized && currentScene === 0) {
      console.log('🎬 NarrativeCaseStudy: Scene 0 detected, StemPhase will handle tutorial');
    }
  }, [isOpen, isInitialized, currentScene]);
  
  const handleClose = () => {
    setTransitionState('closing');
    setTimeout(() => {
      onClose();
      setTransitionState('idle');
    }, 300);
  };
  
  const toggleHelpPanel = () => {
    setShowHelpPanel(!showHelpPanel);
  };
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (showHelpPanel) {
          setShowHelpPanel(false);
        } else {
          handleClose();
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      if (!isInitialized) {
        console.log('🚀 Initializing NarrativeCaseStudy');
        setTransitionState('opening');
        setTimeout(() => {
          setTransitionState('idle');
          setIsInitialized(true);
        }, 400);
      } else {
        setTransitionState('idle');
      }
      
      console.log('NarrativeCaseStudy Portal opened');
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, showHelpPanel, isInitialized]);
  
  const scenes = [
    {
      id: 'overview',
      title: 'South Korea\'s Democratic Journey',
      subtitle: 'From Authoritarianism to Democracy (1945-2025)',
      indicator: 'vdem_liberal',
      timeRange: [1950, 2020],
      message: 'South Korea underwent one of the most dramatic democratic transformations in modern history.',
      annotations: [
        { year: 1961, text: 'Military Coup', type: 'negative' },
        { year: 1987, text: 'June Uprising', type: 'positive' },
        { year: 2016, text: 'Candlelight Revolution', type: 'positive' }
      ],
      continuityElements: ['democratization_trend', 'key_events', 'authoritarian_legacy']
    },
    {
      id: 'authoritarian-era',
      title: 'The Authoritarian Era',
      subtitle: 'Park Chung-hee and Developmental Dictatorship (1961-1987)',
      indicator: 'polity5',
      timeRange: [1960, 1990],
      message: 'Military rule combined rapid economic growth with severe political repression.',
      annotations: [
        { year: 1961, text: 'May 16 Coup', type: 'negative' },
        { year: 1972, text: 'Yushin Constitution', type: 'negative' },
        { year: 1979, text: 'Park Assassination', type: 'neutral' },
        { year: 1980, text: 'Gwangju Uprising', type: 'negative' }
      ],
      continuityElements: ['military_control', 'economic_development', 'repression_indicators']
    },
    {
      id: 'transition',
      title: 'Democratic Transition',
      subtitle: 'The June Democratic Uprising (1987-1993)',
      indicator: 'polity5',
      timeRange: [1980, 2000],
      message: 'Massive protests forced democratic reforms and constitutional changes.',
      annotations: [
        { year: 1987, text: 'June Uprising', type: 'positive' },
        { year: 1988, text: 'Direct Elections', type: 'positive' },
        { year: 1993, text: 'Civilian Government', type: 'positive' }
      ],
      continuityElements: ['democratization_process', 'civil_society', 'institutional_reform']
    },
    {
      id: 'consolidation',
      title: 'Democratic Consolidation',
      subtitle: 'Strengthening Institutions (1993-2008)',
      indicator: 'vdem_liberal',
      timeRange: [1990, 2010],
      message: 'Democratic institutions were established and civil society flourished.',
      annotations: [
        { year: 1998, text: 'First Opposition Victory', type: 'positive' },
        { year: 2002, text: 'Peaceful Power Transfer', type: 'positive' }
      ],
      continuityElements: ['institutional_strength', 'democratic_norms', 'civil_liberties']
    },
    {
      id: 'challenges',
      title: 'Modern Challenges',
      subtitle: 'Polarization and Democratic Resilience (2008-Present)',
      indicator: 'freedom_house',
      timeRange: [2000, 2020],
      message: 'Recent years show both democratic backsliding and remarkable resilience.',
      annotations: [
        { year: 2008, text: 'Conservative Return', type: 'negative' },
        { year: 2016, text: 'Impeachment Crisis', type: 'neutral' },
        { year: 2017, text: 'Democratic Renewal', type: 'positive' }
      ],
      continuityElements: ['democratic_resilience', 'polarization', 'accountability_mechanisms']
    }
  ];

  useEffect(() => {
    if (!isOpen || !isInitialized) return;

    narrativeRouter.register('/case-study/south-korea', NarrativeCaseStudy);
    narrativeRouter.register('/case-study/south-korea/scene/:sceneId', NarrativeCaseStudy);
    narrativeRouter.register('/case-study/south-korea/explore', NarrativeCaseStudy);

    const { path, params } = narrativeRouter.parseParams(currentRoute);
    
    console.log('=== NarrativeCaseStudy Routing ===');
    console.log('currentRoute:', currentRoute);
    console.log('path:', path);
    console.log('params:', params);
    
    if (path.includes('/explore')) {
      console.log('Transitioning to glass phase');
      handlePhaseTransition('glass');
    } else if (path.includes('/scene/') && params.sceneId) {
      const sceneIndex = scenes.findIndex(s => s.id === params.sceneId);
      
      if (sceneIndex >= 0) {
        console.log(`Transitioning to scene ${sceneIndex}`);
        handleSceneTransition(sceneIndex);
      } else {
        console.warn(`Scene '${params.sceneId}' not found, fallback to scene 0`);
        setCurrentScene(0);
        setNarrativePhase('stem');
        navigate('/case-study/south-korea/scene/overview');
      }
    } else {
      console.log('Setting default scene 0');
      setCurrentScene(0);
      setNarrativePhase('stem');
      navigate('/case-study/south-korea/scene/overview');
    }
  }, [isOpen, isInitialized, currentRoute]);


  const handleSceneTransition = (sceneIndex) => {
    if (sceneIndex >= 0 && sceneIndex < scenes.length && sceneIndex !== currentScene) {
      console.log(`Enhanced scene transition: ${currentScene} → ${sceneIndex}`);

      setCurrentScene(sceneIndex);
      navigate(`/case-study/south-korea/scene/${scenes[sceneIndex].id}`);
    }
  };

  const handlePhaseTransition = (targetPhase) => {
    if (targetPhase === narrativePhase) return;
    
    console.log(`Enhanced phase transition: ${narrativePhase} → ${targetPhase}`);

    const currentSceneData = scenes[currentScene];
    setPhaseTransitionData({
      sourcePhase: narrativePhase,
      targetPhase: targetPhase,
      sceneContext: currentSceneData,
      continuityElements: currentSceneData.continuityElements,
      timestamp: Date.now()
    });

    setNarrativePhase(targetPhase);
    
    if (targetPhase === 'glass') {
      navigate('/case-study/south-korea/explore');
    } else {
      navigate(`/case-study/south-korea/scene/${scenes[currentScene].id}`);
    }
    
    setTimeout(() => {
      setPhaseTransitionData(null);
    }, 600);
  };

  const handleSceneChange = (sceneIndex) => {
    handleSceneTransition(sceneIndex);
  };

  const handleTransitionToGlass = () => {
    handlePhaseTransition('glass');
  };

  const handleBackToStem = () => {
    handlePhaseTransition('stem');
  };

  if (!isOpen) return null;

  const getTransitionClass = () => {
    switch (transitionState) {
      case 'opening': return 'narrative-opening';
      case 'closing': return 'narrative-closing';
      default: return 'narrative-idle';
    }
  };

  const getFadeStyle = () => {
    switch (transitionState) {
      case 'opening':
        return { opacity: 0 };
      case 'closing':
        return { opacity: 0 };
      default:
        return { opacity: 1 };
    }
  };

  return (
    <div 
      className={`portal-narrative-overlay ${getTransitionClass()}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: transitionState === 'closing' ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.4)',
        zIndex: 2147483647,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        ...getFadeStyle(),
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && transitionState === 'idle') {
          handleClose();
        }
      }}
    >
      <div 
        className={`portal-narrative-panel ${getTransitionClass()}`}
        style={{
          width: '100%',
          maxWidth: 'none',
          minWidth: '100%',
          height: '100vh',
          background: 'white',
          boxShadow: transitionState === 'closing' ? 'none' : '-4px 0 20px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          ...getFadeStyle(),
          transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          zIndex: 2147483647,
          overflow: 'hidden'
        }}
      >
      
      <NarrativeHeader 
        onClose={handleClose}
        currentPhase={narrativePhase}
        currentScene={currentScene}
        totalScenes={scenes.length}
        onPhaseChange={narrativePhase === 'stem' ? handleTransitionToGlass : handleBackToStem}
        onHelpToggle={toggleHelpPanel}
        onSceneChange={handleSceneChange}
        showHelp={showHelpPanel}
        transitionState={transitionState}
        sceneProgress={(currentScene + 1) / scenes.length}
        onViewTutorial={forceShowTutorial}
      />

      {showHelpPanel && (
        <HelpPanel 
          onClose={() => setShowHelpPanel(false)}
          phase={narrativePhase}
          currentScene={scenes[currentScene]}
          transitionState={transitionState}
        />
      )}

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        {narrativePhase === 'stem' ? (
          <StemPhase
            scenes={scenes}
            currentScene={currentScene}
            onSceneChange={handleSceneChange}
            onTransitionToGlass={handleTransitionToGlass}
            data={data}
            state={state}
            transitionState={transitionState}
            phaseTransitionData={phaseTransitionData}
          />
        ) : (
          <GlassPhase
            data={data}
            state={state}
            onBackToStem={handleBackToStem}
            transitionState={transitionState}
            phaseTransitionData={phaseTransitionData}
            previousSceneContext={scenes[currentScene]}
          />
        )}
      </div>
      </div>
    </div>
  );
};

const NarrativeHeader = ({ 
  onClose, 
  currentPhase, 
  currentScene, 
  totalScenes, 
  onPhaseChange, 
  onHelpToggle,
  onSceneChange,
  showHelp,
  transitionState,
  sceneProgress,
  onViewTutorial
}) => {
  const handleViewTutorial = () => {
    if (currentPhase !== 'stem') {
      console.log('🚫 Tutorial disabled in Free Exploration mode');
      return;
    }

    try {
      console.log('🎯 View tutorial requested from header');
      
      sessionStorage.setItem('southKoreaTutorialSeen', '0');
      
      if (currentScene !== 0) {
        console.log('Moving to Scene 0 to show tutorial');
        onSceneChange(0);
      } else {
        console.log('Already on Scene 0, force showing tutorial immediately');
        if (onViewTutorial) {
          onViewTutorial();
        }
      }

      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 80px;
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
      
      notification.textContent = '✅ Tutorial will show now!';
      
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
      console.error('Failed to view tutorial:', error);
    }
  };

  const isTutorialDisabled = currentPhase !== 'stem';
  
  const getTutorialTooltip = () => {
    if (currentPhase === 'stem') {
      return 'View tutorial to learn how to navigate (will move to the first chart)';
    } else {
      return 'Tutorial is only available in Guided Story mode. Switch to "Guided Story" to view the tutorial.';
    }
  };

  return (
  <div style={{
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2147483647,
    position: 'relative'
  }}>
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: '3px',
      width: `${sceneProgress * 100}%`,
      background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
      transition: 'width 0.5s ease-out'
    }} />
    
    <div style={{ flex: 1 }}>
      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
        South Korea Case Study
      </h2>
      <div style={{ 
        marginTop: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '6px 14px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          fontSize: '15px',
          fontWeight: '600',
          opacity: 1
        }}>
          <span style={{
            background: currentPhase === 'stem' ? '#fbbf24' : '#10b981',
            color: '#1f2937',
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
          }}>
            {currentPhase === 'stem' ? 'STORY' : 'EXPLORE'}
          </span>
          <span style={{ color: 'white', fontWeight: '600' }}>
            {currentPhase === 'stem' ? `Scene ${currentScene + 1}/${totalScenes}` : 'Interactive Mode'}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: '3px',
            height: '14px',
            background: currentPhase === 'stem' ? '#fbbf24' : 'rgba(255,255,255,0.4)',
            borderRadius: '2px',
            transition: 'all 0.3s ease-out',
            boxShadow: currentPhase === 'stem' ? '0 0 12px #fbbf24' : 'none'
          }} />
          <div style={{
            width: '10px',
            height: '8px',
            borderBottom: '8px solid ' + (currentPhase === 'glass' ? '#10b981' : 'rgba(255,255,255,0.4)'),
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            transition: 'all 0.3s ease-out',
            filter: currentPhase === 'glass' ? 'drop-shadow(0 0 6px #10b981)' : 'none'
          }} />
        </div>
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        padding: '4px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <button
          onClick={() => currentPhase !== 'stem' && onPhaseChange()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: currentPhase === 'stem' ? 
              'rgba(255, 255, 255, 0.9)' : 
              'transparent',
            color: currentPhase === 'stem' ? '#374151' : 'rgba(255, 255, 255, 0.8)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: currentPhase === 'stem' ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: currentPhase === 'stem' ? 1 : 0.8,
            transform: currentPhase === 'stem' ? 'scale(1)' : 'scale(0.95)',
            boxShadow: currentPhase === 'stem' ? 
              '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
          }}
          onMouseOver={(e) => {
            if (currentPhase !== 'stem') {
              e.target.style.opacity = '1';
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }
          }}
          onMouseOut={(e) => {
            if (currentPhase !== 'stem') {
              e.target.style.opacity = '0.8';
              e.target.style.background = 'transparent';
            }
          }}
        >
          <span style={{ fontSize: '14px' }}>📖</span>
          <span>Guided Story</span>
          {currentPhase === 'stem' && (
            <span style={{
              fontSize: '10px',
              background: '#fbbf24',
              color: 'black',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: '500'
            }}>
              Scene {currentScene + 1}/{totalScenes}
            </span>
          )}
        </button>

        <div style={{
          width: '1px',
          height: '20px',
          background: 'rgba(255, 255, 255, 0.3)',
          margin: '8px 4px',
          alignSelf: 'center'
        }} />

        <button
          onClick={() => currentPhase !== 'glass' && onPhaseChange()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: currentPhase === 'glass' ? 
              'rgba(255, 255, 255, 0.9)' : 
              'transparent',
            color: currentPhase === 'glass' ? '#374151' : 'rgba(255, 255, 255, 0.8)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: currentPhase === 'glass' ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: currentPhase === 'glass' ? 1 : 0.8,
            transform: currentPhase === 'glass' ? 'scale(1)' : 'scale(0.95)',
            boxShadow: currentPhase === 'glass' ? 
              '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
            position: 'relative'
          }}
          onMouseOver={(e) => {
            if (currentPhase !== 'glass') {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }
          }}
          onMouseOut={(e) => {
            if (currentPhase !== 'glass') {
              e.currentTarget.style.opacity = '0.8';
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <span style={{ fontSize: '14px' }}>🔍</span>
          <span>Free Exploration</span>
          {currentPhase === 'stem' && currentScene === totalScenes - 1 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '8px',
              height: '8px',
              background: '#fbbf24',
              borderRadius: '50%',
              animation: 'pulse 2s ease-in-out infinite'
            }} />
          )}
        </button>
      </div>

      <button
        onClick={handleViewTutorial}
        disabled={isTutorialDisabled}
        style={{
          background: isTutorialDisabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: isTutorialDisabled ? 'rgba(255, 255, 255, 0.5)' : 'white',
          padding: '8px 16px',
          borderRadius: '6px',
          fontSize: '12px',
          cursor: isTutorialDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          zIndex: 2147483647,
          fontWeight: '500',
          opacity: isTutorialDisabled ? 0.6 : 1,
          position: 'relative'
        }}
        onMouseOver={(e) => {
          if (!isTutorialDisabled) {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          }
        }}
        onMouseOut={(e) => {
          if (!isTutorialDisabled) {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }
        }}
        title={getTutorialTooltip()}
      >
        {isTutorialDisabled && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '6px',
            height: '6px',
            background: '#ef4444',
            borderRadius: '50%',
            border: '1px solid white'
          }} />
        )}
        {!isTutorialDisabled && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '6px',
            height: '6px',
            background: '#10b981',
            borderRadius: '50%',
            border: '1px solid white'
          }} />
        )}
        🎯 View Tutorial
      </button>

      <button
        onClick={onHelpToggle}
        title="Show/Hide Help"
        style={{
          background: showHelp ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: 'white',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          zIndex: 2147483647
        }}
        onMouseOver={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.target.style.background = showHelp ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        ?
      </button>

      <button
        onClick={onClose}
        title="Close (ESC)"
        aria-label="Close dialog"
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          color: 'white',
          fontWeight: 'bold',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s ease-in-out',
          flexShrink: 0,
          zIndex: 2147483647
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.border = '2px solid #dc2626';
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.border = '2px solid rgba(255, 255, 255, 0.8)';
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        }}
        onFocus={(e) => {
          e.target.style.outline = '2px solid #fbbf24';
          e.target.style.outlineOffset = '2px';
        }}
        onBlur={(e) => {
          e.target.style.outline = 'none';
        }}
      >
        ×
      </button>
    </div>
  </div>
  );
};

const HelpPanel = ({ onClose, phase, currentScene, transitionState }) => {
  const helpContent = {
    stem: {
      title: 'Guided Story Mode',
      subtitle: currentScene ? `Scene: ${currentScene.title}` : '',
      sections: [
        {
          title: 'Navigation & Interaction',
          content: [
            'Use scene buttons to jump between chapters',
            'Hover over data points for detailed information',
            'Click annotations to explore historical context',
            'Navigate with Previous/Next buttons or arrow keys'
          ]
        },
        {
          title: 'Understanding the Visualization',
          content: [
            'Timeline shows democratic progress over years',
            'Colored annotations mark key historical events',
            'Line thickness and area shading indicate data confidence',
            'Smooth transitions maintain visual continuity'
          ]
        },
        {
          title: 'Transition to Exploration',
          content: [
            'Complete all scenes to unlock free exploration mode',
            'Or click "Explore Freely" to jump to interactive analysis',
            'Your current progress will be preserved'
          ]
        }
      ]
    },
    glass: {
      title: 'Free Exploration Mode',
      subtitle: 'Interactive Analysis & Comparison',
      sections: [
        {
          title: 'Interactive Features',
          content: [
            'Adjust time ranges using the timeline controls',
            'Switch between different democracy indicators',
            'Compare South Korea with other countries',
            'Create custom visualizations and annotations'
          ]
        },
        {
          title: 'Data Interpretation',
          content: [
            'Higher values generally indicate more democratic systems',
            'Sharp changes often reflect major political events',
            'Use multiple indicators for comprehensive analysis',
            'Cross-reference with historical annotations'
          ]
        },
        {
          title: 'Advanced Analysis',
          content: [
            'Export data and visualizations for further study',
            'Combine multiple indicators for nuanced insights',
            'Use comparative mode to understand regional trends',
            'Create custom narratives with annotation tools'
          ]
        }
      ]
    }
  };

  const content = helpContent[phase] || helpContent.stem;

  return (
    <div style={{
      position: 'absolute',
      top: '70px',
      right: '20px',
      width: '320px',
      maxHeight: '60vh',
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      zIndex: 2147483647,
      animation: 'slideInRight 0.3s ease-out',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <h3 style={{ 
            margin: '0 0 4px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#1e293b' 
          }}>
            {content.title}
          </h3>
          {content.subtitle && (
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#64748b',
              fontStyle: 'italic'
            }}>
              {content.subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            padding: '4px',
            lineHeight: 1,
            zIndex: 2147483647,
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.color = '#374151';
            e.target.style.background = '#f1f5f9';
          }}
          onMouseOut={(e) => {
            e.target.style.color = '#64748b';
            e.target.style.background = 'none';
          }}
        >
          ×
        </button>
      </div>

      <div style={{
        padding: '20px',
        maxHeight: '50vh',
        overflowY: 'auto'
      }}>
        {content.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} style={{ marginBottom: '20px' }}>
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                width: '4px',
                height: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '2px'
              }} />
              {section.title}
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              listStyle: 'none'
            }}>
              {section.content.map((item, itemIndex) => (
                <li key={itemIndex} style={{
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: '#64748b',
                  marginBottom: '8px',
                  position: 'relative',
                  paddingLeft: '16px'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: '6px',
                    width: '4px',
                    height: '4px',
                    background: '#94a3b8',
                    borderRadius: '50%'
                  }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: '8px',
          border: '1px solid #bae6fd'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#0369a1',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>💡</span>
            Quick Tips
          </div>
          <div style={{
            fontSize: '12px',
            color: '#0369a1',
            lineHeight: '1.4'
          }}>
            Press <kbd style={{
              background: '#e2e8f0',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              border: '1px solid #cbd5e1'
            }}>ESC</kbd> to close • Use <kbd style={{
              background: '#e2e8f0',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              border: '1px solid #cbd5e1'
            }}>?</kbd> for help • <kbd style={{
              background: '#e2e8f0',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              border: '1px solid #cbd5e1'
            }}>←→</kbd> navigate scenes
          </div>
        </div>

        {phase === 'stem' && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#fef3c7',
            borderRadius: '6px',
            border: '1px solid #fed7aa'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#92400e',
              fontWeight: '500'
            }}>
              💫 Pro Tip: Let the story guide you first, then explore freely for deeper insights!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NarrativeCaseStudy;