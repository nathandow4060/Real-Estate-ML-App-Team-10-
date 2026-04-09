from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np

#GLOBAL VARS
# years are inclusive
TRAIN_START_YEAR = 2004
TRAIN_END_YEAR = 2017
HOLDOUT_START_YEAR = 2018
HOLDOUT_END_YEAR = 2020


# Paths relative to this file (works no matter what directory you run the script from)
_ML_DIR = Path(__file__).resolve().parent
_DEFAULT_INPUT_CSV = _ML_DIR / "data" / "cre22_master_dataset_cleaned.csv"
_DEFAULT_OUTPUT_DIR = _ML_DIR / "data"
import pandas as pd


TARGET_COLUMN = "sale_amount_log1p"

TEXT_COLUMNS = [
    "sale_date",
    "town_norm",
    "address_norm",
    "street_suffix",
    "street_name",
    "style",
]

LEAKAGE_COLUMNS = [
    "sale_amount",
    "sales_ratio",
    "assessed_value",
    "assessed_value_log1p",
]

IDENTIFIER_COLUMNS = ["serial_number"]

REQUIRED_NON_NULL_COLUMNS = [
    "house_number",
    "zipcode",
    "longitude",
    "latitude",
    "year_built",
    "stories",
    "total_bedrms",
    "total_bthrms",
    "living_area_sqft",
    "style_encoded",
    "living_area_sqft_log1p",
]


def print_null_percentages(df: pd.DataFrame) -> None:
    null_pct = (df.isna().mean() * 100).sort_values(ascending=False)
    print("\nNull percentage by column:")
    print(null_pct.to_string())



def preprocess_dataset(
    input_csv: str | Path,
    output_csv: str | Path,
    target_column: str = TARGET_COLUMN,
) -> pd.DataFrame:
    df = pd.read_csv(input_csv)

    # add index to dataset for predictions context
    df.insert(0, "index", np.arange(len(df)))

    print(f"Loaded dataset shape: {df.shape}")
    print_null_percentages(df)

    rows_before = len(df)
    df = df.dropna(subset=[target_column]).copy()
    print(f"\nDropped {rows_before - len(df)} rows with null target values in '{target_column}'")

    rows_before = len(df)
    df = df.dropna(subset=REQUIRED_NON_NULL_COLUMNS).copy()
    print(f"Dropped {rows_before - len(df)} rows with null values in required feature columns")

    # save a copy of the dataframe with row indices; save after row drops, before column drops
    df.to_csv(_DEFAULT_OUTPUT_DIR / "predictions" / "df_predictions_context.csv", index=False, encoding="utf-8")

    columns_to_drop = TEXT_COLUMNS + LEAKAGE_COLUMNS + IDENTIFIER_COLUMNS
    columns_to_drop = [col for col in columns_to_drop if col in df.columns]

    print("\nDropping columns:")
    for col in columns_to_drop:
        print(f"  - {col}")

    df = df.drop(columns=columns_to_drop).copy()

    df = df.select_dtypes(include=[np.number]).copy()

    assert target_column in df.columns, (
        f"Target column '{target_column}' is missing after preprocessing."
    )

    remaining_nulls = df.isna().sum()
    remaining_nulls = remaining_nulls[remaining_nulls > 0].sort_values(ascending=False)

    if len(remaining_nulls) > 0:
        print("\nRemaining null counts:")
        print(remaining_nulls.to_string())
        print("\nKeeping these nulls for later train-only imputation to avoid leakage.")

    assert all(np.issubdtype(dtype, np.number) for dtype in df.dtypes), (
        "Non-numeric columns remain."
    )

    print(f"\nFinal processed shape: {df.shape}")
    print("\nFinal columns:")
    for col in df.columns:
        print(f"  - {col}")

    output_csv = Path(output_csv)
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_csv, index=False)
    print(f"\nSaved processed dataset to: {output_csv}")

    return df



