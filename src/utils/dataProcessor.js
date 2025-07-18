import * as d3 from 'd3';
import { INDICATORS, THRESHOLDS } from './constants.js';
import { DataLoader } from './dataLoader.js';

const dataLoader = new DataLoader();

export async function loadAllData() {
  try {
    console.log('Starting data load...');
    
    try {
      const realData = await dataLoader.loadAllRealData();
      console.log('Real data loaded successfully:', {
        countries: realData.countries.length,
        indicators: realData.indicators.length,
        sources: realData.loadedSources,
        timeRange: realData.timeRange
      });
      return realData;
      
    } catch (realDataError) {
      console.warn('Real data loading failed, falling back to mock data:', realDataError);
      
      const mockData = {
        countries: await generateMockCountryData(),
        worldGeo: await loadWorldGeography(),
        indicators: INDICATORS,
        timeRange: [1945, 2025],
        loadedSources: ['mock'],
        schemaInfo: null
      };
      
      console.log('Mock data loaded as fallback:', {
        countries: mockData.countries.length,
        indicators: mockData.indicators.length
      });
      
      return mockData;
    }
    
  } catch (error) {
    console.error('Complete data loading failure:', error);
    throw error;
  }
}

async function generateMockCountryData() {
  const countries = [
    { name: 'United States', iso3: 'USA', region: 'Americas' },
    { name: 'Germany', iso3: 'DEU', region: 'Europe' },
    { name: 'United Kingdom', iso3: 'GBR', region: 'Europe' },
    { name: 'France', iso3: 'FRA', region: 'Europe' },
    { name: 'Japan', iso3: 'JPN', region: 'Asia' },
    { name: 'South Korea', iso3: 'KOR', region: 'Asia' },
    { name: 'Canada', iso3: 'CAN', region: 'Americas' },
    { name: 'Australia', iso3: 'AUS', region: 'Oceania' },
    { name: 'New Zealand', iso3: 'NZL', region: 'Oceania' },
    { name: 'Sweden', iso3: 'SWE', region: 'Europe' },
    { name: 'Norway', iso3: 'NOR', region: 'Europe' },
    { name: 'Denmark', iso3: 'DNK', region: 'Europe' },
    
    { name: 'India', iso3: 'IND', region: 'Asia' },
    { name: 'Brazil', iso3: 'BRA', region: 'Americas' },
    { name: 'South Africa', iso3: 'ZAF', region: 'Africa' },
    { name: 'Indonesia', iso3: 'IDN', region: 'Asia' },
    { name: 'Mexico', iso3: 'MEX', region: 'Americas' },
    { name: 'Poland', iso3: 'POL', region: 'Europe' },
    { name: 'Czech Republic', iso3: 'CZE', region: 'Europe' },
    { name: 'Chile', iso3: 'CHL', region: 'Americas' },
    
    { name: 'China', iso3: 'CHN', region: 'Asia' },
    { name: 'Russia', iso3: 'RUS', region: 'Europe' },
    { name: 'Iran', iso3: 'IRN', region: 'Middle East' },
    { name: 'Saudi Arabia', iso3: 'SAU', region: 'Middle East' },
    { name: 'North Korea', iso3: 'PRK', region: 'Asia' },
    { name: 'Belarus', iso3: 'BLR', region: 'Europe' },
    { name: 'Myanmar', iso3: 'MMR', region: 'Asia' },
    { name: 'Venezuela', iso3: 'VEN', region: 'Americas' },
    { name: 'Cuba', iso3: 'CUB', region: 'Americas' },
    { name: 'Syria', iso3: 'SYR', region: 'Middle East' },
    
    { name: 'Turkey', iso3: 'TUR', region: 'Asia' },
    { name: 'Hungary', iso3: 'HUN', region: 'Europe' },
    { name: 'Philippines', iso3: 'PHL', region: 'Asia' },
    { name: 'Thailand', iso3: 'THA', region: 'Asia' },
    { name: 'Egypt', iso3: 'EGY', region: 'Middle East' },
    { name: 'Nigeria', iso3: 'NGA', region: 'Africa' },
    { name: 'Kenya', iso3: 'KEN', region: 'Africa' },
    { name: 'Malaysia', iso3: 'MYS', region: 'Asia' },
    { name: 'Singapore', iso3: 'SGP', region: 'Asia' },
    { name: 'Ukraine', iso3: 'UKR', region: 'Europe' },
  ];
  
  const data = [];
  const years = d3.range(1945, 2026);
  
  countries.forEach(country => {
    years.forEach(year => {
      data.push({
        country: country.name,
        iso3: country.iso3,
        region: country.region,
        year: year,
        ...generateIndicatorValues(country, year)
      });
    });
  });
  
  return data;
}

