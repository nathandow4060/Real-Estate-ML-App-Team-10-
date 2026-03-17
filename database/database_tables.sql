CREATE ROLE admin2 LOGIN PASSWORD --insert password here

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin2

--Composite key does not include zipcode as it is not constant in all records
CREATE TABLE "Property"(
    pid BIGSERIAL PRIMARY KEY,
    year_built INTEGER,
    street_address TEXT NOT NULL,
    zipcode INTEGER,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    longitude double precision,
	latitude double precision,
    house_style TEXT,
    num_bedrooms INTEGER,
    num_bathrooms INTEGER,
    living_area_sqft INTEGER,
    stories INTEGER,
	CONSTRAINT unique_address UNIQUE (street_address, city, state)
);


CREATE TABLE "Property_Sale"(
    sid BIGSERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL,
    date_of_sale TEXT NOT NULL,
    sale_amount INTEGER NOT NULL,
	CONSTRAINT "property_sale_property_id_foreign" FOREIGN KEY("property_id") REFERENCES "Property"("pid")
);

--store header information about a timeseries
CREATE TABLE "Timeseries_Set_Info" (
    id BIGSERIAL PRIMARY KEY,
    time_series_freq TEXT NOT NULL,
    data_source_name TEXT NOT NULL,
    data_vector_name TEXT NOT NULL,
    UNIQUE (time_series_freq, data_source_name, data_vector_name)
);

--store data of timeseries
CREATE TABLE "Timeseries_Data_Points" (
    id BIGSERIAL PRIMARY KEY,
    timeseries_set_id BIGINT NOT NULL,
    date_of_data_sample TEXT NOT NULL,
    data_point DOUBLE PRECISION,
	data_location TEXT,
    FOREIGN KEY (timeseries_set_id) REFERENCES "Timeseries_Set_Info"(id) ON DELETE CASCADE,
    UNIQUE (timeseries_set_id, date_of_data_sample, data_location)
);


CREATE TABLE "ML_Dataset"(
    serial_id BIGSERIAL PRIMARY KEY,
    year_built INTEGER,
    street_address TEXT NOT NULL,
    zipcode INTEGER,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    house_style TEXT,
    num_bedrooms INTEGER,
    num_bathrooms INTEGER,
    living_area_sqft INTEGER,
    date_of_sale TEXT NOT NULL,
    sale_amount INTEGER NOT NULL,
    CTDATA_mill_rates DOUBLE PRECISION,
    FRED_mortgage30us DOUBLE PRECISION,
    FRED_CPI DOUBLE PRECISION,
    BLS_unemployment_rate DOUBLE PRECISION,
    BLS_housing_supply DOUBLE PRECISION,
    USCENSUS_lodes DOUBLE PRECISION,
    USCENSUS_qwi DOUBLE PRECISION,
    FRED_ctrerenleargsp DOUBLE PRECISION,
    FRED_dgs10 DOUBLE PRECISION,
    FRED_actliscouct DOUBLE PRECISION,
    FBI_burglary DOUBLE PRECISION,
    FBI_agg_assault DOUBLE PRECISION,
    NCES_student_teacher_ratio DOUBLE PRECISION
	
);

CREATE TABLE "ML_Models"(
    model_name TEXT PRIMARY KEY,
    model_coverage TEXT,
    mode_of_prediction TEXT,
    target_feature TEXT,
    created_at TIMESTAMP(0) WITHOUT TIME ZONE,
    updated_at TIMESTAMP(0) WITHOUT TIME ZONE
);

CREATE TABLE "Model_Performance"(
    model_name TEXT NOT NULL,
    r_squared DOUBLE PRECISION,
    mean_average_percent_error DOUBLE PRECISION NOT NULL,
    mean_average_actual_error DOUBLE PRECISION NOT NULL,
	CONSTRAINT "model_performance_model_name_foreign" FOREIGN KEY("model_name") REFERENCES "ML_Models"("model_name")
);

CREATE TABLE "Model_Predictions"(
    "model_name" TEXT PRIMARY KEY,
    "serial_id" INTEGER NOT NULL,
    "actual_value" INTEGER NOT NULL,
    "predicted_value" INTEGER NOT NULL,
	CONSTRAINT "model_predictions_series_id_foreign" FOREIGN KEY("serial_id") REFERENCES "ML_Dataset"("serial_id"),
	CONSTRAINT "model_predictions_model_name_foreign" FOREIGN KEY("model_name") REFERENCES "ML_Models"("model_name")
);