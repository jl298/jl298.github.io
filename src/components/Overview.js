import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  getDataForYear, 
  filterDataByRegions, 
  filterDataByCountries,
  getDemocracyColor,
  formatValue 
} from '../utils/realDataLoader';
import { COLORS, COUNTRY_REGIONS } from '../utils/constants';

const Overview = ({ data, state, onCountryClick }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
  const [debugInfo, setDebugInfo] = useState(null);

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

    console.log('📊 [OVERVIEW DEBUG] Overview Chart Debugging:');
    console.log('=====================================');
    console.log('  Selected year:', state.selectedYear);
    console.log('  Original data count:', data?.countries?.length || 0);
    console.log('  Filtered data count:', chartData?.length || 0);
    console.log('  Active regions:', state.activeRegions);
    console.log('  Selected countries:', state.selectedCountries);

    if (data?.countries) {
      console.log('📅 Data availability analysis by year:');
      
      const allYears = [...new Set(data.countries.map(d => d.year))].sort();
      const minYear = Math.min(...allYears);
      const maxYear = Math.max(...allYears);
      console.log(`  Overall data year range: ${minYear}-${maxYear}`);
      
      const beforeAfter2020 = {
        before: data.countries.filter(d => d.year < 2020).length,
        after: data.countries.filter(d => d.year >= 2020).length
      };
      console.log(`  Before 2020: ${beforeAfter2020.before} records, After: ${beforeAfter2020.after} records`);
      
      const testYears = [1980, 1990, 2000, 2010, 2019, 2020, 2021, 2022, 2023, 2024];
      console.log('  Data count by specific years:');
      testYears.forEach(year => {
        const count = data.countries.filter(d => d.year === year).length;
        const status = count === 0 ? '❌' : count < 50 ? '⚠️' : '✅';
        console.log(`    ${status} ${year}: ${count} records`);
      });
      
      const currentYearData = getDataForYear(data.countries, state.selectedYear);
      console.log(`📈 ${state.selectedYear} detailed analysis:`);
      console.log(`  Total data for this year: ${currentYearData.length} records`);
      
      if (currentYearData.length > 0) {
        const regionCounts = {};
        currentYearData.forEach(d => {
          regionCounts[d.region] = (regionCounts[d.region] || 0) + 1;
        });
        console.log('  Regional data distribution:');
        Object.entries(regionCounts).forEach(([region, count]) => {
          console.log(`    ${region}: ${count} records`);
        });
        
        const indicators = ['vdem_liberal', 'freedom_house', 'polity5'];
        console.log('  Key indicator data availability:');
        indicators.forEach(indicator => {
          const withData = currentYearData.filter(d => d[indicator] != null && !isNaN(d[indicator])).length;
          const percentage = (withData / currentYearData.length * 100).toFixed(1);
          console.log(`    ${indicator}: ${withData}/${currentYearData.length} (${percentage}%)`);
        });
        
        const koreaData = currentYearData.filter(d => d.country === 'South Korea');
        console.log('🇰🇷 South Korea data status:');
        if (koreaData.length > 0) {
          console.log('  ✅ South Korea data exists');
          console.log('  South Korea data content:', koreaData[0]);
          indicators.forEach(indicator => {
            const value = koreaData[0][indicator];
            const status = value != null && !isNaN(value) ? '✅' : '❌';
            console.log(`    ${status} ${indicator}: ${value}`);
          });
        } else {
          console.log('  ❌ No South Korea data');
          const allCountries = [...new Set(currentYearData.map(d => d.country))];
          const koreaLike = allCountries.filter(name => 
            name && name.toLowerCase().includes('kor'));
          if (koreaLike.length > 0) {
            console.log('  🔍 Korea-related names:', koreaLike);
          }
        }
      }
    }

    if (chartData) {
      console.log('🎯 Post-filtering data analysis:');
      
      const preValidation = chartData.filter(d => 
        d.vdem_liberal != null && !isNaN(d.vdem_liberal) &&
        d.freedom_house != null && !isNaN(d.freedom_house)
      );
      
      console.log(`  validData condition check: ${preValidation.length}/${chartData.length} passed`);
      console.log('    Condition: vdem_liberal != null && freedom_house != null');
      
      if (chartData.length > 0 && preValidation.length === 0) {
        console.log('  ⚠️ Analysis of why validData is 0:');
        const vdemCount = chartData.filter(d => d.vdem_liberal != null && !isNaN(d.vdem_liberal)).length;
        const fhCount = chartData.filter(d => d.freedom_house != null && !isNaN(d.freedom_house)).length;
        console.log(`    Records with vdem_liberal: ${vdemCount}`);
        console.log(`    Records with freedom_house: ${fhCount}`);
        
        const sample = chartData[0];
        console.log('    Sample data:', {
          country: sample.country,
          year: sample.year,
          vdem_liberal: sample.vdem_liberal,
          freedom_house: sample.freedom_house,
          polity5: sample.polity5,
          sources: sample.sources
        });
      }
      
      setDebugInfo({
        totalRecords: chartData.length,
        validRecords: preValidation.length,
        selectedYear: state.selectedYear,
        hasKorea: chartData.some(d => d.country === 'South Korea'),
        indicators: {
          vdem_liberal: chartData.filter(d => d.vdem_liberal != null).length,
          freedom_house: chartData.filter(d => d.freedom_house != null).length,
          polity5: chartData.filter(d => d.polity5 != null).length
        }
      });
    }
    
    console.log('=====================================');

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
      d.vdem_liberal != null && !isNaN(d.vdem_liberal) &&
      d.freedom_house != null && !isNaN(d.freedom_house)
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
      .domain(d3.extent(validData, d => d.vdem_liberal))
      .range([0, width])
      .nice();

    const yScale = d3.scaleLinear()
      .domain(d3.extent(validData, d => d.freedom_house))
      .range([height, 0])
      .nice();

    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(validData, d => 350000000)])
      .range([4, 20]);

    const colorScale = d3.scaleOrdinal()
      .domain(Object.values(COUNTRY_REGIONS))
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
      .call(d3.axisBottom(xScale).tickFormat(d3.format('.1f')))
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
      .text('V-Dem Liberal Democracy Index');

    const circles = g.selectAll('.data-point')
      .data(validData)
      .enter().append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.vdem_liberal))
      .attr('cy', d => yScale(d.freedom_house))
      .attr('r', d => radiusScale(Math.random() * 100000000 + 10000000))
      .attr('fill', d => colorScale(d.region))
      .attr('opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer');

    circles
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 1)
          .attr('stroke-width', 2.5);

        const tooltipContent = `
          <div style="font-weight: 600; color: #fbbf24; margin-bottom: 8px;">${d.country}</div>
          <div><strong>Region:</strong> ${d.region}</div>
          <div><strong>Year:</strong> ${d.year}</div>
          <div style="margin-top: 8px;">
            <div><strong>V-Dem Liberal Democracy:</strong> ${formatValue(d.vdem_liberal, 'vdem_liberal')}</div>
            <div><strong>Freedom House:</strong> ${formatValue(d.freedom_house, 'freedom_house')}</div>
            <div><strong>Polity5:</strong> ${formatValue(d.polity5, 'polity5')}</div>
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
      circles
        .attr('opacity', d => state.selectedCountries.includes(d.country) ? 1 : 0.3)
        .attr('stroke-width', d => state.selectedCountries.includes(d.country) ? 3 : 1.5);
    }

    const midX = xScale(0.5);
    const midY = yScale(50);

    const quadrants = [
      { x: midX + 10, y: 25, text: 'Liberal Democracy', color: '#059669' },
      { x: 10, y: 25, text: 'Partial Freedom', color: '#fbbf24' },
      { x: 10, y: height - 10, text: 'Authoritarianism', color: '#dc2626' },
      { x: midX + 10, y: height - 10, text: 'Electoral Democracy', color: '#3b82f6' }
    ];

    quadrants.forEach(quad => {
      g.append('text')
        .attr('x', quad.x)
        .attr('y', quad.y)
        .style('fill', quad.color)
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('opacity', 0.7)
        .text(quad.text);
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

    if (process.env.NODE_ENV === 'development' && debugInfo) {
      g.append('text')
        .attr('x', 10)
        .attr('y', height + 50)
        .style('font-size', '9px')
        .style('fill', '#6b7280')
        .text(`Debug: ${debugInfo.validRecords}/${debugInfo.totalRecords} records, Korea: ${debugInfo.hasKorea ? '✓' : '✗'}`);
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
      
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          maxWidth: '200px',
          zIndex: 1000
        }}>
          <div><strong>Overview Debug:</strong></div>
          <div>Year: {debugInfo.selectedYear}</div>
          <div>Records: {debugInfo.validRecords}/{debugInfo.totalRecords}</div>
          <div>Korea: {debugInfo.hasKorea ? '✓' : '✗'}</div>
          <div style={{ marginTop: '4px', fontSize: '10px' }}>
            <div>V-Dem: {debugInfo.indicators.vdem_liberal}</div>
            <div>FH: {debugInfo.indicators.freedom_house}</div>
            <div>Polity5: {debugInfo.indicators.polity5}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default Overview;
