from typing import Any
import pandas as pd
import xgboost as xgb
from skopt import BayesSearchCV
from skopt.space import Integer, Real
from sklearn.metrics import r2_score, root_mean_squared_error, mean_absolute_error, mean_absolute_percentage_error as MAPE
from xgboost import XGBRegressor


# The model class will control all functionality related to generating predictions, and evaluating model performance.

# Instance variables:
# - model_name: str
# - file_save_path: str
# - model: XGBRegressor
# - predictions: pd.Series
# - performance: dict[str, float]

class Model: 
    def __init__(self, model_name: str, file_save_path: str, params: dict[str, Any]):
        # passed identity information
        self.model_name = model_name
        self.file_save_path = file_save_path
        self.params = params # loads dictionary of component X and y pd series for train, val, test sets

        # generated information
        self.xgboost_regressor = None # this is populated either when model is run, or when a model is loaded from file
        self.hyper_parameters = None # this is populated when bayes_search is run
        self.predictions = None # this is populated when predictions are generated
        self.performance = None # this is populated when performance is evaluated

    # loads model from initialized file path
    def load_model(self):
        self.xgboost_regressor = xgb.XGBRegressor()
        self.xgboost_regressor.load_model(self.file_save_path)
        #load booster 
        booster = __buildBooster(self.file_save_path, self.params['X_train'], self.params['y_train'], hyper_params=self.hyperparameters, num_class=1)
        xgb._Booster = booster   # attach trained booster
    
    # saves model to initialized file path
    def save_model(self):
        if self.xgboost_regressor is None:
            raise ValueError("Model is not initialized")
        else:
            self.xgboost_regressor.save_model(self.file_save_path)

    def bayesian_search(self, n_iterations: int = 50, cv_folds: int = 5, verbosity: int = 0) -> list[float | int]:
        """
        Bayesian optimization over XGBoost hyperparameters via BayesSearchCV.
        Returns optimal values in the same order as keys in ``param_space``.
        """
        param_space = {
            "n_estimators": Integer(50, 220),
            "max_depth": Integer(2, 20),
            "learning_rate": Real(0.01, 0.5, prior="log-uniform"),
            "subsample": Real(0.7, 1.0),
            "colsample_bytree": Real(0.1, 1.0),
            "gamma": Real(0, 10),
            "reg_lambda": Real(5, 100.0, prior="log-uniform"),
        }

        X_train = self.params["X_train"]
        y_train = self.params["y_train"]

        base = xgb.XGBRegressor(
            objective="reg:squarederror",
            eval_metric="rmse",
            tree_method="hist",
            random_state=42,
            n_jobs=-1,
            device="cpu",
        )

        search = BayesSearchCV(
            estimator=base,
            search_spaces=param_space,
            n_iter=n_iterations,
            cv=cv_folds,
            scoring="neg_root_mean_squared_error",
            verbose=verbosity,
            random_state=42,
            n_jobs=-1,
        )
        search.fit(X_train, y_train)

        self.hyper_parameters = search.best_params_ # save found optimal hyper_params

    def __buildBooster(src_model_path: str, X_target, y_target, prediction_mode: str, hyper_params: dict, num_class: int = None):
        # 1) refresh leaf weights (native booster)
        booster = __refresh_leaf_weights(
            src_model_path=src_model_path,
            X_target=X_target,
            y_target=y_target,
            prediction_mode=prediction_mode,
            num_class=num_class,
            hyper_params=hyper_params,
            n_refresh_rounds=1
        )

        return booster

    def __refresh_leaf_weights(src_model_path: str, X_target, y_target, num_class: int = None, hyper_params: dict = None, n_refresh_rounds: int = 1,):
        """
        Load a source model, then refresh its leaf weights on target data
        while keeping tree structure fixed.
        Returns a Booster.
        """
        if hyper_params is None:
            hyper_params = {}

        # ---- Build DMatrix ----
        dtrain = XGB.DMatrix(X_target, label=y_target)

        # ---- Load source booster ----
        booster = XGB.Booster()
        booster.load_model(src_model_path)

        # ---- Set objective & required params ----
        params = dict(hyper_params)  # copy

        
        params.update({
            "objective": "reg:squarederror",
            "eval_metric": params.get("eval_metric", "rmse"),
        })

        # ---- refresh updater ----
        # process_type=update tells XGBoost we are updating an existing model
        # updater=refresh recomputes stats / optionally leaf weights
        # refresh_leaf=True updates leaf values without changing structure
        params.update({
            "process_type": "update",
            "updater": "refresh",
            "refresh_leaf": True,
            # keep tree method consistent with your setup
            #"tree_method": params.get("tree_method", "hist"),
        })

        # ---- Run refresh passes ----
        # num_boost_round here means "how many update passes" over existing trees
        booster = XGB.train(
            params=params,
            dtrain=dtrain,
            num_boost_round=n_refresh_rounds,
            xgb_model=booster,     # start from the loaded model
            verbose_eval=False
        )

        return booster
    # end def refresh_leaf_weights



    def model(self, X_y_components: dict[str, pd.Series]):
        # model does not exist yet, but hyper-params Do (model not loaded, Bayes search ran)
        if self.xgboost_regressor is None and self.hyper_parameters is not None:
            self.xgboost_regressor = xgb.XGBRegressor(eval_metric='rmse', tree_method='hist', random_state=42, n_jobs=-1, device='cpu', **self.hyper_parameters) # default objective
            print(f"Model Created: {self.xgboost_regressor}") # debug
            # set other  features later with xgb.set.config()
        elif self.xgboost_regressor and self.hyper_parameters is None:
            print("Error: run bayes search before modeling. (model.bayesian_search())")

        # parse X and y components
        X_train = X_y_components['X_train']
        y_train = X_y_components['y_train']
        X_val = X_y_components['X_val']
        y_val = X_y_components['y_val']
        
        # fit model to train and val sets
        self.xgboost_regressor.fit(X_train, y_train, eval_set=[(X_train, y_train), (X_val, y_val)], verbose=False)
        
        return self.xgboost_regressor # returns model for debugging

    # generates dataframe of predictions using trained model
    # access indices through the components dict
    def generate_predictions(self, components):
        train_preds = None
        val_preds = None
        if self.xgboost_regressor is None:
            print("Error: Model must be initialized before making predictions.")
        
        # generate predictions
        train_preds = self.xgboost_regressor.predict(self.params['X_train'])
        val_preds = self.xgboost_regressor.predict(self.params['X_val'])
        test_preds = self.xgboost_regressor.predict(self.params['X_test'])

        #package
        y_pred_dict = {'y_train_pred': train_preds, 'y_val_pred': val_preds, 'y_test_pred': test_preds}

        #DEBUG
        print(f"X_Train indices len: {len(components['X_train_indices'])}")
        print(f'Training Predictions length self.params[X_train]: {len(train_preds)}')

        df_train = pd.DataFrame({
            'index': components['X_train_indices'],
            'actual': self.params['y_train'],
            'pred': train_preds
        })

        df_val = pd.DataFrame({
            'index': components['X_val_indices'],
            'actual': self.params['y_val'],
            'pred': val_preds
        })

        df_test = pd.DataFrame({
            'index': components['X_test_indices'],
            'actual': self.params['y_test'],
            'pred': test_preds
        })

        return df_train, df_val, df_test, y_pred_dict
        
        
    # returns performance metrics of model
    # pass the names of the datasets to evaluate. ex datasets=['train', 'val', 'test']
    # pass predicted values series as dictionary. Ensure datasets and predicted_vals align
    def evaluate_performance(self, datasets, y_actual, y_predicted):
        if self.xgboost_regressor is None:
            print("Error: Model must be initialized before evaluation.")

        # setup df to hold performance metrics
        regression_headers = ["model_name", "dataset", "r_squared", "root_mean_squared_error", "mean_average_percent_error", "mean_average_actual_error"]
        data = []
        df_metrics_regression = pd.DataFrame(columns=regression_headers)

        # correlate y_actuals, y_preds
        y_actuals = [y_actual['y_train'], y_actual['y_val'], y_actual['y_test']]
        y_preds =  [y_predicted['y_train_pred'], y_predicted['y_val_pred'], y_predicted['y_test_pred']]

        for y_actual, y_pred, dataset in zip(y_actuals, y_preds, datasets):
            r2 = r2_score(y_actual, y_pred)
            rmse = root_mean_squared_error(y_actual, y_pred)
            mape = MAPE(y_actual, y_pred) * 100
            mae = mean_absolute_error(y_actual, y_pred)
            data_entry =  {"model_name": self.model_name, "dataset": dataset, "r_squared": r2, "root_mean_squared_error": rmse, "mean_average_percent_error": mape, "mean_average_actual_error": mae}
            data.append(data_entry)

        df_metrics_regression = pd.concat([df_metrics_regression, pd.DataFrame(data, columns=regression_headers)], ignore_index=True, axis=0)

        return df_metrics_regression
            