function generateIndicatorValues(country, year) {
  const countryType = getCountryType(country.name);
  const historicalContext = getHistoricalContext(year);
  
  let baseValues = {};
  
  switch (countryType) {
    case 'strongDemocracy':
      baseValues = {
        polity5: 8 + Math.random() * 2,
        vdem_liberal: 0.75 + Math.random() * 0.2,
        freedom_house: 85 + Math.random() * 10,
        press_freedom: 15 + Math.random() * 20,
        surveillance: 20 + Math.random() * 30,
        minority_rights: 0.7 + Math.random() * 0.25,
      };
      break;
      
    case 'emergingDemocracy':
      baseValues = {
        polity5: 3 + Math.random() * 5,
        vdem_liberal: 0.4 + Math.random() * 0.3,
        freedom_house: 55 + Math.random() * 25,
        press_freedom: 30 + Math.random() * 30,
        surveillance: 40 + Math.random() * 35,
        minority_rights: 0.4 + Math.random() * 0.35,
      };
      break;
      
    case 'authoritarian':
      baseValues = {
        polity5: -8 + Math.random() * 6,
        vdem_liberal: 0.1 + Math.random() * 0.25,
        freedom_house: 15 + Math.random() * 25,
        press_freedom: 60 + Math.random() * 30,
        surveillance: 60 + Math.random() * 35,
        minority_rights: 0.1 + Math.random() * 0.3,
      };
      break;
      
    case 'hybrid':
    default:
      baseValues = {
        polity5: -2 + Math.random() * 8,
        vdem_liberal: 0.3 + Math.random() * 0.4,
        freedom_house: 40 + Math.random() * 35,
        press_freedom: 35 + Math.random() * 40,
        surveillance: 35 + Math.random() * 40,
        minority_rights: 0.3 + Math.random() * 0.4,
      };
  }
  
  const adjustedValues = applyHistoricalTrends(baseValues, country, year, historicalContext);
  
  return {
    polity5: Math.max(-10, Math.min(10, adjustedValues.polity5 || 0)),
    vdem_liberal: Math.max(0, Math.min(1, adjustedValues.vdem_liberal || 0)),
    freedom_house: Math.max(0, Math.min(100, adjustedValues.freedom_house || 0)),
    press_freedom: Math.max(0, Math.min(100, adjustedValues.press_freedom || 0)),
    surveillance: Math.max(0, Math.min(100, adjustedValues.surveillance || 0)),
    minority_rights: Math.max(0, Math.min(1, adjustedValues.minority_rights || 0)),
  };
}

function getCountryType(countryName) {
  const strongDemocracies = [
    'United States', 'Germany', 'United Kingdom', 'France', 'Japan',
    'Canada', 'Australia', 'New Zealand', 'Sweden', 'Norway', 'Denmark'
  ];
  
  const emergingDemocracies = [
    'South Korea', 'India', 'Brazil', 'South Africa', 'Indonesia',
    'Mexico', 'Poland', 'Czech Republic', 'Chile'
  ];
  
  const authoritarianRegimes = [
    'China', 'Russia', 'Iran', 'Saudi Arabia', 'North Korea',
    'Belarus', 'Myanmar', 'Venezuela', 'Cuba', 'Syria'
  ];
  
  if (strongDemocracies.includes(countryName)) return 'strongDemocracy';
  if (emergingDemocracies.includes(countryName)) return 'emergingDemocracy';
  if (authoritarianRegimes.includes(countryName)) return 'authoritarian';
  return 'hybrid';
}

function getHistoricalContext(year) {
  if (year >= 1945 && year <= 1989) return 'coldWar';
  if (year >= 1974 && year <= 1991) return 'thirdWave';
  if (year >= 1990 && year <= 2005) return 'postColdWar';
  if (year >= 2006 && year <= 2025) return 'democraticRecession';
  return 'modern';
}

