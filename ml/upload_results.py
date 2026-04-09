# This file will upload model identification, model performance, and predictions data to the remote server
import pandas as pd
from pathlib import Path
import sqlalchemy
from sqlalchemy import create_engine, Table, MetaData
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError, NoSuchTableError, OperationalError

# GLOBAL VARS
PARENT_DIR = Path(__file__).resolve().parent
PREDICTIONS_DIR = PARENT_DIR / "Data" / "predictions" 

DB_URL = 'postgresql://homview_admin:D00kWYfKWoZIDqrK122ndtacYT4Zij5Y@dpg-d6sspqv5gffc738q86lg-a.ohio-postgres.render.com:5432/homeview'
MODEL_TBL = "ML_Models"
MODEL_PERF_TBL = "Model_Performance"
MODEL_PREDS_TBL = "Model_Predictions"

# FUNCTIONS
# Upserts data to posgres DB using on conflict do update 
# Return: statius_code
def upsert_df_to_DB(connection_url, table_name, df, conflict_cols, batch_size=1000):
    # Define some status codes
    SUCCESS = 0
    ERR_CONNECTION = 1
    ERR_SEND = 2

    # build connection
    try:
        engine = create_engine(connection_url)
    except OperationalError as e:
        print(f"[ERROR] Could not connect: {e}")
        return ERR_CONNECTION
    
    try:
        # reflect just the table to insert into
        meta = MetaData()
        meta.reflect(bind=engine, only=[table_name])
        tbl = meta.tables[table_name]

        update_cols = [col for col in df.columns if col not in conflict_cols]

        with engine.begin() as conn:
            for i in range(0, len(df), batch_size):
                batch = df.iloc[i:i + batch_size]
                print(f"Upserting rows {i} to {min(i + batch_size, len(df))} of {len(df)}...")

                stmt = insert(tbl)
                set_dict = {col: getattr(stmt.excluded, col) for col in update_cols}

                stmt = stmt.values(batch.to_dict(orient="records")).on_conflict_do_update(
                    index_elements=conflict_cols,
                    set_=set_dict
                )

                conn.execute(stmt)

        return SUCCESS

    except Exception as e:
        print(f'Exception while upserting data: {e}')
        return ERR_SEND
    
    finally:
        try:
            engine.dispose()
        except Exception:
            pass

def queryDB(connection_url, query):
    try:
        engine = create_engine(connection_url)
        df = pd.read_sql_query(query, con=engine)

    except Exception as e:
        print(f'Exception while querying data: {e}')
        return None

    return df

import pandas as pd

def find_duplicates_across_dfs(df1, df2, df3, subset_cols):
    """
    Returns rows that are duplicates across the three DataFrames
    based on the given subset of columns.

    Parameters:
        df1, df2, df3 (pd.DataFrame): Input DataFrames
        subset_cols (list): Columns to check duplicates on

    Returns:
        pd.DataFrame: Rows that appear more than once across all DataFrames
    """

    # Add source labels (optional but useful)
    df1_ = df1.copy()
    df1_['__source'] = 'df1'

    df2_ = df2.copy()
    df2_['__source'] = 'df2'

    df3_ = df3.copy()
    df3_['__source'] = 'df3'

    # Combine all DataFrames
    combined = pd.concat([df1_, df2_, df3_], ignore_index=True)

    # Find duplicates based on subset
    dup_mask = combined.duplicated(subset=subset_cols, keep=False)

    duplicates = combined[dup_mask].sort_values(by=subset_cols)

    return duplicates


"""
1)
Create Ml_Models table record 
Create Model_Performance table record from "ml_model_performance_metrics.csv"
Upload tables


2)PLAN to upload predictions data
1. load components into respective dataframes
2. load dataset context information
3. join components dataframes with context information to get (address, city, state, date_of_sale, actual, pred) fields in component dfs. 
make sure there is a dataset and relevant model id fields (these records to be uploaded to table Model_Predictions)
4. query database for list of properties joined with property_sales (batch) select fields (p.street_address, p.city, p.state, p.pid, ps.date_of_sale, ps.sid)
5. join component data on queried data by (street_address, city, state, date_of_sale) to get the pid and sid data
6. drop irrelevent rows from component datasets
7. upsert to "Model_Predictions" table on unique (pid, sid) make sure to add created_at and updated_at fields
"""

# 1) Create Ml_Models table record 
# Create Model_Performance table record from "ml_model_performance_metrics.csv"
df_model = pd.read_csv(PREDICTIONS_DIR / "model_details.csv")
df_model_metrics = pd.read_csv(PREDICTIONS_DIR / "model_performance_metrics.csv")
upsert_df_to_DB(DB_URL, MODEL_TBL, df_model, conflict_cols=['model_name'])
upsert_df_to_DB(DB_URL, MODEL_PERF_TBL, df_model_metrics, conflict_cols=['model_name', 'dataset'])

# 2) upload predictions data
#1.
df_y_train = pd.read_csv(PREDICTIONS_DIR / "y_train_preds.csv")
df_y_val =pd.read_csv(PREDICTIONS_DIR / "y_val_preds.csv")
df_y_test =pd.read_csv(PREDICTIONS_DIR / "y_test_preds.csv")

#2.
df_context = pd.read_csv(PREDICTIONS_DIR / "df_predictions_context.csv")
df_context['state'] = "CT" # this column is dropped during preprocessing as it does not affect predictions in a single state model

