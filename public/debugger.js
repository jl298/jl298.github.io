window.DashboardDebugger = {
  summary() {
    const data = window.dashboardData || this.getCurrentData();
    if (!data) {
      console.log('[X] Cannot find data. Please check if dashboard is loaded.');
      return;
    }

    console.log('Dashboard Data Summary');
    console.log('===================');
    console.log('Total records:', data.countries?.length || 0);
    
    if (data.countries && data.countries.length > 0) {
      const years = [...new Set(data.countries.map(d => d.year))].sort();
      console.log('Year range:', Math.min(...years), '-', Math.max(...years));
      console.log('Number of countries:', new Set(data.countries.map(d => d.country)).size);
      console.log('Available sources:', data.loadedSources);
      
      const yearCounts = {};
      data.countries.forEach(d => {
        yearCounts[d.year] = (yearCounts[d.year] || 0) + 1;
      });
      
      console.log('\nData distribution by year:');
      Object.entries(yearCounts)
        .sort(([a], [b]) => a - b)
        .forEach(([year, count]) => {
          const status = count < 10 ? '[!]' : '[V]';
          console.log(`  ${status} ${year}: ${count} records`);
        });
    }
  },

  analyzeYear(year) {
    const data = window.dashboardData || this.getCurrentData();
    if (!data) return;

    const yearData = data.countries.filter(d => d.year === year);
    console.log(`${year} Year Data Analysis`);
    console.log('=================');
    console.log('Records for this year:', yearData.length);

    if (yearData.length === 0) {
      console.log('[X] No data for this year.');
      return;
    }

    const regionCounts = {};
    yearData.forEach(d => {
      regionCounts[d.region] = (regionCounts[d.region] || 0) + 1;
    });

    console.log('\nDistribution by region:');
    Object.entries(regionCounts).forEach(([region, count]) => {
      console.log(`  ${region}: ${count} records`);
    });

    const indicators = ['vdem_liberal', 'freedom_house', 'polity5', 'press_freedom', 'surveillance'];
    console.log('\nData availability by indicator:');
    indicators.forEach(indicator => {
      const withData = yearData.filter(d => d[indicator] != null && !isNaN(d[indicator])).length;
      const percentage = (withData / yearData.length * 100).toFixed(1);
      const status = withData === 0 ? '❌' : withData < yearData.length * 0.5 ? '⚠️' : '✅';
      console.log(`  ${status} ${indicator}: ${withData}/${yearData.length} (${percentage}%)`);
    });

    return yearData;
  },

  analyzeCountry(countryName) {
    const data = window.dashboardData || this.getCurrentData();
    if (!data) return;

    const countryData = data.countries.filter(d => d.country === countryName);
    console.log(`${countryName} Data Analysis`);
    console.log('======================');
    
    if (countryData.length === 0) {
      console.log('[X] Cannot find data for this country.');
      
      const allCountries = [...new Set(data.countries.map(d => d.country))];
      const similar = allCountries.filter(name => 
        name.toLowerCase().includes(countryName.toLowerCase()) ||
        countryName.toLowerCase().includes(name.toLowerCase())
      );
      
      if (similar.length > 0) {
        console.log('Similar country names:', similar);
      }
      return;
    }

    const years = countryData.map(d => d.year).sort();
    console.log('Data period:', Math.min(...years), '-', Math.max(...years));
    console.log('Total records:', countryData.length);
    console.log('Data sources:', [...new Set(countryData.flatMap(d => d.sources || []))]);

    const indicators = ['vdem_liberal', 'freedom_house', 'polity5'];
    console.log('\nData status by indicator:');
    indicators.forEach(indicator => {
      const withData = countryData.filter(d => d[indicator] != null && !isNaN(d[indicator]));
      console.log(`  ${indicator}:`, withData.length, 'years');
      if (withData.length > 0) {
        const values = withData.map(d => d[indicator]);
        console.log(`    Range: ${Math.min(...values).toFixed(2)} ~ ${Math.max(...values).toFixed(2)}`);
      }
    });

    return countryData;
  },

  analyzePolity5() {
    const data = window.dashboardData || this.getCurrentData();
    if (!data) return;

    const withPolity5 = data.countries.filter(d => d.polity5 != null && !isNaN(d.polity5));
    console.log('Polity5 Data Analysis');
    console.log('==================');
    console.log('Records with Polity5 data:', withPolity5.length, 'records');
    console.log('Percentage of total records:', (withPolity5.length / data.countries.length * 100).toFixed(1), '%');

    if (withPolity5.length === 0) {
      console.log('[X] No Polity5 data found.');
      
      const withPolity2 = data.countries.filter(d => d.polity2 != null && !isNaN(d.polity2));
      console.log('Checking polity2 data:', withPolity2.length, 'records');
      
      return;
    }

    const countryCounts = {};
    withPolity5.forEach(d => {
      countryCounts[d.country] = (countryCounts[d.country] || 0) + 1;
    });

    console.log('\nCountries with Polity5 data (top 10):');
    Object.entries(countryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([country, count]) => {
        console.log(`  ${country}: ${count} years`);
      });

    const yearCounts = {};
    withPolity5.forEach(d => {
      yearCounts[d.year] = (yearCounts[d.year] || 0) + 1;
    });

    const years = Object.keys(yearCounts).map(Number).sort();
    console.log('\nPolity5 year range:', Math.min(...years), '-', Math.max(...years));

    return withPolity5;
  },

  checkCurrentState() {
    const reactRoot = document.querySelector('#root');
    if (reactRoot && reactRoot._reactInternalFiber) {
      console.log('[!] Direct access to React state is not possible.');
    }

    if (window.dashboardData) {
      console.log('[V] window.dashboardData available');
    } else {
      console.log('[X] window.dashboardData not found');
    }

    const keys = Object.keys(localStorage).filter(key => key.includes('dashboard'));
    if (keys.length > 0) {
      console.log('Related local storage:', keys);
    }
  },

  getCurrentData() {
    if (window.dashboardData) {
      return window.dashboardData;
    }

    console.log('Please refresh the browser and try again to access data.');
    console.log('Or add the following code in App.js useEffect:');
    console.log('window.dashboardData = data; // in App.js useEffect');
    
    return null;
  },

  diagnose() {
    console.log('Dashboard Automated Diagnosis');
    console.log('========================');

    const data = this.getCurrentData();
    if (!data) {
      console.log('[X] Step 1: Data access failed');
      this.checkCurrentState();
      return;
    }
    console.log('[V] Step 1: Data access successful');

    const years = [...new Set(data.countries.map(d => d.year))].sort();
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    
    if (minYear >= 2000) {
      console.log('[X] Step 2: Year range limitation detected');
      console.log(`   Current range: ${minYear}-${maxYear}`);
      console.log('   Solution: Check year filtering conditions in dataLoader.js');
    } else {
      console.log('[V] Step 2: Year range normal');
    }

    const polity5Count = data.countries.filter(d => d.polity5 != null).length;
    if (polity5Count === 0) {
      console.log('[X] Step 3: Polity5 data missing');
      console.log('   Solution: Check country name mapping and field name mapping');
    } else {
      console.log('[V] Step 3: Polity5 data exists');
    }

    const koreaData = data.countries.filter(d => d.country === 'South Korea');
    if (koreaData.length === 0) {
      console.log('[X] Step 4: Korea data missing');
      const allCountries = [...new Set(data.countries.map(d => d.country))];
      const koreaLike = allCountries.filter(name => name.toLowerCase().includes('kor'));
      if (koreaLike.length > 0) {
        console.log('   Found Korea-related names:', koreaLike);
      }
    } else {
      console.log('Step 4: Korea data exists');
    }

    console.log('\nDiagnosis complete. Please resolve the [X] items using DEBUGGING_GUIDE.md.');
  },

  help() {
    console.log('Dashboard Debugger Usage');
    console.log('========================');
    console.log('DashboardDebugger.summary()        - Overall data summary');
    console.log('DashboardDebugger.analyzeYear(2020) - Analyze specific year');
    console.log('DashboardDebugger.analyzeCountry("South Korea") - Analyze by country');
    console.log('DashboardDebugger.analyzePolity5()  - Analyze Polity5 data');
    console.log('DashboardDebugger.diagnose()       - Automated diagnosis');
    console.log('DashboardDebugger.help()           - This help message');
  }
};

console.log('🛠️ Dashboard Debugger loaded!');
console.log('Run DashboardDebugger.help() to see usage instructions.');
console.log('Run DashboardDebugger.diagnose() to start automated diagnosis.');
