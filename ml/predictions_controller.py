import model as Model
import pandas as pd
#import data preprocessing

# prepreocess data
DATA_PATH = "ml\data\cre22_master_dataset_cleaned.csv"
df_dataset = pd.read_csv(DATA_PATH)


dataset_components = {'X_train': X_train, 'y_train': y_train, 'X_val': X_val, 'y_val': y_val, 'X_test': X_test, 'y_test': y_test}
y_actual = {'y_train': y_train, 'y_val': y_val, 'y_test': y_test} # used for evaluating performance

# build model
MODEL_NAME = "Real_Estate_Price_predictor_2001_2023_CT"
MODEL_FILE_PATH = f"{MODEL_NAME}_model_cofig.json"
estimator = Model(MODEL_NAME, MODEL_FILE_PATH, dataset_components)
# load model here when desired
# model.load_model()
estimator.bayesian_search(n_iterations= 50, cv_folds= 5, verbosity= 0) # find ideal hyper-params
debug_model = estimator.model(dataset_components) # create model; model config returned for debugging purposes
y_predicted = estimator.generate_predictions() # generate predictions df
df_model_metrics = estimator.evaluate_performance(['train', 'val', 'test'], y_actual, y_predicted) # evaluate model
estimator.save_model() # save model

# print evaluation results
print(df_model_metrics)