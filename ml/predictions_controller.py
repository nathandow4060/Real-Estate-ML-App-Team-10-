from pathlib import Path
import pandas as pd
from dataset_split_TEMP import split_dataset_components
from model import Model

# preprocess data
ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR / "data" / "cre22_master_dataset_cleaned.csv"

TARGET_COLUMN = "sale_amount_log1p"

# Train / validation / test split (must sum to 100)
TRAIN_PCT = 70.0
VAL_PCT = 15.0
TEST_PCT = 15.0

df_dataset = pd.read_csv(DATA_PATH)

# TEMPORARY PRE_PREPROCESSING
df_dataset = df_dataset.drop(columns=["sale_amount", "serial_number", "sale_date", "town_norm", "address_norm", "street_suffix", "style", "street_name", "has_unit"],axis=1,)
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
y_predicted = estimator.generate_predictions()
df_model_metrics = estimator.evaluate_performance(   ["train", "val", "test"], y_actual, y_predicted)
estimator.save_model()

# print evaluation results
print(df_model_metrics)