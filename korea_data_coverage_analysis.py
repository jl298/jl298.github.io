#!/usr/bin/env python3
import pandas as pd
import os
import glob
from collections import defaultdict
import re
import csv

def detect_delimiter(file_path, sample_size=5):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
        sample = file.read(1024 * sample_size)

    try:
        sniffer = csv.Sniffer()
        delimiter = sniffer.sniff(sample, delimiters=',;\t|').delimiter
        return delimiter
    except:
        delimiters = [',', ';', '\t', '|']
        delimiter_counts = {}
        
        for delim in delimiters:
            delimiter_counts[delim] = sample.count(delim)

        if delimiter_counts:
            return max(delimiter_counts, key=delimiter_counts.get)
        else:
            return ','

def find_korea_columns_and_data(df):
    korea_patterns = [
        'kor', 'kr', 'rok',
        'korea', 'south korea', 'republic of korea', 'korea, south', 
        'korea (south)', 's. korea', 'korean',
        'corée du sud', 'corée', 'coree du sud', 'coree',
        'corea del sur', 'corea',
        'coreia do sul', 'coreia',
        'korea south', 'south-korea', 's korea'
    ]
    
    korea_data = []
    korea_columns = []

    for col in df.columns:
        col_lower = str(col).lower()

        country_indicators = ['country', 'nation', 'state', 'iso', 'code', 'name', 'territory']
        is_country_column = any(indicator in col_lower for indicator in country_indicators)

        multilingual_indicators = ['en_', 'fr_', 'es_', 'ar_', 'fa_', 'pt_']
        is_multilingual = any(indicator in col_lower for indicator in multilingual_indicators)
        
        if is_country_column or is_multilingual or col_lower in ['iso']:
            korea_columns.append(col)

            for idx, val in df[col].items():
                if pd.isna(val):
                    continue
                    
                val_str = str(val).lower().strip()

                if any(pattern in val_str for pattern in korea_patterns):
                    korea_data.append({
                        'row_index': idx,
                        'column': col,
                        'value': str(df[col].iloc[idx]),
                        'full_row': df.iloc[idx].to_dict()
                    })
                    break

    unique_korea_data = []
    seen_rows = set()
    for data in korea_data:
        if data['row_index'] not in seen_rows:
            unique_korea_data.append(data)
            seen_rows.add(data['row_index'])
    
    return korea_columns, unique_korea_data

def extract_year_info(df, korea_data):
    years = []
    
    # Look for year columns
    year_columns = []
    for col in df.columns:
        col_lower = str(col).lower()
        if any(term in col_lower for term in ['year', 'time', 'date']):
            year_columns.append(col)

    for korea_row in korea_data:
        row_data = korea_row['full_row']

        for year_col in year_columns:
            if year_col in row_data:
                try:
                    year_val = row_data[year_col]
                    if pd.notna(year_val):
                        year_str = str(year_val)
                        year_match = re.search(r'(19|20)\d{2}', year_str)
                        if year_match:
                            years.append(int(year_match.group()))
                except:
                    pass

        if not years:
            for col, val in row_data.items():
                if pd.notna(val):
                    val_str = str(val)
                    if re.match(r'^(19|20)\d{2}$', val_str):
                        try:
                            years.append(int(val_str))
                        except:
                            pass
    
    return sorted(list(set(years)))

def safe_read_csv(csv_file):
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1', 'utf-8-sig']

    try:
        delimiter = detect_delimiter(csv_file)
    except:
        delimiter = ','

    for encoding in encodings:
        try:
            df = pd.read_csv(csv_file, 
                           encoding=encoding, 
                           delimiter=delimiter,
                           low_memory=False,
                           on_bad_lines='skip')

            if len(df) > 0 and len(df.columns) > 1:
                return df, delimiter, encoding
                
        except Exception as e:
            continue

    for delimiter in [';', ',', '\t', '|']:
        for encoding in encodings:
            try:
                df = pd.read_csv(csv_file, 
                               encoding=encoding,
                               delimiter=delimiter,
                               low_memory=False,
                               on_bad_lines='skip')
                
                if len(df) > 0 and len(df.columns) > 1:
                    return df, delimiter, encoding
                    
            except Exception as e:
                continue
    
    return None, None, None

