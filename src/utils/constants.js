export const COLORS = {
  democracy: {
    high: '#059669',
    medium: '#fbbf24',
    low: '#dc2626',
    noData: '#e5e7eb',
  },
  
  regions: {
    'Europe': '#3b82f6',
    'Asia': '#ef4444',
    'Africa': '#f59e0b',
    'Americas': '#10b981',
    'Oceania': '#8b5cf6',
    'Middle East': '#f97316',
  },
  
  primary: '#1e40af',
  secondary: '#64748b',
  accent: '#fbbf24',
  background: '#f8fafc',
  text: '#1e293b',
  
  gradients: {
    democracy: ['#dc2626', '#fbbf24', '#059669'],
    freedom: ['#7c2d12', '#ea580c', '#facc15', '#22c55e'],
  }
};

export const INDICATORS = [
  {
    id: 'polity5',
    name: 'Polity5 Score',
    description: 'Combined democracy score (-10 to +10)',
    range: [-10, 10],
    source: 'Center for Systemic Peace',
    active: true,
  },
  {
    id: 'vdem_liberal',
    name: 'V-Dem Liberal Democracy',
    description: 'Liberal democracy index (0-1)',
    range: [0, 1],
    source: 'V-Dem Institute',
    active: true,
  },
  {
    id: 'freedom_house',
    name: 'Freedom House Score',
    description: 'Political rights and civil liberties (0-100)',
    range: [0, 100],
    source: 'Freedom House',
    active: true,
  },
  {
    id: 'press_freedom',
    name: 'Press Freedom Index',
    description: 'RSF World Press Freedom Index (0-100)',
    range: [0, 100],
    source: 'Reporters Without Borders',
    active: false,
  },
  {
    id: 'surveillance',
    name: 'AI Surveillance Index',
    description: 'AI-based surveillance adoption (0-100)',
    range: [0, 100],
    source: 'Carnegie Endowment',
    active: false,
  },
  {
    id: 'minority_rights',
    name: 'Minority Rights',
    description: 'Protection of minority rights (0-1)',
    range: [0, 1],
    source: 'V-Dem Institute',
    active: false,
  }
];

export const REGIONS = [
  { id: 'europe', name: 'Europe', active: true },
  { id: 'asia', name: 'Asia', active: true },
  { id: 'africa', name: 'Africa', active: true },
  { id: 'americas', name: 'Americas', active: true },
  { id: 'oceania', name: 'Oceania', active: true },
  { id: 'middle_east', name: 'Middle East', active: true },
];

export const COUNTRY_REGIONS = {
  'Germany': 'Europe',
  'France': 'Europe',
  'United Kingdom': 'Europe',
  'Italy': 'Europe',
  'Spain': 'Europe',
  'Poland': 'Europe',
  'Romania': 'Europe',
  'Netherlands': 'Europe',
  'Belgium': 'Europe',
  'Czech Republic': 'Europe',
  'Portugal': 'Europe',
  'Hungary': 'Europe',
  'Sweden': 'Europe',
  'Austria': 'Europe',
  'Switzerland': 'Europe',
  'Denmark': 'Europe',
  'Finland': 'Europe',
  'Norway': 'Europe',
  'Ireland': 'Europe',
  'Russia': 'Europe',
  'Ukraine': 'Europe',
  'Belarus': 'Europe',
  
  'China': 'Asia',
  'India': 'Asia',
  'Indonesia': 'Asia',
  'Pakistan': 'Asia',
  'Bangladesh': 'Asia',
  'Japan': 'Asia',
  'Philippines': 'Asia',
  'Vietnam': 'Asia',
  'Turkey': 'Asia',
  'Thailand': 'Asia',
  'Myanmar': 'Asia',
  'South Korea': 'Asia',
  'Malaysia': 'Asia',
  'Nepal': 'Asia',
  'Sri Lanka': 'Asia',
  'Cambodia': 'Asia',
  'Laos': 'Asia',
  'Mongolia': 'Asia',
  'North Korea': 'Asia',
  'Singapore': 'Asia',
  
  'Nigeria': 'Africa',
  'Ethiopia': 'Africa',
  'Egypt': 'Africa',
  'South Africa': 'Africa',
  'Kenya': 'Africa',
  'Ghana': 'Africa',
  'Angola': 'Africa',
  'Morocco': 'Africa',
  'Madagascar': 'Africa',
  'Cameroon': 'Africa',
  'Ivory Coast': 'Africa',
  'Niger': 'Africa',
  'Mali': 'Africa',
  'Burkina Faso': 'Africa',
  'Senegal': 'Africa',
  'Chad': 'Africa',
  'Somalia': 'Africa',
  'Zimbabwe': 'Africa',
  'Guinea': 'Africa',
  'Rwanda': 'Africa',
  
  'United States': 'Americas',
  'Brazil': 'Americas',
  'Mexico': 'Americas',
  'Colombia': 'Americas',
  'Argentina': 'Americas',
  'Canada': 'Americas',
  'Peru': 'Americas',
  'Venezuela': 'Americas',
  'Chile': 'Americas',
  'Ecuador': 'Americas',
  'Guatemala': 'Americas',
  'Cuba': 'Americas',
  'Bolivia': 'Americas',
  'Dominican Republic': 'Americas',
  'Honduras': 'Americas',
  'Paraguay': 'Americas',
  'Nicaragua': 'Americas',
  'Costa Rica': 'Americas',
  'Uruguay': 'Americas',
  'Panama': 'Americas',
  
  'Australia': 'Oceania',
  'Papua New Guinea': 'Oceania',
  'New Zealand': 'Oceania',
  'Fiji': 'Oceania',
  'Solomon Islands': 'Oceania',
  'Vanuatu': 'Oceania',
  'Samoa': 'Oceania',
  'Tonga': 'Oceania',
  
  'Iran': 'Middle East',
  'Iraq': 'Middle East',
  'Saudi Arabia': 'Middle East',
  'Yemen': 'Middle East',
  'Syria': 'Middle East',
  'Jordan': 'Middle East',
  'Israel': 'Middle East',
  'Lebanon': 'Middle East',
  'United Arab Emirates': 'Middle East',
  'Kuwait': 'Middle East',
  'Qatar': 'Middle East',
  'Bahrain': 'Middle East',
  'Oman': 'Middle East',
  'Afghanistan': 'Middle East',
};

