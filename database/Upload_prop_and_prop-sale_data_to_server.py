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

        # Build insert statement first
        stmt = insert(tbl)
        # inserts data to table, doing nothing on duplicate
        stmt = stmt.values(df.to_dict(orient="records")).on_conflict_do_nothing(index_elements=duplicate_cols)

        with engine.begin() as conn:
            conn.execute(stmt)

    except Exception as e:
        print(f'Exception while inserting data: {e}')


# GLOBAL VARS
#SCRAPE_DATA_PATH = "Real_Estate_Sales_2001-2023_with_scrape_data.csv"
SCRAPE_DATA_PATH = 'Real_Estate_Sales_2001-2023_with_scrape_data.csv'
DB_URL = 'postgresql://homview_admin:D00kWYfKWoZIDqrK122ndtacYT4Zij5Y@dpg-d6sspqv5gffc738q86lg-a.ohio-postgres.render.com:5432/homeview'
df_scrape = pd.read_csv(SCRAPE_DATA_PATH, thousands=',')

# ----------------------------------------------------------------------
# Start of property data format for upload to server
# drop columns not relevant to property or property_sales table
df_scrape = df_scrape.drop(columns=["Serial Number", "Assessed Value", "Sales Ratio", "Property Type", "Residential Type"], axis=1)

# Re-order columns for data upload
COLS_ORDERED = ["Date Recorded", "Sale Amount", "year_built", "Address", "zipcode", "Town", "state", "longitude", "latitude", "style", "total_bedrms", "total_bthrms", "living_area_sqft", "stories"]
df_scrape = df_scrape[COLS_ORDERED]

# rename columns to match database columns
COLS_DB = ["date_of_sale", "sale_amount", "year_built", "street_address", "zipcode", "city", "state", "longitude", "latitude", "house_style", "num_bedrooms", "num_bathrooms", "living_area_sqft", "stories"]
df_scrape.columns = COLS_DB

#print(df_scrape.head()) # debug confirm columns look correct

# create property csv file for upload
df_property_upload = df_scrape.drop(columns=["date_of_sale", "sale_amount"], axis=1)
#print(df_property_upload.head()) # debug

# cast Int data types to Int64
int_columns = ['year_built', 'zipcode', 'num_bedrooms', 'num_bathrooms', 'stories', 'living_area_sqft']
for col in int_columns:
    df_property_upload[col] = pd.to_numeric(df_property_upload[col], errors='coerce')  # converts bad values to NaN
    df_property_upload[col] = df_property_upload[col].astype('Int64')

#df_property_upload.to_csv("Real_Estate_Property_Dataset_DB_Upload.csv", index=False) # uncomment if you want to download file

# upload properties skipping duplicates Note: Unique address identified by (['street_address', 'city', 'state'])
insertDB(DB_URL, 'Property', ['street_address', 'city', 'state'], df_property_upload)


# --------------------------------------------------------------------------------
# Start of property sales format for upload
# query server property table for ('PID', 'street_address', 'city', 'state')
query = "SELECT pid, street_address, city, state from public.\"Property\""
df_prop_server = queryDB(DB_URL, query)
#print(df_prop_server.head()) # debug

# join scrape dataset and df_prop server to map PIDs to address
df_prop_sales = pd.merge(df_scrape, df_prop_server, on=['street_address', 'city', 'state'], how='inner')
#print(df_prop_sales.head()) # debug

# drop and rename columns to prepare for property_sales datset upload
df_prop_sales = df_prop_sales.drop(["year_built", "street_address", "zipcode", "city", "state", "longitude", "latitude", "house_style", "num_bedrooms", "num_bathrooms", "living_area_sqft", "stories"], axis=1)
PROP_SALES_COLS = ['date_of_sale', 'sale_amount', 'property_id']
df_prop_sales.columns = PROP_SALES_COLS

# upload property sales data to server
insertDB(DB_URL, 'Property_Sale', ['property_id', 'date_of_sale', 'sale_amount'], df_prop_sales)





