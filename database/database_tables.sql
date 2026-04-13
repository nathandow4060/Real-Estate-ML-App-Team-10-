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
	market_status BOOLEAN,
	current_price INTEGER,
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

DROP TABLE "ML_Models"
DROP TABLE "Model_Performance"
DROP TABLE "Model_Predictions"

CREATE TABLE "ML_Models"(
    model_name TEXT PRIMARY KEY,
    model_coverage TEXT,
    mode_of_prediction TEXT,
    target_feature TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Model_Performance"(
    model_name TEXT NOT NULL,
	dataset TEXT NOT NULL,
    r_squared DOUBLE PRECISION NOT NULL,
	root_mean_sq_error DOUBLE PRECISION NOT NULL,
    mean_avg_percent_err DOUBLE PRECISION NOT NULL,
    mean_avg_actual_err DOUBLE PRECISION NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "model_performance_model_name_foreign" FOREIGN KEY("model_name") REFERENCES "ML_Models"("model_name") ON DELETE CASCADE,
	UNIQUE(model_name, dataset, pid, sid)
);

CREATE TABLE "Model_Predictions"(
	pid	INTEGER NOT NULL,
	sid INTEGER NOT NULL,
    "model_name" TEXT,
	dataset TEXT,
    "actual_value" INTEGER NOT NULL,
    "predicted_value" INTEGER NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "model_predictions_model_name_foreign" FOREIGN KEY("model_name") REFERENCES "ML_Models"("model_name") ON DELETE CASCADE,
	CONSTRAINT "pid_context_foreign" FOREIGN KEY("pid") REFERENCES "Property"("pid"),
	CONSTRAINT "sid_context_foreign" FOREIGN KEY("sid") REFERENCES "Property_Sale"("sid"),
	UNIQUE(pid, sid, "model_name") --compositional key
);

--create trigger for updated at field
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--attach trigger to tables: "ML_Models", "Model_Predictions", "Model_Performance"
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON "ML_Models"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON "Model_Predictions"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON "Model_Performance"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE "Property_Images"(
	pid 	INTEGER NOT NULL,
	img_url	TEXT,
	CONSTRAINT "prop_images_foreign" FOREIGN KEY("pid") REFERENCES "Property"("pid")
)