from pathlib import Path
import pandas as pd
import numpy as np
from dataset_split_TEMP import split_dataset_components
from model import Model

#GLOBAL VARS
ML_DIR = Path(__file__).resolve().parent
#DATA_PATH = ML_DIR / "data" / "cre22_master_dataset_cleaned.csv"
_DEFAULT_INPUT_CSV_COMPONENTS = ML_DIR / "data"
_PREDICTIONS_DIR = ML_DIR / "data" / "predictions"




# Henry data pre-processing
X_train = np.load(_DEFAULT_INPUT_CSV_COMPONENTS / "x_train.npy") 
y_train = np.load(_DEFAULT_INPUT_CSV_COMPONENTS / "y_train.npy") 
X_val = np.load(_DEFAULT_INPUT_CSV_COMPONENTS / "x_val.npy")
y_val = np.load(_DEFAULT_INPUT_CSV_COMPONENTS / "y_val.npy")
X_test = np.load(_DEFAULT_INPUT_CSV_COMPONENTS / "x_test.npy") 
y_test = np.load(_DEFAULT_INPUT_CSV_COMPONENTS / "y_test.npy")
component_indices = np.load(_DEFAULT_INPUT_CSV_COMPONENTS / "dataset_component_indices.npz")

dataset_components={"X_train": X_train, 
                    "y_train": y_train, 
                    "X_val": X_val, 
                    "y_val": y_val,
                    "X_test": X_test, 
                    "y_test": y_test, 
                    "X_train_indices": component_indices['X_train_indices'], 
                    "X_val_indices": component_indices['X_val_indices'], 
                    "X_test_indices": component_indices['X_test_indices']}

# TEMPORARY PRE_PREPROCESSING
"""
TARGET_COLUMN = "sale_amount_log1p"
# Train / validation / test split (must sum to 100)
TRAIN_PCT = 70.0
VAL_PCT = 15.0
TEST_PCT = 15.0

df_dataset = pd.read_csv(DATA_PATH)
df_dataset = df_dataset.drop(columns=["sale_amount", "serial_number", "sale_date", "town_norm", "address_norm", "street_suffix", "style", "street_name", "has_unit"],axis=1)
df_dataset = df_dataset.sample(n=1000, random_state=42).reset_index(drop=True)  # subset for faster iteration while developing
#df_dataset.info()

dataset_components = split_dataset_components(
    df_dataset,
    TARGET_COLUMN,
    train_pct=TRAIN_PCT,
    val_pct=VAL_PCT,
    test_pct=TEST_PCT,
    random_state=42,
)
"""

y_actual = {"y_train": dataset_components["y_train"],"y_val": dataset_components["y_val"],"y_test": dataset_components["y_test"]}

# build model
MODEL_NAME = "Real_Estate_Price_predictor_2001_2023_CT"
MODEL_FILE_PATH = f"{MODEL_NAME}_model_cofig.json"
estimator = Model(MODEL_NAME, MODEL_FILE_PATH, dataset_components)
# load model here when desired
# estimator.load_model()
print('Starting bayes search')
estimator.bayesian_search(n_iterations=50, cv_folds=5, verbosity=0)
debug_model = estimator.model(dataset_components)
df_train_pred, df_val_pred, df_test_pred, y_predicted_dict = estimator.generate_predictions(dataset_components)
df_model_metrics = estimator.evaluate_performance(["train", "val", "test"], y_actual, y_predicted_dict)
estimator.save_model()

# convert predictions from log price to actual price
for df in [df_train_pred, df_val_pred, df_test_pred]:\
    # exponentiate prediction and actual vals to convert back to raw prices
    df["pred"] = np.exp(df["pred"])
    df["actual"] = np.exp(df["actual"])

# Save predictions results
df_train_pred.to_csv(_PREDICTIONS_DIR / "y_train_preds.csv", index=False, encoding="utf-8")
df_val_pred.to_csv(_PREDICTIONS_DIR / "y_val_preds.csv", index=False, encoding="utf-8")
df_test_pred.to_csv(_PREDICTIONS_DIR / "y_test_preds.csv", index=False, encoding="utf-8")

# print evaluation results
print(df_model_metrics)
print(df_train_pred)
print(df_val_pred)
print(df_test_pred)