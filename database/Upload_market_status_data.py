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

def upsertDB(connection_url, table_name, duplicate_cols, df, update_cols):
    try:
        engine = create_engine(connection_url, connect_args={"sslmode": "require"})

        meta = MetaData()
        meta.reflect(bind=engine, only=[table_name])
        tbl = meta.tables[table_name]

        chunkSize = 500

        for i in range(0, len(df), chunkSize):
            chunk = df[i:i + chunkSize]
            records = chunk.to_dict(orient="records")

            base_stmt = insert(tbl).values(records)

            update_dict = {
                col: getattr(base_stmt.excluded, col)
                for col in update_cols
            }

            stmt = base_stmt.on_conflict_do_update(
                index_elements=duplicate_cols,
                set_=update_dict
            )

            with engine.begin() as conn:
                conn.execute(stmt)

    except Exception as e:
        print(f"Exception while inserting: Error type: {type(e).__name__}")

# GLOBAL VARS
DB_URL = 'postgresql://homview_admin:D00kWYfKWoZIDqrK122ndtacYT4Zij5Y@dpg-d6sspqv5gffc738q86lg-a.ohio-postgres.render.com:5432/homeview'
MARET_STATS_DATA_PATH = 'market_stats.csv'

# NOTE: This file is more of a funtional way to upload what data has been scraped, not potential future zillow scrape data
# Entry Point
query = 'SELECT * FROM public."Property" WHERE city = \'MONROE\''
df_property = queryDB(DB_URL, query) # returns all properties scraped in city of monroe


df_market_stats = pd.read_csv(MARET_STATS_DATA_PATH)

# map pid to each street address scraped on zillow
df_market_stats = df_market_stats.merge(df_property[['street_address', 'pid']].drop_duplicates(subset='street_address'), on='street_address', how='left')

# DEBUG
print(df_property.head())
print(df_market_stats.head())

# UPSERT DATA
upsert_query = """INSERT INTO public."Property" (pid, current_price, market_status)
ON CONFLICT (pid)
DO UPDATE SET
current_price = EXCLUDED.current_price,
market_status = EXCLUDED.market_status;"""

upsertDB(
    connection_url=DB_URL,
    table_name='Property',
    duplicate_cols=['pid'],
    df=df_market_stats,
    update_cols=['current_price', 'market_status']
)