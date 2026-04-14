# code and library imports
from model import Model
import numpy as np
import pandas as pd
from sklearn.inspection import permutation_importance
from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib import pyplot
from xgboost import plot_importance
# TARGET VARIABLE
#----------------------------------
TARGET_FEATURE = "sale_amount_log1p"
MODEL_NAME = "Real_Estate_log1p_Price_predictor_2004_2020_CT"


#GLOBAL VARS
ML_DIR = Path(__file__).resolve().parent
#DATA_PATH = ML_DIR / "data" / "cre22_master_dataset_cleaned.csv"
_DATA_DIR = ML_DIR / "data"
_DEFAULT_INPUT_CSV_COMPONENTS = ML_DIR / "data"
_PREDICTIONS_DIR = ML_DIR / "data" / "predictions"
MODEL_FILE_PATH = ML_DIR / f"{MODEL_NAME}_model_cofig.json"

# load components
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

# load context dataframe
df = pd.read_csv(_PREDICTIONS_DIR / "df_predictions_context.csv")

# drop targets (y) and non feature columns
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
    "living_area_sqft",
    "has_unit"
]

IDENTIFIER_COLUMNS = [
    'serial_number',
    'index'
]

Y = [TARGET_FEATURE]

columns_to_drop = TEXT_COLUMNS + LEAKAGE_COLUMNS + IDENTIFIER_COLUMNS + Y


df = df.drop(columns=columns_to_drop)

feature_names = df.columns.tolist()
print("Feature Names:")
print(feature_names)

# LOAD pre trained model
estimator = Model(MODEL_NAME, MODEL_FILE_PATH, dataset_components) #dont pass X or y data
estimator.load_model()
booster = estimator.get_booster()
booster.feature_names = feature_names # a list of length n_features

fig, ax = plt.subplots(figsize=(8, len(feature_names) * 0.4))  # dynamic height
# most important importance_types: gain, weight, cover
plot_importance(booster, importance_type="gain", ax=ax, height=0.3)
pyplot.show()