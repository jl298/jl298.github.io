import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  getCountryTimeSeries, 
  formatValue 
} from '../utils/realDataLoader';
import { KOREA_EVENTS, COLORS } from '../utils/constants';

const CaseStudyPanel = ({ isOpen, onClose, data, state }) => {
  const svgRef = useRef();
  const [selectedIndicator, setSelectedIndicator] = useState('vdem_liberal');

  useEffect(() => {
    if (!isOpen || !data || !data.countries) return;
    
    const koreaData = getCountryTimeSeries(data.countries, 'South Korea');
    if (koreaData.length > 0) {
      drawChart(koreaData);
    }
  }, [isOpen, data, selectedIndicator]);

  const drawChart = (koreaData) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!koreaData || koreaData.length === 0) {
      svg.append('text')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .style('font-size', '14px')
        .text('Unable to load South Korea data');
      return;
    }

    const container = svg.node().getBoundingClientRect();
    const margin = { top: 20, right: 30, bottom: 80, left: 70 };
    const width = container.width - margin.left - margin.right;
    const height = container.height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const validData = koreaData.filter(d => 
      d[selectedIndicator] != null && 
      !isNaN(d[selectedIndicator])
    );

    if (validData.length === 0) {
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .style('font-size', '14px')
        .text('No valid data for selected indicator');
      return;
    }

    const xScale = d3.scaleLinear()
      .domain(d3.extent(validData, d => d.year))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(validData, d => d[selectedIndicator]))
      .range([height, 0])
      .nice();

    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d[selectedIndicator]))
      .curve(d3.curveMonotoneX);

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
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text(getIndicatorLabel(selectedIndicator));

    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text('Year');

    const area = d3.area()
      .x(d => xScale(d.year))
      .y0(height)
      .y1(d => yScale(d[selectedIndicator]))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(validData)
      .attr('fill', COLORS.primary)
      .attr('opacity', 0.1)
      .attr('d', area);

    const path = g.append('path')
      .datum(validData)
      .attr('fill', 'none')
      .attr('stroke', COLORS.primary)
      .attr('stroke-width', 3)
      .attr('d', line);

    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    const dots = g.selectAll('.data-dot')
      .data(validData)
      .enter().append('circle')
      .attr('class', 'data-dot')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d[selectedIndicator]))
      .attr('r', 0)
      .attr('fill', COLORS.primary)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    dots
      .transition()
      .duration(100)
      .delay((d, i) => i * 30)
      .attr('r', 4);

    const relevantEvents = KOREA_EVENTS.filter(event => {
      const eventYear = event.year;
      return eventYear >= d3.min(validData, d => d.year) && 
             eventYear <= d3.max(validData, d => d.year);
    });

    const eventGroups = g.selectAll('.event-annotation')
      .data(relevantEvents)
      .enter().append('g')
      .attr('class', 'event-annotation')
      .attr('transform', d => `translate(${xScale(d.year)}, 0)`);

    eventGroups.append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.7);

    eventGroups.append('circle')
      .attr('cx', 0)
      .attr('cy', d => {
        const yearData = validData.find(item => item.year === d.year);
        return yearData ? yScale(yearData[selectedIndicator]) : height / 2;
      })
      .attr('r', 6)
      .attr('fill', '#dc2626')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    eventGroups.append('text')
      .attr('x', 0)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#dc2626')
      .text(d => d.event);

    eventGroups
      .on('mouseover', function(event, d) {
        const tooltip = d3.select('body').append('div')
          .attr('class', 'event-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.9)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', 1000)
          .html(`<strong>${d.event} (${d.year})</strong><br/>${d.description}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');

        d3.select(this).select('circle')
          .transition()
          .duration(150)
          .attr('r', 8);
      })
      .on('mouseout', function() {
        d3.selectAll('.event-tooltip').remove();
        d3.select(this).select('circle')
          .transition()
          .duration(150)
          .attr('r', 6);
      });

    if (state.selectedYear >= d3.min(validData, d => d.year) && 
        state.selectedYear <= d3.max(validData, d => d.year)) {
      
      const currentYearData = validData.find(d => d.year === state.selectedYear);
      if (currentYearData) {
        const currentYearGroup = g.append('g')
          .attr('class', 'current-year')
          .attr('transform', `translate(${xScale(state.selectedYear)}, ${yScale(currentYearData[selectedIndicator])})`);

        currentYearGroup.append('circle')
          .attr('r', 8)
          .attr('fill', '#fbbf24')
          .attr('stroke', '#fff')
          .attr('stroke-width', 3);

        currentYearGroup.append('text')
          .attr('x', 12)
          .attr('y', -12)
          .style('font-size', '12px')
          .style('font-weight', '600')
          .style('fill', '#fbbf24')
          .text(`${state.selectedYear}: ${formatValue(currentYearData[selectedIndicator], selectedIndicator)}`);
      }
    }

    const summaryGroup = g.append('g')
      .attr('class', 'summary')
      .attr('transform', `translate(${width - 200}, 20)`);

    const stats = [
      { label: 'Max', value: d3.max(validData, d => d[selectedIndicator]) },
      { label: 'Min', value: d3.min(validData, d => d[selectedIndicator]) },
      { label: 'Average', value: d3.mean(validData, d => d[selectedIndicator]) },
      { label: 'Current', value: validData[validData.length - 1]?.[selectedIndicator] }
    ];

    summaryGroup.selectAll('.stat')
      .data(stats)
      .enter().append('text')
      .attr('class', 'stat')
      .attr('x', 0)
      .attr('y', (d, i) => i * 16)
      .style('font-size', '11px')
      .style('fill', '#64748b')
      .text(d => `${d.label}: ${formatValue(d.value, selectedIndicator)}`);
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '50%',
        height: '100vh',
        background: 'white',
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out'
      }}
    >
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            🇰🇷 South Korea Case Study
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
            Transition from Authoritarianism to Democracy (1945-2025)
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontSize: '14px', 
          fontWeight: '500',
          color: '#374151'
        }}>
          Select Indicator for Analysis:
        </label>
        <select
          value={selectedIndicator}
          onChange={(e) => setSelectedIndicator(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            background: 'white'
          }}
        >
          <option value="vdem_liberal">V-Dem Liberal Democracy Index</option>
          <option value="polity5">Polity5 Score</option>
          <option value="freedom_house">Freedom House Score</option>
          <option value="press_freedom">RSF Press Freedom Index</option>
          <option value="surveillance">AI Surveillance Index</option>
          <option value="minority_rights">Minority Rights Index</option>
        </select>
      </div>

      <div style={{ flex: 1, padding: '16px' }}>
        <svg
          ref={svgRef}
          width="100%"
          height="400px"
          style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
        />
      </div>

      <div 
        style={{ 
          padding: '20px 24px', 
          borderTop: '1px solid #e5e7eb',
          background: '#f8fafc',
          maxHeight: '200px',
          overflowY: 'auto'
        }}
      >
        <h3 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '16px', 
          fontWeight: '600',
          color: '#1e293b'
        }}>
          South Korea's Democratization Journey
        </h3>
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569' }}>
          <p style={{ margin: '0 0 12px 0' }}>
            <strong>Authoritarian Period (1961-1987):</strong> Military rule that began with Park Chung-hee's 
            May 16 coup was further strengthened through the Yushin Constitution (1972). During this period, 
            South Korea experienced developmental authoritarianism with rapid economic growth alongside severely 
            restricted political freedoms.
          </p>
          <p style={{ margin: '0 0 12px 0' }}>
            <strong>Democratic Transition (1987-1993):</strong> The June Democratic Uprising of 1987 marked 
            a turning point for Korean democracy. With constitutional amendments allowing direct presidential 
            elections, political freedoms began to expand, culminating in the establishment of civilian 
            government under Kim Young-sam in 1993.
          </p>
          <p style={{ margin: '0' }}>
            <strong>Democratic Consolidation (1993-Present):</strong> South Korea successfully overcame 
            the 1997 IMF crisis through democratic means and demonstrated democratic maturity through 
            peaceful power transitions, including the 2016 Candlelight Revolution leading to 
            President Park Geun-hye's impeachment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyPanel;
