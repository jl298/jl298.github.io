import * as d3 from 'd3';
import Papa from 'papaparse';
import { COUNTRY_REGIONS, INDICATORS, THRESHOLDS } from './constants.js';

export class DataLoader {
  constructor() {
    this.schemaInfo = null;
    this.loadedData = new Map();
    this.debugInfo = {
      yearRanges: {},
      countryMappings: {},
      datasetStats: {}
    };
  }

  async loadSchemaInfo() {
    try {
      const response = await fetch('/dataset/dataset_schema.json');
      this.schemaInfo = await response.json();
      console.log('Schema info loaded:', this.schemaInfo.analysis_summary);
      return this.schemaInfo;
    } catch (error) {
      console.error('Failed to load schema info:', error);
      return null;
    }
  }

  async loadVDemData() {
    console.log('🔍 [DEBUG] Loading V-Dem data...');
    
    if (!this.schemaInfo) {
      await this.loadSchemaInfo();
    }

    const vdemFile = this.findFileByPattern('V-Dem.*\\.csv');
    if (!vdemFile) {
      console.warn('V-Dem file not found in schema');
      return [];
    }

    try {
      let csvContent;
      try {
        csvContent = await fetch('/dataset/V-Dem/V-Dem-processed.csv').then(r => r.text());
        console.log('Using preprocessed V-Dem data');
      } catch {
        console.log('Preprocessed V-Dem data not found, skipping...');
        return [];
      }

      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: header => header.trim()
      });

      if (parsed.errors.length > 0) {
        console.warn('V-Dem parsing warnings:', parsed.errors.slice(0, 3));
      }

      console.log('[DEBUG] V-Dem original data analysis:');
      console.log('  Total records:', parsed.data.length);
      
      const allYears = parsed.data
        .map(row => parseInt(row.year))
        .filter(year => !isNaN(year));
      
      if (allYears.length > 0) {
        const minYear = Math.min(...allYears);
        const maxYear = Math.max(...allYears);
        console.log('  Original year range:', minYear, '-', maxYear);
        
        const yearCounts = {};
        allYears.forEach(year => {
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        });
        
        const before2000 = allYears.filter(y => y < 2000).length;
        const after2000 = allYears.filter(y => y >= 2000).length;
        console.log('  Data before 2000:', before2000, 'records');
        console.log('  Data from 2000 onwards:', after2000, 'records');
        
        const testYears = [1980, 1990, 1995, 2000, 2010, 2020];
        testYears.forEach(year => {
          const count = yearCounts[year] || 0;
          console.log(`  ${year} data:`, count, 'records');
        });
        
        this.debugInfo.yearRanges.vdem = { min: minYear, max: maxYear, totalRecords: allYears.length };
      }

      const allCountries = [...new Set(parsed.data.map(row => row.country_name || row.country))];
      console.log('  Original countries:', allCountries.length);
      console.log('  Korea-related country names:', allCountries.filter(name => 
        name && name.toLowerCase().includes('kor')));

      const processedData = this.processVDemData(parsed.data, []);
      
      console.log(`V-Dem data processed: ${processedData.length} records`);
      this.loadedData.set('vdem', processedData);
      
