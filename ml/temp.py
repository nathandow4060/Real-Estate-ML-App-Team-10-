from pathlib import Path
import numpy as np
ML_DIR = Path(__file__).resolve().parent
#DATA_PATH = ML_DIR / "data" / "cre22_master_dataset_cleaned.csv"
_DEFAULT_INPUT_CSV_COMPONENTS = ML_DIR / "data"
data = np.load(_DEFAULT_INPUT_CSV_COMPONENTS / "dataset_splits.npz")

print(data['x_train'].shape)