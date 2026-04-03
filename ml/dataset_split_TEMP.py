from __future__ import annotations

import pandas as pd
from sklearn.model_selection import train_test_split

DatasetComponents = dict[str, pd.DataFrame | pd.Series]


def split_dataset_components(
    df: pd.DataFrame,
    target_column: str,
    *,
    train_pct: float,
    val_pct: float,
    test_pct: float,
    random_state: int | None = 42,
) -> DatasetComponents:
    """
    Split ``df`` into train / validation / test feature matrices and target vectors.

    Percentages must sum to 100. Rows are shuffled before splitting (reproducible
    when ``random_state`` is set).

    Returns a dict with keys:
    ``X_train``, ``y_train``, ``X_val``, ``y_val``, ``X_test``, ``y_test``.
    """
    total = train_pct + val_pct + test_pct
    if abs(total - 100.0) > 1e-6:
        raise ValueError(
            f"train_pct + val_pct + test_pct must equal 100 (got {total})."
        )
    if min(train_pct, val_pct, test_pct) < 0:
        raise ValueError("Percentages must be non-negative.")

    if target_column not in df.columns:
        raise KeyError(f"target_column {target_column!r} not in dataframe columns.")

    n = len(df)
    if n == 0:
        raise ValueError("dataframe has no rows.")

    feature_columns = [c for c in df.columns if c != target_column]

    # First: separate test set by requested fraction of full data
    train_val_df, test_df = train_test_split(
        df,
        test_size=test_pct / 100.0,
        random_state=random_state,
        shuffle=True,
    )

    # Second: split train+val into train and val; val is val_pct of (train_pct + val_pct) of original
    train_plus_val = train_pct + val_pct
    if train_plus_val <= 0:
        raise ValueError("train_pct + val_pct must be positive when test_pct < 100.")

    val_fraction_of_train_val = val_pct / train_plus_val

    train_df, val_df = train_test_split(
        train_val_df,
        test_size=val_fraction_of_train_val,
        random_state=random_state,
        shuffle=True,
    )

    def xy_parts(part: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
        y = part[target_column]
        x = part[feature_columns]
        return x, y

    X_train, y_train = xy_parts(train_df)
    X_val, y_val = xy_parts(val_df)
    X_test, y_test = xy_parts(test_df)

    return {
        "X_train": X_train,
        "y_train": y_train,
        "X_val": X_val,
        "y_val": y_val,
        "X_test": X_test,
        "y_test": y_test,
        "X_train_indices": X_train.index.to_series(name="X_train_indices"),
        "y_train_indices": y_train.index.to_series(name="y_train_indices"),
        "X_val_indices": X_val.index.to_series(name="X_val_indices"),
        "y_val_indices": y_val.index.to_series(name="y_val_indices"),
        "X_test_indices": X_test.index.to_series(name="X_test_indices"),
        "y_test_indices": y_test.index.to_series(name="y_test_indices"),
    }