      return processedData;

    } catch (error) {
      console.error('Error loading V-Dem data:', error);
      return [];
    }
  }

  async loadPolityData() {
    console.log('[DEBUG] Loading Polity5 data...');
    
    const polityFile = this.findFileByPattern('Polity5.*\\.csv');
    if (!polityFile) {
      console.warn('Polity5 file not found');
      return [];
    }

    try {
      const csvContent = await fetch('/dataset/Polity5/p5v2018.csv').then(r => r.text());
      
      const lines = csvContent.split('\n');
      console.log('Polity5 CSV header:', lines[0]);
      console.log('First data line:', lines[1]);
      
      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: header => header.trim()
      });

      console.log('[DEBUG] Polity5 original data analysis:');
      console.log('  Total records:', parsed.data.length);
      console.log('  Column names:', Object.keys(parsed.data[0] || {}));
      
      const allYears = parsed.data
        .map(row => parseInt(row.year))
        .filter(year => !isNaN(year));
      
      if (allYears.length > 0) {
        const minYear = Math.min(...allYears);
        const maxYear = Math.max(...allYears);
        console.log('  Original year range:', minYear, '-', maxYear);
        
        const before2000 = allYears.filter(y => y < 2000).length;
        const after2000 = allYears.filter(y => y >= 2000).length;
        console.log('  Data before 2000:', before2000, 'records');
        console.log('  Data from 2000 onwards:', after2000, 'records');
        
        this.debugInfo.yearRanges.polity5 = { min: minYear, max: maxYear, totalRecords: allYears.length };
      }
      
      const allCountries = [...new Set(parsed.data.map(row => row.country))];
      console.log('  Original countries:', allCountries.length);
      
      const koreaRelated = allCountries.filter(name => 
        name && name.toLowerCase().includes('kor'));
      console.log('  Korea-related original country names:', koreaRelated);
      
      koreaRelated.forEach(countryName => {
        const koreaData = parsed.data.filter(row => row.country === countryName);
        console.log(`  "${countryName}" data:`, koreaData.length, 'records');
        if (koreaData.length > 0) {
          const years = koreaData.map(d => parseInt(d.year)).filter(y => !isNaN(y));
          const minYear = Math.min(...years);
          const maxYear = Math.max(...years);
          console.log(`    Year range: ${minYear}-${maxYear}`);
          console.log(`    Sample data:`, {
            country: koreaData[0].country,
            year: koreaData[0].year,
            polity2: koreaData[0].polity2,
            democ: koreaData[0].democ,
            autoc: koreaData[0].autoc
          });
        }
      });
      
      const processedData = parsed.data
        .filter(row => row.year >= 1945 && row.year <= 2024)
        .map(row => {
          const standardizedName = this.standardizeCountryName(row.country);
          return {
            country: standardizedName,
            originalCountryName: row.country,
            iso3: row.scode || this.guessISO3(row.country),
            region: this.mapCountryToRegion(standardizedName),
            year: parseInt(row.year),
            polity2: this.safeParseFloat(row.polity2),
            democ: this.safeParseInt(row.democ),
            autoc: this.safeParseInt(row.autoc),
            source: 'polity5'
          };
        })
        .filter(row => row.country && row.year);

      console.log('[DEBUG] Country name mapping results:');
      const mappingResults = {};
      parsed.data.forEach(row => {
        if (row.country) {
          const original = row.country;
          const standardized = this.standardizeCountryName(original);
          if (original !== standardized) {
            mappingResults[original] = standardized;
          }
        }
      });
      
      Object.entries(mappingResults).forEach(([original, standardized]) => {
        console.log(`  "${original}" -> "${standardized}"`);
      });
      
      this.debugInfo.countryMappings.polity5 = mappingResults;

      const finalKoreaData = processedData.filter(d => d.country === 'South Korea');
      console.log('Final South Korea data:', finalKoreaData.length, 'records');
      if (finalKoreaData.length > 0) {
        const years = finalKoreaData.map(d => d.year);
        console.log('South Korea data year range:', Math.min(...years), '-', Math.max(...years));
        console.log('Sample data:', finalKoreaData[0]);
      }

      console.log(`Polity5 data processed: ${processedData.length} records`);
      this.loadedData.set('polity5', processedData);
      
      return processedData;

    } catch (error) {
      console.error('Error loading Polity5 data:', error);
      return [];
    }
  }

  async loadFreedomHouseData() {
    console.log('[DEBUG] Loading Freedom House data...');
    
    try {
      const possibleFiles = [
        '/dataset/freedomhouse/Country_and_Territory_Ratings_processed.csv'
      ];

      let csvContent = null;
      let usedFile = null;
      for (const file of possibleFiles) {
        try {
          csvContent = await fetch(file).then(r => r.text());
          usedFile = file;
          console.log(`Using Freedom House file: ${file}`);
          break;
        } catch (e) {
          continue;
        }
      }

      if (!csvContent) {
        console.warn('Freedom House CSV file (Country_and_Territory_Ratings_processed.csv) not found');
        return [];
      }

      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: header => header.trim()
      });

      console.log('[DEBUG] Freedom House original data analysis:');
      console.log('  File used:', usedFile);
      console.log('  Total records:', parsed.data.length);
      console.log('  Column names:', Object.keys(parsed.data[0] || {}));
      
      const yearField = parsed.data[0]?.year ? 'year' : 'Year';
      const allYears = parsed.data
        .map(row => parseInt(row[yearField]))
        .filter(year => !isNaN(year));
      
      if (allYears.length > 0) {
        const minYear = Math.min(...allYears);
        const maxYear = Math.max(...allYears);
        console.log('  Original year range:', minYear, '-', maxYear);
        
        const before2000 = allYears.filter(y => y < 2000).length;
        const after2000 = allYears.filter(y => y >= 2000).length;
        console.log('  Data before 2000:', before2000, 'records');
        console.log('  Data from 2000 onwards:', after2000, 'records');
        
        this.debugInfo.yearRanges.freedomhouse = { min: minYear, max: maxYear, totalRecords: allYears.length };
      }

      const processedData = this.processFreedomHouseData(parsed.data);
      
      console.log(`Freedom House data processed: ${processedData.length} records`);
      this.loadedData.set('freedom_house', processedData);
      
      return processedData;

    } catch (error) {
      console.error('Error loading Freedom House data:', error);
      return [];
    }
  }

  processVDemData(rawData, importantColumns) {
    console.log('[DEBUG] Processing V-Dem data...');
    
    const processed = rawData
      .filter(row => row.year >= 1945 && row.year <= 2025)
      .map(row => ({
        country: this.standardizeCountryName(row.country_name || row.country),
        originalCountryName: row.country_name || row.country,
        iso3: row.country_text_id || this.guessISO3(row.country_name || row.country),
        region: this.mapCountryToRegion(row.country_name || row.country),
        year: parseInt(row.year),
        
        vdem_libdem: this.safeParseFloat(row.v2x_libdem),
        vdem_polyarchy: this.safeParseFloat(row.v2x_polyarchy),
        vdem_civlib: this.safeParseFloat(row.v2x_civlib),
        vdem_rule_of_law: this.safeParseFloat(row.v2xcl_rol),
        vdem_freexp: this.safeParseFloat(row.v2x_freexp_altinf || row.v2x_freexp),
        vdem_corruption: this.safeParseFloat(row.v2x_corr),
        
        source: 'vdem'
      }))
      .filter(row => row.country && row.year);
    
    console.log('  Records after filtering:', processed.length);
    
    return processed;
  }

  processFreedomHouseData(rawData) {
    console.log('[DEBUG] Processing Freedom House data...');
    
    const processed = rawData
      .filter(row => {
        const year = parseInt(row.year || row.Year);
        return year >= 1945 && year <= 2025;
      })
      .map(row => ({
        country: this.standardizeCountryName(row.country || row['Country/Territory']),
        originalCountryName: row.country || row['Country/Territory'],
        iso3: this.guessISO3(row.country || row['Country/Territory']),
        region: this.mapCountryToRegion(row.country || row['Country/Territory']),
        year: parseInt(row.year || row.Year),
        
        fh_total: this.safeParseInt(row.total || row.Total),
        fh_pr: this.safeParseInt(row.pr || row.PR),
        fh_cl: this.safeParseInt(row.cl || row.CL),
        fh_status: row.status || row.Status,
        
        source: 'freedom_house'
      }))
      .filter(row => row.country && row.year);
    
    console.log('  Records after filtering:', processed.length);
    
    return processed;
  }

  mergeDatasets(datasets) {
    console.log('[DEBUG] Starting dataset merge...');
    
    const mergedMap = new Map();
    
    datasets.forEach((dataset, index) => {
      const source = dataset[0]?.source || `dataset_${index}`;
      console.log(`  Dataset ${source}:`, dataset.length, 'records');
      
      const years = dataset.map(d => d.year).filter(y => y);
      if (years.length > 0) {
        console.log(`    Year range: ${Math.min(...years)}-${Math.max(...years)}`);
      }
      
      const countries = [...new Set(dataset.map(d => d.country))];
      console.log(`    Countries: ${countries.length}`);
      
      const koreaData = dataset.filter(d => d.country === 'South Korea');
      if (koreaData.length > 0) {
        console.log(`    South Korea data: ${koreaData.length} records`);
        const koreaYears = koreaData.map(d => d.year);
        console.log(`    South Korea years: ${Math.min(...koreaYears)}-${Math.max(...koreaYears)}`);
      }
    });
    
    datasets.flat().forEach(row => {
      if (!row.country || !row.year) return;
      
      const key = `${row.country}-${row.year}`;
      
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          country: row.country,
          iso3: row.iso3,
          region: row.region,
          year: row.year,
          sources: []
        });
      }
      
      const existing = mergedMap.get(key);
      existing.sources.push(row.source);
      
      Object.keys(row).forEach(field => {
        if (!['country', 'iso3', 'region', 'year', 'source', 'originalCountryName'].includes(field)) {
          existing[field] = row[field];
        }
      });
    });
    
    const result = Array.from(mergedMap.values()).map(row => ({
      ...row,
      vdem_liberal: row.vdem_libdem || null,
      freedom_house: row.fh_total || null,
      press_freedom: this.calculatePressFreedomIndex(row),
      surveillance: this.calculateSurveillanceIndex(row),
      polity5: row.polity2 || null,
      minority_rights: row.vdem_civlib || null,
      
      democracy_index: this.calculateDemocracyIndex(row),
      freedom_index: this.calculateFreedomIndex(row),
      authoritarianism_index: this.calculateAuthoritarianismIndex(row)
    }));
    
    console.log('[DEBUG] Merge results analysis:');
    console.log('  Total records:', result.length);
    
    if (result.length > 0) {
      const years = result.map(d => d.year).filter(y => y);
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      console.log('  Final year range:', minYear, '-', maxYear);
      
      const yearCounts = {};
      years.forEach(year => {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      });
      
      const testYears = [1980, 1990, 1995, 2000, 2010, 2020];
      testYears.forEach(year => {
        const count = yearCounts[year] || 0;
        console.log(`  ${year} final data: ${count} records`);
      });
      
      const withPolity5 = result.filter(d => d.polity5 != null);
      console.log('  Records with Polity5 data:', withPolity5.length, 'records');
      
      const koreaFinal = result.filter(d => d.country === 'South Korea');
      console.log('Final South Korea merged data:', koreaFinal.length, 'records');
      if (koreaFinal.length > 0) {
        const koreaYears = koreaFinal.map(d => d.year);
        console.log('South Korea final year range:', Math.min(...koreaYears), '-', Math.max(...koreaYears));
        
        const koreaWithPolity = koreaFinal.filter(d => d.polity5 != null);
        console.log('South Korea records with Polity5 data:', koreaWithPolity.length, 'records');
        
        console.log('South Korea sample data:', {
          country: koreaFinal[0].country,
          year: koreaFinal[0].year,
          polity5: koreaFinal[0].polity5,
          vdem_liberal: koreaFinal[0].vdem_liberal,
          freedom_house: koreaFinal[0].freedom_house,
          sources: koreaFinal[0].sources
        });
      }
      
      const indicators = ['polity5', 'vdem_liberal', 'freedom_house', 'press_freedom', 'surveillance', 'minority_rights'];
      console.log('Data availability by indicator:');
      indicators.forEach(indicator => {
        const withData = result.filter(d => d[indicator] != null).length;
        console.log(`  ${indicator}: ${withData}/${result.length} (${(withData/result.length*100).toFixed(1)}%)`);
      });
    }
    
    this.debugInfo.datasetStats = {
      totalRecords: result.length,
      yearRange: result.length > 0 ? [Math.min(...result.map(d => d.year)), Math.max(...result.map(d => d.year))] : [0, 0],
      indicatorCoverage: {}
    };
    
    return result;
  }

  generateDebugReport() {
    console.log('[DEBUG REPORT] Data Loading and Processing Summary');
    console.log('=====================================');
    
    console.log('Year range by dataset:');
    Object.entries(this.debugInfo.yearRanges).forEach(([dataset, info]) => {
      console.log(`  ${dataset}: ${info.min}-${info.max} (total ${info.totalRecords} records)`);
    });
    
    console.log('Country name mapping results:');
    Object.entries(this.debugInfo.countryMappings).forEach(([dataset, mappings]) => {
      console.log(`  ${dataset}:`, Object.keys(mappings).length, 'mappings');
      Object.entries(mappings).slice(0, 5).forEach(([original, mapped]) => {
        console.log(`    "${original}" -> "${mapped}"`);
      });
    });
    
    console.log('Final merge results:');
    const stats = this.debugInfo.datasetStats;
    console.log(`  Total records: ${stats.totalRecords}`);
    console.log(`  Year range: ${stats.yearRange[0]}-${stats.yearRange[1]}`);
    
    console.log('=====================================');
  }

  async loadAllRealData() {
    console.log('[DEBUG] Starting Real data loading...');
    
    try {
      await this.loadSchemaInfo();
      
      const [vdemData, polityData, freedomData] = await Promise.all([
        this.loadVDemData(),
        this.loadPolityData(), 
        this.loadFreedomHouseData()
      ]);

      const mergedData = this.mergeDatasets([vdemData, polityData, freedomData]);
      
      this.generateDebugReport();
      
      return {
        countries: mergedData,
        worldGeo: await this.loadWorldGeography(),
        indicators: INDICATORS,
        timeRange: this.calculateTimeRange(mergedData),
        loadedSources: Array.from(this.loadedData.keys()),
        schemaInfo: this.schemaInfo,
        debugInfo: this.debugInfo
      };

    } catch (error) {
      console.error('Failed to load real data:', error);
      throw error;
    }
  }

  findFileByPattern(pattern) {
    if (!this.schemaInfo) return null;
    
    const regex = new RegExp(pattern, 'i');
    const files = this.schemaInfo.files || {};
    
    return Object.keys(files).find(path => regex.test(path));
  }

  identifyImportantColumns(fileInfo, preferredColumns) {
    if (!this.schemaInfo?.files?.[fileInfo]) return preferredColumns;
    
    const fileData = this.schemaInfo.files[fileInfo];
    const availableColumns = Object.keys(fileData.columns_info || {});
    
    return preferredColumns.filter(col => {
      return availableColumns.some(available => 
        available.toLowerCase().includes(col.toLowerCase()) ||
        col.toLowerCase().includes(available.toLowerCase())
      );
    });
  }

  safeParseFloat(value) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  safeParseInt(value) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
  }

  standardizeCountryName(name) {
    if (!name) return null;
    
    const nameMap = {
      'United States of America': 'United States',
      'Russian Federation': 'Russia',
      'Republic of Korea': 'South Korea',
      'Korea': 'South Korea',
      'Korea South': 'South Korea',
      'Korea North': 'North Korea',
      'Democratic People\'s Republic of Korea': 'North Korea',
      'Korea, Republic of': 'South Korea',
      'Korea, South': 'South Korea',
      'South Korea (Republic of Korea)': 'South Korea'
    };
    
    return nameMap[name] || name;
  }

  guessISO3(countryName) {
    if (!countryName) return null;
    
    const isoMap = {
      'United States': 'USA',
      'United Kingdom': 'GBR',
      'Germany': 'DEU',
      'France': 'FRA',
      'Japan': 'JPN',
      'South Korea': 'KOR',
      'China': 'CHN',
      'Russia': 'RUS',
      'India': 'IND',
      'Brazil': 'BRA'
    };
    
    return isoMap[countryName] || countryName.substring(0, 3).toUpperCase();
  }

  mapCountryToRegion(countryName) {
    if (!countryName) return 'Other';
    
    const region = COUNTRY_REGIONS[countryName];
    if (region) return region;
    
    const standardized = this.standardizeCountryName(countryName);
    if (standardized && COUNTRY_REGIONS[standardized]) {
      return COUNTRY_REGIONS[standardized];
    }
    
    for (const [country, region] of Object.entries(COUNTRY_REGIONS)) {
      if (country.toLowerCase().includes(countryName.toLowerCase()) ||
          countryName.toLowerCase().includes(country.toLowerCase())) {
        return region;
      }
    }
    
    return 'Other';
  }

  calculateTimeRange(data) {
    const years = data.map(d => d.year).filter(y => y);
    return years.length > 0 ? [Math.min(...years), Math.max(...years)] : [1945, 2025];
  }

  calculateDemocracyIndex(row) {
    const indicators = [];
    
    if (row.vdem_libdem != null) indicators.push(row.vdem_libdem);
    if (row.polity2 != null) indicators.push((row.polity2 + 10) / 20);
    if (row.fh_total != null) indicators.push(row.fh_total / 100);
    
    return indicators.length > 0 ? indicators.reduce((a, b) => a + b) / indicators.length : null;
  }

  calculateFreedomIndex(row) {
    const indicators = [];
    
    if (row.vdem_civlib != null) indicators.push(row.vdem_civlib);
    if (row.vdem_freexp != null) indicators.push(row.vdem_freexp);
    if (row.fh_cl != null) indicators.push((7 - row.fh_cl) / 6);
    
    return indicators.length > 0 ? indicators.reduce((a, b) => a + b) / indicators.length : null;
  }

  calculateAuthoritarianismIndex(row) {
    const indicators = [];
    
    if (row.vdem_corruption != null) indicators.push(1 - row.vdem_corruption);
    if (row.democracy_index != null) indicators.push(1 - row.democracy_index);
    
    return indicators.length > 0 ? indicators.reduce((a, b) => a + b) / indicators.length : null;
  }

  calculatePressFreedomIndex(row) {
    const indicators = [];
    
    if (row.vdem_freexp != null) {
      indicators.push((1 - row.vdem_freexp) * 100);
    }
    
    if (row.fh_pr != null) {
      indicators.push((row.fh_pr - 1) * 16.67);
    }
    
    return indicators.length > 0 ? indicators.reduce((a, b) => a + b) / indicators.length : null;
  }

  calculateSurveillanceIndex(row) {
    const indicators = [];
    
    if (row.vdem_corruption != null) {
      indicators.push(row.vdem_corruption * 100);
    }
    
    if (row.vdem_rule_of_law != null) {
      indicators.push((1 - row.vdem_rule_of_law) * 100);
    }
    
    if (row.vdem_libdem != null) {
      indicators.push((1 - row.vdem_libdem) * 100);
    }
    
    return indicators.length > 0 ? indicators.reduce((a, b) => a + b) / indicators.length : null;
  }

  async loadWorldGeography() {
    return {
      type: "Topology",
      arcs: [],
      objects: { countries: { type: "GeometryCollection", geometries: [] } }
    };
  }
}

const dataLoader = new DataLoader();

export async function loadAllData() {
  try {
    console.log('Loading real data only...');
    return await dataLoader.loadAllRealData();
    
  } catch (error) {
    console.error('Real data loading failed:', error);
    throw error;
  }
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
      return '#16a085';
    case 'anocracy':
    case 'partly_free':
    case 'medium':
      return '#f39c12';
    case 'autocracy':
    case 'not_free':
    case 'low':
      return '#e74c3c';
    default:
      return '#95a5a6';
  }
}