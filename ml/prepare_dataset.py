from __future__ import annotations

import re
import sys

import numpy as np
import pandas as pd

# How to run: Run this script in the same folder as the joined dataset named "cre22_master_dataset_test_output"
# In your terminal: python prepare_dataset.py cre22_master_dataset_test_output.csv cre22_master_dataset_cleaned.csv
# This will output the cleaned dataset "cre22_master_dataset_cleaned.csv"
# Optionally you can do this in your terminal to get a report on the cleaning as well:
# python prepare_dataset.py cre22_master_dataset_test_output.csv cre22_master_dataset_cleaned.csv cre22_cleaning_report.csv

def normalize_text(series: pd.Series) -> pd.Series:
    s = series.astype("string").str.upper().str.strip()
    s = s.str.replace(r"\s+", " ", regex=True)
    s = s.replace({
        "": pd.NA,
        "NAN": pd.NA,
        "NONE": pd.NA,
        "NULL": pd.NA,
    })
    return s


def coalesce_columns(df: pd.DataFrame, columns: list[str]) -> pd.Series:
    present = [c for c in columns if c in df.columns]
    if not present:
        return pd.Series(pd.NA, index=df.index, dtype="object")

    s = df[present[0]].copy()
    for c in present[1:]:
        s = s.combine_first(df[c])
    return s


def to_numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce")


def parse_stories_value(x) -> float:
    if pd.isna(x):
        return np.nan

    s = str(x).strip().lower()
    if not s:
        return np.nan

    s = s.replace("stories", "").replace("story", "").strip()

    mapping = {
        "1 1/4": 1.25,
        "1 1/2": 1.5,
        "1 3/4": 1.75,
        "2 1/4": 2.25,
        "2 1/2": 2.5,
        "2 3/4": 2.75,
    }
    if s in mapping:
        return mapping[s]

    try:
        return float(s)
    except ValueError:
        return np.nan


def parse_bedrooms_value(x) -> float:
    if pd.isna(x):
        return np.nan

    s = str(x).strip().lower()
    if not s:
        return np.nan

    m = re.search(r"(\d+)", s)
    return float(m.group(1)) if m else np.nan


def parse_bathrooms_value(x) -> float:
    if pd.isna(x):
        return np.nan

    s = str(x).strip().lower()
    if not s:
        return np.nan

    nums = re.findall(r"\d+(?:\.\d+)?", s)
    if not nums:
        return np.nan

    value = float(nums[0])

    if "half" in s:
        if len(nums) >= 2:
            value += 0.5 * float(nums[1])
        else:
            value += 0.5

    return value


def normalize_zipcode_value(x):
    if pd.isna(x):
        return pd.NA

    digits = re.sub(r"\D", "", str(x))
    return digits[:5] if len(digits) >= 5 else pd.NA


def split_address_parts(series: pd.Series) -> pd.DataFrame:
    s = normalize_text(series)

    out = pd.DataFrame(index=series.index)
    out["address_norm"] = s

    out["house_number"] = s.str.extract(r"^(\d+)")[0]
    out["house_number"] = pd.to_numeric(out["house_number"], errors="coerce")

    rest = s.str.replace(r"^\d+\s*", "", regex=True)

    out["has_unit"] = rest.str.contains(
        r"\b(APT|UNIT|LOT|FL|FLOOR|STE|SUITE|#)\b",
        regex=True,
        na=False,
    ).astype(int)

    rest_no_unit = rest.str.replace(
        r"\b(APT|UNIT|LOT|FL|FLOOR|STE|SUITE|#)\b.*$",
        "",
        regex=True,
    ).str.strip()

    suffix_map = {
        "STREET": "ST",
        "ST": "ST",
        "ROAD": "RD",
        "RD": "RD",
        "AVENUE": "AVE",
        "AVE": "AVE",
        "LANE": "LN",
        "LN": "LN",
        "DRIVE": "DR",
        "DR": "DR",
        "COURT": "CT",
        "CT": "CT",
        "CIRCLE": "CIR",
        "CIR": "CIR",
        "PLACE": "PL",
        "PL": "PL",
        "BOULEVARD": "BLVD",
        "BLVD": "BLVD",
        "WAY": "WAY",
        "TERRACE": "TER",
        "TER": "TER",
        "PARKWAY": "PKWY",
        "PKWY": "PKWY",
        "HIGHWAY": "HWY",
        "HWY": "HWY",
    }

    suffix_raw = rest_no_unit.str.extract(r"\b([A-Z]+)\s*$")[0]
    out["street_suffix"] = suffix_raw.map(suffix_map)

    out["street_name"] = rest_no_unit.str.replace(r"\b[A-Z]+\s*$", "", regex=True).str.strip()
    out["street_name"] = out["street_name"].replace({"": pd.NA})

    return out


