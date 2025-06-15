import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  getDataForYear, 
  filterDataByRegions, 
  filterDataByCountries,
  getDemocracyColor,
  formatValue 
} from '../utils/realDataLoader';
import { COLORS } from '../utils/constants';

const BubbleChart = ({ data, state, onCountryClick }) => {
  const svgRef = useRef();
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

  useEffect(() => {
    if (!data || !data.countries) return;

    let yearData = getDataForYear(data.countries, state.selectedYear);
    yearData = filterDataByRegions(yearData, state.activeRegions);
    
    if (state.selectedCountries.length > 0) {
      yearData = filterDataByCountries(yearData, state.selectedCountries);
    }

    drawChart(yearData);
  }, [data, state]);

  const drawChart = (chartData) => {
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
    const margin = { top: 20, right: 40, bottom: 60, left: 70 };
    const width = container.width - margin.left - margin.right;
    const height = container.height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const validData = chartData.filter(d => 
      d.press_freedom != null && !isNaN(d.press_freedom) &&
      d.freedom_house != null && !isNaN(d.freedom_house) &&
      d.surveillance != null && !isNaN(d.surveillance)
    );

    if (validData.length === 0) {
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2 - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .style('font-size', '16px')
        .style('font-weight', '500')
        .text(`No valid data available for ${state.selectedYear}`);
      
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2 + 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .style('font-size', '14px')
        .text('Try selecting a different year');
      return;
    }

    const xScale = d3.scaleLinear()
      .domain(d3.extent(validData, d => d.press_freedom))
      .range([0, width])
      .nice();

    const yScale = d3.scaleLinear()
      .domain(d3.extent(validData, d => d.freedom_house))
      .range([height, 0])
      .nice();

    const radiusScale = d3.scaleSqrt()
      .domain(d3.extent(validData, d => d.surveillance))
      .range([6, 25]);

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

    const xAxis = d3.axisBottom(xScale).tickSize(-height).tickFormat('');
    const yAxis = d3.axisLeft(yScale).tickSize(-width).tickFormat('');

    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1);

    g.append('g')
      .attr('class', 'grid')
      .call(yAxis)
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
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text('Freedom House Score (Civil Liberties)');

    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text('Press Freedom Index (Lower = More Free)');

    const quadrantData = [
      { x: 0, y: 0, width: xScale(50), height: yScale(50), class: 'high-freedom', opacity: 0.05, color: '#059669' },
      { x: xScale(50), y: 0, width: width - xScale(50), height: yScale(50), class: 'medium-freedom', opacity: 0.05, color: '#fbbf24' },
      { x: 0, y: yScale(50), width: xScale(50), height: height - yScale(50), class: 'mixed', opacity: 0.05, color: '#3b82f6' },
      { x: xScale(50), y: yScale(50), width: width - xScale(50), height: height - yScale(50), class: 'low-freedom', opacity: 0.05, color: '#dc2626' }
    ];

    g.selectAll('.quadrant')
      .data(quadrantData)
      .enter().append('rect')
      .attr('class', d => `quadrant ${d.class}`)
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('fill', d => d.color)
      .attr('opacity', d => d.opacity);

    const bubbles = g.selectAll('.bubble')
      .data(validData)
      .enter().append('circle')
      .attr('class', 'bubble')
      .attr('cx', d => xScale(d.press_freedom))
      .attr('cy', d => yScale(d.freedom_house))
      .attr('r', 0)
      .attr('fill', d => colorScale(d.region))
      .attr('opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer');

    bubbles
      .transition()
      .duration(750)
      .delay((d, i) => i * 50)
      .attr('r', d => radiusScale(d.surveillance));

    bubbles
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 1)
          .attr('stroke-width', 3);

        const tooltipContent = `
          <div style="font-weight: 600; color: #fbbf24; margin-bottom: 8px;">${d.country}</div>
          <div><strong>Region:</strong> ${d.region}</div>
          <div><strong>Year:</strong> ${d.year}</div>
          <div style="margin-top: 8px;">
            <div><strong>Press Freedom Index:</strong> ${formatValue(d.press_freedom, 'press_freedom')} (Lower = More Free)</div>
            <div><strong>Freedom House:</strong> ${formatValue(d.freedom_house, 'freedom_house')}</div>
            <div><strong>Surveillance Index:</strong> ${formatValue(d.surveillance, 'surveillance')} (Bubble Size)</div>
          </div>
          <div style="margin-top: 8px;">
            <div><strong>Democracy Index:</strong> ${formatValue(d.vdem_liberal, 'vdem_liberal')}</div>
            <div><strong>Polity5:</strong> ${formatValue(d.polity5, 'polity5')}</div>
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
          .attr('opacity', 0.7)
          .attr('stroke-width', 1.5);

        setTooltip({ visible: false, x: 0, y: 0, content: '' });
      })
      .on('click', function(event, d) {
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

    if (state.selectedCountries.length > 0) {
      bubbles
        .attr('opacity', d => state.selectedCountries.includes(d.country) ? 1 : 0.3)
        .attr('stroke-width', d => state.selectedCountries.includes(d.country) ? 3 : 1.5);
    }

    const labels = [
      { x: xScale(25), y: 25, text: 'High Freedom', color: '#059669' },
      { x: xScale(75), y: 25, text: 'Press Restrictions', color: '#fbbf24' },
      { x: xScale(25), y: height - 10, text: 'Mixed System', color: '#3b82f6' },
      { x: xScale(75), y: height - 10, text: 'Authoritarian', color: '#dc2626' }
    ];

    labels.forEach(label => {
      g.append('text')
        .attr('x', label.x)
        .attr('y', label.y)
        .style('fill', label.color)
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('opacity', 0.8)
        .style('text-anchor', 'middle')
        .text(label.text);
    });

    const legendData = [...new Set(validData.map(d => d.region))];
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 20)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItems.append('circle')
      .attr('cx', 6)
      .attr('cy', 6)
      .attr('r', 6)
      .attr('fill', d => colorScale(d))
      .attr('opacity', 0.8);

    legendItems.append('text')
      .attr('x', 18)
      .attr('y', 6)
      .attr('dy', '0.35em')
      .style('font-size', '11px')
      .style('fill', '#374151')
      .text(d => d);

    const sizeLegend = g.append('g')
      .attr('class', 'size-legend')
      .attr('transform', `translate(20, ${height - 100})`);

    sizeLegend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .text('Surveillance Index (Bubble Size)');

    const sizeValues = [20, 50, 80];
    const sizeLegendItems = sizeLegend.selectAll('.size-item')
      .data(sizeValues)
      .enter().append('g')
      .attr('class', 'size-item')
      .attr('transform', (d, i) => `translate(${i * 40}, 20)`);

    sizeLegendItems.append('circle')
      .attr('cx', 15)
      .attr('cy', 15)
      .attr('r', d => radiusScale(d))
      .attr('fill', '#94a3b8')
      .attr('opacity', 0.6)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    sizeLegendItems.append('text')
      .attr('x', 15)
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#64748b')
      .text(d => d);
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
            maxWidth: '280px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </>
  );
};

export default BubbleChart;
