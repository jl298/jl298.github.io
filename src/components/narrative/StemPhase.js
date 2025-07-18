import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { getCountryTimeSeries, formatValue } from '../../utils/dataProcessor';
import { KOREA_EVENTS, COLORS } from '../../utils/constants';

const TUTORIAL_STORAGE_KEY = 'southKoreaTutorialSeen';

const TUTORIAL_STATE = {
  HIDDEN: 'hidden',
  SHOWING: 'showing',
  COMPLETED: 'completed'
};

const TutorialOverlay = React.memo(({ 
  currentScene, 
  tutorialState, 
  tutorialStep, 
  onComplete, 
  onAdvance 
}) => {
  const renderCountRef = useRef(0);
  if (process.env.NODE_ENV === 'development') {
    renderCountRef.current++;
    console.log(`🔄 TutorialOverlay render #${renderCountRef.current}:`, { 
      currentScene, 
      tutorialState, 
      tutorialStep 
    });
  }

  if (currentScene !== 0 || tutorialState !== TUTORIAL_STATE.SHOWING) {
    return null;
  }

  const tutorialMessages = [
    {
      title: "Welcome to South Korea's Story! 🇰🇷",
      message: "This interactive visualization will guide you through South Korea's democratic transformation. Take your time to explore!",
      highlight: "none",
      actionHint: "Click Next to continue or explore the chart",
      canManualAdvance: true
    },
    {
      title: "Explore the Data Points 📊",
      message: "Try hovering over the blue dots on the timeline to see detailed democracy scores for each year. Or click Next to continue.",
      highlight: "dots",
      actionHint: "Hover over any blue dot or click Next",
      canManualAdvance: true
    },
    {
      title: "Discover Historical Events 📍",
      message: "Click on the colored event markers to learn about key moments in South Korea's democratic journey. Or click Next to continue.",
      highlight: "annotations",
      actionHint: "Click any colored event marker or click Next",
      canManualAdvance: true
    },
    {
      title: "Navigate the Story 🧭",
      message: "Use the scene buttons at the top to jump between chapters, or follow the story with the Next button below.",
      highlight: "navigation",
      actionHint: "You're ready to explore!",
      canManualAdvance: true
    }
  ];

  const currentTutorial = tutorialMessages[tutorialStep] || tutorialMessages[0];

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '320px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
      color: 'white',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 12px 40px rgba(59, 130, 246, 0.4)',
      zIndex: 1000,
      animation: 'slideInRight 0.4s ease-out',
      border: '2px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '13px', 
          fontWeight: '600',
          background: 'rgba(255, 255, 255, 0.2)',
          padding: '4px 8px',
          borderRadius: '12px'
        }}>
          Step {Math.min(tutorialStep + 1, tutorialMessages.length)} of {tutorialMessages.length}
        </div>
        <button
          onClick={() => {
            console.log('Tutorial closed via X button');
            onComplete();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          ×
        </button>
      </div>
      
      <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600' }}>
        {currentTutorial.title}
      </h4>
      
      <p style={{ margin: '0 0 8px 0', fontSize: '13px', lineHeight: 1.5, opacity: 0.95 }}>
        {currentTutorial.message}
      </p>
      
      <div style={{
        fontSize: '11px',
        background: 'rgba(255, 255, 255, 0.15)',
        padding: '6px 10px',
        borderRadius: '8px',
        marginBottom: '16px',
        fontStyle: 'italic'
      }}>
        💡 {currentTutorial.actionHint}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {tutorialMessages.map((_, index) => (
            <div
              key={index}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: index === tutorialStep ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s ease',
                border: index === tutorialStep ? '2px solid white' : 'none'
              }}
            />
          ))}
        </div>
        
        <button
          onClick={() => {
            console.log('Tutorial manually advanced via button');
            onAdvance();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          {tutorialStep < tutorialMessages.length - 1 ? 'Next →' : 'Got it! ✓'}
        </button>
      </div>
    </div>
  );
});

TutorialOverlay.displayName = 'TutorialOverlay';

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.currentScene === nextProps.currentScene &&
    prevProps.tutorialState === nextProps.tutorialState &&
    prevProps.tutorialStep === nextProps.tutorialStep
  );
};

const MemoizedTutorialOverlay = React.memo(TutorialOverlay, areEqual);

