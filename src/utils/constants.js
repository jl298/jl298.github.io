export const ENVIRONMENT = {
  DEBUG_MODE: false,
  SHOW_CONSOLE_LOGS: false,
  SHOW_DEBUG_PANELS: false,
  
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

export const COLORS = {
  democracy: {
    high: '#16a085',
    medium: '#f39c12',
    low: '#e74c3c',
    noData: '#95a5a6',
  },
  
  regions: {
    'Europe': '#5dade2',
    'Asia': '#ec7063',
    'Africa': '#f4d03f',
    'Americas': '#58d68d',
    'Oceania': '#bb8fce',
    'Middle East': '#f8c471',
  },
  
  primary: '#2c3e50',
  secondary: '#7f8c8d',
  accent: '#e67e22',
  background: '#ecf0f1',
  text: '#2c3e50',
  
  gradients: {
    democracy: ['#e74c3c', '#f39c12', '#16a085'],
    freedom: ['#c0392b', '#e67e22', '#f1c40f', '#27ae60'],
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
  { 
    year: 1948, 
    event: 'ROK Government Established', 
    description: 'The Republic of Korea government is established under President Syngman Rhee, marking the beginning of South Korea as an independent state.',
    type: 'founding'
  },
  { 
    year: 1961, 
    event: 'May 16 Military Coup', 
    description: 'General Park Chung-hee seizes power in a military coup, beginning over two decades of authoritarian rule with rapid economic development.',
    type: 'authoritarian'
  },
  { 
    year: 1972, 
    event: 'Yushin Constitution', 
    description: 'Park Chung-hee proclaims the Yushin Constitution, concentrating power and establishing a more repressive authoritarian system.',
    type: 'authoritarian'
  },
  { 
    year: 1979, 
    event: 'Park Assassination', 
    description: 'President Park Chung-hee is assassinated by his intelligence chief, ending 18 years of military rule but leading to continued authoritarianism.',
    type: 'transition'
  },
  { 
    year: 1980, 
    event: 'Gwangju Uprising', 
    description: 'Pro-democracy uprising in Gwangju is brutally suppressed by Chun Doo-hwan\'s military, becoming a symbol of resistance to authoritarian rule.',
    type: 'resistance'
  },
  { 
    year: 1987, 
    event: 'June Democratic Uprising', 
    description: 'Massive nationwide protests force the military government to accept democratic reforms, including direct presidential elections.',
    type: 'democratization'
  },
  { 
    year: 1993, 
    event: 'Civilian Government', 
    description: 'Kim Young-sam becomes the first civilian president in 32 years, marking the beginning of democratic consolidation.',
    type: 'democratization'
  },
  { 
    year: 1997, 
    event: 'Asian Financial Crisis', 
    description: 'The IMF financial crisis leads to the first peaceful transfer of power to the opposition party under Kim Dae-jung.',
    type: 'consolidation'
  },
  { 
    year: 2002, 
    event: 'World Cup Success', 
    description: 'South Korea co-hosts the FIFA World Cup, showcasing its democratic development and soft power on the global stage.',
    type: 'consolidation'
  },
  { 
    year: 2008, 
    event: 'Conservative Return', 
    description: 'Lee Myung-bak\'s presidency begins a conservative era with some concerns about press freedom and civil liberties.',
    type: 'backslide'
  },
  { 
    year: 2016, 
    event: 'Candlelight Revolution', 
    description: 'Peaceful mass protests against President Park Geun-hye\'s corruption lead to her impeachment, demonstrating democratic maturity.',
    type: 'resilience'
  },
  { 
    year: 2017, 
    event: 'Democratic Renewal', 
    description: 'Moon Jae-in\'s election represents a return to progressive governance and strengthened democratic institutions.',
    type: 'renewal'
  },
  { 
    year: 2022, 
    event: 'Political Polarization', 
    description: 'Yoon Suk-yeol\'s presidency highlights ongoing challenges of political polarization and institutional tensions.',
    type: 'challenge'
  }
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

  dataQuality: {
    minimumDataPoints: 5,
    minimumYearRange: 10,
    validValueRange: {
      polity5: [-10, 10],
      vdem_liberal: [0, 1],
      freedom_house: [0, 100],
      press_freedom: [0, 100],
      surveillance: [0, 100],
      minority_rights: [0, 1]
    }
  }
};

export const DEFAULT_STATE = {
  selectedYear: 2018,
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

  narrative: {
    sceneTransition: 600,
    lineDrawing: 1500,
    annotationDelay: 300,
    tooltipFade: 200,
    panelSlide: 400
  }
};

export const TOOLTIP = {
  offset: { x: 10, y: -10 },
  maxWidth: 240,
  delay: 300,
};

export default {
  ENVIRONMENT,
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
