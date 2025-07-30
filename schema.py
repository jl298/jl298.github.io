#!/usr/bin/env python3
"""
Korea Democracy Data Integration Script

This script implements a hybrid preprocessing approach:
1. Complete extraction of Korea-related data from all datasets
2. Standardization and normalization of democracy indicators  
3. Time series integration and gap filling
4. Web-optimized JSON generation for the visualization app

Usage: python schema.py
"""

import pandas as pd
import numpy as np
import os
import json
import csv
from pathlib import Path
import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class KoreaDemocracyDataIntegrator:
    def __init__(self, dataset_root: str):
        self.dataset_root = Path(dataset_root)
        self.korea_data = {}
        self.integrated_timeline = {}
        self.web_data = {}
        
        # Enhanced Korea identification patterns
        self.korea_patterns = [
            # ISO codes
            'kor', 'kr', 'rok', '410', '732',
            # English variations
            'south korea', 'korea', 'republic of korea', 'korea, south', 
            'korea (south)', 's. korea', 's korea', 'korean',
            # French variations
            'corée du sud', 'corée', 'coree du sud', 'coree',
            # Spanish variations  
            'corea del sur', 'corea',
            # Portuguese variations
            'coreia do sul', 'coreia',
            # Other variations
            'korea south', 'south-korea'
        ]
        
        # Democracy indicator mapping with scale information
        self.democracy_indicators = {
            # Freedom House indicators
            'pr': {'name': 'Political Rights', 'scale_range': (1, 7), 'reverse': True},
            'cl': {'name': 'Civil Liberties', 'scale_range': (1, 7), 'reverse': True},
            'status': {'name': 'Freedom Status', 'categorical': True},
            'fiw': {'name': 'Freedom in the World', 'scale_range': (1, 7), 'reverse': True},
            
            # Polity indicators
            'polity': {'name': 'Polity Score', 'scale_range': (-10, 10), 'reverse': False},
            'polity2': {'name': 'Polity Score Modified', 'scale_range': (-10, 10), 'reverse': False},
            'democ': {'name': 'Democracy Score', 'scale_range': (0, 10), 'reverse': False},
            'autoc': {'name': 'Autocracy Score', 'scale_range': (0, 10), 'reverse': True},
            
            # V-Dem indicators
            'v2x_polyarchy': {'name': 'Electoral Democracy', 'scale_range': (0, 1), 'reverse': False},
            'v2x_libdem': {'name': 'Liberal Democracy', 'scale_range': (0, 1), 'reverse': False},
            'v2x_partipdem': {'name': 'Participatory Democracy', 'scale_range': (0, 1), 'reverse': False},
            'v2x_delibdem': {'name': 'Deliberative Democracy', 'scale_range': (0, 1), 'reverse': False},
            'v2x_egal': {'name': 'Egalitarian Democracy', 'scale_range': (0, 1), 'reverse': False},
            
            # RSF Press Freedom indicators
            'score': {'name': 'Press Freedom Score', 'scale_range': (0, 100), 'reverse': True},
            'rank': {'name': 'Press Freedom Rank', 'scale_range': (1, 180), 'reverse': True},
            
            # AI & Big Data Surveillance indicators
            'surveillance_score': {'name': 'Surveillance Score', 'scale_range': (0, 100), 'reverse': True}
        }
        
        # Generic democracy keywords for fallback matching
        self.generic_democracy_keywords = [
            'democracy', 'democratic', 'freedom', 'liberty', 'civil', 'political', 'rights'
        ]

    def detect_delimiter(self, file_path: Path) -> str:
        """Detect CSV delimiter automatically"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                sample = file.read(1024)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample, delimiters=',;\t|').delimiter
            return delimiter
        except:
            return ','

    def safe_read_csv(self, file_path: Path) -> Optional[pd.DataFrame]:
        """Safely read CSV with automatic delimiter and encoding detection"""
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1', 'utf-8-sig']
        
        # Detect delimiter
        delimiter = self.detect_delimiter(file_path)
        
        # Try different encodings
        for encoding in encodings:
            try:
                df = pd.read_csv(file_path, 
                               encoding=encoding, 
                               delimiter=delimiter,
                               low_memory=False,
                               on_bad_lines='skip')
                
                if len(df) > 0 and len(df.columns) > 1:
                    return df
            except Exception:
                continue
        
        # Fallback: try different delimiters
        for delimiter in [';', ',', '\t', '|']:
            for encoding in encodings:
                try:
                    df = pd.read_csv(file_path, 
                                   encoding=encoding,
                                   delimiter=delimiter,
                                   low_memory=False,
                                   on_bad_lines='skip')
                    if len(df) > 0 and len(df.columns) > 1:
                        return df
                except Exception:
                    continue
        
        return None

    def find_korea_data(self, df: pd.DataFrame) -> Tuple[List[int], List[str]]:
        """Find all rows containing Korea data"""
        korea_rows = []
        korea_columns = []
        
        for col in df.columns:
            if df[col].dtype == 'object':
                col_values = df[col].astype(str).str.lower().fillna('')
                
                for pattern in self.korea_patterns:
                    mask = col_values.str.contains(pattern, na=False, regex=False)
                    if mask.any():
                        korea_rows.extend(df[mask].index.tolist())
                        if col not in korea_columns:
                            korea_columns.append(col)
        
        return list(set(korea_rows)), korea_columns

    def extract_year_from_data(self, df: pd.DataFrame, korea_rows: List[int]) -> List[int]:
        """Extract year information from Korea data rows"""
        years = []
        
        # Look for year columns
        year_columns = []
        for col in df.columns:
            col_lower = str(col).lower()
            if any(term in col_lower for term in ['year', 'time', 'date']):
                year_columns.append(col)
        
        # Extract years from Korea rows
        for row_idx in korea_rows:
            # Check year columns first
            for year_col in year_columns:
                try:
                    year_val = df.iloc[row_idx][year_col]
                    if pd.notna(year_val):
                        year_str = str(year_val)
                        year_match = re.search(r'(19|20)\d{2}', year_str)
                        if year_match:
                            years.append(int(year_match.group()))
                            break
                except:
                    continue
            
            # If no year found in year columns, check all columns
            if not years or len(years) == len([y for y in years if y != years[-1]]):
                for col in df.columns:
                    try:
                        val = df.iloc[row_idx][col]
                        if pd.notna(val):
                            val_str = str(val)
                            if re.match(r'^(19|20)\d{2}$', val_str):
                                years.append(int(val_str))
                                break
                    except:
                        continue
        
        return sorted(list(set(years)))

    def identify_democracy_indicators(self, df: pd.DataFrame) -> Dict[str, Dict]:
        """Identify potential democracy indicators in the dataset"""
        indicators = {}
        
        for col in df.columns:
            col_lower = col.lower()
            
            # Direct matches with known indicators
            for indicator_key, indicator_info in self.democracy_indicators.items():
                if col_lower == indicator_key or col_lower.endswith(indicator_key):
                    indicators[col] = indicator_info.copy()
                    indicators[col]['original_column'] = col
                    break
            
            # Generic keyword matching
            if col not in indicators:
                for keyword in self.generic_democracy_keywords:
                    if keyword in col_lower:
                        indicators[col] = {
                            'name': col,
                            'scale_range': None,
                            'reverse': False,
                            'original_column': col
                        }
                        break
            
            # For numeric columns, try to infer scale
            if col not in indicators and df[col].dtype in ['int64', 'float64']:
                try:
                    min_val = df[col].min()
                    max_val = df[col].max()
                    unique_count = df[col].nunique()
                    
                    # Potential democracy score if limited range
                    if unique_count < 200 and not pd.isna(min_val) and not pd.isna(max_val):
                        # Common democracy indicator patterns
                        democracy_keywords = ['score', 'index', 'rating', 'rank', 'freedom', 'democracy', 'political', 'civil']
                        if any(keyword in col_lower for keyword in democracy_keywords):
                            indicators[col] = {
                                'name': col,
                                'scale_range': (min_val, max_val),
                                'reverse': 'rank' in col_lower,  # Rankings are typically reversed
                                'original_column': col
                            }
                except:
                    continue
        
        return indicators

    def normalize_to_democracy_scale(self, value: float, scale_range: Tuple[float, float], 
                                   reverse: bool = False) -> float:
        """Normalize value to -10 to +10 democracy scale"""
        if pd.isna(value):
            return np.nan
            
        min_val, max_val = scale_range
        
        if min_val == max_val:
            return 0.0
        
        # Normalize to 0-1 first
        normalized = (value - min_val) / (max_val - min_val)
        
        # Reverse if needed (for indicators where lower is better)
        if reverse:
            normalized = 1 - normalized
        
        # Scale to -10 to +10 range (0.5 normalized = 0 democracy score)
        democracy_score = (normalized - 0.5) * 20
        
        # Clip to valid range
        return max(-10, min(10, democracy_score))

    def process_dataset(self, dataset_name: str) -> Dict[str, Any]:
        """Process a single dataset to extract Korea democracy data"""
        dataset_path = self.dataset_root / dataset_name
        dataset_results = {
            'dataset_name': dataset_name,
            'files_processed': 0,
            'korea_data_found': 0,
            'years_covered': [],
            'indicators_found': {},
            'time_series_data': {}
        }
        
        print(f"\n📂 Processing dataset: {dataset_name}")
        
        if not dataset_path.exists() or not dataset_path.is_dir():
            print(f"❌ Dataset directory not found: {dataset_path}")
            return dataset_results
        
        # Find all CSV files (excluding samples for now)
        csv_files = []
        for root, dirs, files in os.walk(dataset_path):
            for file in files:
                if file.endswith('.csv') and not file.endswith('.sample'):
                    csv_files.append(Path(root) / file)
        
        print(f"Found {len(csv_files)} CSV files")
        
        for csv_file in csv_files:
            try:
                print(f"  📄 Processing: {csv_file.name}")
                df = self.safe_read_csv(csv_file)
                
                if df is None:
                    print(f"    ❌ Could not read file")
                    continue
                
                dataset_results['files_processed'] += 1
                
                # Find Korea data
                korea_rows, korea_columns = self.find_korea_data(df)
                
                if not korea_rows:
                    print(f"    ❌ No Korea data found")
                    continue
                
                dataset_results['korea_data_found'] += 1
                print(f"    ✅ Found {len(korea_rows)} Korea rows in columns: {korea_columns}")
                
                # Extract years
                years = self.extract_year_from_data(df, korea_rows)
                dataset_results['years_covered'].extend(years)
                
                if years:
                    print(f"    📅 Years: {min(years)}-{max(years)} ({len(years)} years)")
                
                # Identify democracy indicators
                indicators = self.identify_democracy_indicators(df)
                print(f"    📊 Democracy indicators found: {len(indicators)}")
                
                # Extract time series data for each indicator
                for indicator_col, indicator_info in indicators.items():
                    for row_idx in korea_rows:
                        try:
                            # Get year for this row
                            row_years = self.extract_year_from_data(df, [row_idx])
                            if not row_years:
                                continue
                            
                            year = row_years[0]
                            raw_value = df.iloc[row_idx][indicator_col]
                            
                            if pd.notna(raw_value) and isinstance(raw_value, (int, float)):
                                # Normalize the value
                                if indicator_info.get('scale_range'):
                                    normalized_value = self.normalize_to_democracy_scale(
                                        raw_value, 
                                        indicator_info['scale_range'],
                                        indicator_info.get('reverse', False)
                                    )
                                else:
                                    # If no scale info, try to infer
                                    if raw_value >= 0 and raw_value <= 1:
                                        normalized_value = (raw_value - 0.5) * 20
                                    elif raw_value >= 0 and raw_value <= 100:
                                        normalized_value = ((raw_value / 100) - 0.5) * 20
                                    else:
                                        normalized_value = raw_value
                                
                                # Store in time series
                                indicator_key = f"{dataset_name}_{indicator_col}"
                                if indicator_key not in dataset_results['time_series_data']:
                                    dataset_results['time_series_data'][indicator_key] = {
                                        'name': indicator_info['name'],
                                        'dataset': dataset_name,
                                        'original_column': indicator_col,
                                        'data': {}
                                    }
                                
                                dataset_results['time_series_data'][indicator_key]['data'][year] = {
                                    'raw_value': raw_value,
                                    'normalized_value': normalized_value
                                }
                        except Exception as e:
                            continue
                
                dataset_results['indicators_found'].update(indicators)
                
            except Exception as e:
                print(f"    ❌ Error processing {csv_file.name}: {str(e)}")
                continue
        
        # Clean up years
        dataset_results['years_covered'] = sorted(list(set(dataset_results['years_covered'])))
        
        print(f"  📊 Dataset summary:")
        print(f"    Files processed: {dataset_results['files_processed']}")
        print(f"    Files with Korea data: {dataset_results['korea_data_found']}")
        print(f"    Years covered: {len(dataset_results['years_covered'])}")
        print(f"    Time series indicators: {len(dataset_results['time_series_data'])}")
        
        return dataset_results

    def integrate_all_datasets(self) -> Dict[str, Any]:
        """Process all datasets and integrate Korea democracy data"""
        print("=" * 80)
        print("KOREA DEMOCRACY DATA INTEGRATION")
        print("=" * 80)
        
        all_results = {}
        all_years = set()
        all_time_series = {}
        
        # Get list of dataset directories
        dataset_dirs = [d for d in self.dataset_root.iterdir() if d.is_dir()]
        
        for dataset_dir in dataset_dirs:
            dataset_name = dataset_dir.name
            results = self.process_dataset(dataset_name)
            all_results[dataset_name] = results
            
            # Collect all years and time series
            all_years.update(results['years_covered'])
            all_time_series.update(results['time_series_data'])
        
        # Create integrated timeline
        all_years = sorted(list(all_years))
        
        print(f"\n{'='*20} INTEGRATION SUMMARY {'='*20}")
        print(f"Total datasets processed: {len(all_results)}")
        print(f"Overall time coverage: {min(all_years) if all_years else 'N/A'} - {max(all_years) if all_years else 'N/A'}")
        print(f"Total years with data: {len(all_years)}")
        print(f"Total time series indicators: {len(all_time_series)}")
        
        # Create web-optimized data structure
        web_data = self.create_web_data_structure(all_years, all_time_series)
        
        return {
            'dataset_results': all_results,
            'all_years': all_years,
            'time_series': all_time_series,
            'web_data': web_data
        }

    def create_web_data_structure(self, all_years: List[int], time_series: Dict[str, Any]) -> Dict[str, Any]:
        """Create web-optimized data structure for the visualization"""
        
        # Create timeline with all years
        timeline_data = []
        
        for year in all_years:
            year_data = {
                'year': year,
                'democracy_score': None,
                'indicators': {},
                'data_sources': []
            }
            
            # Collect all indicator values for this year
            year_indicators = []
            
            for series_key, series_info in time_series.items():
                if year in series_info['data']:
                    data_point = series_info['data'][year]
                    year_data['indicators'][series_key] = {
                        'name': series_info['name'],
                        'dataset': series_info['dataset'],
                        'raw_value': data_point['raw_value'],
                        'normalized_value': data_point['normalized_value']
                    }
                    year_data['data_sources'].append(series_info['dataset'])
                    year_indicators.append(data_point['normalized_value'])
            
            # Calculate composite democracy score (average of available indicators)
            if year_indicators:
                year_data['democracy_score'] = np.mean(year_indicators)
                year_data['data_sources'] = list(set(year_data['data_sources']))
            
            timeline_data.append(year_data)
        
        # Create metadata
        metadata = {
            'generated_at': datetime.now().isoformat(),
            'total_years': len(all_years),
            'year_range': {
                'start': min(all_years) if all_years else None,
                'end': max(all_years) if all_years else None
            },
            'datasets_used': list(set(series_info['dataset'] for series_info in time_series.values())),
            'indicators_count': len(time_series),
            'description': 'South Korea democracy indicators integrated from multiple datasets',
            'democracy_score_scale': {
                'min': -10,
                'max': 10,
                'description': 'Normalized democracy score where -10 is least democratic and +10 is most democratic'
            }
        }
        
        # Create web-ready structure
        web_data = {
            'metadata': metadata,
            'timeline': timeline_data,
            'indicators_info': {
                series_key: {
                    'name': series_info['name'],
                    'dataset': series_info['dataset'],
                    'original_column': series_info['original_column']
                }
                for series_key, series_info in time_series.items()
            }
        }
        
        return web_data

    def fill_data_gaps(self, web_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fill gaps in time series data using interpolation"""
        timeline = web_data['timeline']
        
        if len(timeline) < 2:
            return web_data
        
        # Sort by year
        timeline.sort(key=lambda x: x['year'])
        
        # Fill missing years in the range
        start_year = timeline[0]['year']
        end_year = timeline[-1]['year']
        
        filled_timeline = []
        
        for year in range(start_year, end_year + 1):
            # Find existing data for this year
            existing_data = next((item for item in timeline if item['year'] == year), None)
            
            if existing_data:
                filled_timeline.append(existing_data)
            else:
                # Create interpolated data point
                interpolated_data = {
                    'year': year,
                    'democracy_score': None,
                    'indicators': {},
                    'data_sources': ['interpolated']
                }
                
                # Simple linear interpolation for democracy score
                before_data = None
                after_data = None
                
                for item in timeline:
                    if item['year'] < year and item['democracy_score'] is not None:
                        before_data = item
                    elif item['year'] > year and item['democracy_score'] is not None:
                        after_data = item
                        break
                
                if before_data and after_data:
                    # Linear interpolation
                    x1, y1 = before_data['year'], before_data['democracy_score']
                    x2, y2 = after_data['year'], after_data['democracy_score']
                    
                    interpolated_score = y1 + (y2 - y1) * (year - x1) / (x2 - x1)
                    interpolated_data['democracy_score'] = interpolated_score
                
                filled_timeline.append(interpolated_data)
        
        web_data['timeline'] = filled_timeline
        web_data['metadata']['interpolation_applied'] = True
        
        return web_data

    def save_web_data(self, web_data: Dict[str, Any], output_file: str = "korea_democracy_data.json"):
        """Save web-optimized data to JSON file"""
        # Apply gap filling
        web_data = self.fill_data_gaps(web_data)
        
        # Save to JSON
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(web_data, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\n✅ Web-optimized data saved to: {output_file}")
        
        # Also save a compact version for production
        compact_file = output_file.replace('.json', '_compact.json')
        with open(compact_file, 'w', encoding='utf-8') as f:
            json.dump(web_data, f, separators=(',', ':'), ensure_ascii=False, default=str)
        
        print(f"✅ Compact version saved to: {compact_file}")
        
        return output_file

    def generate_data_summary(self, integration_results: Dict[str, Any]) -> str:
        """Generate a comprehensive summary of the data integration"""
        web_data = integration_results['web_data']
        timeline = web_data['timeline']
        metadata = web_data['metadata']
        
        summary = []
        summary.append("=" * 80)
        summary.append("KOREA DEMOCRACY DATA INTEGRATION SUMMARY")
        summary.append("=" * 80)
        
        summary.append(f"\n📊 Data Coverage:")
        summary.append(f"  Time range: {metadata['year_range']['start']} - {metadata['year_range']['end']}")
        summary.append(f"  Total years: {metadata['total_years']}")
        summary.append(f"  Data points: {len([t for t in timeline if t['democracy_score'] is not None])}")
        summary.append(f"  Datasets used: {len(metadata['datasets_used'])}")
        summary.append(f"  Total indicators: {metadata['indicators_count']}")
        
        summary.append(f"\n📈 Democracy Score Trends:")
        scores_with_years = [(t['year'], t['democracy_score']) for t in timeline if t['democracy_score'] is not None]
        if scores_with_years:
            scores_with_years.sort()
            first_year, first_score = scores_with_years[0]
            last_year, last_score = scores_with_years[-1]
            avg_score = np.mean([score for _, score in scores_with_years])
            
            summary.append(f"  First data point: {first_year} (score: {first_score:.2f})")
            summary.append(f"  Latest data point: {last_year} (score: {last_score:.2f})")
            summary.append(f"  Average score: {avg_score:.2f}")
            summary.append(f"  Trend: {'↗️ Improving' if last_score > first_score else '↘️ Declining' if last_score < first_score else '➡️ Stable'}")
        
        summary.append(f"\n📋 Dataset Contributions:")
        for dataset_name in metadata['datasets_used']:
            dataset_years = [t['year'] for t in timeline if dataset_name in t.get('data_sources', [])]
            if dataset_years:
                summary.append(f"  {dataset_name}: {len(dataset_years)} years ({min(dataset_years)}-{max(dataset_years)})")
        
        summary.append(f"\n🔧 Data Quality:")
        interpolated_years = [t['year'] for t in timeline if 'interpolated' in t.get('data_sources', [])]
        summary.append(f"  Interpolated data points: {len(interpolated_years)}")
        summary.append(f"  Data completeness: {(len(scores_with_years)/metadata['total_years']*100):.1f}%")
        
        summary.append(f"\n📱 Web Integration:")
        summary.append(f"  Ready for web app: ✅")
        summary.append(f"  JSON file size: ~{len(json.dumps(web_data))//1024}KB")
        summary.append(f"  Performance optimized: ✅")
        
        summary.append(f"\n🚀 Next Steps:")
        summary.append(f"  1. Replace generateSampleData() in web app")
        summary.append(f"  2. Load korea_democracy_data.json via fetch API")
        summary.append(f"  3. Update data processing logic to use real data")
        summary.append(f"  4. Add loading states and error handling")
        summary.append(f"  5. Test with real data and adjust visualization")
        
        return "\n".join(summary)

# Main execution
if __name__ == "__main__":
    # Configuration
    DATASET_ROOT = "/mnt/c/home/cs416/jl298.github.io/dataset"
    
    print("🚀 Starting Korea Democracy Data Integration...")
    print(f"📁 Dataset root: {DATASET_ROOT}")
    
    # Initialize integrator
    integrator = KoreaDemocracyDataIntegrator(DATASET_ROOT)
    
    # Run complete integration
    results = integrator.integrate_all_datasets()
    
    # Save web-optimized data
    json_file = integrator.save_web_data(results['web_data'])
    
    # Generate and save summary
    summary = integrator.generate_data_summary(results)
    print(summary)
    
    with open("korea_democracy_integration_summary.txt", "w", encoding="utf-8") as f:
        f.write(summary)
    
    # Save detailed results for analysis
    with open("korea_democracy_detailed_results.json", "w", encoding="utf-8") as f:
        json.dump(results['dataset_results'], f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\n🎉 Integration Complete!")
    print(f"📊 Web data: {json_file}")
    print(f"📋 Summary: korea_democracy_integration_summary.txt")
    print(f"🔍 Detailed results: korea_democracy_detailed_results.json")
    print(f"\n💡 Ready to integrate with web app!")
