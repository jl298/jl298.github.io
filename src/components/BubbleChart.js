import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  getDataForYear, 
  filterDataByRegions, 
  filterDataByCountries,
  formatValue 
} from '../utils/dataLoader';
import { COLORS } from '../utils/constants';

const BubbleChart = ({ data, state, onCountryClick, sidebarVisible }) => {
  const svgRef = useRef();
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

  const adjustTooltipPosition = (x, y, tooltipWidth = 320, tooltipHeight = 200) => {
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
    
    if (state.selectedCountries.length > 0) {
      yearData = filterDataByCountries(yearData, state.selectedCountries);
    }

    drawChart(yearData);
  }, [data, state, sidebarVisible]);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        if (data && data.countries) {
          let yearData = getDataForYear(data.countries, state.selectedYear);
          yearData = filterDataByRegions(yearData, state.activeRegions);
          
          if (state.selectedCountries.length > 0) {
            yearData = filterDataByCountries(yearData, state.selectedCountries);
          }

          drawChart(yearData);
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
    
    const margin = sidebarVisible 
      ? { top: 20, right: 40, bottom: 60, left: 70 }
      : { top: 15, right: 25, bottom: 50, left: 60 };
    
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
      .range(sidebarVisible ? [6, 25] : [8, 30]);

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
      .style('font-size', sidebarVisible ? '12px' : '14px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text('Freedom House Score (Civil Liberties)');

    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .style('font-size', sidebarVisible ? '12px' : '14px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text('Press Freedom Index (Lower = More Free)');

    const quadrantData = [
      { x: 0, y: 0, width: xScale(50), height: yScale(50), class: 'high-freedom', opacity: 0.05, color: '#16a085' },
      { x: xScale(50), y: 0, width: width - xScale(50), height: yScale(50), class: 'medium-freedom', opacity: 0.05, color: '#f39c12' },
      { x: 0, y: yScale(50), width: xScale(50), height: height - yScale(50), class: 'mixed', opacity: 0.05, color: '#5dade2' },
      { x: xScale(50), y: yScale(50), width: width - xScale(50), height: height - yScale(50), class: 'low-freedom', opacity: 0.05, color: '#e74c3c' }
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
          <div style="font-weight: 600; color: #f39c12; margin-bottom: 8px;">${d.country}</div>
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
          x: adjustTooltipPosition(event.pageX + 10, event.pageY - 10).x,
          y: adjustTooltipPosition(event.pageX + 10, event.pageY - 10).y,
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
      { x: xScale(25), y: 25, text: 'High Freedom', color: '#16a085' },
      { x: xScale(75), y: 25, text: 'Press Restrictions', color: '#f39c12' },
      { x: xScale(25), y: height - 10, text: 'Mixed System', color: '#5dade2' },
      { x: xScale(75), y: height - 10, text: 'Authoritarian', color: '#e74c3c' }
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
        .style('pointer-events', 'none')
        .text(label.text);
    });

    const legendData = [...new Set(validData.map(d => d.region))];
    const legendHeight = legendData.length * (sidebarVisible ? 18 : 22);
    
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - (sidebarVisible ? 80 : 85)}, ${height - legendHeight - 10})`)
      .style('pointer-events', 'none');

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * (sidebarVisible ? 18 : 22)})`);

    legendItems.append('circle')
      .attr('cx', 6)
      .attr('cy', 6)
      .attr('r', sidebarVisible ? 5 : 7)
      .attr('fill', d => colorScale(d))
      .attr('opacity', 0.8)
      .style('pointer-events', 'none');

    legendItems.append('text')
      .attr('x', sidebarVisible ? 16 : 20)
      .attr('y', 6)
      .attr('dy', '0.35em')
      .style('font-size', sidebarVisible ? '10px' : '12px')
      .style('fill', '#374151')
      .style('pointer-events', 'none')
      .text(d => d);

    const sizeLegendHeight = sidebarVisible ? 80 : 100;
    const sizeLegend = g.append('g')
      .attr('class', 'size-legend')
      .attr('transform', `translate(${sidebarVisible ? 15 : 25}, ${height - legendHeight - sizeLegendHeight - 20})`)
      .style('pointer-events', 'none');

    sizeLegend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', sidebarVisible ? '10px' : '12px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .style('pointer-events', 'none')
      .text('Surveillance Index (Bubble Size)');

    const sizeValues = sidebarVisible ? [20, 50, 80] : [25, 55, 85];
    const sizeLegendItems = sizeLegend.selectAll('.size-item')
      .data(sizeValues)
      .enter().append('g')
      .attr('class', 'size-item')
      .attr('transform', (d, i) => `translate(${i * (sidebarVisible ? 40 : 50)}, 20)`);

    sizeLegendItems.append('circle')
      .attr('cx', 15)
      .attr('cy', 15)
      .attr('r', d => radiusScale(d))
      .attr('fill', '#94a3b8')
      .attr('opacity', 0.6)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('pointer-events', 'none');

    sizeLegendItems.append('text')
      .attr('x', 15)
      .attr('y', sidebarVisible ? 38 : 42)
      .attr('text-anchor', 'middle')
      .style('font-size', sidebarVisible ? '8px' : '10px')
      .style('fill', '#64748b')
      .style('pointer-events', 'none')
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
            maxWidth: '320px',
            minWidth: '200px',
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

export default BubbleChart;