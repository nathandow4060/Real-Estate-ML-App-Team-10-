import DataTable from 'react-data-table-component';



function Table(response) { // figure out props later

    const columns = [
	{
		name: 'Title',
		selector: row => row.title,
	},
	{
		name: 'Data',
		selector: row => row.data,
	},
];

const data = [ // data will be set with props 
  	{
		title: 'year_built',
		data: response.data.year_built,
	},
  	{
		title: 'street_address',
		data: response.data.street_address,
	},
	{
		title: 'zipcode',
		data: response.data.zipcode,
	},
	{
		title: 'city',
		data: response.data.city,
	},
	{
		title: 'state',
		data: response.data.state,
	},
	{
		title: 'longitude',
		data: response.data.longitude,
	},
	{
		title: 'latitude',
		data: response.data.latitude,
	},
	{
		title: 'house_style',
		data: response.data.house_style,
	},
	{
		title: 'num_bedrooms',
		data: response.datanum_bedrooms,
	}, 
	{
		title: 'num_bathrooms',
		data: response.data.num_bathrooms,
	},
	{
		title: 'living_area_sqft',
		data: response.data.living_area_sqft,
	},
	{
		title: 'stories',
		data: response.data.stories,
	},
	
	
]


	return (
		<DataTable
			columns={columns}
			data={data}
		/>
	);
};
export default Table