export const TIME_PERIODS = {
  COLD_WAR: { start: 1945, end: 1989, name: 'Cold War Era' },
  THIRD_WAVE: { start: 1974, end: 1991, name: 'Third Wave of Democratization' },
  POST_COLD_WAR: { start: 1990, end: 2000, name: 'Post-Cold War Period' },
  DEMOCRATIC_RECESSION: { start: 2006, end: 2025, name: 'Democratic Recession' },
  MODERN_ERA: { start: 2010, end: 2025, name: 'Modern Era' },
};

export const HISTORICAL_EVENTS = [
  { year: 1945, event: 'UN Establishment', description: 'United Nations Established' },
  { year: 1948, event: 'Universal Declaration of Human Rights', description: 'UN Universal Declaration of Human Rights Adopted' },
  { year: 1974, event: 'Portugal Carnation Revolution', description: 'Beginning of Third Wave of Democratization' },
  { year: 1989, event: 'Fall of Berlin Wall', description: 'Acceleration of Eastern European Democratization' },
  { year: 1991, event: 'Soviet Union Dissolution', description: 'End of Cold War' },
  { year: 2001, event: '9/11 Attacks', description: 'Anti-terrorism Policies and Freedom Restrictions' },
  { year: 2010, event: 'Arab Spring', description: 'Middle East Democratization Attempts' },
  { year: 2016, event: 'Brexit Vote', description: 'Rise of Populism' },
  { year: 2020, event: 'COVID-19 Pandemic', description: 'Spread of Authoritarian Responses' },
  { year: 2022, event: 'Russia Invades Ukraine', description: 'Democracy vs Authoritarianism Confrontation' },
];

export const KOREA_EVENTS = [
  { year: 1948, event: 'ROK Government Established', description: 'Syngman Rhee Administration Begins' },
  { year: 1961, event: 'May 16 Military Coup', description: 'Park Chung-hee Regime Begins' },
  { year: 1972, event: 'Yushin Constitution Proclaimed', description: 'Authoritarian System Strengthened' },
  { year: 1979, event: 'October 26 Incident', description: 'President Park Chung-hee Assassinated' },
  { year: 1980, event: 'May 18 Gwangju Democratization Movement', description: 'Chun Doo-hwan Regime Begins' },
  { year: 1987, event: 'June Democratic Uprising', description: 'Democratic Transition Begins' },
  { year: 1993, event: 'Civilian Government Begins', description: 'Kim Young-sam Government, Democratic Consolidation' },
  { year: 1997, event: 'IMF Financial Crisis', description: 'Economic Crisis and Regime Change' },
  { year: 2016, event: 'Lee Myung-bak Administration', description: 'Authoritarianism' },
  { year: 2016, event: 'Park Geun-hye Impeachment', description: 'Candlelight Revolution and Democratic Maturity' },
  { year: 2017, event: 'Moon Jae-in Administration', description: 'Return of Progressive Government' },
  { year: 2022, event: 'Yoon Suk-yeol Administration', description: 'Authoritarianism/Emergency Martial Law' },
];

export const CHART_DIMENSIONS = {
  margin: { top: 20, right: 30, bottom: 40, left: 50 },
  width: 800,
  height: 400,
  
  scatter: {
    pointRadius: { min: 3, max: 15 },
    opacity: 0.7,
  },
  
  map: {
    strokeWidth: 0.5,
    hoverStrokeWidth: 2,
  },
  
  bubble: {
    radiusRange: [5, 30],
    opacity: 0.8,
  },
  
  parallel: {
    axisCount: 6,
    lineOpacity: 0.3,
    highlightOpacity: 0.8,
  },
};

export const THRESHOLDS = {
  democracy: {
    high: 0.7,
    medium: 0.4,
    low: 0.2,
  },
  
  freedom: {
    free: 70,
    partlyFree: 40,
    notFree: 0,
  },
  
  polity: {
    democracy: 6,
    anocracy: -5,
    autocracy: -10,
  },
};

export const DEFAULT_STATE = {
  selectedYear: 2020,
  selectedCountries: [],
  activeIndicators: ['polity5', 'vdem_liberal', 'freedom_house'],
  activeRegions: ['europe', 'asia', 'africa', 'americas', 'oceania', 'middle_east'],
  showCaseStudy: false,
  isLoading: false,
};

export const ANIMATION = {
  duration: 750,
  delay: 50,
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const TOOLTIP = {
  offset: { x: 10, y: -10 },
  maxWidth: 240,
  delay: 300,
};

export default {
  COLORS,
  INDICATORS,
  REGIONS,
  COUNTRY_REGIONS,
  TIME_PERIODS,
  HISTORICAL_EVENTS,
  KOREA_EVENTS,
  CHART_DIMENSIONS,
  THRESHOLDS,
  DEFAULT_STATE,
  ANIMATION,
  TOOLTIP,
};