#3. Join context to get the address of each row so we can get the pid and sid from the database
df_y_train_context = df_y_train.join(df_context[['index', 'address_norm', 'town_norm', 'state', 'sale_date']].set_index("index"), on="index").rename(columns={'address_norm': 'street_address', 'town_norm': 'city', 'sale_date': 'date_of_sale'})
df_y_val_context = df_y_val.join(df_context[['index', 'address_norm', 'town_norm', 'state', 'sale_date']].set_index("index"), on="index").rename(columns={'address_norm': 'street_address', 'town_norm': 'city', 'sale_date': 'date_of_sale'})
df_y_test_context = df_y_test.join(df_context[['index', 'address_norm', 'town_norm', 'state', 'sale_date']].set_index("index"), on="index").rename(columns={'address_norm': 'street_address', 'town_norm': 'city', 'sale_date': 'date_of_sale'})

# change date to datetime object
df_y_train_context['date_of_sale'] = pd.to_datetime(df_y_train_context['date_of_sale'])
df_y_val_context['date_of_sale'] = pd.to_datetime(df_y_val_context['date_of_sale'])
df_y_test_context['date_of_sale'] = pd.to_datetime(df_y_test_context['date_of_sale'])

#4.
prop_query = 'SELECT * FROM public."Property"'
sales_query = 'SELECT * FROM public."Property_Sale"'
df_property = queryDB(DB_URL, prop_query)
df_sales = queryDB(DB_URL, sales_query)
df_sales['date_of_sale'] = pd.to_datetime(df_sales['date_of_sale'])

print(df_sales.head())

#5. Join property pid
df_train_upload = df_y_train_context.join(df_property[['street_address', 'city', 'state', 'pid']].set_index(['street_address', 'city', 'state']), on=['street_address', 'city', 'state'])
df_val_upload = df_y_val_context.join(df_property[['street_address', 'city', 'state', 'pid']].set_index(['street_address', 'city', 'state']), on=['street_address', 'city', 'state'])
df_test_upload = df_y_test_context.join(df_property[['street_address', 'city', 'state', 'pid']].set_index(['street_address', 'city', 'state']), on=['street_address', 'city', 'state'])

# temporarily rename property id for the sales table join
df_train_upload = df_train_upload.rename(columns={'pid': 'property_id'})
df_val_upload = df_val_upload.rename(columns={'pid': 'property_id'})
df_test_upload = df_test_upload.rename(columns={'pid': 'property_id'})

print("df_train_upload head")
print(df_train_upload.head())

# join date_of_sale sid
df_train_upload = df_train_upload.join(df_sales[['date_of_sale', 'sid', 'property_id']].set_index(['date_of_sale', 'property_id']), on=['date_of_sale', 'property_id']).rename(columns={'property_id': 'pid'})
df_val_upload = df_val_upload.join(df_sales[['date_of_sale', 'sid', 'property_id']].set_index(['date_of_sale', 'property_id']), on=['date_of_sale', 'property_id']).rename(columns={'property_id': 'pid'})
df_test_upload = df_test_upload.join(df_sales[['date_of_sale', 'sid', 'property_id']].set_index(['date_of_sale', 'property_id']), on=['date_of_sale', 'property_id']).rename(columns={'property_id': 'pid'})

#6. drop irelevant columns
df_train_upload = df_train_upload.drop(columns=['street_address', 'city', 'state', 'date_of_sale', 'index'])
df_val_upload = df_val_upload.drop(columns=['street_address', 'city', 'state', 'date_of_sale', 'index'])
df_test_upload = df_test_upload.drop(columns=['street_address', 'city', 'state', 'date_of_sale', 'index'])

# 7. Add model identifying columns to dataframes
df_train_upload['model_name'] = df_model['model_name'][0]
df_train_upload['dataset'] = 'train'
df_val_upload['model_name'] = df_model['model_name'][0]
df_val_upload['dataset'] = 'val'
df_test_upload['model_name'] = df_model['model_name'][0]
df_test_upload['dataset'] = 'test'

#print(df_train_upload.head(10)) # DEBUG
print(df_train_upload.info()) # DEBUG
print(df_val_upload.info()) # DEBUG
print(df_test_upload.info()) # DEBUG

print(df_train_upload.columns.is_unique)
print(df_val_upload.columns.is_unique)
print(df_test_upload.columns.is_unique)

#INVESTIGATE Potential duplicates
duplicates_train = df_train_upload[df_train_upload.duplicated(subset=['pid', 'sid', 'model_name'], keep=False)]
duplicates_val= df_val_upload[df_val_upload.duplicated(subset=['pid', 'sid', 'model_name'], keep=False)]
duplicates_test = df_test_upload[df_test_upload.duplicated(subset=['pid', 'sid', 'model_name'], keep=False)]
if(len(duplicates_train) > 0 or len(duplicates_val) > 0 or len(duplicates_test) > 0):
    print("Error: Duplicates found.")
    print(f"Train dupes ct: {len(duplicates_train)}")
    print(f"Val dupes ct: {len(duplicates_val)}")
    print(f"Test dupes ct: {len(duplicates_test)}")
    exit()

splitwise_dups = find_duplicates_across_dfs(df_train_upload, df_val_upload, df_test_upload, ['pid', 'sid', 'model_name'])
if(len(splitwise_dups) > 0):
    print("Error: The 3 sets are not disjoint. Duplicates exist between sets")
    print(splitwise_dups)


#8 upload datasets to DB
# rate limited to 1000 rows per upload

err_tr = upsert_df_to_DB(DB_URL, MODEL_PREDS_TBL, df_train_upload, ['pid', 'sid', 'model_name'])
err_v = upsert_df_to_DB(DB_URL, MODEL_PREDS_TBL, df_val_upload, ['pid', 'sid', 'model_name'])
err_ts = upsert_df_to_DB(DB_URL, MODEL_PREDS_TBL, df_test_upload, ['pid', 'sid', 'model_name'])
if(err_tr == 0 and err_v == 0 and err_ts ==0):
    print("Data Succesfully Uploaded")
else:
    print("Exited with error")