def split_processed_dataset(
    input_csv: str | Path,
    output_dir: str | Path,
    target_column: str = TARGET_COLUMN,
    train_start_year: int = TRAIN_START_YEAR,
    train_end_year: int = TRAIN_END_YEAR, 
    holdout_start_year: int = HOLDOUT_START_YEAR,
    holdout_end_year: int = HOLDOUT_END_YEAR, 
) -> dict[str, np.ndarray]:
    df = pd.read_csv(input_csv)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # TEMP KEEP ONLY SUBSET OF TRAINING DATA
    #df = df.sample(n=1000, random_state=42).reset_index(drop=True)  # subset for faster iteration while developing

    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' was not found in the dataset.")

    if "sale_year" not in df.columns:
        raise ValueError("The dataset must contain a 'sale_year' column for temporal splitting.")

    feature_columns = [col for col in df.columns if col not in (target_column, "index")]

    train_mask = (df["sale_year"] >= train_start_year) & (df["sale_year"] <= train_end_year)
    #holdout_mask = df["sale_year"] == holdout_year

    train_df = df.loc[train_mask].copy()
    #holdout_df = df.loc[holdout_mask].copy()

    sort_columns = [
        col for col in ["sale_year", "sale_month", "sale_day"] if col in df.columns
    ]
    # For each year in the holdout range, sort chronologically and split in half
    # The earlier half goes to validation, the later half goes to test. Idea is to attempt to balance testing capability of validation and test set
    validation_parts = []
    test_parts = []
    for year in range(holdout_start_year, holdout_end_year + 1):
        year_df = df.loc[df["sale_year"] == year].copy()
        if sort_columns:
            year_df = year_df.sort_values(sort_columns, kind="stable").reset_index(drop=True)
        else:
            year_df = year_df.reset_index(drop=True)
        split_index = (len(year_df) + 1) // 2
        validation_parts.append(year_df.iloc[:split_index].copy())
        test_parts.append(year_df.iloc[split_index:].copy())

    validation_df = pd.concat(validation_parts, ignore_index=True) if validation_parts else pd.DataFrame(columns=df.columns)
    test_df = pd.concat(test_parts, ignore_index=True) if test_parts else pd.DataFrame(columns=df.columns)

    x_train = train_df[feature_columns].to_numpy()
    y_train = train_df[target_column].to_numpy()

    x_val = validation_df[feature_columns].to_numpy()
    y_val = validation_df[target_column].to_numpy()

    x_test = test_df[feature_columns].to_numpy()
    y_test = test_df[target_column].to_numpy()

    X_train_indices = train_df["index"].to_numpy()
    y_train_indices = train_df["index"].to_numpy()
    X_val_indices = validation_df["index"].to_numpy()
    y_val_indices = validation_df["index"].to_numpy()
    X_test_indices = test_df["index"].to_numpy()
    y_test_indices = test_df["index"].to_numpy()

    arrays = {
        "x_train": x_train,
        "y_train": y_train,
        "x_val": x_val,
        "y_val": y_val,
        "x_test": x_test,
        "y_test": y_test,
    }

    for name, array in arrays.items():
        file_path = output_dir / f"{name}.npy"
        np.save(file_path, array)
        print(f"Saved {name} to {file_path} with shape {array.shape}")

    archive_path = output_dir / "dataset_splits.npz"
    np.savez_compressed(
        archive_path,
        x_train=x_train,
        y_train=y_train,
        x_val=x_val,
        y_val=y_val,
        x_test=x_test,
        y_test=y_test,
    )
    print(f"Saved compressed archive to {archive_path}")

    indices_path = output_dir / "dataset_component_indices.npz"
    np.savez_compressed(
        indices_path,
        X_train_indices=X_train_indices,
        y_train_indices=y_train_indices,
        X_val_indices=X_val_indices,
        y_val_indices=y_val_indices,
        X_test_indices=X_test_indices,
        y_test_indices=y_test_indices,
    )
    print(f"Saved index arrays to {indices_path}")

    total_rows = len(df)
    print("\nSplit summary:")
    print(f"  Train rows ({train_start_year}-{train_end_year}): {len(train_df)}    {(len(train_df) / total_rows)*100:.2f}%")
    print(
        f"  Validation rows ({holdout_start_year}-{holdout_end_year}, first half after chronological split): "
        f"{len(validation_df)}     {(len(validation_df) / total_rows)*100:.2f}%"
    )
    print(
        f"  Test rows ({holdout_start_year}-{holdout_end_year}, second half after chronological split): {len(test_df)}     {(len(test_df) / total_rows)*100:.2f}%"
    )

    available_years = sorted(df["sale_year"].dropna().astype(int).unique().tolist())
    print(f"  Available sale_year range in input file: {available_years[0]} to {available_years[-1]}")

    if len(validation_df) and len(test_df) == 0:
        print(
            f"\nWARNING: No rows were found for {holdout_start_year}-{holdout_end_year}. "
            "Validation and test arrays were saved as empty arrays."
        )

    return arrays