function applyHistoricalTrends(values, country, year, context) {
  const adjusted = {
    polity5: Number(values.polity5) || 0,
    vdem_liberal: Number(values.vdem_liberal) || 0,
    freedom_house: Number(values.freedom_house) || 0,
    press_freedom: Number(values.press_freedom) || 0,
    surveillance: Number(values.surveillance) || 0,
    minority_rights: Number(values.minority_rights) || 0,
  };
  
  switch (context) {
    case 'coldWar':
      if (country.region === 'Europe' && !['Russia', 'Belarus'].includes(country.name)) {
        return {
          ...adjusted,
          polity5: adjusted.polity5 * 0.8,
          vdem_liberal: adjusted.vdem_liberal * 0.8
        };
      }
      break;
      
    case 'thirdWave':
      if (['South Korea', 'Brazil', 'Chile', 'Poland', 'Czech Republic'].includes(country.name)) {
        const progress = (year - 1974) / (1991 - 1974);
        return {
          ...adjusted,
          polity5: values.polity5 * (0.5 + 0.5 * progress),
          vdem_liberal: values.vdem_liberal * (0.5 + 0.5 * progress),
          freedom_house: values.freedom_house * (0.6 + 0.4 * progress)
        };
      }
      break;
      
    case 'postColdWar':
      if (country.region === 'Europe') {
        return {
          ...adjusted,
          polity5: adjusted.polity5 * 1.1,
          vdem_liberal: adjusted.vdem_liberal * 1.1,
          freedom_house: adjusted.freedom_house * 1.05
        };
      }
      break;
      
    case 'democraticRecession':
      const recession = (year - 2006) / (2025 - 2006) * 0.2;
      return {
        ...adjusted,
        polity5: adjusted.polity5 * (1 - recession),
        vdem_liberal: adjusted.vdem_liberal * (1 - recession),
        freedom_house: adjusted.freedom_house * (1 - recession * 0.5),
        press_freedom: adjusted.press_freedom * (1 + recession),
        surveillance: adjusted.surveillance * (1 + recession)
      };
  }
  
  if (country.name === 'South Korea') {
    return applySouthKoreaTrends(adjusted, year);
  }
  
  return adjusted;
}

