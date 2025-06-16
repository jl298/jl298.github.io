import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  getDataForYear, 
  filterDataByRegions, 
  getDemocracyColor,
  formatValue,
  classifyDemocracyLevel 
} from '../utils/dataLoader';

const WorldMap = ({ data, state, onCountryClick, sidebarVisible }) => {
  const svgRef = useRef();
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

  const adjustTooltipPosition = (x, y, tooltipWidth = 300, tooltipHeight = 180) => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    let adjustedX = x;
    let adjustedY = y;
    
    if (x + tooltipWidth > viewport.width) {
      adjustedX = x - tooltipWidth - 20;
    }
    if (adjustedX < 0) {
      adjustedX = 10;
    }
    
    if (y + tooltipHeight > viewport.height) {
      adjustedY = y - tooltipHeight - 20;
    }
    if (adjustedY < 0) {
      adjustedY = 10;
    }
    
    return { x: adjustedX, y: adjustedY };
  };

  useEffect(() => {
    if (!data || !data.countries) return;

    let yearData = getDataForYear(data.countries, state.selectedYear);
    yearData = filterDataByRegions(yearData, state.activeRegions);

    drawMap(yearData);
  }, [data, state, sidebarVisible]);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        if (data && data.countries) {
          let yearData = getDataForYear(data.countries, state.selectedYear);
          yearData = filterDataByRegions(yearData, state.activeRegions);
          drawMap(yearData);
        }
      }, 100);
    });

    const container = svgElement.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      if (container) {
        resizeObserver.unobserve(container);
      }
    };
  }, [data, state]);

  const drawMap = (chartData) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svg.node().getBoundingClientRect();
    const width = container.width;
    const height = container.height;

    if (!chartData || chartData.length === 0) {
      svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#f8fafc');

      const messageGroup = svg.append('g')
        .attr('transform', `translate(${width/2}, ${height/2})`);

      messageGroup.append('circle')
        .attr('r', 60)
        .attr('fill', '#e5e7eb')
        .attr('stroke', '#d1d5db')
        .attr('stroke-width', 2);

      messageGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-10')
        .style('font-size', '16px')
        .style('font-weight', '600')
        .style('fill', '#64748b')
        .text('No Data Available');

      messageGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '10')
        .style('font-size', '14px')
        .style('fill', '#9ca3af')
        .text(`for ${state.selectedYear}`);

      messageGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '30')
        .style('font-size', '12px')
        .style('fill', '#9ca3af')
        .text('Try selecting a different year');

      return;
    }

    const regions = [
      { name: 'Europe', x: sidebarVisible ? 280 : 320, y: sidebarVisible ? 100 : 110, width: sidebarVisible ? 120 : 140, height: sidebarVisible ? 80 : 90, region: 'Europe' },
      { name: 'Asia', x: sidebarVisible ? 400 : 480, y: sidebarVisible ? 80 : 90, width: sidebarVisible ? 180 : 220, height: sidebarVisible ? 120 : 140, region: 'Asia' },
      { name: 'Africa', x: sidebarVisible ? 250 : 280, y: sidebarVisible ? 180 : 210, width: sidebarVisible ? 100 : 120, height: sidebarVisible ? 140 : 160, region: 'Africa' },
      { name: 'Americas', x: sidebarVisible ? 80 : 100, y: sidebarVisible ? 120 : 140, width: sidebarVisible ? 140 : 170, height: sidebarVisible ? 180 : 210, region: 'Americas' },
      { name: 'Oceania', x: sidebarVisible ? 520 : 620, y: sidebarVisible ? 220 : 260, width: sidebarVisible ? 80 : 100, height: sidebarVisible ? 60 : 80, region: 'Oceania' },
      { name: 'Middle East', x: sidebarVisible ? 320 : 380, y: sidebarVisible ? 160 : 180, width: sidebarVisible ? 80 : 100, height: sidebarVisible ? 60 : 80, region: 'Middle East' }
    ];

    const regionData = new Map();
    chartData.forEach(d => {
      if (!regionData.has(d.region)) {
        regionData.set(d.region, []);
      }
      regionData.get(d.region).push(d);
    });

    const primaryIndicator = state.activeIndicators[0] || 'vdem_liberal';

    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#e0f2fe');

    const regionGroups = svg.selectAll('.region')
      .data(regions)
      .enter().append('g')
      .attr('class', 'region');

    regionGroups.each(function(regionInfo) {
      const countries = regionData.get(regionInfo.region) || [];
      if (countries.length === 0) return;

      const avgScore = d3.mean(countries, d => d[primaryIndicator]) || 0;
      const regionColor = getDemocracyColor(avgScore, primaryIndicator);

      const group = d3.select(this);

      group.append('rect')
        .attr('x', regionInfo.x)
        .attr('y', regionInfo.y)
        .attr('width', regionInfo.width)
        .attr('height', regionInfo.height)
        .attr('fill', regionColor)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('opacity', 0.8)
        .style('cursor', 'pointer');

      group.append('text')
        .attr('x', regionInfo.x + regionInfo.width / 2)
        .attr('y', regionInfo.y + regionInfo.height / 2)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', sidebarVisible ? '12px' : '14px')
        .style('font-weight', '600')
        .style('fill', '#fff')
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)')
        .style('pointer-events', 'none')
        .text(regionInfo.name);

      const countryDots = group.selectAll('.country-dot')
        .data(countries.slice(0, 8))
        .enter().append('circle')
        .attr('class', 'country-dot')
        .attr('cx', (d, i) => {
          const cols = Math.ceil(Math.sqrt(countries.length));
          const col = i % cols;
          return regionInfo.x + 15 + (col * (regionInfo.width - 30) / (cols - 1 || 1));
        })
        .attr('cy', (d, i) => {
          const cols = Math.ceil(Math.sqrt(countries.length));
          const row = Math.floor(i / cols);
          const rows = Math.ceil(countries.length / cols);
          return regionInfo.y + 15 + (row * (regionInfo.height - 30) / (rows - 1 || 1));
        })
        .attr('r', sidebarVisible ? 4 : 5)
        .attr('fill', d => getDemocracyColor(d[primaryIndicator], primaryIndicator))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('opacity', d => state.selectedCountries.length === 0 || state.selectedCountries.includes(d.country) ? 1 : 0.3)
        .style('cursor', 'pointer');

      countryDots
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('r', 6)
            .attr('stroke-width', 2);

          const tooltipContent = `
            <div style="font-weight: 600; color: #f39c12; margin-bottom: 8px;">${d.country}</div>
            <div><strong>Region:</strong> ${d.region}</div>
            <div><strong>Year:</strong> ${d.year}</div>
            <div style="margin-top: 8px;">
              <div><strong>V-Dem Liberal Democracy:</strong> ${formatValue(d.vdem_liberal, 'vdem_liberal')}</div>
              <div><strong>Freedom House:</strong> ${formatValue(d.freedom_house, 'freedom_house')}</div>
              <div><strong>Polity5:</strong> ${formatValue(d.polity5, 'polity5')}</div>
            </div>
            <div style="margin-top: 8px;">
              <div><strong>Classification:</strong> ${getClassificationText(d[primaryIndicator], primaryIndicator)}</div>
            </div>
          `;

          const adjustedPos = adjustTooltipPosition(event.pageX + 10, event.pageY - 10);
          
          setTooltip({
            visible: true,
            x: adjustedPos.x,
            y: adjustedPos.y,
            content: tooltipContent
          });
        })
        .on('mousemove', function(event) {
          const adjustedPos = adjustTooltipPosition(event.pageX + 10, event.pageY - 10);
          setTooltip(prev => ({
            ...prev,
            x: adjustedPos.x,
            y: adjustedPos.y
          }));
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('r', 4)
            .attr('stroke-width', 1);

          setTooltip({ visible: false, x: 0, y: 0, content: '' });
        })
        .on('click', function(event, d) {
          event.stopPropagation();
          if (onCountryClick) {
            const currentSelection = state.selectedCountries;
            const isSelected = currentSelection.includes(d.country);
            
            if (isSelected) {
              onCountryClick(currentSelection.filter(c => c !== d.country));
            } else {
              onCountryClick([...currentSelection, d.country]);
            }
          }
        });

      group.select('rect')
        .on('click', function() {
          if (onCountryClick) {
            const regionCountries = countries.map(d => d.country);
            const currentSelection = state.selectedCountries;
            const allSelected = regionCountries.every(country => 
              currentSelection.includes(country)
            );
            
            if (allSelected) {
              onCountryClick(currentSelection.filter(c => !regionCountries.includes(c)));
            } else {
              const newSelection = [
                ...currentSelection.filter(c => !regionCountries.includes(c)),
                ...regionCountries
              ];
              onCountryClick(newSelection);
            }
          }
        })
        .on('mouseover', function(event) {
          const avgScore = d3.mean(countries, d => d[primaryIndicator]) || 0;
          const tooltipContent = `
            <div style="font-weight: 600; color: #f39c12; margin-bottom: 8px;">${regionInfo.name}</div>
            <div><strong>Number of Countries:</strong> ${countries.length}</div>
            <div><strong>Average ${getIndicatorName(primaryIndicator)}:</strong> ${formatValue(avgScore, primaryIndicator)}</div>
            <div style="margin-top: 8px;">
              <div style="font-size: 12px; opacity: 0.9;">Click to select/deselect entire region</div>
            </div>
          `;

          const adjustedPos = adjustTooltipPosition(event.pageX + 10, event.pageY - 10);
          
          setTooltip({
            visible: true,
            x: adjustedPos.x,
            y: adjustedPos.y,
            content: tooltipContent
          });
        })
        .on('mouseout', function() {
          setTooltip({ visible: false, x: 0, y: 0, content: '' });
        });
    });

    const legendData = [
      { label: 'High Democracy', color: getDemocracyColor(0.8, 'vdem_liberal') },
      { label: 'Medium Level', color: getDemocracyColor(0.5, 'vdem_liberal') },
      { label: 'Low Democracy', color: getDemocracyColor(0.2, 'vdem_liberal') },
      { label: 'No Data', color: '#95a5a6' }
    ];

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${sidebarVisible ? 20 : 30}, ${sidebarVisible ? 20 : 25})`);

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * (sidebarVisible ? 25 : 30)})`);

    legendItems.append('rect')
      .attr('width', sidebarVisible ? 16 : 20)
      .attr('height', sidebarVisible ? 16 : 20)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    legendItems.append('text')
      .attr('x', sidebarVisible ? 22 : 28)
      .attr('y', sidebarVisible ? 8 : 10)
      .attr('dy', '0.35em')
      .style('font-size', sidebarVisible ? '12px' : '14px')
      .style('fill', '#374151')
      .style('font-weight', '500')
      .text(d => d.label);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', sidebarVisible ? '14px' : '16px')
      .style('font-weight', '600')
      .style('fill', '#1e293b')
      .text(`Global ${getIndicatorName(primaryIndicator)} Distribution in ${state.selectedYear}`);
  };

  const getIndicatorName = (indicator) => {
    switch (indicator) {
      case 'polity5': return 'Polity5 Score';
      case 'vdem_liberal': return 'Liberal Democracy Index';
      case 'freedom_house': return 'Freedom House Score';
      case 'press_freedom': return 'Press Freedom Index';
      case 'surveillance': return 'Surveillance Index';
      case 'minority_rights': return 'Minority Rights';
      default: return 'Democracy Index';
    }
  };

  const getClassificationText = (value, indicator) => {
    const level = classifyDemocracyLevel(value, indicator);
    switch (level) {
      case 'democracy':
      case 'high':
        return 'Democracy';
      case 'anocracy':
      case 'medium':
        return 'Mixed System';
      case 'autocracy':
      case 'low':
        return 'Authoritarianism';
      case 'free':
        return 'Free';
      case 'partly_free':
        return 'Partly Free';
      case 'not_free':
        return 'Not Free';
      default:
        return 'Unclassified';
    }
  };

  return (
    <>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ minHeight: '350px' }}
      />
      
      {tooltip.visible && (
        <div
          className="tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.4',
            pointerEvents: 'none',
            zIndex: 1000,
            maxWidth: '300px',
            minWidth: '180px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </>
  );
};

export default WorldMap;
