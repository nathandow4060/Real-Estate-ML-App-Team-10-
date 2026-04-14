import pandas as pd
import sqlalchemy
from sqlalchemy import create_engine, Table, MetaData
from sqlalchemy.dialects.postgresql import insert
pd.set_option('display.max_columns', None)

# FUNCTIONS
# this function will be used to query database
def queryDB(connection_url, query):
    try:
        engine = create_engine(connection_url)
        df = pd.read_sql_query(query, con=engine)

    except Exception as e:
        print(f'Exception while querying data: {e}')
        return None

    return df

def insertDB(connection_url, table_name, duplicate_cols, df):
    # inserting data
    try:
        engine = create_engine(connection_url, connect_args={"sslmode": "require"})
        # reflect just the table to insert into
        meta = MetaData()
        meta.reflect(bind=engine, only=[table_name])
        tbl = meta.tables[table_name]

        # break upload into chunks to avoid overloading server
        chunkSize = 500
        for i in range(0, len(df), chunkSize):
            chunk = df[i:i + chunkSize]

            # inserts data to table, doing nothing on duplicate
            stmt = insert(tbl).values(chunk.to_dict(orient="records")).on_conflict_do_nothing(index_elements=duplicate_cols)

            with engine.begin() as conn:
                conn.execute(stmt)


    except Exception as e:
        print(f"Exception while inserting: Error type: {type(e).__name__}")

#USAGE
# Use henrys cre22 merge pipeline and prepare_dataset to build the merged and cleaned ml dataset
<<<<<<< HEAD
# from this dataset, delete the columns not relevant to prop or prop_sale.
=======
# from this dataset, add state column after city column with value 'CT' for all rows.
>>>>>>> origin/Merge-4/14
# -(ie dataset should only have cols in COLS_ORDERED var)
# -add state column with value CT for all rows
# run this file with the "cre22_master_dataset_cleaned.csv" in the same dir
# look for success insert print statements in console

# GLOBAL VARS
#SCRAPE_DATA_PATH = "Real_Estate_Sales_2001-2023_with_scrape_data.csv"
SCRAPE_DATA_PATH = 'cre22_master_dataset_cleaned.csv'
DB_URL = 'postgresql://homview_admin:D00kWYfKWoZIDqrK122ndtacYT4Zij5Y@dpg-d6sspqv5gffc738q86lg-a.ohio-postgres.render.com:5432/homeview'
df_scrape = pd.read_csv(SCRAPE_DATA_PATH, thousands=',')

# ----------------------------------------------------------------------
# Start of property data format for upload to server

<<<<<<< HEAD
# Re-order columns for data upload
COLS_ORDERED = ["sale_date", "sale_amount", "year_built", "address_norm", "zipcode", "town_norm", "state", "longitude", "latitude", "style", "total_bedrms", "total_bthrms", "living_area_sqft", "stories"]
=======
# drop irrelavant columns that are not going to be uploaded
df_scrape = df_scrape.drop(columns=['sale_year', 'sale_month', 'sale_day', 'sale_quarter', 'list_year', 'city_code', 'house_number', 'has_unit', 'street_suffix', 'street_name', 'assessed_value', 'sales_ratio', 'fiscal_year_end_june30', 'mortgage30us', 'cpi_cuur0100sa0', 'unemployment_rate', 'housing_supply_actliscouct', 'mill_rate', 'gdp_real_estate', 'home_age_at_sale', 'living_area_sqft_log1p', 'assessed_value_log1p', 'sale_amount_log1p'])

# Re-order columns for data upload
COLS_ORDERED = ["sale_date", "sale_amount", "year_built", "address_norm", "zipcode", "city", "state", "longitude", "latitude", "style", "total_bedrms", "total_bthrms", "living_area_sqft", "stories"]
>>>>>>> origin/Merge-4/14
df_scrape = df_scrape[COLS_ORDERED]

# rename columns to match database columns
COLS_DB = ["date_of_sale", "sale_amount", "year_built", "street_address", "zipcode", "city", "state", "longitude", "latitude", "house_style", "num_bedrooms", "num_bathrooms", "living_area_sqft", "stories"]
df_scrape.columns = COLS_DB

#print(df_scrape.head()) # debug confirm columns look correct

# create property csv file for upload
df_property_upload = df_scrape.drop(columns=["date_of_sale", "sale_amount"], axis=1)

# cast Int data types to Int64
int_columns = ['year_built', 'zipcode', 'num_bedrooms', 'num_bathrooms', 'living_area_sqft']
for col in int_columns:
    df_property_upload[col] = pd.to_numeric(df_property_upload[col], errors='coerce')  # converts bad values to NaN
<<<<<<< HEAD
=======
    df_property_upload[col] = round(df_property_upload[col]) # round stories to nearest integer
>>>>>>> origin/Merge-4/14
    df_property_upload[col] = df_property_upload[col].astype('Int64')

#print(df_property_upload.info()) # debug confirm datatypes of cols
#df_property_upload.to_csv("Real_Estate_Property_Dataset_DB_Upload.csv", index=False) # uncomment if you want to download file

# upload properties skipping duplicates Note: Unique address identified by (['street_address', 'city', 'state'])
insertDB(DB_URL, 'Property', ['street_address', 'city', 'state'], df_property_upload)
print("Insert Property Table Successful")


# --------------------------------------------------------------------------------
# Start of property sales format for upload
# query server property table for ('PID', 'street_address', 'city', 'state')
query = "SELECT pid, street_address, city, state from public.\"Property\""
df_prop_server = queryDB(DB_URL, query)
#print(df_prop_server.head()) # debug

# join scrape dataset and df_prop server to map PIDs to address
df_prop_sales = pd.merge(df_scrape, df_prop_server, on=['street_address', 'city', 'state'], how='inner')
#print(df_prop_sales.info()) # debug

# drop and rename columns to prepare for property_sales datset upload
df_prop_sales = df_prop_sales.drop(["year_built", "street_address", "zipcode", "city", "state", "longitude", "latitude", "house_style", "num_bedrooms", "num_bathrooms", "living_area_sqft", "stories"], axis=1)
PROP_SALES_COLS = ['date_of_sale', 'sale_amount', 'property_id']
df_prop_sales.columns = PROP_SALES_COLS

# upload property sales data to server
insertDB(DB_URL, 'Property_Sale', ['property_id', 'date_of_sale', 'sale_amount'], df_prop_sales)
print("Insert Property_Sales Table Successful")