function applySouthKoreaTrends(values, year) {
  const baseValues = {
    polity5: Number(values.polity5) || 0,
    vdem_liberal: Number(values.vdem_liberal) || 0,
    freedom_house: Number(values.freedom_house) || 0,
    press_freedom: Number(values.press_freedom) || 0,
    surveillance: Number(values.surveillance) || 0,
    minority_rights: Number(values.minority_rights) || 0,
  };

  if (year >= 1945 && year <= 1960) {
    const instabilityFactor = Math.random() * 0.3 - 0.15;
    return {
      polity5: Math.max(-10, Math.min(10, 3 + instabilityFactor * 5)),
      vdem_liberal: Math.max(0, Math.min(1, 0.35 + instabilityFactor)),
      freedom_house: Math.max(0, Math.min(100, 45 + instabilityFactor * 25)),
      press_freedom: Math.max(0, Math.min(100, 45 + Math.random() * 20)),
      surveillance: Math.max(0, Math.min(100, 30 + Math.random() * 20)),
      minority_rights: Math.max(0, Math.min(1, 0.3 + Math.random() * 0.2))
    };
  }

  else if (year >= 1961 && year <= 1986) {
    const authoritarian_intensity = (year >= 1972 && year <= 1979) ? 1.2 : 1.0;
    const variation = Math.random() * 0.2 - 0.1;
    
    return {
      polity5: Math.max(-10, Math.min(10, (-6 * authoritarian_intensity) + variation * 2)),
      vdem_liberal: Math.max(0, Math.min(1, (0.12 / authoritarian_intensity) + variation * 0.05)),
      freedom_house: Math.max(0, Math.min(100, (30 / authoritarian_intensity) + variation * 15)),
      press_freedom: Math.max(0, Math.min(100, (75 * authoritarian_intensity) + Math.random() * 10)),
      surveillance: Math.max(0, Math.min(100, (60 * authoritarian_intensity) + Math.random() * 15)),
      minority_rights: Math.max(0, Math.min(1, (0.15 / authoritarian_intensity) + Math.random() * 0.1))
    };
  }

  else if (year >= 1987 && year <= 1992) {
    const progress = (year - 1987) / 5;
    const smoothTransition = Math.sin(progress * Math.PI / 2);
    
    return {
      polity5: Math.max(-10, Math.min(10, -6 + smoothTransition * 12 + Math.random() * 1)),
      vdem_liberal: Math.max(0, Math.min(1, 0.12 + smoothTransition * 0.55 + Math.random() * 0.05)),
      freedom_house: Math.max(0, Math.min(100, 30 + smoothTransition * 45 + Math.random() * 8)),
      press_freedom: Math.max(0, Math.min(100, 75 - smoothTransition * 35 + Math.random() * 8)),
      surveillance: Math.max(0, Math.min(100, 60 - smoothTransition * 25 + Math.random() * 10)),
      minority_rights: Math.max(0, Math.min(1, 0.15 + smoothTransition * 0.35 + Math.random() * 0.05))
    };
  }
  
  else if (year >= 1993 && year <= 2007) {
    const maturity = Math.min(1, (year - 1993) / 10);
    const cyclicalVariation = Math.sin((year - 1993) * 2 * Math.PI / 5) * 0.1;
    
    return {
      polity5: Math.max(-10, Math.min(10, 6 + maturity * 2 + cyclicalVariation + Math.random() * 0.8)),
      vdem_liberal: Math.max(0, Math.min(1, 0.67 + maturity * 0.15 + cyclicalVariation * 0.05 + Math.random() * 0.05)),
      freedom_house: Math.max(0, Math.min(100, 75 + maturity * 10 + cyclicalVariation * 5 + Math.random() * 6)),
      press_freedom: Math.max(0, Math.min(100, 40 - maturity * 10 + Math.abs(cyclicalVariation) * 8 + Math.random() * 8)),
      surveillance: Math.max(0, Math.min(100, 35 + Math.random() * 15)),
      minority_rights: Math.max(0, Math.min(1, 0.5 + maturity * 0.2 + Math.random() * 0.1))
    };
  }
  
  else if (year >= 2008 && year <= 2016) {
    const backslide_intensity = (year >= 2013) ? 1.3 : 1.0;
    const yearsInPeriod = year - 2008;
    const degradation = Math.min(0.15, yearsInPeriod * 0.02);
    
    return {
      polity5: Math.max(-10, Math.min(10, 8 - degradation * backslide_intensity * 10 + Math.random() * 0.6)),
      vdem_liberal: Math.max(0, Math.min(1, 0.82 - degradation * backslide_intensity + Math.random() * 0.04)),
      freedom_house: Math.max(0, Math.min(100, 85 - degradation * backslide_intensity * 20 + Math.random() * 5)),
      press_freedom: Math.max(0, Math.min(100, 32 + degradation * backslide_intensity * 25 + Math.random() * 8)),
      surveillance: Math.max(0, Math.min(100, 40 + degradation * backslide_intensity * 30 + Math.random() * 10)),
      minority_rights: Math.max(0, Math.min(1, 0.7 - degradation * backslide_intensity * 0.5 + Math.random() * 0.08))
    };
  }

  else if (year >= 2017) {
    const renewal = Math.min(1, (year - 2017) / 3);
    const modern_challenges = (year >= 2020) ? 0.05 : 0;
    
    return {
      polity5: Math.max(-10, Math.min(10, 7.5 + renewal * 0.8 - modern_challenges * 2 + Math.random() * 0.5)),
      vdem_liberal: Math.max(0, Math.min(1, 0.75 + renewal * 0.1 - modern_challenges * 0.03 + Math.random() * 0.03)),
      freedom_house: Math.max(0, Math.min(100, 80 + renewal * 8 - modern_challenges * 5 + Math.random() * 4)),
      press_freedom: Math.max(0, Math.min(100, 45 - renewal * 8 + modern_challenges * 5 + Math.random() * 6)),
      surveillance: Math.max(0, Math.min(100, 55 - renewal * 10 + modern_challenges * 10 + Math.random() * 8)),
      minority_rights: Math.max(0, Math.min(1, 0.65 + renewal * 0.15 - modern_challenges * 0.05 + Math.random() * 0.06))
    };
  }

  return {
    polity5: Math.max(-10, Math.min(10, baseValues.polity5 + Math.random() * 2 - 1)),
    vdem_liberal: Math.max(0, Math.min(1, baseValues.vdem_liberal + Math.random() * 0.1 - 0.05)),
    freedom_house: Math.max(0, Math.min(100, baseValues.freedom_house + Math.random() * 10 - 5)),
    press_freedom: Math.max(0, Math.min(100, baseValues.press_freedom + Math.random() * 10 - 5)),
    surveillance: Math.max(0, Math.min(100, baseValues.surveillance + Math.random() * 10 - 5)),
    minority_rights: Math.max(0, Math.min(1, baseValues.minority_rights + Math.random() * 0.1 - 0.05))
  };
}