def run_pipeline(
    input_csv: str | Path,
    output_dir: str | Path = ".",
    processed_filename: str = "master_dataset_processed_numeric.csv",
    target_column: str = TARGET_COLUMN,
    train_start_year: int = TRAIN_START_YEAR,
    train_end_year: int = TRAIN_END_YEAR, 
    holdout_start_year: int = HOLDOUT_START_YEAR,
    holdout_end_year: int = HOLDOUT_END_YEAR,
) -> dict[str, np.ndarray]:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    processed_csv_path = output_dir / processed_filename

    print("=" * 80)
    print("STEP 1: PREPROCESS DATASET")
    print("=" * 80)
    preprocess_dataset(
        input_csv=input_csv,
        output_csv=processed_csv_path,
        target_column=target_column,
    )

    print("\n" + "=" * 80)
    print("STEP 2: SPLIT PROCESSED DATASET")
    print("=" * 80)
    arrays = split_processed_dataset(
        input_csv=processed_csv_path,
        output_dir=output_dir,
        target_column=target_column,
        train_start_year=train_start_year,
        train_end_year=train_end_year,
        holdout_start_year=holdout_start_year,
        holdout_end_year=holdout_end_year,
    )

    print("\nPipeline complete.")
    print(f"All output files were saved to: {output_dir.resolve()}")
    return arrays



def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Preprocess the cleaned housing dataset, save the numeric processed CSV, "
            "and create train/validation/test NumPy split files in one run."
        )
    )
    parser.add_argument(
        "--input_csv",
        default=str(_DEFAULT_INPUT_CSV),
        help="Path to the cleaned input CSV (default: ml/data/ next to this script).",
    )
    parser.add_argument(
        "--output_dir",
        default=str(_DEFAULT_OUTPUT_DIR),
        help="Directory where the processed CSV and split files will be saved.",
    )
    parser.add_argument(
        "--processed_filename",
        default="master_dataset_processed_numeric.csv",
        help="Filename for the processed numeric CSV.",
    )
    parser.add_argument(
        "--target_column",
        default=TARGET_COLUMN,
        help="Target column to predict.",
    )
    parser.add_argument("--train_start_year", type=int, default=TRAIN_START_YEAR)
    parser.add_argument("--train_end_year", type=int, default=TRAIN_END_YEAR) 
    parser.add_argument(
        "--holdout_start_year",
        type=int,
        default=HOLDOUT_START_YEAR,  
        help="First year (inclusive) of the holdout range used for validation and test splits.",
    )
    parser.add_argument(
        "--holdout_end_year",
        type=int,
        default=HOLDOUT_END_YEAR,  
        help="Last year (inclusive) of the holdout range used for validation and test splits.",
    )
    return parser.parse_args()
# Note: Change the years so that test and validation are 2023 and training it 2001-2022 once the scrape is complete

if __name__ == "__main__":
    args = parse_args()
    run_pipeline(
        input_csv=args.input_csv,
        output_dir=args.output_dir,
        processed_filename=args.processed_filename,
        target_column=args.target_column,
        train_start_year=args.train_start_year,
        train_end_year=args.train_end_year,
        holdout_start_year=args.holdout_start_year,
        holdout_end_year=args.holdout_end_year
    )