def analyze_dataset_coverage():
    dataset_base = "/mnt/c/home/cs416/jl298.github.io/dataset"
    coverage_results = {}
    
    print("=" * 80)
    print("KOREA DATA COVERAGE ANALYSIS")
    print("=" * 80)
    print()

    for dataset_dir in os.listdir(dataset_base):
        dataset_path = os.path.join(dataset_base, dataset_dir)
        
        if not os.path.isdir(dataset_path):
            continue
            
        print(f"📂 Analyzing: {dataset_dir}")
        print("-" * 60)
        
        dataset_coverage = {
            'files_analyzed': 0,
            'files_with_korea': 0,
            'years_found': [],
            'total_korea_rows': 0,
            'file_details': {}
        }

        csv_files = []
        for root, dirs, files in os.walk(dataset_path):
            for file in files:
                if file.endswith('.csv') and not file.endswith('.sample'):
                    csv_files.append(os.path.join(root, file))
        
        for csv_file in csv_files:
            try:
                print(f"  Reading: {os.path.basename(csv_file)}")

                df, delimiter, encoding = safe_read_csv(csv_file)
                
                if df is None:
                    print(f"    Could not read file with any method")
                    continue
                
                dataset_coverage['files_analyzed'] += 1

                if dataset_dir == 'RSF':
                    print(f"    Detected delimiter: '{delimiter}', encoding: {encoding}")
                    print(f"    Columns: {list(df.columns)[:5]}...")  # Show first 5 columns
                    print(f"    Shape: {df.shape}")

                korea_columns, korea_data = find_korea_columns_and_data(df)
                
                if korea_data:
                    dataset_coverage['files_with_korea'] += 1
                    dataset_coverage['total_korea_rows'] += len(korea_data)

                    years = extract_year_info(df, korea_data)
                    dataset_coverage['years_found'].extend(years)

                    dataset_coverage['file_details'][os.path.basename(csv_file)] = {
                        'korea_rows': len(korea_data),
                        'years': years,
                        'korea_columns': korea_columns,
                        'sample_korea_values': [k['value'] for k in korea_data[:3]],  # First 3 Korea entries
                        'delimiter': delimiter,
                        'encoding': encoding
                    }
                    
                    print(f"    Found {len(korea_data)} Korea rows")
                    if years:
                        print(f"    Years: {min(years)}-{max(years)} ({len(years)} years)")
                    else:
                        print(f"    No clear year information found")

                    if dataset_dir == 'RSF' and korea_data:
                        sample_values = [k['value'] for k in korea_data[:2]]
                        print(f"    Sample Korea values: {sample_values}")
                        
                else:
                    print(f"    No Korea data found")
                    
            except Exception as e:
                print(f"    Error processing {os.path.basename(csv_file)}: {str(e)}")

        all_years = sorted(list(set(dataset_coverage['years_found'])))
        dataset_coverage['year_range'] = (min(all_years), max(all_years)) if all_years else None
        dataset_coverage['unique_years'] = len(all_years)
        
        coverage_results[dataset_dir] = dataset_coverage
        
        print(f"\n  Dataset Summary:")
        print(f"     Files analyzed: {dataset_coverage['files_analyzed']}")
        print(f"     Files with Korea data: {dataset_coverage['files_with_korea']}")
        print(f"     Total Korea rows: {dataset_coverage['total_korea_rows']}")
        print(f"     Unique years: {dataset_coverage['unique_years']}")
        if dataset_coverage['year_range']:
            print(f"     Year range: {dataset_coverage['year_range'][0]}-{dataset_coverage['year_range'][1]}")
        print()
    
    print("=" * 80)
    print("OVERALL COVERAGE SUMMARY")
    print("=" * 80)

    all_dataset_years = {}
    for dataset, info in coverage_results.items():
        if info['years_found']:
            years = sorted(list(set(info['years_found'])))
            all_dataset_years[dataset] = years
            print(f"{dataset:40} | {min(years):4d}-{max(years):4d} | {len(years):3d} years")
    
    print("\n" + "=" * 80)
    print("COMMON TIME PERIODS ANALYSIS")
    print("=" * 80)
    
    if len(all_dataset_years) >= 2:
        year_counts = defaultdict(int)
        for dataset, years in all_dataset_years.items():
            for year in years:
                year_counts[year] += 1

        for min_datasets in range(len(all_dataset_years), 0, -1):
            common_years = [year for year, count in year_counts.items() if count >= min_datasets]
            if common_years:
                common_years.sort()
                print(f"\nYears covered by at least {min_datasets} dataset(s): {len(common_years)} years")
                if common_years:
                    print(f"Range: {min(common_years)}-{max(common_years)}")

                    continuous_periods = []
                    if common_years:
                        current_start = common_years[0]
                        current_end = common_years[0]
                        
                        for i in range(1, len(common_years)):
                            if common_years[i] == current_end + 1:
                                current_end = common_years[i]
                            else:
                                continuous_periods.append((current_start, current_end))
                                current_start = common_years[i]
                                current_end = common_years[i]
                        continuous_periods.append((current_start, current_end))
                    
                    print("Continuous periods:")
                    for start, end in continuous_periods:
                        if start == end:
                            print(f"  - {start} (1 year)")
                        else:
                            print(f"  - {start}-{end} ({end-start+1} years)")

                    if continuous_periods:
                        best_period = max(continuous_periods, key=lambda x: x[1] - x[0])
                        print(f"\nLongest continuous period: {best_period[0]}-{best_period[1]} ({best_period[1]-best_period[0]+1} years)")
                        print("Contributing datasets:")
                        for dataset, years in all_dataset_years.items():
                            overlap = [y for y in years if best_period[0] <= y <= best_period[1]]
                            if overlap:
                                print(f"  - {dataset}: {len(overlap)} years ({min(overlap)}-{max(overlap)})")
                
                break
    
    print("\n" + "=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)

    if all_dataset_years:
        all_years_union = set()
        for years in all_dataset_years.values():
            all_years_union.update(years)
        
        overall_range = (min(all_years_union), max(all_years_union))
        print(f"1. Overall data availability: {overall_range[0]}-{overall_range[1]} ({len(all_years_union)} unique years)")

        best_datasets = sorted(all_dataset_years.items(), key=lambda x: len(x[1]), reverse=True)
        print(f"\n2. Datasets with most Korea data:")
        for i, (dataset, years) in enumerate(best_datasets[:3]):
            print(f"   {i+1}. {dataset}: {len(years)} years ({min(years)}-{max(years)})")

        year_counts = defaultdict(int)
        for years in all_dataset_years.values():
            for year in years:
                year_counts[year] += 1
        
        well_covered_years = [year for year, count in year_counts.items() if count >= max(1, len(all_dataset_years) // 2)]
        if well_covered_years:
            well_covered_years.sort()
            print(f"\n3. Recommended focus period: {min(well_covered_years)}-{max(well_covered_years)}")
            print(f"   ({len(well_covered_years)} years with data from multiple datasets)")
    
    return coverage_results

if __name__ == "__main__":
    results = analyze_dataset_coverage()