const StemPhase = ({ 
  scenes, 
  currentScene, 
  onSceneChange, 
  onTransitionToGlass, 
  data, 
  state 
}) => {
  const svgRef = useRef();
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [dataError, setDataError] = useState(null);
  const [koreaDataCache, setKoreaDataCache] = useState(null);

  const [tutorialState, setTutorialState] = useState(TUTORIAL_STATE.HIDDEN);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialExecutedRef = useRef(false);
  const componentMountedRef = useRef(false);
  const currentSceneRef = useRef(currentScene);

  const scene = scenes[currentScene];

  useEffect(() => {
    currentSceneRef.current = currentScene;
  }, [currentScene]);

  useEffect(() => {
    componentMountedRef.current = true;
    return () => {
      componentMountedRef.current = false;
    };
  }, []);

  const checkTutorialCompleted = useCallback(() => {
    try {
      return sessionStorage.getItem(TUTORIAL_STORAGE_KEY) === '1';
    } catch (error) {
      console.warn('Session storage not available:', error);
      return false;
    }
  }, []);

  const markTutorialCompleted = useCallback(() => {
    try {
      sessionStorage.setItem(TUTORIAL_STORAGE_KEY, '1');
      console.log('✅ Tutorial marked as completed in session storage');
    } catch (error) {
      console.warn('Failed to save tutorial state:', error);
    }
  }, []);

  const completeTutorial = useCallback(() => {
    console.log('🎉 Tutorial completed');
    markTutorialCompleted();
    setTutorialState(TUTORIAL_STATE.COMPLETED);
    setTutorialStep(0);
  }, [markTutorialCompleted]);

  const advanceTutorial = useCallback(() => {
    if (tutorialState !== TUTORIAL_STATE.SHOWING) {
      console.log('⚠️ Tutorial not showing, cannot advance');
      return;
    }

    const totalSteps = 4;
    console.log(`📈 Advancing tutorial from step ${tutorialStep} to ${tutorialStep + 1}`);
    
    if (tutorialStep < totalSteps - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  }, [tutorialState, tutorialStep, completeTutorial]);

  useEffect(() => {
    console.log('🔄 Tutorial initialization effect', {
      currentScene,
      tutorialState,
      executed: tutorialExecutedRef.current
    });

    if (currentScene !== 0) {
      if (tutorialState === TUTORIAL_STATE.SHOWING) {
        console.log('🚫 Not scene 0, hiding tutorial');
        setTutorialState(TUTORIAL_STATE.HIDDEN);
        setTutorialStep(0);

        const tutorialCompleted = checkTutorialCompleted();
        if (!tutorialCompleted) {
          console.log('🔄 Tutorial not completed, resetting executed flag for future Scene 0 visits');
          tutorialExecutedRef.current = false;
        }
      }
      return;
    }

    const tutorialCompleted = checkTutorialCompleted();

    if (tutorialCompleted) {
      console.log('✅ Tutorial already completed, skipping');
      setTutorialState(TUTORIAL_STATE.COMPLETED);
      tutorialExecutedRef.current = true;
      return;
    }

    if (tutorialState !== TUTORIAL_STATE.SHOWING) {
      console.log('🚀 Starting/Restarting tutorial (not completed)');
      tutorialExecutedRef.current = true;
      setTutorialState(TUTORIAL_STATE.SHOWING);
      setTutorialStep(0);
    } else {
      console.log('📱 Tutorial already showing, maintaining current state');
    }

  }, [currentScene, checkTutorialCompleted, tutorialState]);

  const viewTutorial = useCallback(() => {
    console.log('🎯 Viewing tutorial');
    console.log('Current scene:', currentSceneRef.current);
    console.log('Current tutorial state:', tutorialState);
    
    try {
      sessionStorage.setItem(TUTORIAL_STORAGE_KEY, '0');
      console.log('✅ Session storage set to "0"');
    } catch (error) {
      console.warn('Failed to view tutorial state:', error);
    }

    tutorialExecutedRef.current = false;
    setTutorialState(TUTORIAL_STATE.HIDDEN);
    setTutorialStep(0);
    
    console.log('🎯 Tutorial state reset to HIDDEN, step 0, executed flag false');

    if (currentSceneRef.current === 0) {
      console.log('🚀 Scene 0 detected - starting tutorial in 100ms');
      setTimeout(() => {
        if (componentMountedRef.current) {
          console.log('🎆 Executing tutorial start');

          const isCompleted = checkTutorialCompleted();
          if (!isCompleted) {
            setTutorialState(TUTORIAL_STATE.SHOWING);
            setTutorialStep(0);
            tutorialExecutedRef.current = true;
            console.log('✅ Tutorial start completed - state: SHOWING, step: 0, executed: true');
          } else {
            console.log('⚠️ Tutorial appears to be completed despite reset - this should not happen');
          }
        } else {
          console.log('⚠️ Component unmounted, skipping tutorial start');
        }
      }, 100);
    } else {
      console.log('📍 Not on Scene 0, tutorial will show when user navigates to Scene 0');
    }
  }, [checkTutorialCompleted]);

  useEffect(() => {
    window.viewSouthKoreaTutorial = viewTutorial;
    window.forceSouthKoreaTutorial = viewTutorial;
    return () => {
      delete window.viewSouthKoreaTutorial;
      delete window.forceSouthKoreaTutorial;
    };
  }, [viewTutorial]);

  const loadKoreaData = useCallback(() => {
    if (!data || !data.countries) {
      console.log('StemPhase: No data available');
      setDataError('Dashboard data not loaded');
      return null;
    }
    
    console.log('StemPhase: Loading scene', currentScene, scene.id);

    const koreaNameVariants = [
      'South Korea', 
      'Korea, South', 
      'Republic of Korea', 
      'KOR',
      'Korea (South)',
      'South Korea (Republic of Korea)'
    ];
    
    let koreaData = null;
    let usedName = null;
    
    for (const name of koreaNameVariants) {
      const foundData = getCountryTimeSeries(data.countries, name);
      if (foundData && foundData.length > 0) {
        koreaData = foundData;
        usedName = name;
        console.log(`✓ Found Korea data with name: "${name}" (${foundData.length} records)`);
        break;
      }
    }
    
    if (!koreaData || koreaData.length === 0) {
      console.error('✗ No Korea data found with any name variant');
      setDataError(`Could not find South Korea data. Using fallback narrative mode.`);
      return generateFallbackData();
    }
    
    setDataError(null);
    return koreaData;
  }, [data, currentScene, scene.id]);

  const generateFallbackData = () => {
    const fallbackData = [];
    const startYear = scene.timeRange[0];
    const endYear = scene.timeRange[1];
    
    for (let year = startYear; year <= endYear; year += 2) {
      const value = generateHistoricalValue(year, scene.indicator);
      fallbackData.push({
        year,
        [scene.indicator]: value,
        country: 'South Korea (estimated)'
      });
    }
    
    return fallbackData;
  };

  const generateHistoricalValue = (year, indicator) => {
    switch (indicator) {
      case 'polity5':
        if (year < 1987) return -6 + Math.random() * 2;
        if (year < 1993) return -2 + Math.random() * 4;
        return 6 + Math.random() * 2;
      case 'vdem_liberal':
        if (year < 1987) return 0.15 + Math.random() * 0.1;
        if (year < 1993) return 0.3 + Math.random() * 0.2;
        return 0.6 + Math.random() * 0.2;
      case 'freedom_house':
        if (year < 1987) return 25 + Math.random() * 15;
        if (year < 1993) return 45 + Math.random() * 15;
        return 75 + Math.random() * 15;
      default:
        return Math.random() * 100;
    }
  };

  const sceneKey = useMemo(() => `${currentScene}-${scene.id}`, [currentScene, scene.id]);
  
  useEffect(() => {
    console.log(`Scene transition effect triggered for scene: ${sceneKey}`);

    let koreaData = null;
    if (data && data.countries) {
      const koreaNameVariants = [
        'South Korea', 
        'Korea, South', 
        'Republic of Korea', 
        'KOR',
        'Korea (South)',
        'South Korea (Republic of Korea)'
      ];
      
      for (const name of koreaNameVariants) {
        const foundData = getCountryTimeSeries(data.countries, name);
        if (foundData && foundData.length > 0) {
          koreaData = foundData;
          console.log(`✓ Found Korea data with name: "${name}" (${foundData.length} records)`);
          break;
        }
      }
    }
    
    if (koreaData) {
      setKoreaDataCache(koreaData);
      setDataError(null);
      drawScene(koreaData, scene);
    } else {
      console.log('No Korea data found, using fallback');
      setDataError('Could not find South Korea data. Using fallback narrative mode.');
      showFallbackVisualization();
    }
  }, [sceneKey, data]);





  const updateAxes = (g, xScale, yScale, width, height, indicator) => {
    g.selectAll('.grid').remove();

    const xGrid = d3.axisBottom(xScale)
      .tickSize(-height)
      .tickFormat('');
    
    const yGrid = d3.axisLeft(yScale)
      .tickSize(-width)
      .tickFormat('');

    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(xGrid)
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1);

    g.append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1);

    let xAxis = g.select('.x-axis');
    if (xAxis.empty()) {
      xAxis = g.append('g').attr('class', 'x-axis');
    }
    
    let yAxis = g.select('.y-axis');
    if (yAxis.empty()) {
      yAxis = g.append('g').attr('class', 'y-axis');
    }

    xAxis
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#64748b');

    yAxis
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#64748b');

    updateAxisLabels(g, width, height, indicator);
  };

  const drawLinePath = (g, data, xScale, yScale, sceneConfig) => {
    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d[sceneConfig.indicator]))
      .curve(d3.curveMonotoneX);

    let linePath = g.select('.main-line');
    
    if (linePath.empty()) {
      linePath = g.append('path')
        .attr('class', 'main-line')
        .attr('fill', 'none')
        .attr('stroke', COLORS.primary)
        .attr('stroke-width', 3);
    }

    linePath.attr('d', line(data));

    const area = d3.area()
      .x(d => xScale(d.year))
      .y0(yScale.range()[0])
      .y1(d => yScale(d[sceneConfig.indicator]))
      .curve(d3.curveMonotoneX);

    let areaPath = g.select('.main-area');
    if (areaPath.empty()) {
      areaPath = g.append('path')
        .attr('class', 'main-area')
        .attr('fill', COLORS.primary)
        .attr('opacity', 0.1);
    }

    areaPath.attr('d', area(data));
  };

  const updateDataPoints = useCallback((g, data, xScale, yScale, sceneConfig) => {
    g.selectAll('.data-dot').remove();

    const dots = g.selectAll('.data-dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'data-dot')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d[sceneConfig.indicator]))
      .attr('r', 4)
      .attr('fill', COLORS.primary)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    dots
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6);
        showTooltip(event, d, sceneConfig.indicator);

        if (currentSceneRef.current === 0 && tutorialState === TUTORIAL_STATE.SHOWING && tutorialStep === 1) {
          setTimeout(() => {
            if (componentMountedRef.current) {
              advanceTutorial();
            }
          }, 200);
        }
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 4);
        hideTooltip();
      })
      .on('click', function(event, d) {
        if (currentSceneRef.current === 0 && tutorialState === TUTORIAL_STATE.SHOWING && tutorialStep === 1) {
          setTimeout(() => {
            if (componentMountedRef.current) {
              advanceTutorial();
            }
          }, 200);
        }
      });
  }, [tutorialState, tutorialStep, advanceTutorial]);

  const updateAnnotations = useCallback((g, sceneData, xScale, yScale, sceneConfig) => {
    g.selectAll('.annotation').remove();

    const relevantAnnotations = sceneConfig.annotations.filter(ann => 
      ann.year >= sceneConfig.timeRange[0] && ann.year <= sceneConfig.timeRange[1]
    );

    relevantAnnotations.forEach((annotation, index) => {
      const yearData = sceneData.data.find(d => d.year === annotation.year);
      if (!yearData) return;

      const x = xScale(annotation.year);
      const y = yScale(yearData[sceneConfig.indicator]);

      const annotationGroup = g.append('g')
        .attr('class', 'annotation');

      annotationGroup.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', yScale.range()[0])
        .attr('y2', 0)
        .attr('stroke', getAnnotationColor(annotation.type))
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.7);

      const point = annotationGroup.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 6)
        .attr('fill', getAnnotationColor(annotation.type))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');

      const labelY = 30 + (index * 35);
      const label = annotationGroup.append('g')
        .attr('transform', `translate(${x}, ${labelY})`)
        .style('cursor', 'pointer');

      const labelText = annotation.text;
      const labelWidth = Math.max(80, labelText.length * 6);

      label.append('rect')
        .attr('x', -labelWidth/2)
        .attr('y', -12)
        .attr('width', labelWidth)
        .attr('height', 24)
        .attr('fill', 'rgba(255, 255, 255, 0.95)')
        .attr('stroke', getAnnotationColor(annotation.type))
        .attr('stroke-width', 1)
        .attr('rx', 6)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

      label.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 4)
        .style('font-size', '11px')
        .style('font-weight', '600')
        .style('fill', getAnnotationColor(annotation.type))
        .text(labelText);

      const connectionPath = d3.path();
      connectionPath.moveTo(x, y);
      connectionPath.quadraticCurveTo(x, (y + labelY - 12) / 2, x, labelY - 12);
      
      annotationGroup.append('path')
        .attr('d', connectionPath.toString())
        .attr('stroke', getAnnotationColor(annotation.type))
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', 0.6)
        .attr('fill', 'none');

      annotationGroup
        .on('click', (event) => {
          event.stopPropagation();
          
          console.log(`Annotation clicked: ${annotation.text}`);
          setCurrentAnnotation(annotation);

          if (currentSceneRef.current === 0 && tutorialState === TUTORIAL_STATE.SHOWING && tutorialStep === 2) {
            setTimeout(() => {
              if (componentMountedRef.current) {
                advanceTutorial();
              }
            }, 300);
          }
        })
        .on('mouseover', function() {
          d3.select(this).select('circle').attr('r', 8);
        })
        .on('mouseout', function() {
          d3.select(this).select('circle').attr('r', 6);
        });
    });
  }, [tutorialState, tutorialStep, advanceTutorial]);

  const showFallbackVisualization = () => {
    const koreaData = generateFallbackData();
    drawScene(koreaData, scene);

    const svg = d3.select(svgRef.current);
    svg.append('text')
      .attr('x', 20)
      .attr('y', 25)
      .style('font-size', '12px')
      .style('fill', '#f59e0b')
      .style('font-weight', '600')
      .text('📊 Using estimated data - narrative preserved');
  };

  const drawScene = (koreaData, sceneConfig) => {
    console.log('Drawing scene:', sceneConfig.id);
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svg.node().getBoundingClientRect();
    const margin = { top: 40, right: 60, bottom: 80, left: 80 };
    const width = Math.max(400, container.width - margin.left - margin.right);
    const height = Math.max(300, container.height - margin.top - margin.bottom);
    
    if (width <= 0 || height <= 0) {
      setTimeout(() => drawScene(koreaData, sceneConfig), 100);
      return;
    }

    const g = svg.append('g')
      .attr('class', 'main-chart')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const filteredData = koreaData.filter(d => {
      const yearValid = d.year >= sceneConfig.timeRange[0] && d.year <= sceneConfig.timeRange[1];
      const valueValid = d[sceneConfig.indicator] != null && 
                        !isNaN(d[sceneConfig.indicator]) && 
                        isFinite(d[sceneConfig.indicator]);
      return yearValid && valueValid;
    }).sort((a, b) => a.year - b.year);
    
    if (filteredData.length === 0) {
      showFallbackVisualization();
      return;
    }

    const xScale = d3.scaleLinear()
      .domain(sceneConfig.timeRange)
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(filteredData, d => d[sceneConfig.indicator]))
      .range([height, 0])
      .nice();

    updateAxes(g, xScale, yScale, width, height, sceneConfig.indicator);
    drawLinePath(g, filteredData, xScale, yScale, sceneConfig);
    updateDataPoints(g, filteredData, xScale, yScale, sceneConfig);
    updateAnnotations(g, {data: filteredData}, xScale, yScale, sceneConfig);
  };

  const updateAxisLabels = (g, width, height, indicator) => {
    g.selectAll('.axis-label').remove();
    
    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - 60)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text(getIndicatorLabel(indicator));

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', `translate(${width / 2}, ${height + 60})`)
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text('Year');
  };

  const getIndicatorLabel = (indicator) => {
    switch (indicator) {
      case 'polity5': return 'Polity5 Score (-10 ~ +10)';
      case 'vdem_liberal': return 'V-Dem Liberal Democracy Index (0-1)';
      case 'freedom_house': return 'Freedom House Score (0-100)';
      case 'press_freedom': return 'RSF Press Freedom Index (0-100, Lower = More Free)';
      case 'surveillance': return 'AI Surveillance Index (0-100)';
      case 'minority_rights': return 'Minority Rights Index (0-1)';
      default: return 'Indicator Value';
    }
  };

  const getAnnotationColor = (type) => {
    switch (type) {
      case 'positive': return '#10b981';
      case 'negative': return '#dc2626';
      case 'neutral': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const showTooltip = (event, d, indicator) => {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'data-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', 1000)
      .html(`
        <div><strong>Year:</strong> ${d.year}</div>
        <div><strong>Value:</strong> ${formatValue(d[indicator], indicator)}</div>
      `);

    tooltip
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  };

  const hideTooltip = () => {
    d3.selectAll('.data-tooltip').remove();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {false && process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '11px',
          zIndex: 999,
          fontFamily: 'monospace'
        }}>
          <div>Scene: {currentScene}</div>
          <div>State: {tutorialState}</div>
          <div>Step: {tutorialStep}</div>
          <div>Executed: {tutorialExecutedRef.current ? 'true' : 'false'}</div>
          <button 
            onClick={viewTutorial}
            style={{
              marginTop: '4px',
              padding: '2px 6px',
              fontSize: '10px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            View Tutorial
          </button>
        </div>
      )}
      
      <MemoizedTutorialOverlay 
        currentScene={currentScene}
        tutorialState={tutorialState}
        tutorialStep={tutorialStep}
        onComplete={completeTutorial}
        onAdvance={advanceTutorial}
      />

      <SceneNavigation
        scenes={scenes}
        currentScene={currentScene}
        onSceneChange={onSceneChange}
        showTutorialHint={tutorialState === TUTORIAL_STATE.SHOWING && tutorialStep === 3}
      />

      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 2, padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>
              {scene.title}
            </h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
              {scene.subtitle}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
              {scene.message}
            </p>
          </div>
          
          <svg
            ref={svgRef}
            width="100%"
            height="360px"
            style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)'
            }}
          />
        </div>

        <div style={{ flex: 1, padding: '16px', background: '#f8fafc' }}>
          <SceneInformation 
            scene={scene}
            currentAnnotation={currentAnnotation}
            onCloseAnnotation={() => setCurrentAnnotation(null)}
            showTutorialHint={tutorialState === TUTORIAL_STATE.SHOWING && tutorialStep === 2}
          />
        </div>
      </div>

      <div style={{ 
        padding: '16px 24px', 
        borderTop: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {scenes.map((_, index) => (
            <div
              key={index}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: index === currentScene ? 
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                  '#d1d5db',
                transition: 'all 0.3s',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: index === currentScene ? 
                  '0 2px 8px rgba(102, 126, 234, 0.4)' : 'none'
              }}
              onClick={() => onSceneChange(index)}
            >
              {index < currentScene && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '8px',
                  color: 'white'
                }}>
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#6b7280', marginRight: '8px' }}>
            {currentScene + 1} of {scenes.length}
          </span>

          {currentScene > 0 && (
            <button
              onClick={() => onSceneChange(currentScene - 1)}
              style={{
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              ← Previous
            </button>
          )}

          {dataError && (
            <button
              onClick={() => {
                if (currentScene < scenes.length - 1) {
                  onSceneChange(currentScene + 1);
                } else {
                  onTransitionToGlass();
                }
              }}
              style={{
                padding: '8px 16px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Skip Scene →
            </button>
          )}
          
          {currentScene < scenes.length - 1 ? (
            <button
              onClick={() => onSceneChange(currentScene + 1)}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={onTransitionToGlass}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
              }}
            >
              Explore Freely →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const SceneNavigation = ({ scenes, currentScene, onSceneChange, showTutorialHint }) => (
  <div style={{ 
    padding: '48px 24px 12px 24px', 
    borderBottom: '1px solid #e5e7eb',
    background: 'white',
    position: 'relative'
  }}>
    {showTutorialHint && (
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '24px',
        background: '#3b82f6',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        zIndex: 100,
        animation: 'bounce 2s infinite'
      }}>
        Click these buttons to navigate! ⬇
      </div>
    )}
    
    <div style={{ 
      display: 'flex', 
      gap: '8px', 
      overflowX: 'auto',
      paddingBottom: '4px',
      paddingTop: '8px'
    }}>
      {scenes.map((scene, index) => (
        <button
          key={scene.id}
          onClick={() => onSceneChange(index)}
          style={{
            padding: '8px 16px',
            background: index === currentScene ? 
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
              'white',
            color: index === currentScene ? 'white' : '#374151',
            border: '1px solid ' + (index === currentScene ? 'transparent' : '#d1d5db'),
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            transition: 'all 0.3s',
            position: 'relative',
            boxShadow: index === currentScene ? 
              '0 4px 12px rgba(102, 126, 234, 0.3)' : 
              '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
          onMouseOver={(e) => {
            if (index !== currentScene) {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#9ca3af';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseOut={(e) => {
            if (index !== currentScene) {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {index + 1}. {scene.title}

          {index < currentScene && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '16px',
              height: '16px',
              background: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'white',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              ✓
            </span>
          )}
        </button>
      ))}
    </div>
  </div>
);

const SceneInformation = ({ scene, currentAnnotation, onCloseAnnotation, showTutorialHint }) => (
  <div style={{ position: 'relative' }}>
    {showTutorialHint && (
      <div style={{
        position: 'absolute',
        top: '160px',
        left: '0',
        background: '#3b82f6',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        zIndex: 100,
        animation: 'pulse 2s infinite',
        whiteSpace: 'nowrap'
      }}>
        Click annotations in the chart! ← 
      </div>
    )}
    
    <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
      Scene Details
    </h4>
    
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
        Time Period
      </div>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: '500',
        padding: '8px 12px',
        background: 'white',
        borderRadius: '6px',
        border: '1px solid #e5e7eb'
      }}>
        {scene.timeRange[0]} - {scene.timeRange[1]}
      </div>
    </div>

    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
        Focus Indicator
      </div>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: '500',
        padding: '8px 12px',
        background: 'white',
        borderRadius: '6px',
        border: '1px solid #e5e7eb'
      }}>
        {scene.indicator}
      </div>
    </div>

    {scene.annotations && scene.annotations.length > 0 && (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
          Key Events
        </div>
        {scene.annotations.map((annotation, index) => (
          <div
            key={index}
            style={{
              padding: '8px 12px',
              marginBottom: '6px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderLeft: `4px solid ${getAnnotationColor(annotation.type)}`
            }}
            onClick={() => {}}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <div style={{ fontWeight: '500', color: '#374151' }}>
              {annotation.year}: {annotation.text}
            </div>
          </div>
        ))}
      </div>
    )}

    {currentAnnotation && (
      <div style={{
        padding: '16px',
        background: 'white',
        border: '2px solid ' + getAnnotationColor(currentAnnotation.type),
        borderRadius: '8px',
        marginTop: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
            {currentAnnotation.year}: {currentAnnotation.text}
          </h5>
          <button
            onClick={onCloseAnnotation}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0 4px'
            }}
          >
            ×
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.4, color: '#374151' }}>
          {getAnnotationDescription(currentAnnotation)}
        </p>
      </div>
    )}
  </div>
);

const getAnnotationColor = (type) => {
  switch (type) {
    case 'positive': return '#10b981';
    case 'negative': return '#dc2626';
    case 'neutral': return '#f59e0b';
    default: return '#6b7280';
  }
};

const getAnnotationDescription = (annotation) => {
  const descriptions = {
    'Military Coup': 'Park Chung-hee seized power, establishing military rule that would last over two decades.',
    'June Uprising': 'Mass protests forced democratic reforms and constitutional changes.',
    'Candlelight Revolution': 'Peaceful protests led to President Park Geun-hye\'s impeachment.',
    'May 16 Coup': 'Military coup that brought Park Chung-hee to power, ending the Second Republic.',
    'Yushin Constitution': 'New constitution that gave President Park near-dictatorial powers.',
    'Park Assassination': 'President Park Chung-hee was assassinated, leading to political uncertainty.',
    'Gwangju Uprising': 'Pro-democracy uprising brutally suppressed by military forces.',
    'Direct Elections': 'First direct presidential election since 1971, marking democratic progress.',
    'Civilian Government': 'Kim Young-sam became first civilian president in over 30 years.',
    'First Opposition Victory': 'Kim Dae-jung\'s victory marked first peaceful transfer to opposition.',
    'Peaceful Power Transfer': 'Smooth transition between opposing political parties.',
    'Conservative Return': 'Lee Myung-bak\'s election brought conservatives back to power.',
    'Impeachment Crisis': 'President Park Geun-hye impeached over corruption scandal.',
    'Democratic Renewal': 'Moon Jae-in\'s election represented democratic resilience.'
  };
  return descriptions[annotation.text] || 'Click on chart annotations to learn more about this event.';
};

export default StemPhase;