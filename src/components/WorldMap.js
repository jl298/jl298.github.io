import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  getDataForYear, 
  filterDataByRegions, 
  getDemocracyColor,
  formatValue,
  classifyDemocracyLevel 
} from '../utils/realDataLoader';
import { COLORS } from '../utils/constants';

const WorldMap = ({ data, state, onCountryClick }) => {
  const svgRef = useRef();
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

  useEffect(() => {
    if (!data || !data.countries) return;

    let yearData = getDataForYear(data.countries, state.selectedYear);
    yearData = filterDataByRegions(yearData, state.activeRegions);

    drawMap(yearData);
  }, [data, state]);

  const drawMap = (chartData) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!chartData || chartData.length === 0) {
      svg.append('text')
        .attr('x', '50%')
        .attr('y', '45%')
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .style('font-size', '16px')
        .style('font-weight', '500')
        .text(`No data available for ${state.selectedYear}`);
      
      svg.append('text')
        .attr('x', '50%')
        .attr('y', '55%')
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .style('font-size', '14px')
        .text('Most data is available from 2000 onwards');
      return;
    }

    const container = svg.node().getBoundingClientRect();
    const width = container.width;
    const height = container.height;

    const regions = [
      { name: 'Europe', x: 280, y: 100, width: 120, height: 80, region: 'Europe' },
      { name: 'Asia', x: 400, y: 80, width: 180, height: 120, region: 'Asia' },
      { name: 'Africa', x: 250, y: 180, width: 100, height: 140, region: 'Africa' },
      { name: 'Americas', x: 80, y: 120, width: 140, height: 180, region: 'Americas' },
      { name: 'Oceania', x: 520, y: 220, width: 80, height: 60, region: 'Oceania' },
      { name: 'Middle East', x: 320, y: 160, width: 80, height: 60, region: 'Middle East' }
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
        .style('font-size', '12px')
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
        .attr('r', 4)
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
            <div style="font-weight: 600; color: #fbbf24; margin-bottom: 8px;">${d.country}</div>
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

          setTooltip({
            visible: true,
            x: event.pageX + 10,
            y: event.pageY - 10,
            content: tooltipContent
          });
        })
        .on('mousemove', function(event) {
          setTooltip(prev => ({
            ...prev,
            x: event.pageX + 10,
            y: event.pageY - 10
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
            <div style="font-weight: 600; color: #fbbf24; margin-bottom: 8px;">${regionInfo.name}</div>
            <div><strong>Number of Countries:</strong> ${countries.length}</div>
            <div><strong>Average ${getIndicatorName(primaryIndicator)}:</strong> ${formatValue(avgScore, primaryIndicator)}</div>
            <div style="margin-top: 8px;">
              <div style="font-size: 12px; opacity: 0.9;">Click to select/deselect entire region</div>
            </div>
          `;

          setTooltip({
            visible: true,
            x: event.pageX + 10,
            y: event.pageY - 10,
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
      { label: 'No Data', color: '#e5e7eb' }
    ];

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(20, 20)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`);

    legendItems.append('rect')
      .attr('width', 16)
      .attr('height', 16)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    legendItems.append('text')
      .attr('x', 22)
      .attr('y', 8)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#374151')
      .style('font-weight', '500')
      .text(d => d.label);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
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
            maxWidth: '240px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </>
  );
};

export default WorldMap;
