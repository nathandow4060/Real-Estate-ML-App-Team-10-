from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


# Data files are expected in ml/data by default.
# You can still replace these paths with machine-specific locations if needed.

# also run this in command prompt "pip install pandas numpy openpyxl"

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / 'data' # filepath is effectively ml/data

FILES = {
    'sales': DATA_DIR / 'Real_Estate_Sales_2001-2023_with_scrape_data.csv',
    'mortgage': DATA_DIR / 'MORTGAGE30US.csv',
    'cpi': DATA_DIR / 'CPI_CUUR0100SA0.csv',
    'housing_supply': DATA_DIR / 'housing_supply_ACTLISCOUCT.csv',
    'mill_rates': DATA_DIR / 'Mill_Rates_for_FY_2014-2026_20260304.csv',
    'gdp_real_estate': DATA_DIR / 'FRED_ctrerenleargsp.xlsx',
    'unemployment': DATA_DIR / 'BLS_unemployment_2001-2023.csv',
}

for name, path in FILES.items():
    if not path.exists():
        raise FileNotFoundError(f"Missing file for {name}: {path}")


# ------------------------------
# Utilities
# ------------------------------

def normalize_text(series: pd.Series) -> pd.Series:
    return (
        series.astype(str)
        .str.strip()
        .str.upper()
        .str.replace('&', 'AND', regex=False)
        .str.replace(r'\s+', ' ', regex=True)
    )


def merge_asof_back(
    left: pd.DataFrame,
    right: pd.DataFrame,
    left_date_col: str,
    right_date_col: str,
    value_cols: list[str],
    by: list[str] | None = None,
    tolerance: pd.Timedelta | None = None,
) -> pd.DataFrame:
    """
    Backward-looking as-of merge.

    Why backward and not nearest:
    - nearest can pull future information and leak it into the model.
    - backward guarantees we only use information available on or before the sale date.
    """

    left_work = left.copy()
    right_work = right.copy()

    temp_right_date = right_date_col
    if right_date_col in left_work.columns:
        temp_right_date = f'__{right_date_col}_right'
        right_work = right_work.rename(columns={right_date_col: temp_right_date})

    left_valid = left_work[left_work[left_date_col].notna()].copy()
    left_invalid = left_work[left_work[left_date_col].isna()].copy()

    right_valid = right_work[right_work[temp_right_date].notna()].copy()

    left_valid = left_valid.sort_values(left_date_col)
    right_valid = right_valid.sort_values(temp_right_date)

    keep_cols = [temp_right_date] + (by or []) + value_cols

    merged_valid = pd.merge_asof(
        left_valid,
        right_valid[keep_cols],
        left_on=left_date_col,
        right_on=temp_right_date,
        by=by,
        direction='backward',
        tolerance=tolerance,
    )

    if temp_right_date in merged_valid.columns:
        merged_valid = merged_valid.drop(columns=[temp_right_date])

    for col in value_cols:
        left_invalid[col] = np.nan

    merged = pd.concat([merged_valid, left_invalid], axis=0).sort_index()

    return merged


def validate_left_join(
    before: pd.DataFrame,
    after: pd.DataFrame,
    join_name: str,
    added_cols: list[str],
    unique_key_cols: list[str],
) -> dict[str, Any]:
    out: dict[str, Any] = {
        'join_name': join_name,
        'rows_before': int(len(before)),
        'rows_after': int(len(after)),
        'row_count_ok': int(len(before)) == int(len(after)),
        'duplicate_key_rows_after': int(after.duplicated(unique_key_cols).sum()),
        'match_rates': {},
    }
    for col in added_cols:
        out['match_rates'][col] = round(float(after[col].notna().mean()) * 100, 2)
    return out


# ------------------------------
# Primary dataset
# ------------------------------

def load_primary_sales(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, low_memory=False)

    df['sale_date'] = pd.to_datetime(df['Date Recorded'], errors='coerce')
    df['sale_year'] = df['sale_date'].dt.year
    df['sale_month'] = df['sale_date'].dt.month
    df['sale_day'] = df['sale_date'].dt.day
    df['sale_month_start'] = df['sale_date'].values.astype('datetime64[M]')

    df['town_norm'] = normalize_text(df['Town'])
    df['address_norm'] = normalize_text(df['Address'])
    df['state'] = 'CT'

    df['living_area_sqft'] = pd.to_numeric(
        df['living_area_sqft'].astype(str).str.replace(',', '', regex=False),
        errors='coerce',
    )
    df['sale_amount'] = pd.to_numeric(df['Sale Amount'], errors='coerce')
    df['list_year'] = pd.to_numeric(df['List Year'], errors='coerce')

    # Mill-rate join helper.
    # A CT fiscal year ending June 30 is:
    # sale month Jul-Dec  -> current sale year + 1
    # sale month Jan-Jun  -> current sale year
    df['fiscal_year_end_june30'] = np.where(
        df['sale_date'].dt.month >= 7,
        df['sale_date'].dt.year + 1,
        df['sale_date'].dt.year,
    )

    return df


