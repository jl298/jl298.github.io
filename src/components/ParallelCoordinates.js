import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  getDataForYear, 
  filterDataByRegions, 
  filterDataByCountries,
  formatValue 
} from '../utils/realDataLoader';
import { COLORS, INDICATORS } from '../utils/constants';

const ParallelCoordinates = ({ data, state, onCountryHighlight }) => {
  const svgRef = useRef();
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
  const [highlightedCountries, setHighlightedCountries] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    if (!data || !data.countries) return;

    let yearData = getDataForYear(data.countries, state.selectedYear);
    yearData = filterDataByRegions(yearData, state.activeRegions);
    
    if (state.selectedCountries.length > 0) {
      yearData = filterDataByCountries(yearData, state.selectedCountries);
    }

    drawChart(yearData);
  }, [data, state, highlightedCountries]);

  const drawChart = (chartData) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    console.log('🔧 [IMPROVED PARALLEL] Enhanced ParallelCoordinates Debugging:');
    console.log('=====================================');
    console.log('  Selected year:', state.selectedYear);
    console.log('  Input data count:', chartData?.length || 0);

    if (!chartData || chartData.length === 0) {
      svg.append('text')
        .attr('x', '50%')
        .attr('y', '45%')
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .style('font-size', '16px')
        .style('font-weight', '500')
        .text(`No data available for ${state.selectedYear}`);
      return;
    }

    const container = svg.node().getBoundingClientRect();
    const margin = { top: 30, right: 10, bottom: 60, left: 10 };
    const width = container.width - margin.left - margin.right;
    const height = container.height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const allDimensions = [
      { key: 'vdem_liberal', name: 'Liberal Democracy', format: d3.format('.2f'), required: false },
      { key: 'polity5', name: 'Polity5', format: d3.format('.1f'), required: false },
      { key: 'freedom_house', name: 'Freedom House', format: d3.format('.0f'), required: true },
      { key: 'press_freedom', name: 'Press Freedom', format: d3.format('.0f'), required: false },
      { key: 'surveillance', name: 'Surveillance Index', format: d3.format('.0f'), required: false },
      { key: 'minority_rights', name: 'Minority Rights', format: d3.format('.2f'), required: false }
    ];

    const dimensionStats = allDimensions.map(dim => {
      const validCount = chartData.filter(d => d[dim.key] != null && !isNaN(d[dim.key])).length;
      const percentage = (validCount / chartData.length) * 100;
      return {
        ...dim,
        validCount,
        percentage,
        hasData: validCount > 0
      };
    });

    console.log('📊 Data availability by dimension:');
    dimensionStats.forEach(stat => {
      console.log(`  ${stat.name}: ${stat.validCount}/${chartData.length} (${stat.percentage.toFixed(1)}%)`);
    });

    const dimensions = dimensionStats.filter(dim => dim.hasData);
    
    if (dimensions.length < 2) {
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .style('font-size', '16px')
        .text('Insufficient indicators to display');
      return;
    }

    console.log('  Dimensions to use:', dimensions.map(d => d.name).join(', '));

    const validData = chartData.filter(d => {
      const hasRequiredData = dimensions
        .filter(dim => dim.required)
        .every(dim => d[dim.key] != null && !isNaN(d[dim.key]));
      
      if (!hasRequiredData) return false;

      const validCount = dimensions.filter(dim => 
        d[dim.key] != null && !isNaN(d[dim.key])
      ).length;
      
      const validRatio = validCount / dimensions.length;
      return validRatio >= 0.3;
    });

    console.log('🎯 Filtering results:');
    console.log(`  validData: ${validData.length}/${chartData.length} (${(validData.length/chartData.length*100).toFixed(1)}%)`);

    const koreaData = validData.filter(d => d.country === 'South Korea');
    console.log(`  Korea included: ${koreaData.length > 0 ? '✅' : '❌'}`);
    if (koreaData.length > 0) {
      console.log('  Korea data:', {
        country: koreaData[0].country,
        year: koreaData[0].year,
        available_indicators: dimensions.filter(dim => 
          koreaData[0][dim.key] != null && !isNaN(koreaData[0][dim.key])
        ).map(dim => dim.name)
      });
    }

    console.log('=====================================');

    if (validData.length === 0) {
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2 - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .style('font-size', '16px')
        .style('font-weight', '500')
        .text(`No valid data available for ${state.selectedYear}`);
      return;
    }

    const y = {};
    dimensions.forEach(dim => {
      const values = validData.map(d => d[dim.key]).filter(v => v != null && !isNaN(v));
      if (values.length > 0) {
        y[dim.key] = d3.scaleLinear()
          .domain(d3.extent(values))
          .range([height, 0])
          .nice();
      }
    });

    const x = d3.scalePoint()
      .range([0, width])
      .padding(0.1)
      .domain(dimensions.map(d => d.key));

    const colorScale = d3.scaleOrdinal()
      .domain(['Europe', 'Asia', 'Africa', 'Americas', 'Oceania', 'Middle East'])
      .range([
        COLORS.regions.Europe,
        COLORS.regions.Asia,
        COLORS.regions.Africa,
        COLORS.regions.Americas,
        COLORS.regions.Oceania,
        COLORS.regions['Middle East']
      ]);

    const line = d3.line()
      .defined(d => !isNaN(d[1]))
      .x(d => x(d[0]))
      .y(d => y[d[0]](d[1]))
      .curve(d3.curveCardinal);

    const background = g.append('g')
      .attr('class', 'background');

    background.selectAll('path')
      .data(validData)
      .enter().append('path')
      .attr('d', d => {
        const pathData = dimensions
          .map(dim => [dim.key, d[dim.key]])
          .filter(point => point[1] != null && !isNaN(point[1]));
        return line(pathData);
      })
      .style('fill', 'none')
      .style('stroke', '#e5e7eb')
      .style('stroke-width', 1)
      .style('opacity', 0.3);

    const foreground = g.append('g')
      .attr('class', 'foreground');

    const paths = foreground.selectAll('path')
      .data(validData)
      .enter().append('path')
      .attr('class', 'country-path')
      .attr('d', d => {
        const pathData = dimensions
          .map(dim => [dim.key, d[dim.key]])
          .filter(point => point[1] != null && !isNaN(point[1]));
        return line(pathData);
      })
      .style('fill', 'none')
      .style('stroke', d => colorScale(d.region))
      .style('stroke-width', 2)
      .style('opacity', d => {
        if (state.selectedCountries.length === 0) return 0.6;
        return state.selectedCountries.includes(d.country) ? 0.8 : 0.2;
      })
      .style('cursor', 'pointer');

    if (koreaData.length > 0) {
      paths.filter(d => d.country === 'South Korea')
        .style('stroke', '#fbbf24')
        .style('stroke-width', 3)
        .style('opacity', 0.9);
    }

    paths
      .on('mouseover', function(event, d) {
        d3.select(this)
          .style('stroke-width', 4)
          .style('opacity', 1);

        paths.filter(data => data.country !== d.country)
          .style('opacity', 0.1);

        setHighlightedCountries([d.country]);

        const tooltipContent = `
          <div style="font-weight: 600; color: #fbbf24; margin-bottom: 8px;">${d.country}</div>
          <div><strong>Region:</strong> ${d.region}</div>
          <div><strong>Year:</strong> ${d.year}</div>
          <div style="margin-top: 8px;">
            ${dimensions.map(dim => {
              const value = d[dim.key];
              if (value != null && !isNaN(value)) {
                return `<div><strong>${dim.name}:</strong> ${dim.format(value)}</div>`;
              }
              return `<div style="color: #9ca3af;"><strong>${dim.name}:</strong> No data</div>`;
            }).join('')}
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: #9ca3af;">
            <strong>Data Sources:</strong> ${d.sources?.join(', ') || 'Unknown'}
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
        paths
          .style('stroke-width', d => {
            if (d.country === 'South Korea') return 3;
            return 2;
          })
          .style('opacity', d => {
            if (state.selectedCountries.length === 0) {
              return d.country === 'South Korea' ? 0.9 : 0.6;
            }
            return state.selectedCountries.includes(d.country) ? 0.8 : 0.2;
          });

        setHighlightedCountries([]);
        setTooltip({ visible: false, x: 0, y: 0, content: '' });
      })
      .on('click', function(event, d) {
        if (onCountryHighlight) {
          const currentSelection = state.selectedCountries;
          const isSelected = currentSelection.includes(d.country);
          
          if (isSelected) {
            onCountryHighlight(currentSelection.filter(c => c !== d.country));
          } else {
            onCountryHighlight([...currentSelection, d.country]);
          }
        }
      });

    const axes = g.selectAll('.axis')
      .data(dimensions)
      .enter().append('g')
      .attr('class', 'axis')
      .attr('transform', d => `translate(${x(d.key)}, 0)`);

    axes.append('line')
      .attr('y1', 0)
      .attr('y2', height)
      .style('stroke', '#64748b')
      .style('stroke-width', 1);

    axes.append('text')
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', d => {
        const stat = dimensionStats.find(s => s.key === d.key);
        return stat && stat.percentage < 50 ? '#ef4444' : '#374151';
      })
      .text(d => {
        const stat = dimensionStats.find(s => s.key === d.key);
        const percentage = stat ? stat.percentage.toFixed(0) : '0';
        return `${d.name} (${percentage}%)`;
      });

    axes.each(function(dim) {
      const axis = d3.select(this);
      if (y[dim.key]) {
        const scale = y[dim.key];
        const ticks = scale.ticks(5);
        
        const tickGroups = axis.selectAll('.tick')
          .data(ticks)
          .enter().append('g')
          .attr('class', 'tick')
          .attr('transform', d => `translate(0, ${scale(d)})`);

        tickGroups.append('line')
          .attr('x1', -4)
          .attr('x2', 4)
          .style('stroke', '#64748b')
          .style('stroke-width', 1);

        tickGroups.append('text')
          .attr('x', -8)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')
          .style('font-size', '10px')
          .style('fill', '#64748b')
          .text(d => dim.format(d));
      }
    });

    const legendData = [...new Set(validData.map(d => d.region))];
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 120}, 20)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 18})`);

    legendItems.append('line')
      .attr('x1', 0)
      .attr('x2', 15)
      .attr('y1', 0)
      .attr('y2', 0)
      .style('stroke', d => colorScale(d))
      .style('stroke-width', 3);

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 0)
      .attr('dy', '0.35em')
      .style('font-size', '11px')
      .style('fill', '#374151')
      .text(d => d);

    g.append('text')
      .attr('x', 10)
      .attr('y', height + 35)
      .style('font-size', '11px')
      .style('fill', '#64748b')
      .style('font-style', 'italic')
      .text('The yellow-highlighted line is South Korea. The % in axis labels shows data availability.');

    g.append('text')
      .attr('x', 10)
      .attr('y', height + 50)
      .style('font-size', '10px')
      .style('fill', '#6b7280')
      .text(`Displayed countries: ${validData.length} | Used indicators: ${dimensions.length} | Korea included: ${koreaData.length > 0 ? 'Yes' : 'No'}`);
  };

  return (
    <>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ minHeight: '400px' }}
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
            maxWidth: '280px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </>
  );
};

export default ParallelCoordinates;
