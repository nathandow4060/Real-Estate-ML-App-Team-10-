import DataTable from 'react-data-table-component';



function Table() { // figure out props later

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

		title: '21',
		data: '1988',
	},
	{

		title: 'balls',
		data: '1984',
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