# ------------------------------
# Auxiliary loaders
# ------------------------------

def load_mortgage30us(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df['obs_date'] = pd.to_datetime(df['observation_date'])
    df['mortgage30us'] = pd.to_numeric(df['MORTGAGE30US'], errors='coerce')
    return df[['obs_date', 'mortgage30us']].dropna().drop_duplicates('obs_date').sort_values('obs_date')

"""
def load_dgs10(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df['obs_date'] = pd.to_datetime(df['observation_date'])
    df['dgs10'] = pd.to_numeric(df['DGS10'], errors='coerce')
    return df[['obs_date', 'dgs10']].dropna().drop_duplicates('obs_date').sort_values('obs_date')
"""

def load_cpi(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df['obs_date'] = pd.to_datetime(df['observation_date'])
    df['cpi_cuur0100sa0'] = pd.to_numeric(df['CUUR0100SA0'], errors='coerce')
    df = df[['obs_date', 'cpi_cuur0100sa0']].dropna().drop_duplicates('obs_date').sort_values('obs_date')
    df['sale_month_start'] = df['obs_date']
    return df[['sale_month_start', 'cpi_cuur0100sa0']]


def _parse_bls_json(path: Path) -> pd.DataFrame:
    with open(path, 'r', encoding='utf-8') as f:
        payload = json.load(f)

    rows: list[dict[str, Any]] = []
    for row in payload['Results']['series'][0]['data']:
        period = row.get('period')
        if not isinstance(period, str) or not period.startswith('M'):
            continue
        rows.append(
            {
                'obs_date': pd.Timestamp(
                    year=int(row['year']),
                    month=int(period[1:]),
                    day=1,
                ),
                'unemployment_rate': pd.to_numeric(row['value'], errors='coerce'),
            }
        )

    return pd.DataFrame(rows)


"""
def load_unemployment(path_1: Path, path_2: Path) -> pd.DataFrame:
    df = pd.concat([_parse_bls_json(path_1), _parse_bls_json(path_2)], ignore_index=True)
    df = df.sort_values('obs_date').drop_duplicates('obs_date', keep='last').dropna()
    df['sale_month_start'] = df['obs_date']
    return df[['sale_month_start', 'unemployment_rate']]
"""

def load_housing_supply(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df['obs_date'] = pd.to_datetime(df['observation_date'])
    df['housing_supply_actliscouct'] = pd.to_numeric(df['ACTLISCOUCT'], errors='coerce')
    df = df[['obs_date', 'housing_supply_actliscouct']].dropna().drop_duplicates('obs_date').sort_values('obs_date')
    df['sale_month_start'] = df['obs_date']
    return df[['sale_month_start', 'housing_supply_actliscouct']]


def load_mill_rates(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)

    # Important: keep only the base municipality row.
    # Service-district rows create duplicate town-year pairs and break a clean m:1 merge.
    df = df[df['Service District Code'].astype(str).eq('0')].copy()

    df['town_norm'] = normalize_text(df['Municipality/District'])
    df['fiscal_year_end_june30'] = pd.to_numeric(df['Fiscal Year End June 30'], errors='coerce')
    df['mill_rate'] = pd.to_numeric(df['Mill Rate'], errors='coerce')

    return (
        df[['town_norm', 'fiscal_year_end_june30', 'mill_rate', 'Grand List Year', 'Municipality/District']]
        .drop_duplicates(['town_norm', 'fiscal_year_end_june30'])
    )

def load_unemployment(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df['sale_month_start'] = pd.to_datetime(df['date'])
    df['unemployment_rate'] = pd.to_numeric(df['value'], errors='coerce')
    return (
        df[['sale_month_start', 'unemployment_rate']]
        .dropna()
        .drop_duplicates('sale_month_start')
        .sort_values('sale_month_start')
    )

def load_gdp_real_estate(path: Path) -> pd.DataFrame:
    df = pd.read_excel(path)
    df['year'] = pd.to_datetime(df['date']).dt.year

    # Use year-end availability to avoid same-year lookahead leakage.
    df['obs_date'] = pd.to_datetime(df['year'].astype(str) + '-12-31')
    df['gdp_real_estate'] = pd.to_numeric(df['gdp_real_estate'], errors='coerce')

    return df[['obs_date', 'gdp_real_estate']].dropna().drop_duplicates('obs_date').sort_values('obs_date')

"""
def load_qwi_hira(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, low_memory=False)

    # Restrict to statewide, all-private, all-sector, all-demographic rows.
    mask = (df['geo_level'] == 'S')
    mask &= (df['industry'] == 0)
    mask &= (df['ownercode'] == 'A05')
    mask &= (df['sex'] == 0)
    mask &= (df['agegrp'] == 'A00')
    mask &= (df['race'] == 'A0')
    mask &= (df['ethnicity'] == 'A0')
    mask &= (df['education'] == 'E0')
    mask &= (df['firmage'] == 0)
    mask &= (df['firmsize'] == 0)

    df = df[mask].copy()
    df['year'] = df['year'].astype(int)
    df['quarter'] = df['quarter'].astype(int)
    df['obs_date'] = pd.PeriodIndex.from_fields(
        year=df['year'],
        quarter=df['quarter'],
        freq='Q-DEC',
    ).to_timestamp(how='end').normalize()
    df['qwi_hira'] = pd.to_numeric(df['HirA'], errors='coerce')

    return df[['obs_date', 'qwi_hira']].dropna().drop_duplicates('obs_date').sort_values('obs_date')
"""

# ------------------------------
# Merge steps
# ------------------------------

def add_mortgage30us(df: pd.DataFrame) -> pd.DataFrame:
    right = load_mortgage30us(FILES['mortgage'])
    return merge_asof_back(df, right, 'sale_date', 'obs_date', ['mortgage30us'])

"""
def add_dgs10(df: pd.DataFrame) -> pd.DataFrame:
    right = load_dgs10(FILES['dgs10'])
    return merge_asof_back(df, right, 'sale_date', 'obs_date', ['dgs10'])
"""

def add_cpi(df: pd.DataFrame) -> pd.DataFrame:
    right = load_cpi(FILES['cpi'])
    return df.merge(right, on='sale_month_start', how='left', validate='m:1')

"""
def add_unemployment(df: pd.DataFrame) -> pd.DataFrame:
    right = load_unemployment(FILES['unemployment_1'], FILES['unemployment_2'])
    return df.merge(right, on='sale_month_start', how='left', validate='m:1')
"""

def add_housing_supply(df: pd.DataFrame) -> pd.DataFrame:
    right = load_housing_supply(FILES['housing_supply'])
    return df.merge(right, on='sale_month_start', how='left', validate='m:1')


def add_mill_rates(df: pd.DataFrame) -> pd.DataFrame:
    right = load_mill_rates(FILES['mill_rates'])
    return df.merge(
        right[['town_norm', 'fiscal_year_end_june30', 'mill_rate']],
        on=['town_norm', 'fiscal_year_end_june30'],
        how='left',
        validate='m:1',
    )


def add_gdp_real_estate(df: pd.DataFrame) -> pd.DataFrame:
    right = load_gdp_real_estate(FILES['gdp_real_estate'])
    return merge_asof_back(df, right, 'sale_date', 'obs_date', ['gdp_real_estate'])

def add_unemployment(df: pd.DataFrame) -> pd.DataFrame:
    right = load_unemployment(FILES['unemployment'])
    return df.merge(right, on='sale_month_start', how='left', validate='m:1')

"""
def add_qwi_hira(df: pd.DataFrame) -> pd.DataFrame:
    right = load_qwi_hira(FILES['qwi_hira'])
    return merge_asof_back(df, right, 'sale_date', 'obs_date', ['qwi_hira'])
"""

# ------------------------------
# Pipeline
# ------------------------------

def build_master_dataset() -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    unique_key_cols = ['List Year', 'Date Recorded', 'Town', 'Address']
    checks: list[dict[str, Any]] = []

    df = load_primary_sales(FILES['sales'])
    print("Rows with missing sale_date:", int(df['sale_date'].isna().sum()))
    checks.append(
        {
            'join_name': 'primary_sales_loaded',
            'rows': int(len(df)),
            'duplicate_key_rows': int(df.duplicated(unique_key_cols).sum()),
            'duplicate_serial_number_rows': int(df['Serial Number'].duplicated().sum()),
            'sale_date_min': str(df['sale_date'].min().date()) if df['sale_date'].notna().any() else None,
            'sale_date_max': str(df['sale_date'].max().date()) if df['sale_date'].notna().any() else None,
        }
    )

    for join_name, fn, added_cols in [
        ('mortgage30us', add_mortgage30us, ['mortgage30us']),
        ('cpi', add_cpi, ['cpi_cuur0100sa0']),
        ('unemployment', add_unemployment, ['unemployment_rate']),
        ('housing_supply', add_housing_supply, ['housing_supply_actliscouct']),
        ('mill_rates', add_mill_rates, ['mill_rate']),
        ('gdp_real_estate', add_gdp_real_estate, ['gdp_real_estate']),
    ]:
        before = df.copy()
        df = fn(df)
        checks.append(validate_left_join(before, df, join_name, added_cols, unique_key_cols))

    return df, checks

if __name__ == '__main__':
    merged_df, checks = build_master_dataset()
    out_csv = DATA_DIR / 'cre22_master_dataset_test_output.csv'
    out_json = DATA_DIR / 'cre22_merge_validation.json'
    merged_df.to_csv(out_csv, index=False)
    out_json.write_text(json.dumps(checks, indent=2), encoding='utf-8')
    print(f'Wrote {out_csv}')
    print(f'Wrote {out_json}')
