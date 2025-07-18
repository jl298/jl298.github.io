import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { getCountryTimeSeries, formatValue } from '../../utils/dataProcessor';
import { KOREA_EVENTS, COLORS, INDICATORS } from '../../utils/constants';

const GlassPhase = ({ 
  data, 
  state, 
  onBackToStem, 
  transitionState, 
  phaseTransitionData, 
  previousSceneContext 
}) => {
  const [selectedIndicators, setSelectedIndicators] = useState(['vdem_liberal']);
  const [timeRange, setTimeRange] = useState([1945, 2025]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonCountries, setComparisonCountries] = useState(['South Korea']);
  const [focusedEvent, setFocusedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('timeseries'); // 'timeseries', 'correlation', 'events'
  const [interactionHistory, setInteractionHistory] = useState([]);
  const [customAnnotations, setCustomAnnotations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [explorationPath, setExplorationPath] = useState([]);
  
  const mainChartRef = useRef();
  const correlationChartRef = useRef();
  const previousDataRef = useRef(null);

  useEffect(() => {
    if (phaseTransitionData && previousSceneContext) {
      console.log('GlassPhase: Initializing with context from Stem phase');
      console.log('Previous scene context:', previousSceneContext);
      console.log('Transition data:', phaseTransitionData);
      
      if (previousSceneContext.indicator) {
        setSelectedIndicators([previousSceneContext.indicator]);
      }
      if (previousSceneContext.timeRange) {
        setTimeRange(previousSceneContext.timeRange);
      }
      
      setExplorationPath([{
        timestamp: Date.now(),
        action: 'transition_from_stem',
        context: {
          scene: previousSceneContext.title,
          indicator: previousSceneContext.indicator,
          timeRange: previousSceneContext.timeRange
        }
      }]);
    }
  }, [phaseTransitionData, previousSceneContext]);

  const loadKoreaData = useCallback(() => {
    if (!data || !data.countries) {
      setDataError('Dashboard data not loaded');
      return null;
    }
    
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
        console.log(`✓ GlassPhase: Found Korea data with name: "${name}" (${foundData.length} records)`);
        break;
      }
    }
    
    if (!koreaData || koreaData.length === 0) {
      console.error('✗ GlassPhase: No Korea data found with any name variant');
      setDataError('Could not find South Korea data. Using fallback exploration mode.');
      return generateFallbackExplorationData();
    }
    
    setDataError(null);
    return koreaData;
  }, [data]);

  const generateFallbackExplorationData = () => {
    const fallbackData = [];
    for (let year = timeRange[0]; year <= timeRange[1]; year += 2) {
      const dataPoint = {
        year,
        country: 'South Korea (estimated)',
        vdem_liberal: generateHistoricalValue(year, 'vdem_liberal'),
        polity5: generateHistoricalValue(year, 'polity5'),
        freedom_house: generateHistoricalValue(year, 'freedom_house')
      };
      fallbackData.push(dataPoint);
    }
    return fallbackData;
  };

  const generateHistoricalValue = (year, indicator) => {
    const baseValues = {
      vdem_liberal: {
        authoritarian: 0.15 + Math.random() * 0.1,
        transition: 0.3 + Math.random() * 0.2,
        democratic: 0.6 + Math.random() * 0.2
      },
      polity5: {
        authoritarian: -6 + Math.random() * 2,
        transition: -2 + Math.random() * 4,
        democratic: 6 + Math.random() * 2
      },
      freedom_house: {
        authoritarian: 25 + Math.random() * 15,
        transition: 45 + Math.random() * 15,
        democratic: 75 + Math.random() * 15
      }
    };

    const period = year < 1987 ? 'authoritarian' : year < 1993 ? 'transition' : 'democratic';
    return baseValues[indicator]?.[period] || Math.random() * 100;
  };

  const trackExploration = (action, details) => {
    const explorationEntry = {
      timestamp: Date.now(),
      action,
      details,
      viewMode,
      selectedIndicators: [...selectedIndicators],
      timeRange: [...timeRange]
    };
    
    setExplorationPath(prev => [...prev.slice(-9), explorationEntry]);
    setInteractionHistory(prev => [...prev.slice(-19), explorationEntry]);
  };

  useEffect(() => {
    if (!data || !data.countries) {
      console.log('GlassPhase: No data available');
      return;
    }
    
    console.log('GlassPhase: Drawing charts for viewMode:', viewMode);
    setIsLoading(true);
    
    try {
      if (transitionState === 'transitioning') {
        setTimeout(() => {
          drawChart();
          setIsLoading(false);
        }, 300);
      } else {
        drawChart();
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error drawing chart:', error);
      showErrorMessage(error.message);
      setIsLoading(false);
    }
  }, [data, selectedIndicators, timeRange, comparisonCountries, viewMode, transitionState]);

  const drawChart = () => {
    switch (viewMode) {
      case 'timeseries':
        drawTimeSeriesChart();
        break;
      case 'correlation':
        drawCorrelationChart();
        break;
      case 'events':
        drawEventsChart();
        break;
      default:
        console.warn('Unknown view mode:', viewMode);
        drawTimeSeriesChart();
    }
  };

  const drawTimeSeriesChart = () => {
    const svg = d3.select(mainChartRef.current);
    if (!svg.node()) {
      console.error('SVG ref not available in GlassPhase');
      return;
    }
    
    svg.selectAll('*').remove();

    const container = svg.node().getBoundingClientRect();
    const legendHeight = Math.ceil(selectedIndicators.length / 3) * 44 + 38 + 20;
    const margin = { top: 40, right: 80, bottom: 60 + legendHeight, left: 80 };
    const width = Math.max(400, container.width - margin.left - margin.right);
    const height = Math.max(300, container.height - margin.top - margin.bottom);

    if (width <= 0 || height <= 0) {
      console.error('Invalid chart dimensions in GlassPhase:', { width, height });
      return;
    }

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const countryData = comparisonCountries.map(country => {
      let countryTimeSeries = getCountryTimeSeries(data.countries, country);

      if (countryTimeSeries.length === 0 && country === 'South Korea') {
        const alternatives = ['Korea, South', 'Republic of Korea', 'KOR'];
        for (const altName of alternatives) {
          countryTimeSeries = getCountryTimeSeries(data.countries, altName);
          if (countryTimeSeries.length > 0) {
            console.log(`Found data for ${country} using alternative name: ${altName}`);
            break;
          }
        }
      }
      
      return {
        country,
        data: countryTimeSeries.filter(d => 
          d.year >= timeRange[0] && d.year <= timeRange[1]
        )
      };
    }).filter(cd => cd.data.length > 0);

    if (countryData.length === 0) {
      showErrorMessage('No data available for selected countries and time range.');
      return;
    }
    
    console.log('Country data prepared:', countryData.map(cd => ({ country: cd.country, points: cd.data.length })));

    const xScale = d3.scaleLinear()
      .domain(timeRange)
      .range([0, width]);

    const yScales = {};
    selectedIndicators.forEach(indicator => {
      const allValues = countryData.flatMap(cd => 
        cd.data.map(d => d[indicator]).filter(v => v != null && !isNaN(v) && isFinite(v))
      );
      
      if (allValues.length > 0) {
        yScales[indicator] = d3.scaleLinear()
          .domain(d3.extent(allValues))
          .range([height, 0])
          .nice();
      }
    });

    const gridGroup = g.append('g').attr('class', 'grid-group');
    
    gridGroup.append('g')
      .attr('class', 'grid x-grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(''))
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1)
      .attr('opacity', 0.6);

    gridGroup.append('g')
      .attr('class', 'grid y-grid')
      .call(d3.axisLeft(yScales[selectedIndicators[0]]).tickSize(-width).tickFormat(''))
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1)
      .attr('opacity', 0.6);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#64748b');

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScales[selectedIndicators[0]]))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#64748b');

    g.append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -60)
      .attr('x', -height/2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .style('fill', getIndicatorColor(selectedIndicators[0]))
      .text(getIndicatorLabel(selectedIndicators[0]));

    g.append('text')
      .attr('class', 'x-axis-label')
      .attr('transform', `translate(${width/2}, ${height + 40})`)
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text('Year');

    const countryColorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const indicatorColorScale = d3.scaleOrdinal([
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
    ]);

    countryData.forEach((cd, countryIndex) => {
      selectedIndicators.forEach((indicator, indicatorIndex) => {
        if (!yScales[indicator]) return;

        const validData = cd.data.filter(d => 
          d[indicator] != null && !isNaN(d[indicator]) && isFinite(d[indicator])
        );

        if (validData.length === 0) return;

        const line = d3.line()
          .x(d => xScale(d.year))
          .y(d => yScales[indicator](d[indicator]))
          .curve(d3.curveMonotoneX);

        const lineColor = comparisonMode 
          ? countryColorScale(countryIndex)
          : indicatorColorScale(indicatorIndex);

        if (indicatorIndex === 0) {
          const area = d3.area()
            .x(d => xScale(d.year))
            .y0(height)
            .y1(d => yScales[indicator](d[indicator]))
            .curve(d3.curveMonotoneX);

          g.append('path')
            .datum(validData)
            .attr('class', `area-${countryIndex}-${indicatorIndex}`)
            .attr('fill', lineColor)
            .attr('opacity', 0.1)
            .attr('d', area);
        }

        const path = g.append('path')
          .datum(validData)
          .attr('class', `line-${countryIndex}-${indicatorIndex}`)
          .attr('fill', 'none')
          .attr('stroke', lineColor)
          .attr('stroke-width', indicatorIndex === 0 ? 3 : 2)
          .attr('stroke-dasharray', indicatorIndex > 0 ? '5,5' : 'none')
          .attr('d', line)
          .style('opacity', 0);

        const totalLength = path.node().getTotalLength();
        path
          .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(1000)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0)
          .style('opacity', 0.8)
          .on('end', () => {
            if (indicatorIndex > 0) {
              path.attr('stroke-dasharray', '5,5');
            } else {
              path.attr('stroke-dasharray', 'none');
            }
          });

        const dotsGroup = g.append('g')
          .attr('class', `dots-group-${countryIndex}-${indicatorIndex}`);

        const dots = dotsGroup.selectAll('.data-dot')
          .data(validData)
          .enter().append('circle')
          .attr('class', 'data-dot')
          .attr('cx', d => xScale(d.year))
          .attr('cy', d => yScales[indicator](d[indicator]))
          .attr('r', 0)
          .attr('fill', lineColor)
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition()
              .duration(150)
              .attr('r', 6);
            
            showDetailedTooltip(event, d, cd.country, indicator);

            trackExploration('data_point_hover', {
              year: d.year,
              country: cd.country,
              indicator,
              value: d[indicator]
            });
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(150)
              .attr('r', 4);
            
            hideTooltip();
          })
          .on('click', function(event, d) {
            addCustomAnnotation(d.year, indicator, `User annotation: ${d.year}`);
            
            trackExploration('data_point_click', {
              year: d.year,
              country: cd.country,
              indicator,
              value: d[indicator]
            });
          });

        dots
          .transition()
          .delay((d, i) => i * 20)
          .duration(300)
          .attr('r', 4);
      });
    });

    addHistoricalEvents(g, xScale, height);

    addEnhancedLegend(g, width, height, legendHeight, comparisonMode, 
                     comparisonCountries, selectedIndicators, countryColorScale, indicatorColorScale);

    addExplorationTools(g, width, height);
  };

  const drawCorrelationChart = () => {
    const svg = d3.select(correlationChartRef.current);
    if (!svg.node()) {
      console.error('Correlation chart SVG ref not available');
      return;
    }
    
    svg.selectAll('*').remove();

    if (selectedIndicators.length < 2) {
      const container = svg.node().getBoundingClientRect();
      const messageGroup = svg.append('g');
      
      messageGroup.append('text')
        .attr('x', container.width / 2)
        .attr('y', container.height / 2 - 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '48px')
        .style('fill', '#e5e7eb')
        .text('📊');
        
      messageGroup.append('text')
        .attr('x', container.width / 2)
        .attr('y', container.height / 2 + 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#6b7280')
        .style('font-weight', '500')
        .text('Select at least 2 indicators to view correlation');
        
      messageGroup.append('text')
        .attr('x', container.width / 2)
        .attr('y', container.height / 2 + 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#9ca3af')
        .text('Use the indicator checkboxes above');
      return;
    }

    const container = svg.node().getBoundingClientRect();
    const margin = { top: 60, right: 60, bottom: 80, left: 100 };
    const width = container.width - margin.left - margin.right;
    const height = container.height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const koreaData = loadKoreaData();
    if (!koreaData) return;
    
    const filteredData = koreaData.filter(d => 
      d.year >= timeRange[0] && d.year <= timeRange[1]
    );

    const [xIndicator, yIndicator] = selectedIndicators.slice(0, 2);
    const validData = filteredData.filter(d => 
      d[xIndicator] != null && !isNaN(d[xIndicator]) && isFinite(d[xIndicator]) &&
      d[yIndicator] != null && !isNaN(d[yIndicator]) && isFinite(d[yIndicator])
    );

    if (validData.length === 0) {
      showErrorMessage('No valid data points for correlation analysis.');
      return;
    }

    const xScale = d3.scaleLinear()
      .domain(d3.extent(validData, d => d[xIndicator]))
      .range([0, width])
      .nice();

    const yScale = d3.scaleLinear()
      .domain(d3.extent(validData, d => d[yIndicator]))
      .range([height, 0])
      .nice();

    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(''))
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(''))
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#64748b');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#64748b');

    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + 60})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text(getIndicatorLabel(xIndicator));

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -80)
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text(getIndicatorLabel(yIndicator));

    g.append('text')
      .attr('x', width / 2)
      .attr('y', -30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', '600')
      .style('fill', '#1e293b')
      .text(`Correlation: ${getIndicatorLabel(xIndicator)} vs ${getIndicatorLabel(yIndicator)}`);

    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain(d3.extent(validData, d => d.year));

    const dots = g.selectAll('.correlation-dot')
      .data(validData)
      .enter().append('circle')
      .attr('class', 'correlation-dot')
      .attr('cx', d => xScale(d[xIndicator]))
      .attr('cy', d => yScale(d[yIndicator]))
      .attr('r', 0)
      .attr('fill', d => colorScale(d.year))
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 8);
        
        showCorrelationTooltip(event, d, xIndicator, yIndicator);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 5);
        
        hideTooltip();
      });

    dots
      .transition()
      .delay((d, i) => i * 30)
      .duration(500)
      .attr('r', 5);

    const correlation = calculateCorrelation(validData, xIndicator, yIndicator);
    if (correlation.slope && isFinite(correlation.slope)) {
      const trendLine = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

      const xDomain = xScale.domain();
      const trendData = [
        { x: xDomain[0], y: correlation.slope * xDomain[0] + correlation.intercept },
        { x: xDomain[1], y: correlation.slope * xDomain[1] + correlation.intercept }
      ];

      g.append('path')
        .datum(trendData)
        .attr('fill', 'none')
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', trendLine)
        .style('opacity', 0)
        .transition()
        .delay(500)
        .duration(500)
        .style('opacity', 0.8);

      const statsPanel = g.append('g')
        .attr('class', 'stats-panel')
        .attr('transform', `translate(${width - 180}, 20)`);

      statsPanel.append('rect')
        .attr('width', 160)
        .attr('height', 100)
        .attr('fill', 'rgba(255, 255, 255, 0.95)')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1)
        .attr('rx', 8);

      statsPanel.append('text')
        .attr('x', 80)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', '#374151')
        .text('Correlation Analysis');

      statsPanel.append('text')
        .attr('x', 10)
        .attr('y', 40)
        .style('font-size', '11px')
        .style('fill', '#6b7280')
        .text(`Correlation: ${correlation.r.toFixed(3)}`);

      statsPanel.append('text')
        .attr('x', 10)
        .attr('y', 55)
        .style('font-size', '11px')
        .style('fill', '#6b7280')
        .text(`R²: ${(correlation.r * correlation.r).toFixed(3)}`);

      statsPanel.append('text')
        .attr('x', 10)
        .attr('y', 70)
        .style('font-size', '11px')
        .style('fill', '#6b7280')
        .text(`Data points: ${validData.length}`);

      const strength = Math.abs(correlation.r) > 0.7 ? 'Strong' : 
                       Math.abs(correlation.r) > 0.4 ? 'Moderate' : 'Weak';
      
      statsPanel.append('text')
        .attr('x', 10)
        .attr('y', 85)
        .style('font-size', '11px')
        .style('fill', '#374151')
        .style('font-weight', '500')
        .text(`${strength} correlation`);
    }

    addYearColorLegend(g, width, height, colorScale, validData);
  };

  const drawEventsChart = () => {
    console.log('Drawing Enhanced Events Chart');
    const svg = d3.select(mainChartRef.current);
    if (!svg.node()) {
      console.error('SVG ref not available for events chart');
      return;
    }
    
    svg.selectAll('*').remove();
    
    const container = svg.node().getBoundingClientRect();
    const margin = { top: 60, right: 60, bottom: 180, left: 80 };
    const width = Math.max(400, container.width - margin.left - margin.right);
    const height = Math.max(300, container.height - margin.top - margin.bottom);
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const koreaData = loadKoreaData();
    if (!koreaData) return;
    
    const filteredData = koreaData.filter(d => {
      const yearValid = d.year >= timeRange[0] && d.year <= timeRange[1];
      const valueValid = selectedIndicators.some(indicator => 
        d[indicator] != null && !isNaN(d[indicator]) && isFinite(d[indicator])
      );
      return yearValid && valueValid;
    }).sort((a, b) => a.year - b.year);
    
    if (filteredData.length === 0) {
      showErrorMessage('No Korea data available for events timeline.');
      return;
    }
    
    const xScale = d3.scaleLinear()
      .domain(timeRange)
      .range([0, width]);
    
    const indicator = selectedIndicators[0];
    const yScale = d3.scaleLinear()
      .domain(d3.extent(filteredData, d => d[indicator]))
      .range([height, 0])
      .nice();

    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(''))
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(''))
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#64748b');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#64748b');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -60)
      .attr('x', -height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text(getIndicatorLabel(indicator));

    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + 40})`)
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text('Year');

    const area = d3.area()
      .x(d => xScale(d.year))
      .y0(height)
      .y1(d => yScale(d[indicator]))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(filteredData)
      .attr('fill', 'url(#backgroundGradient)')
      .attr('opacity', 0.3)
      .attr('d', area);

    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'backgroundGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', height)
      .attr('x2', 0).attr('y2', 0);

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', COLORS.primary)
      .attr('stop-opacity', 0.1);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', COLORS.primary)
      .attr('stop-opacity', 0.4);

    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d[indicator]))
      .curve(d3.curveMonotoneX);

    const mainLine = g.append('path')
      .datum(filteredData)
      .attr('fill', 'none')
      .attr('stroke', COLORS.primary)
      .attr('stroke-width', 3)
      .attr('d', line);

    const totalLength = mainLine.node().getTotalLength();
    mainLine
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);
    
    g.selectAll('.data-point')
      .data(filteredData)
      .enter().append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d[indicator]))
      .attr('r', 0)
      .attr('fill', COLORS.primary)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 6);
        
        showDetailedTooltip(event, d, 'South Korea', indicator);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 4);
        
        hideTooltip();
      })
      .transition()
      .delay((d, i) => i * 50 + 1000)
      .duration(300)
      .attr('r', 4);

    addEnhancedEvents(g, xScale, yScale, height, filteredData, indicator);

    g.append('text')
      .attr('x', width / 2)
      .attr('y', -30)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', '600')
      .style('fill', '#1e293b')
      .text(`South Korea: ${getIndicatorLabel(indicator)} and Historical Events`);

    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 140)
      .attr('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('fill', '#6b7280')
      .text('Click event markers for details • Hover for quick info • Use controls above to explore');
  };

  const addEnhancedEvents = (g, xScale, yScale, height, filteredData, indicator) => {
    const relevantEvents = KOREA_EVENTS.filter(event => 
      event.year >= timeRange[0] && event.year <= timeRange[1]
    );
    
    const eventLevels = [];
    const minEventSpacing = 80;
    
    relevantEvents.forEach((event, index) => {
      const x = xScale(event.year);
      let level = 0;

      while (eventLevels[level] && Math.abs(eventLevels[level] - x) < minEventSpacing) {
        level++;
      }
      eventLevels[level] = x;
      
      const eventY = -60 - (level * 35);
      const dataPoint = filteredData.find(d => d.year === event.year);
      const dataY = dataPoint ? yScale(dataPoint[indicator]) : height / 2;
      
      const eventGroup = g.append('g')
        .attr('class', 'enhanced-event-group')
        .style('cursor', 'pointer')
        .on('click', () => {
          setFocusedEvent(event);
          trackExploration('event_click', { event: event.event, year: event.year });
        })
        .on('mouseover', function(event, d) {
          d3.select(this).select('.event-marker').attr('r', 10);
          d3.select(this).select('.event-label-bg').attr('stroke-width', 2);

          showEventPreview(event, d3.pointer(event, g.node()));
        })
        .on('mouseout', function() {
          d3.select(this).select('.event-marker').attr('r', 7);
          d3.select(this).select('.event-label-bg').attr('stroke-width', 1);
          hideEventPreview();
        });

      eventGroup.append('path')
        .attr('d', createCurvedPath(x, dataY, x, eventY + 20))
        .attr('stroke', getEventColor(event.type))
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('fill', 'none')
        .attr('opacity', 0.6);

      const marker = eventGroup.append('circle')
        .attr('class', 'event-marker')
        .attr('cx', x)
        .attr('cy', eventY)
        .attr('r', 0)
        .attr('fill', getEventColor(event.type))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');

      marker
        .transition()
        .delay(index * 200 + 2000)
        .duration(500)
        .attr('r', 7);

      if (event.year > 2000) {
        marker
          .transition()
          .delay(index * 200 + 3000)
          .duration(1000)
          .attr('r', 10)
          .transition()
          .duration(1000)
          .attr('r', 7);
      }

      const labelText = `${event.year}`;
      const fullLabelText = `${event.year}: ${event.event}`;
      const textWidth = fullLabelText.length * 5;
      
      eventGroup.append('rect')
        .attr('class', 'event-label-bg')
        .attr('x', x - textWidth/2 - 6)
        .attr('y', eventY - 25)
        .attr('width', textWidth + 12)
        .attr('height', 18)
        .attr('fill', 'rgba(255, 255, 255, 0.95)')
        .attr('stroke', getEventColor(event.type))
        .attr('stroke-width', 1)
        .attr('rx', 6)
        .style('filter', 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))');
      
      eventGroup.append('text')
        .attr('class', 'event-label')
        .attr('x', x)
        .attr('y', eventY - 12)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', '600')
        .style('fill', getEventColor(event.type))
        .text(labelText);

      const impactRadius = event.impact === 'major' ? 3 : event.impact === 'moderate' ? 2 : 1;
      eventGroup.append('circle')
        .attr('cx', x + 15)
        .attr('cy', eventY - 15)
        .attr('r', impactRadius)
        .attr('fill', getEventColor(event.type))
        .attr('opacity', 0.6);
    });
  };

  const createCurvedPath = (x1, y1, x2, y2) => {
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} Q ${x1} ${midY} ${x2} ${y2}`;
  };

  const addEnhancedLegend = (g, width, height, legendHeight, comparisonMode, 
                            comparisonCountries, selectedIndicators, countryColorScale, indicatorColorScale) => {
    const legend = g.append('g')
      .attr('class', 'enhanced-legend')
      .attr('transform', `translate(0, ${height + 78})`);

    if (comparisonMode) {
      const itemWidth = 140;
      const itemsPerRow = Math.floor(width / itemWidth);
      
      comparisonCountries.forEach((country, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const x = col * itemWidth;
        const y = row * 44;
        
        const legendItem = legend.append('g')
          .attr('class', 'legend-item')
          .attr('transform', `translate(${x}, ${y})`)
          .style('cursor', 'pointer')
          .on('click', () => {
            toggleCountryVisibility(country);
          });

        legendItem.append('rect')
          .attr('width', 130)
          .attr('height', 25)
          .attr('fill', 'rgba(255, 255, 255, 0.8)')
          .attr('stroke', countryColorScale(index))
          .attr('stroke-width', 1)
          .attr('rx', 4);

        legendItem.append('line')
          .attr('x1', 8)
          .attr('x2', 23)
          .attr('y1', 12)
          .attr('y2', 12)
          .attr('stroke', countryColorScale(index))
          .attr('stroke-width', 3);

        legendItem.append('text')
          .attr('x', 30)
          .attr('y', 16)
          .style('font-size', '11px')
          .style('font-weight', '500')
          .style('fill', '#374151')
          .text(country);
      });
    } else {
      const itemWidth = 180;
      const itemsPerRow = Math.floor(width / itemWidth);
      
      selectedIndicators.forEach((indicator, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const x = col * itemWidth;
        const y = row * 44;
        
        const legendItem = legend.append('g')
          .attr('class', 'legend-item')
          .attr('transform', `translate(${x}, ${y})`)
          .style('cursor', 'pointer')
          .on('click', () => {
            toggleIndicatorVisibility(indicator);
          });

        legendItem.append('rect')
          .attr('width', 170)
          .attr('height', 25)
          .attr('fill', 'rgba(255, 255, 255, 0.8)')
          .attr('stroke', indicatorColorScale(index))
          .attr('stroke-width', 1)
          .attr('rx', 4);

        legendItem.append('line')
          .attr('x1', 8)
          .attr('x2', 23)
          .attr('y1', 12)
          .attr('y2', 12)
          .attr('stroke', indicatorColorScale(index))
          .attr('stroke-width', 3)
          .attr('stroke-dasharray', index > 0 ? '5,5' : 'none');

        legendItem.append('text')
          .attr('x', 30)
          .attr('y', 16)
          .style('font-size', '11px')
          .style('font-weight', '500')
          .style('fill', '#374151')
          .text(INDICATORS.find(i => i.id === indicator)?.name || indicator);
      });
    }
  };

  const addYearColorLegend = (g, width, height, colorScale, data) => {
    const legendGroup = g.append('g')
      .attr('class', 'year-color-legend')
      .attr('transform', `translate(${width - 150}, ${height - 60})`);

    const legendWidth = 120;
    const legendHeight = 10;

    const legendGradient = d3.select('defs').append('linearGradient')
      .attr('id', 'yearLegendGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', legendWidth).attr('y2', 0);

    const yearExtent = d3.extent(data, d => d.year);
    const numStops = 10;
    
    for (let i = 0; i <= numStops; i++) {
      const year = yearExtent[0] + (yearExtent[1] - yearExtent[0]) * i / numStops;
      legendGradient.append('stop')
        .attr('offset', `${i * 100 / numStops}%`)
        .attr('stop-color', colorScale(year));
    }

    legendGroup.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'url(#yearLegendGradient)')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1);

    legendGroup.append('text')
      .attr('x', 0)
      .attr('y', -5)
      .style('font-size', '10px')
      .style('fill', '#6b7280')
      .text(yearExtent[0]);

    legendGroup.append('text')
      .attr('x', legendWidth)
      .attr('y', -5)
      .attr('text-anchor', 'end')
      .style('font-size', '10px')
      .style('fill', '#6b7280')
      .text(yearExtent[1]);

    legendGroup.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text('Years');
  };

  const addExplorationTools = (g, width, height) => {
    const toolsGroup = g.append('g')
      .attr('class', 'exploration-tools')
      .attr('transform', `translate(${width - 120}, 10)`);

    const resetButton = toolsGroup.append('g')
      .attr('class', 'reset-button')
      .style('cursor', 'pointer')
      .on('click', () => {
        resetView();
        trackExploration('reset_view', {});
      });

    resetButton.append('rect')
      .attr('width', 80)
      .attr('height', 25)
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1)
      .attr('rx', 4);

    resetButton.append('text')
      .attr('x', 40)
      .attr('y', 16)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text('Reset View');

    const exportButton = toolsGroup.append('g')
      .attr('class', 'export-button')
      .attr('transform', 'translate(0, 30)')
      .style('cursor', 'pointer')
      .on('click', () => {
        exportChart();
        trackExploration('export_chart', { viewMode });
      });

    exportButton.append('rect')
      .attr('width', 80)
      .attr('height', 25)
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1)
      .attr('rx', 4);

    exportButton.append('text')
      .attr('x', 40)
      .attr('y', 16)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text('Export PNG');
  };

  const addHistoricalEvents = (g, xScale, height) => {
    const relevantEvents = KOREA_EVENTS.filter(event => 
      event.year >= timeRange[0] && event.year <= timeRange[1]
    );

    relevantEvents.forEach((event, index) => {
      const x = xScale(event.year);
      
      const eventGroup = g.append('g')
        .attr('class', 'historical-event')
        .style('cursor', 'pointer')
        .on('click', () => {
          setFocusedEvent(event);
          trackExploration('historical_event_click', event);
        })
        .on('mouseover', function() {
          d3.select(this).select('.event-line').attr('opacity', 0.8);
          d3.select(this).select('.event-marker').attr('r', 6);
        })
        .on('mouseout', function() {
          d3.select(this).select('.event-line').attr('opacity', 0.4);
          d3.select(this).select('.event-marker').attr('r', 4);
        });

      eventGroup.append('line')
        .attr('class', 'event-line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', getEventColor(event.type))
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.4);

      eventGroup.append('circle')
        .attr('class', 'event-marker')
        .attr('cx', x)
        .attr('cy', height + 15)
        .attr('r', 4)
        .attr('fill', getEventColor(event.type))
        .attr('stroke', 'white')
        .attr('stroke-width', 1);

      if (index % Math.max(1, Math.floor(relevantEvents.length / 8)) === 0) {
        eventGroup.append('text')
          .attr('x', x)
          .attr('y', height + 35)
          .attr('text-anchor', 'middle')
          .style('font-size', '9px')
          .style('font-weight', '500')
          .style('fill', getEventColor(event.type))
          .text(event.year);
      }
    });
  };

  const addCustomAnnotation = (year, indicator, text) => {
    const newAnnotation = {
      id: Date.now(),
      year,
      indicator,
      text,
      timestamp: new Date().toISOString()
    };
    
    setCustomAnnotations(prev => [...prev, newAnnotation]);
    trackExploration('custom_annotation', newAnnotation);
  };

  const resetView = () => {
    setTimeRange([1945, 2025]);
    setSelectedIndicators(['vdem_liberal']);
    setComparisonMode(false);
    setComparisonCountries(['South Korea']);
    setViewMode('timeseries');
  };

  const exportChart = () => {
    const svg = viewMode === 'correlation' ? correlationChartRef.current : mainChartRef.current;
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `south-korea-${viewMode}-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleCountryVisibility = (country) => {
    console.log('Toggle country visibility:', country);
  };

  const toggleIndicatorVisibility = (indicator) => {
    console.log('Toggle indicator visibility:', indicator);
  };

  const getIndicatorColor = (indicator) => {
    const colors = {
      'vdem_liberal': '#3b82f6',
      'polity5': '#10b981',
      'freedom_house': '#f59e0b',
      'press_freedom': '#ef4444',
      'surveillance': '#8b5cf6',
      'minority_rights': '#ec4899'
    };
    return colors[indicator] || COLORS.primary;
  };

  const getIndicatorLabel = (indicator) => {
    const indicators = {
      'vdem_liberal': 'V-Dem Liberal Democracy Index',
      'polity5': 'Polity5 Democracy Score',
      'freedom_house': 'Freedom House Score',
      'press_freedom': 'Press Freedom Index',
      'surveillance': 'AI Surveillance Index',
      'minority_rights': 'Minority Rights Index'
    };
    return indicators[indicator] || indicator;
  };

  const getEventColor = (eventType) => {
    const eventColors = {
      'founding': '#3b82f6',
      'authoritarian': '#dc2626',
      'transition': '#f59e0b',
      'resistance': '#7c2d12',
      'democratization': '#10b981',
      'consolidation': '#059669',
      'backslide': '#ef4444',
      'resilience': '#8b5cf6',
      'renewal': '#06b6d4',
      'challenge': '#6b7280'
    };
    return eventColors[eventType] || '#6b7280';
  };

  const calculateCorrelation = (data, xIndicator, yIndicator) => {
    const n = data.length;
    const xValues = data.map(d => d[xIndicator]);
    const yValues = data.map(d => d[yIndicator]);
    
    const xMean = d3.mean(xValues);
    const yMean = d3.mean(yValues);
    
    const numerator = d3.sum(data, d => (d[xIndicator] - xMean) * (d[yIndicator] - yMean));
    const denominator = Math.sqrt(
      d3.sum(data, d => Math.pow(d[xIndicator] - xMean, 2)) *
      d3.sum(data, d => Math.pow(d[yIndicator] - yMean, 2))
    );
    
    const r = denominator === 0 ? 0 : numerator / denominator;

    const xSum = d3.sum(xValues);
    const ySum = d3.sum(yValues);
    const xySum = d3.sum(data, d => d[xIndicator] * d[yIndicator]);
    const x2Sum = d3.sum(data, d => d[xIndicator] * d[xIndicator]);
    
    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;
    
    return { r, slope, intercept };
  };

  const showDetailedTooltip = (event, d, country, indicator) => {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'detailed-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '12px 16px')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', 10002)
      .style('backdrop-filter', 'blur(4px)')
      .html(`
        <div style="font-weight: 600; margin-bottom: 6px; color: #fbbf24;">${country}</div>
        <div style="margin-bottom: 4px;"><strong>Year:</strong> ${d.year}</div>
        <div style="margin-bottom: 4px;"><strong>${getIndicatorLabel(indicator)}:</strong> ${formatValue(d[indicator], indicator)}</div>
        <div style="font-size: 10px; opacity: 0.8; margin-top: 6px;">Click to add annotation</div>
      `);

    tooltip
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  };

  const showCorrelationTooltip = (event, d, xIndicator, yIndicator) => {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'correlation-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '12px 16px')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', 10002)
      .style('backdrop-filter', 'blur(4px)')
      .html(`
        <div style="font-weight: 600; margin-bottom: 6px; color: #fbbf24;">Year ${d.year}</div>
        <div style="margin-bottom: 4px;"><strong>X:</strong> ${formatValue(d[xIndicator], xIndicator)}</div>
        <div style="margin-bottom: 4px;"><strong>Y:</strong> ${formatValue(d[yIndicator], yIndicator)}</div>
        <div style="font-size: 10px; opacity: 0.8; margin-top: 6px;">${getIndicatorLabel(xIndicator)} vs ${getIndicatorLabel(yIndicator)}</div>
      `);

    tooltip
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  };

  const showEventPreview = (event, [x, y]) => {
    const preview = d3.select('body').append('div')
      .attr('class', 'event-preview')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '11px')
      .style('pointer-events', 'none')
      .style('z-index', 10003)
      .style('max-width', '200px')
      .html(`
        <div style="font-weight: 600; color: ${getEventColor(event.type)};">${event.year}: ${event.event}</div>
        <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">Click for details</div>
      `);

    preview
      .style('left', (x + 100) + 'px')
      .style('top', (y - 20) + 'px');
  };

  const hideTooltip = () => {
    d3.selectAll('.detailed-tooltip, .correlation-tooltip').remove();
  };

  const hideEventPreview = () => {
    d3.selectAll('.event-preview').remove();
  };
  
  const showErrorMessage = (message) => {
    const svg = d3.select(mainChartRef.current);
    if (!svg.node()) return;
    
    svg.selectAll('*').remove();
    
    const container = svg.node().getBoundingClientRect();
    const centerX = container.width / 2;
    const centerY = container.height / 2;
    
    const errorGroup = svg.append('g')
      .attr('class', 'error-message-group');
    
    errorGroup.append('text')
      .attr('x', centerX)
      .attr('y', centerY - 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '48px')
      .style('fill', '#ef4444')
      .text('⚠️');

    errorGroup.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('fill', '#374151')
      .style('font-weight', '600')
      .text(message);
    
    errorGroup.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 35)
      .attr('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('fill', '#6b7280')
      .text('Try adjusting your settings or return to the guided story.');

    const backButton = errorGroup.append('g')
      .attr('class', 'back-to-stem-button')
      .attr('transform', `translate(${centerX - 50}, ${centerY + 60})`)
      .style('cursor', 'pointer')
      .on('click', onBackToStem);

    backButton.append('rect')
      .attr('width', 100)
      .attr('height', 30)
      .attr('fill', COLORS.primary)
      .attr('rx', 6);

    backButton.append('text')
      .attr('x', 50)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'white')
      .style('font-weight', '500')
      .text('Back to Story');
  };

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      opacity: transitionState === 'transitioning' ? 0.7 : 1,
      transition: 'opacity 0.3s ease-out'
    }}>
      <ExplorationControls
        selectedIndicators={selectedIndicators}
        setSelectedIndicators={setSelectedIndicators}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        comparisonMode={comparisonMode}
        setComparisonMode={setComparisonMode}
        comparisonCountries={comparisonCountries}
        setComparisonCountries={setComparisonCountries}
        viewMode={viewMode}
        setViewMode={setViewMode}
        data={data}
        transitionState={transitionState}
        onTrackExploration={trackExploration}
      />

      <div style={{ flex: 1, padding: '16px', position: 'relative' }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 1000
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #e5e7eb',
              borderTop: '2px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ fontSize: '14px', color: '#374151' }}>Loading...</span>
          </div>
        )}

        {(viewMode === 'timeseries' || viewMode === 'events') && (
          <svg
            ref={mainChartRef}
            width="100%"
            height="500px"
            style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              overflow: 'visible',
              background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)',
              marginBottom: '60px'
            }}
          />
        )}
        
        {viewMode === 'correlation' && (
          <svg
            ref={correlationChartRef}
            width="100%"
            height="450px"
            style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)',
              marginBottom: '60px'
            }}
          />
        )}
      </div>

      {focusedEvent && (
        <EventDetailsPanel
          event={focusedEvent}
          onClose={() => setFocusedEvent(null)}
          onTrackExploration={trackExploration}
        />
      )}

      {false && explorationPath.length > 0 && (
        <ExplorationSummary
          explorationPath={explorationPath}
          onClearPath={() => setExplorationPath([])}
        />
      )}
    </div>
  );
};

const ExplorationControls = ({
  selectedIndicators,
  setSelectedIndicators,
  timeRange,
  setTimeRange,
  comparisonMode,
  setComparisonMode,
  comparisonCountries,
  setComparisonCountries,
  viewMode,
  setViewMode,
  data,
  transitionState,
  onTrackExploration
}) => {
  const availableCountries = ['South Korea', 'United States', 'Germany', 'Japan', 'China', 'Russia', 'Brazil', 'India'];
  
  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    onTrackExploration('view_mode_change', { from: viewMode, to: newMode });
  };

  const handleIndicatorChange = (indicator, checked) => {
    let newIndicators;
    if (checked) {
      newIndicators = [...selectedIndicators, indicator];
    } else {
      newIndicators = selectedIndicators.filter(id => id !== indicator);
    }
    setSelectedIndicators(newIndicators);
    onTrackExploration('indicator_change', { indicator, checked, total: newIndicators.length });
  };

  return (
    <div style={{ 
      padding: '20px 24px', 
      borderBottom: '1px solid #e5e7eb',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      opacity: transitionState === 'transitioning' ? 0.7 : 1,
      transition: 'opacity 0.3s ease-out'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          fontSize: '15px', 
          fontWeight: '600', 
          marginBottom: '12px', 
          display: 'block',
          color: '#1e293b'
        }}>
          🔍 Analysis Mode
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'timeseries', label: 'Time Series', icon: '📈', desc: 'Track changes over time' },
            { id: 'correlation', label: 'Correlation', icon: '🔗', desc: 'Find relationships' },
            { id: 'events', label: 'Events Focus', icon: '📍', desc: 'Historical context' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => handleViewModeChange(mode.id)}
              disabled={transitionState === 'transitioning'}
              title={mode.desc}
              style={{
                padding: '10px 16px',
                background: viewMode === mode.id ? 
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                  'white',
                color: viewMode === mode.id ? 'white' : '#374151',
                border: '1px solid ' + (viewMode === mode.id ? 'transparent' : '#d1d5db'),
                borderRadius: '8px',
                cursor: transitionState === 'transitioning' ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                opacity: transitionState === 'transitioning' ? 0.5 : 1,
                boxShadow: viewMode === mode.id ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
              }}
              onMouseOver={(e) => {
                if (viewMode !== mode.id && transitionState !== 'transitioning') {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#9ca3af';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseOut={(e) => {
                if (viewMode !== mode.id) {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              <span style={{ marginRight: '6px' }}>{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <label style={{ 
            fontSize: '15px', 
            fontWeight: '600', 
            marginBottom: '12px', 
            display: 'block',
            color: '#1e293b'
          }}>
            📊 Democracy Indicators
          </label>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '8px'
          }}>
            {INDICATORS.map(indicator => (
              <label key={indicator.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '8px 12px',
                background: selectedIndicators.includes(indicator.id) ? 
                  'rgba(102, 126, 234, 0.1)' : 
                  'rgba(255, 255, 255, 0.8)',
                border: '1px solid ' + (selectedIndicators.includes(indicator.id) ? 
                  '#667eea' : '#e5e7eb'),
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!selectedIndicators.includes(indicator.id)) {
                  e.target.style.background = 'rgba(255, 255, 255, 1)';
                  e.target.style.borderColor = '#d1d5db';
                }
              }}
              onMouseOut={(e) => {
                if (!selectedIndicators.includes(indicator.id)) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.target.style.borderColor = '#e5e7eb';
                }
              }}
              >
                <input
                  type="checkbox"
                  checked={selectedIndicators.includes(indicator.id)}
                  onChange={(e) => handleIndicatorChange(indicator.id, e.target.checked)}
                  style={{ 
                    marginRight: '8px',
                    accentColor: '#667eea'
                  }}
                />
                <span style={{ fontWeight: '500' }}>{indicator.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '250px' }}>
          <label style={{ 
            fontSize: '15px', 
            fontWeight: '600', 
            marginBottom: '12px', 
            display: 'block',
            color: '#1e293b'
          }}>
            ⏱️ Time Period: {timeRange[0]} - {timeRange[1]}
          </label>
          <div style={{ 
            background: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                Start Year: {timeRange[0]}
              </label>
              <input
                type="range"
                min={1945}
                max={2023}
                value={timeRange[0]}
                onChange={(e) => {
                  const newRange = [parseInt(e.target.value), timeRange[1]];
                  setTimeRange(newRange);
                  onTrackExploration('time_range_change', { range: newRange });
                }}
                style={{ 
                  width: '100%',
                  accentColor: '#667eea'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                End Year: {timeRange[1]}
              </label>
              <input
                type="range"
                min={1946}
                max={2025}
                value={timeRange[1]}
                onChange={(e) => {
                  const newRange = [timeRange[0], parseInt(e.target.value)];
                  setTimeRange(newRange);
                  onTrackExploration('time_range_change', { range: newRange });
                }}
                style={{ 
                  width: '100%',
                  accentColor: '#667eea'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '250px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            fontSize: '15px', 
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '12px',
            color: '#1e293b'
          }}>
            <input
              type="checkbox"
              checked={comparisonMode}
              onChange={(e) => {
                setComparisonMode(e.target.checked);
                onTrackExploration('comparison_mode_toggle', { enabled: e.target.checked });
              }}
              style={{ marginRight: '8px', accentColor: '#667eea' }}
            />
            🌍 Country Comparison
          </label>
          
          {comparisonMode && (
            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <select
                multiple
                value={comparisonCountries}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setComparisonCountries(selected);
                  onTrackExploration('comparison_countries_change', { countries: selected });
                }}
                style={{
                  width: '100%',
                  height: '120px',
                  fontSize: '13px',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db'
                }}
              >
                {availableCountries.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                Hold Ctrl/Cmd to select multiple countries
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EventDetailsPanel = ({ event, onClose, onTrackExploration }) => (
  <div style={{
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    width: '350px',
    background: 'white',
    border: '2px solid ' + getEventColor(event.type),
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    zIndex: 10001,
    animation: 'slideInRight 0.3s ease-out'
  }}>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start',
      marginBottom: '16px'
    }}>
      <div>
        <h4 style={{ 
          margin: '0 0 4px 0', 
          fontSize: '18px', 
          fontWeight: '600',
          color: '#1e293b'
        }}>
          {event.event}
        </h4>
        <div style={{ 
          fontSize: '14px', 
          color: getEventColor(event.type),
          fontWeight: '500'
        }}>
          {event.year} • {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
        </div>
      </div>
      <button
        onClick={() => {
          onClose();
          onTrackExploration('event_details_close', { event: event.event });
        }}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: '#6b7280',
          padding: '4px',
          borderRadius: '4px',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.background = '#f3f4f6';
          e.target.style.color = '#374151';
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'none';
          e.target.style.color = '#6b7280';
        }}
      >
        ×
      </button>
    </div>
    
    <p style={{ 
      margin: '0 0 16px 0', 
      fontSize: '14px', 
      lineHeight: 1.6,
      color: '#374151'
    }}>
      {event.description}
    </p>

    {event.impact && (
      <div style={{
        padding: '12px',
        background: '#f8fafc',
        borderRadius: '6px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
          Historical Impact
        </div>
        <div style={{ fontSize: '13px', color: '#374151' }}>
          {event.impact === 'major' ? '🔴 Major' : event.impact === 'moderate' ? '🟡 Moderate' : '🟢 Minor'} impact on democratic development
        </div>
      </div>
    )}
  </div>
);

const ExplorationSummary = ({ explorationPath, onClearPath }) => (
  <div style={{
    position: 'absolute',
    top: '20px',
    left: '20px',
    maxWidth: '250px',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '11px',
    color: '#6b7280',
    zIndex: 1000
  }}>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '8px'
    }}>
      <span style={{ fontWeight: '600', color: '#374151' }}>
        Exploration Path ({explorationPath.length})
      </span>
      <button
        onClick={onClearPath}
        style={{
          background: 'none',
          border: 'none',
          color: '#6b7280',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Clear
      </button>
    </div>
    
    <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
      {explorationPath.slice(-5).map((step, index) => (
        <div key={step.timestamp} style={{ marginBottom: '4px' }}>
          {step.action.replace(/_/g, ' ')}
        </div>
      ))}
    </div>
  </div>
);

const getEventColor = (eventType) => {
  const eventColors = {
    'founding': '#3b82f6',
    'authoritarian': '#dc2626',
    'transition': '#f59e0b',
    'resistance': '#7c2d12',
    'democratization': '#10b981',
    'consolidation': '#059669',
    'backslide': '#ef4444',
    'resilience': '#8b5cf6',
    'renewal': '#06b6d4',
    'challenge': '#6b7280'
  };
  return eventColors[eventType] || '#6b7280';
};

export default GlassPhase;