async function loadWorldGeography() {
  return {
    type: "Topology",
    arcs: [],
    objects: {
      countries: {
        type: "GeometryCollection",
        geometries: []
      }
    }
  };
}

export function filterDataByYear(data, startYear, endYear) {
  return data.filter(d => d.year >= startYear && d.year <= endYear);
}

export function filterDataByRegions(data, activeRegions) {
  return data.filter(d => activeRegions.includes(d.region.toLowerCase()));
}

export function filterDataByCountries(data, countries) {
  if (!countries || countries.length === 0) return data;
  return data.filter(d => countries.includes(d.country));
}

export function getUniqueCountries(data) {
  return [...new Set(data.map(d => d.country))].sort();
}

export function getDataForYear(data, year) {
  return data.filter(d => d.year === year);
}

export function calculateSummaryStats(data, indicator) {
  const values = data.map(d => d[indicator]).filter(v => v != null && !isNaN(v));
  
  if (values.length === 0) return null;
  
  return {
    mean: d3.mean(values),
    median: d3.median(values),
    min: d3.min(values),
    max: d3.max(values),
    count: values.length,
    std: d3.deviation(values),
  };
}

export function groupDataByRegion(data) {
  return d3.group(data, d => d.region);
}

export function getCountryTimeSeries(data, countryName) {
  return data
    .filter(d => d.country === countryName)
    .sort((a, b) => a.year - b.year);
}

export function calculateRegionalAverages(data, indicator) {
  const grouped = groupDataByRegion(data);
  const averages = [];
  
  grouped.forEach((regionData, region) => {
    const values = regionData.map(d => d[indicator]).filter(v => v != null && !isNaN(v));
    if (values.length > 0) {
      averages.push({
        region,
        average: d3.mean(values),
        count: values.length,
      });
    }
  });
  
  return averages;
}

export function classifyDemocracyLevel(value, indicator) {
  const thresholds = THRESHOLDS.democracy;
  
  if (indicator === 'polity5') {
    if (value >= 6) return 'democracy';
    if (value >= -5) return 'anocracy';
    return 'autocracy';
  }
  
  if (indicator === 'freedom_house') {
    if (value >= 70) return 'free';
    if (value >= 40) return 'partly_free';
    return 'not_free';
  }
  
  if (value >= thresholds.high) return 'high';
  if (value >= thresholds.medium) return 'medium';
  return 'low';
}

export function searchCountries(data, query) {
  if (!query || query.length < 2) return [];
  
  const countries = getUniqueCountries(data);
  const lowerQuery = query.toLowerCase();
  
  return countries
    .filter(country => country.toLowerCase().includes(lowerQuery))
    .slice(0, 10);
}

export function formatValue(value, indicator) {
  if (value == null || isNaN(value)) return 'N/A';
  
  switch (indicator) {
    case 'polity5':
      return value.toFixed(1);
    case 'vdem_liberal':
    case 'minority_rights':
      return value.toFixed(2);
    case 'freedom_house':
    case 'press_freedom':
    case 'surveillance':
      return Math.round(value);
    default:
      return value.toFixed(1);
  }
}

export function getDemocracyColor(value, indicator) {
  const level = classifyDemocracyLevel(value, indicator);
  
  switch (level) {
    case 'democracy':
    case 'free':
    case 'high':
      return '#059669';
    case 'anocracy':
    case 'partly_free':
    case 'medium':
      return '#fbbf24';
    case 'autocracy':
    case 'not_free':
    case 'low':
      return '#dc2626';
    default:
      return '#e5e7eb';
  }
}

export default {
  loadAllData,
  filterDataByYear,
  filterDataByRegions,
  filterDataByCountries,
  getUniqueCountries,
  getDataForYear,
  calculateSummaryStats,
  groupDataByRegion,
  getCountryTimeSeries,
  calculateRegionalAverages,
  classifyDemocracyLevel,
  searchCountries,
  formatValue,
  getDemocracyColor,
};