def clean_sale_date(df: pd.DataFrame) -> pd.Series:
    raw = coalesce_columns(df, ["sale_date", "Date Recorded"])
    return pd.to_datetime(raw, errors="coerce")


def prepare_dataset(input_csv: str, output_csv: str, report_csv: str | None = None) -> None:
    df = pd.read_csv(input_csv)

    # Build the target first so we can truthfully drop bad-label rows
    sale_amount_raw = to_numeric(coalesce_columns(df, ["sale_amount", "Sale Amount"]))
    sale_amount_raw = sale_amount_raw.mask(sale_amount_raw <= 0)

    keep_mask = sale_amount_raw.notna()
    dropped_rows = int((~keep_mask).sum())

    df = df.loc[keep_mask].copy().reset_index(drop=True)
    sale_amount_raw = sale_amount_raw.loc[keep_mask].reset_index(drop=True)

    out = pd.DataFrame(index=df.index)

    # Core target and identifiers
    out["sale_amount"] = sale_amount_raw
    out["serial_number"] = to_numeric(coalesce_columns(df, ["Serial Number", "serial_number"]))

    # Dates
    sale_date = clean_sale_date(df)
    out["sale_date"] = sale_date.dt.strftime("%Y-%m-%d")

    fallback_sale_year = to_numeric(coalesce_columns(df, ["sale_year", "list_year", "List Year"]))
    fallback_sale_month = to_numeric(coalesce_columns(df, ["sale_month"]))
    fallback_sale_day = to_numeric(coalesce_columns(df, ["sale_day"]))

    out["sale_year"] = sale_date.dt.year.combine_first(fallback_sale_year)
    out["sale_month"] = sale_date.dt.month.combine_first(fallback_sale_month)
    out["sale_day"] = sale_date.dt.day.combine_first(fallback_sale_day)
    out["sale_quarter"] = np.where(
        out["sale_month"].notna(),
        ((out["sale_month"] - 1) // 3) + 1,
        np.nan,
    )

    out["list_year"] = to_numeric(coalesce_columns(df, ["list_year", "List Year"]))

    # Location and address
    out["town_norm"] = normalize_text(coalesce_columns(df, ["town_norm", "Town"]))

    address_parts = split_address_parts(coalesce_columns(df, ["address_norm", "Address"]))
    out = pd.concat([out, address_parts], axis=1)

    out["zipcode"] = coalesce_columns(df, ["zipcode"]).apply(normalize_zipcode_value).astype("string")

    out["longitude"] = to_numeric(coalesce_columns(df, ["longitude"]))
    out.loc[~out["longitude"].between(-74.5, -71.5), "longitude"] = np.nan

    out["latitude"] = to_numeric(coalesce_columns(df, ["latitude"]))
    out.loc[~out["latitude"].between(40.0, 43.0), "latitude"] = np.nan

    # Property characteristics
    out["assessed_value"] = to_numeric(coalesce_columns(df, ["Assessed Value", "assessed_value"]))
    out["sales_ratio"] = to_numeric(coalesce_columns(df, ["Sales Ratio", "sales_ratio"]))

    out["year_built"] = to_numeric(coalesce_columns(df, ["year_built"]))
    out.loc[(out["year_built"] < 1700) | (out["year_built"] > 2100), "year_built"] = np.nan

    out["stories"] = coalesce_columns(df, ["stories"]).apply(parse_stories_value)
    out["total_bedrms"] = coalesce_columns(df, ["total_bedrms"]).apply(parse_bedrooms_value)
    out["total_bthrms"] = coalesce_columns(df, ["total_bthrms"]).apply(parse_bathrooms_value)
    out.loc[out["total_bthrms"] <= 0, "total_bthrms"] = np.nan

    out["living_area_sqft"] = to_numeric(coalesce_columns(df, ["living_area_sqft"]))
    out.loc[out["living_area_sqft"] <= 0, "living_area_sqft"] = np.nan

    out["style"] = normalize_text(coalesce_columns(df, ["style"]))

    # Macro / external columns, kept as-is except numeric coercion
    out["fiscal_year_end_june30"] = to_numeric(coalesce_columns(df, ["fiscal_year_end_june30"]))
    out["mortgage30us"] = to_numeric(coalesce_columns(df, ["mortgage30us"]))
    out["cpi_cuur0100sa0"] = to_numeric(coalesce_columns(df, ["cpi_cuur0100sa0"]))
    out["unemployment_rate"] = to_numeric(coalesce_columns(df, ["unemployment_rate"]))
    out["housing_supply_actliscouct"] = to_numeric(coalesce_columns(df, ["housing_supply_actliscouct"]))
    out["mill_rate"] = to_numeric(coalesce_columns(df, ["mill_rate"]))
    out["gdp_real_estate"] = to_numeric(coalesce_columns(df, ["gdp_real_estate"]))

    # Simple derived fields that do not invent data
    out["home_age_at_sale"] = out["sale_year"] - out["year_built"]
    out.loc[out["home_age_at_sale"] < 0, "home_age_at_sale"] = np.nan

    out["living_area_sqft_log1p"] = np.where(
        out["living_area_sqft"].notna(),
        np.log1p(out["living_area_sqft"]),
        np.nan,
    )

    out["assessed_value_log1p"] = np.where(
        out["assessed_value"].notna(),
        np.log1p(out["assessed_value"]),
        np.nan,
    )

    out["sale_amount_log1p"] = np.log1p(out["sale_amount"])

    # Remove accidental duplicate column names just in case
    out = out.loc[:, ~out.columns.duplicated()].copy()

    # Write cleaned CSV
    # NaN values are written as blank cells by default
    out.to_csv(output_csv, index=False)

    if report_csv is not None:
        report = pd.DataFrame({
            "column": out.columns,
            "dtype": [str(out[c].dtype) for c in out.columns],
            "missing_count": [int(out[c].isna().sum()) for c in out.columns],
            "non_null_count": [int(out[c].notna().sum()) for c in out.columns],
            "unique_non_null": [int(out[c].nunique(dropna=True)) for c in out.columns],
        })
        summary = pd.DataFrame({
            "metric": [
                "input_rows",
                "output_rows",
                "rows_dropped_for_missing_or_invalid_sale_amount",
            ],
            "value": [
                len(keep_mask),
                len(out),
                dropped_rows,
            ],
        })
        with pd.ExcelWriter(report_csv.replace(".csv", ".xlsx")) as writer:
            report.to_excel(writer, index=False, sheet_name="column_report")
            summary.to_excel(writer, index=False, sheet_name="summary")

    print(f"Cleaned dataset written to: {output_csv}")
    print(f"Rows dropped because sale_amount was missing or invalid: {dropped_rows}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage:")
        print("python prepare_dataset.py input.csv output.csv [report.csv]")
        sys.exit(1)

    input_csv = sys.argv[1]
    output_csv = sys.argv[2]
    report_csv = sys.argv[3] if len(sys.argv) >= 4 else None

    prepare_dataset(input_csv, output_csv, report_csv)