import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';
import { 
  getCountryTimeSeries, 
  formatValue 
} from '../utils/dataLoader';
import { KOREA_EVENTS, COLORS } from '../utils/constants';

const CaseStudyPanel = ({ isOpen, onClose, data, state }) => {
  const svgRef = useRef();
  const [selectedIndicator, setSelectedIndicator] = useState('vdem_liberal');
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const adjustTooltipPosition = (x, y, tooltipWidth = 280, tooltipHeight = 150) => {
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

    relevantEvents.sort((a, b) => a.year - b.year);

    const textPositions = [];
    const minTextSpacing = 80;
    const baseYOffset = -30;
    const levelSpacing = 30;
    
    relevantEvents.forEach((event, index) => {
      const x = xScale(event.year);
      let y = baseYOffset;
      let level = 0;
      
      let hasConflict = true;
      while (hasConflict) {
        hasConflict = false;
        const currentY = baseYOffset - (level * levelSpacing);
        
        for (let pos of textPositions) {
          const xDiff = Math.abs(x - pos.x);
          const yDiff = Math.abs(currentY - pos.y);
          
          if (xDiff < minTextSpacing && yDiff < 25) {
            hasConflict = true;
            break;
          }
        }
        
        if (hasConflict) {
          level++;
        } else {
          y = currentY;
        }
        
        if (level > 4) {
          level = index % 3;
          y = baseYOffset - (level * levelSpacing);
          break;
        }
      }
      
      textPositions.push({ x, y, level });
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

    eventGroups.append('path')
      .attr('d', (d, i) => {
        const yearData = validData.find(item => item.year === d.year);
        const startY = yearData ? yScale(yearData[selectedIndicator]) : height / 2;
        const endY = textPositions[i].y + 8;
        const midY = (startY + endY) / 2;
        
        return `M 0,${startY} Q 0,${midY} 0,${endY}`;
      })
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('fill', 'none')
      .attr('opacity', 0.6);

    const textLabels = eventGroups.append('text')
      .attr('x', 0)
      .attr('y', (d, i) => textPositions[i].y)
      .attr('text-anchor', 'middle')
      .style('font-size', '9px')
      .style('font-weight', '600')
      .style('fill', '#dc2626')
      .text(d => {
        const maxLength = 15;
        if (d.event.includes('\n')) {
          return d.event.split('\n')[0].substring(0, maxLength);
        }
        return d.event.length > maxLength ? d.event.substring(0, maxLength) + '...' : d.event;
      });

    textLabels.each(function(d, i) {
      const textNode = this;
      const bbox = textNode.getBBox();
      
      d3.select(textNode.parentNode).insert('rect', 'text')
        .attr('x', bbox.x - 4)
        .attr('y', bbox.y - 2)
        .attr('width', bbox.width + 8)
        .attr('height', bbox.height + 4)
        .attr('fill', 'rgba(255, 255, 255, 0.95)')
        .attr('stroke', '#dc2626')
        .attr('stroke-width', 0.5)
        .attr('rx', 4)
        .attr('ry', 2)
        .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))');
    });

    eventGroups
      .on('mouseover', function(event, d) {
        const tooltip = d3.select('body').append('div')
          .attr('class', 'event-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.9)')
          .style('color', 'white')
          .style('padding', '12px 16px')
          .style('border-radius', '8px')
          .style('font-size', '13px')
          .style('pointer-events', 'none')
          .style('z-index', 1000)
          .style('max-width', '280px')
          .style('line-height', '1.4')
          .html(`
            <div style="font-weight: 600; color: #fbbf24; margin-bottom: 8px;">${d.event}</div>
            <div style="margin-bottom: 6px;"><strong>Year:</strong> ${d.year}</div>
            <div>${d.description}</div>
          `);

        const adjustedPosition = adjustTooltipPosition(event.pageX + 10, event.pageY - 10);
        tooltip
          .style('left', adjustedPosition.x + 'px')
          .style('top', adjustedPosition.y + 'px');

        d3.select(this)
          .style('opacity', 1)
          .select('circle')
          .transition()
          .duration(150)
          .attr('r', 8);
          
        d3.select(this)
          .select('rect')
          .transition()
          .duration(150)
          .attr('stroke-width', 2)
          .attr('fill', 'rgba(220, 38, 38, 0.1)');
      })
      .on('mouseout', function() {
        d3.selectAll('.event-tooltip').remove();
        
        d3.select(this)
          .style('opacity', 0.8)
          .select('circle')
          .transition()
          .duration(150)
          .attr('r', 6);
          
        d3.select(this)
          .select('rect')
          .transition()
          .duration(150)
          .attr('stroke-width', 0.5)
          .attr('fill', 'rgba(255, 255, 255, 0.9)');
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

  return createPortal(
    <div 
      className="portal-case-study-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 2147483647,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="portal-case-study-panel"
        style={{
          width: '50%',
          maxWidth: '800px',
          minWidth: '500px',
          height: '100vh',
          background: 'white',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
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
        <div style={{ maxWidth: 'calc(100% - 60px)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', wordWrap: 'break-word' }}>
            South Korea Case Study
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9, lineHeight: '1.4' }}>
            Democratic Transition from Authoritarianism (1945-2025)
          </p>
        </div>
        <button
          onClick={onClose}
          title="Click this X button or press ESC key to close"
          aria-label="Close dialog"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            color: '#dc2626',
            fontSize: '24px',
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
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 1)';
            e.target.style.border = '2px solid #dc2626';
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.9)';
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

      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontSize: '13px', 
          fontWeight: '500',
          color: '#374151'
        }}>
          Select Indicator for Time Series Analysis:
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
          maxHeight: '300px',
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
        <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#475569' }}>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong style={{ color: '#1e293b' }}>Authoritarian Era (1961-1987):</strong> Military rule established through Park Chung-hee's 
            coup was institutionalized via the Yushin Constitution (1972). This period featured developmental 
            authoritarianism - rapid economic growth coupled with severely restricted political freedoms.
          </p>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong style={{ color: '#1e293b' }}>Democratic Transition (1987-1993):</strong> The June Democratic Uprising of 1987 became 
            the catalyst for Korean democratization. Constitutional amendments enabled direct presidential 
            elections, expanding political freedoms and establishing civilian government under Kim Young-sam (1993).
          </p>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong style={{ color: '#1e293b' }}>Progressive Era (1998-2008):</strong> Kim Dae-jung and Roh Moo-hyun administrations 
            strengthened democratic institutions and civil liberties. Kim's "Sunshine Policy" toward North Korea 
            earned him the Nobel Peace Prize, while Roh survived an impeachment attempt, demonstrating 
            constitutional resilience. This period saw expanded press freedom and civil society activism.
          </p>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong style={{ color: '#1e293b' }}>Conservative Regression (2008-2017):</strong> Lee Myung-bak and Park Geun-hye 
            administrations marked a concerning democratic backslide. Increased surveillance, media control, 
            and authoritarian tendencies culminated in Park's corruption scandal and blacklist of cultural figures. 
            Freedom House scores declined during this period, reflecting erosion of press freedom and civil liberties.
          </p>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong style={{ color: '#1e293b' }}>Democratic Renewal (2017-Present):</strong> The 2016 Candlelight Revolution 
            demonstrated Korean democracy's self-correcting capacity. Park Geun-hye's peaceful impeachment and 
            Moon Jae-in's election restored democratic norms. However, political polarization remains challenging, 
            with the conservative Yoon Suk-yeol administration (2022-) facing tensions over prosecutorial reform 
            and judicial independence.
          </p>
          <p style={{ margin: '0' }}>
            <strong style={{ color: '#1e293b' }}>Contemporary Challenges:</strong> While institutionally stable, 
            Korean democracy faces modern threats including: political polarization, declining social trust, 
            generational divides, and debates over digital surveillance versus security. The resilience shown 
            in peaceful power transitions suggests a mature democracy capable of addressing these challenges.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CaseStudyPanel;
