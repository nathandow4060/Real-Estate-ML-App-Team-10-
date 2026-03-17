--View data
--view mill rate data
select * from public."Timeseries_Set_Info" as setInfo JOIN
public."Timeseries_Data_Points" as setData ON setInfo.id = setData.timeseries_set_id
where setInfo.id = 1

--view mortgage 30
select * from public."Timeseries_Set_Info" as setInfo JOIN
public."Timeseries_Data_Points" as setData ON setInfo.id = setData.timeseries_set_id
where setInfo.id = 2

-- cpi
select * from public."Timeseries_Set_Info" as setInfo JOIN
public."Timeseries_Data_Points" as setData ON setInfo.id = setData.timeseries_set_id
where setInfo.id = 3

--BLS Unemployment rate
select * from public."Timeseries_Set_Info" as setInfo JOIN
public."Timeseries_Data_Points" as setData ON setInfo.id = setData.timeseries_set_id
where setInfo.id = 4

--FRED Housing supply
select * from public."Timeseries_Set_Info" as setInfo JOIN
public."Timeseries_Data_Points" as setData ON setInfo.id = setData.timeseries_set_id
where setInfo.id = 5

--FRED Real Gross Domestic Product: Real Estate and Rental and Leasing (53) in Connecticut
select * from public."Timeseries_Set_Info" as setInfo JOIN
public."Timeseries_Data_Points" as setData ON setInfo.id = setData.timeseries_set_id
where setInfo.id = 6

--FRED DGS10
select * from public."Timeseries_Set_Info" as setInfo JOIN
public."Timeseries_Data_Points" as setData ON setInfo.id = setData.timeseries_set_id
where setInfo.id = 7



--timeseries info records
--CT mill rate data
INSERT INTO public."Timeseries_Set_Info" (time_series_freq, data_source_name, data_vector_name)
VALUES ('Annual', 'CTData', 'ct_mill_rate') 

--FRED Mortgage 30
INSERT INTO public."Timeseries_Set_Info" (time_series_freq, data_source_name, data_vector_name)
VALUES ('Weekly', 'FRED', 'mortgage30us') 

--FRED CPI
INSERT INTO public."Timeseries_Set_Info" (time_series_freq, data_source_name, data_vector_name)
VALUES ('Weekly', 'FRED', 'cpi_northeast_region') 

--BLS Unemployment rate
INSERT INTO public."Timeseries_Set_Info" (time_series_freq, data_source_name, data_vector_name)
VALUES ('Monthly', 'BLS', 'unemployment_rate') 

--FRED housing inv
INSERT INTO public."Timeseries_Set_Info" (time_series_freq, data_source_name, data_vector_name)
VALUES ('Monthly', 'FRED', 'housing_inv_ct') 

--FRED Real Gross Domestic Product: Real Estate and Rental and Leasing (53) in Connecticut
INSERT INTO public."Timeseries_Set_Info" (time_series_freq, data_source_name, data_vector_name)
VALUES ('Annual', 'FRED', 'real_gdp_realestate_ct')

--FRED DGS10
INSERT INTO public."Timeseries_Set_Info" (time_series_freq, data_source_name, data_vector_name)
VALUES ('Daily', 'FRED', 'market_yield_us_treasuries_10_year_dgs10')




--timeseries data records
--insert mill rate data
COPY public."Timeseries_Data_Points" (timeseries_set_id, date_of_data_sample, data_point, data_location)
FROM 'C:\UTD_MATERIAL\CS4485_Real_Estate_Project\Data\CTData_millrates_for_DB_upload.csv'
DELIMITER ','
CSV HEADER;

--insert FRED Mortgage 30
COPY public."Timeseries_Data_Points" (timeseries_set_id, date_of_data_sample, data_point, data_location)
FROM 'C:\UTD_MATERIAL\CS4485_Real_Estate_Project\Data\MORTGAGE30US.csv'
DELIMITER ','
CSV HEADER;

--insert FRED cpi northeast
COPY public."Timeseries_Data_Points" (timeseries_set_id, date_of_data_sample, data_point, data_location)
FROM 'C:\UTD_MATERIAL\CS4485_Real_Estate_Project\Data\CPI_CUUR0100SA0.csv'
DELIMITER ','
CSV HEADER;

--ON HOLD!
--insert BLS unemployment_rate (national)
COPY public."Timeseries_Data_Points" (timeseries_set_id, date_of_data_sample, data_point, data_location)
FROM 'C:\UTD_MATERIAL\CS4485_Real_Estate_Project\Data\BLS_unemployment_2001-2023.csv'
CSV HEADER;

--insert FRED housing inv
COPY public."Timeseries_Data_Points" (timeseries_set_id, date_of_data_sample, data_point, data_location)
FROM 'C:\UTD_MATERIAL\CS4485_Real_Estate_Project\Data\FRED_ctrerenleargsp.csv'
DELIMITER ','
CSV HEADER;

--insert FRED dgs10 
COPY public."Timeseries_Data_Points" (timeseries_set_id, date_of_data_sample, data_point, data_location)
FROM 'C:\UTD_MATERIAL\CS4485_Real_Estate_Project\Data\DGS10.csv'
DELIMITER ','
CSV HEADER;

