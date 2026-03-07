CREATE TABLE "Property"(
    "pid" INTEGER NOT NULL,
    "year_built" INTEGER NOT NULL,
    "street_address" TEXT NOT NULL,
    "zipcode" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "coordinates" TEXT NOT NULL,
    "house_style" TEXT NOT NULL,
    "num_bedrooms" INTEGER NOT NULL,
    "num_bathrooms" INTEGER NOT NULL,
    "living_area_sqft" INTEGER NOT NULL,
    "stories" INTEGER NOT NULL
);
ALTER TABLE
    "Property" ADD PRIMARY KEY("pid");
COMMENT
ON COLUMN
    "Property"."street_address" IS 'composite key including (street_address, city, state, zipcode)

A property in our csv files will be uniquely identified by its address.

Once the property is in the database, it will be assigned a serial ID that will be unique to that property';
COMMENT
ON COLUMN
    "Property"."zipcode" IS 'will have to be calculated if 2001-2023 CT dataset is imported';
COMMENT
ON COLUMN
    "Property"."city" IS 'composite key';
COMMENT
ON COLUMN
    "Property"."state" IS 'composite key';
COMMENT
ON COLUMN
    "Property"."coordinates" IS 'contains (long, latt) entry';
CREATE TABLE "Property_sale"(
    "sid" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "date_of_sale" TEXT NOT NULL,
    "sale_amount" INTEGER NOT NULL
);
ALTER TABLE
    "Property_sale" ADD PRIMARY KEY("sid");
COMMENT
ON COLUMN
    "Property_sale"."sid" IS 'sale id';
CREATE TABLE "Timeseries_Data"(
    "time_series_freq" TEXT NOT NULL,
    "date_of_data_sample" TEXT NOT NULL,
    "data_source_name" TEXT NOT NULL,
    "data_vector_name" TEXT NOT NULL,
    "data_point" DOUBLE PRECISION NOT NULL
);
COMMENT
ON COLUMN
    "Timeseries_Data"."time_series_freq" IS 'denotes the frequency of data point
eg yearly, monthly, daily, etc';
COMMENT
ON COLUMN
    "Timeseries_Data"."data_source_name" IS 'source of data 
ex. FRED, or elsewhere';
COMMENT
ON COLUMN
    "Timeseries_Data"."data_vector_name" IS 'name of vector
e.g. CPI, morgatge rate, etc';
CREATE TABLE "ML_Dataset"(
    "Serial_ID" INTEGER NOT NULL,
    "year_built" INTEGER NOT NULL,
    "street_address" TEXT NOT NULL,
    "zipcode" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "house_style" TEXT NOT NULL,
    "num_bedrooms" INTEGER NOT NULL,
    "num_bathrooms" INTEGER NOT NULL,
    "living_area_sqft" INTEGER NOT NULL,
    "date_of_sale" TEXT NOT NULL,
    "sale_amount" INTEGER NOT NULL,
    "CTDATA_mill_rates" DOUBLE PRECISION NOT NULL,
    "FRED_mortgage30us" DOUBLE PRECISION NOT NULL,
    "FRED_CPI" DOUBLE PRECISION NOT NULL,
    "BLS_unemployment_rate" DOUBLE PRECISION NOT NULL,
    "BLS_housing_supply" DOUBLE PRECISION NOT NULL,
    "USCENSUS_lodes" DOUBLE PRECISION NOT NULL,
    "USCENSUS_qwi" DOUBLE PRECISION NOT NULL,
    "FRED_ctrerenleargsp" DOUBLE PRECISION NOT NULL,
    "FRED_dgs10" DOUBLE PRECISION NOT NULL,
    "FRED_actliscouct" DOUBLE PRECISION NOT NULL,
    "FBI_burglary" DOUBLE PRECISION NOT NULL,
    "FBI_agg_assault" DOUBLE PRECISION NOT NULL,
    "NCES_student_teacher_ratio" DOUBLE PRECISION NOT NULL
);
ALTER TABLE
    "ML_Dataset" ADD PRIMARY KEY("Serial_ID");
COMMENT
ON COLUMN
    "ML_Dataset"."zipcode" IS 'will have to be calculated if 2001-2023 CT dataset is imported';
COMMENT
ON COLUMN
    "ML_Dataset"."date_of_sale" IS 'we will join time series data on this variable';
COMMENT
ON COLUMN
    "ML_Dataset"."sale_amount" IS 'target variable';
CREATE TABLE "ML_Models"(
    "model_name" TEXT NOT NULL,
    "model_coverage" TEXT NOT NULL,
    "mode_of_prediction" TEXT NOT NULL,
    "target_feature" TEXT NOT NULL,
    "created_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "updated_at" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);
ALTER TABLE
    "ML_Models" ADD PRIMARY KEY("model_name");
COMMENT
ON COLUMN
    "ML_Models"."model_coverage" IS 'this is the location scope of the model. For example: CT would be a model for the state of CT';
COMMENT
ON COLUMN
    "ML_Models"."mode_of_prediction" IS 'for example regression';
COMMENT
ON COLUMN
    "ML_Models"."target_feature" IS 'this is what the model predicts';
CREATE TABLE "Model_Performance"(
    "model_name" TEXT NOT NULL,
    "r_squared" DOUBLE PRECISION NOT NULL,
    "mean_average_percent_error" DOUBLE PRECISION NOT NULL,
    "mean_average_actual_error" DOUBLE PRECISION NOT NULL
);
ALTER TABLE
    "Model_Performance" ADD PRIMARY KEY("model_name");
CREATE TABLE "Model_Predictions"(
    "model_name" TEXT NOT NULL,
    "series_id" INTEGER NOT NULL,
    "actual_value" INTEGER NOT NULL,
    "predicted_value" INTEGER NOT NULL
);
ALTER TABLE
    "Model_Predictions" ADD PRIMARY KEY("model_name");
ALTER TABLE
    "Model_Predictions" ADD CONSTRAINT "model_predictions_series_id_unique" UNIQUE("series_id");
COMMENT
ON COLUMN
    "Model_Predictions"."series_id" IS 'prediction for each record in training set

Composite key on (model_name, series_id)';
COMMENT
ON COLUMN
    "Model_Predictions"."predicted_value" IS 'in our case the predicted value would be house price, but that info is stored in the model table';
ALTER TABLE
    "Model_Performance" ADD CONSTRAINT "model_performance_model_name_foreign" FOREIGN KEY("model_name") REFERENCES "ML_Models"("model_name");
ALTER TABLE
    "Model_Predictions" ADD CONSTRAINT "model_predictions_model_name_foreign" FOREIGN KEY("model_name") REFERENCES "ML_Models"("model_name");
ALTER TABLE
    "Property_sale" ADD CONSTRAINT "property_sale_property_id_foreign" FOREIGN KEY("property_id") REFERENCES "Property"("pid");
ALTER TABLE
    "Model_Predictions" ADD CONSTRAINT "model_predictions_series_id_foreign" FOREIGN KEY("series_id") REFERENCES "ML_Dataset"("Serial_ID");