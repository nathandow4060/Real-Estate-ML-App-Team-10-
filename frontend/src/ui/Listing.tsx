import { useState, useEffect } from 'react'
import { useState, useEffect } from 'react'
import House from './assets/house.jpg'
import './Listing.css'
import {Chart as ChartJS} from "chart.js/auto"
import {Line} from "react-chartjs-2";
import DynamicLineChart from "./assets/dynamicLineChart.tsx"
import Search from './assets/search.tsx';
import Table from "./assets/table.tsx";
import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete'
import '@geoapify/geocoder-autocomplete/styles/round-borders-dark.css'
import Table from "./assets/table.tsx";
import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete'
import '@geoapify/geocoder-autocomplete/styles/round-borders-dark.css'

function Listing() {

  let housePastX = ["1990", "1991", "1992"] // contains X and Y data for graphs 
  let housePastY = [

  let housePastX = ["1990", "1991", "1992"]
  
  let housePastY = [
      {
        label: "Purchasse History (USD $)",
        data: [65, 59, 80],
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: 'rgba(25, 142, 221, 1)',
        borderWidth: 1
      },
    ]
  let houseFutureX = ["2025", "2026", "2027"]
  let houseFutureY = [
  let houseFutureX = ["2025", "2026", "2027"]
  let houseFutureY = [
      {
        label: "Price Prediction (USD $)",
        data: [100, 200, 600],
        backgroundColor: 'rgba(255, 26, 104, 0.2)',
        borderColor: 'rgba(255, 26, 104, 1)',
        borderWidth: 1
        borderColor: 'rgba(255, 26, 104, 1)',
        borderWidth: 1
      },
    ]
    
    //PastY[0].data = [21,345345, 234234]'

    var request = {} // contains data for the GET request to the backend

    const onPlaceSelected = (feature) => {
      console.log('Selected:', feature?.properties);

      if(feature?.properties.result_type === "building"){
        request = {
          type: feature.properties.result_type,
          data:{
          address: feature?.properties.address_line1,
          city:feature?.properties.city,
          zipcode: feature?.properties.postcode,
          state: feature?.properties.state_code
        }}
      }
      console.log(request)
    };

    function setXY(xValues, yValues, response){ // setter method for given xValues and yValues
        xValues.push(response.date_of_sales)
        yValues[0].data.push(response.sale_amount)
    }

    const baseURL = 'https://real-estate-ml-app-team-10.onrender.com/'

    async function getSalesData() { // POST request for propert-sales history using "request" variable saves data to X Y structs (ADD PARAMETERS LATER)
        //e.preventDefault() // prevent page reload; may not be needed
        let urlToCall = baseURL+'property-sales'
        console.log(urlToCall)
        const res = await fetch(urlToCall, {
          method: "POST",
          headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
          address: "123 Jizzy LN",
          city: "Austin",
          zipcode: 12345,
          state: "TX"
        })
      })
      const jsonRes = await res.json() 
      console.log(jsonRes)
      let data = ''
      jsonRes.data.array.forEach(element => {
        setXY(housePastX, housePastY, element)
      });

    }

    var propertyData = {} // stores data from getProperyData POST request

    async function getPropertyData() { // POST request for property data using "request" variable saves data to propertyData
        //e.preventDefault() // prevent page reload; may not be needed
        let urlToCall = baseURL+'/property/full_addr'
        console.log(urlToCall)
        const res = await fetch(urlToCall, {
          method: "POST",
          headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
          address: "123 Jizzy LN",
          city: "Austin",
          zipcode: 12345,
          state: "TX"
        })
      })
      const jsonRes = await res.json() 
      console.log(jsonRes)
      return(jsonRes)

    }



  useEffect(() => { // I think this runs on page render
    
  }, []);

  return (
    <>
      <div>
        <a href="https://youtu.be/QWL856dVPIM?si=4lWARAivVvwzxaBK&t=10" target="_blank">
          <img src={House} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>HomeView</h1>
      <div className="card">
        <GeoapifyContext apiKey="c56847c51cc54d77a23f9d4caed09c74">
              <GeoapifyGeocoderAutocomplete placeholder="Enter address here"
                lang={'en'}
                limit={9}
                filterByPlace={"512b2c5d66fd2e52c0590f9fcfdb33d34440f00101f901a287020000000000c0020a"}
                placeSelect={onPlaceSelected}
                //suggestionsChange={onSuggestionsChange}
              />
        </GeoapifyContext>
        <img src = {House} height="350"/>
        <h2>Price Data</h2>
        <DynamicLineChart pastX={housePastX} pastY={housePastY} futureX={houseFutureX} futureY={houseFutureY} />
        <h2>Additional Data</h2>
        <Table response = {propertyData}/>
      </div>
    </>
  )
}
export default Listing

/*
<Line id="graph" data = {{
        <GeoapifyContext apiKey="c56847c51cc54d77a23f9d4caed09c74">
              <GeoapifyGeocoderAutocomplete placeholder="Enter address here"
                lang={'en'}
                limit={9}
                filterByPlace={"512b2c5d66fd2e52c0590f9fcfdb33d34440f00101f901a287020000000000c0020a"}
                placeSelect={onPlaceSelected}
                //suggestionsChange={onSuggestionsChange}
              />
        </GeoapifyContext>
        <img src = {House} height="350"/>
        <h2>Price Data</h2>
        <DynamicLineChart pastX={housePastX} pastY={housePastY} futureX={houseFutureX} futureY={houseFutureY} />
        <h2>Additional Data</h2>
        <Table/>
      </div>
    </>
  )
}
export default Listing

/*
<Line id="graph" data = {{
        labels: ['1990', '1991', '1992', '1993', '1994', '1995', '1996'],
          datasets: [{
            label: 'Housing Prices (USD $)',
            data: [18, 12, 6, 9, 12, 3, 9],
            backgroundColor: [
            'rgba(255, 26, 104, 0.2)'
            ],
            borderColor: [
              'rgba(255, 26, 104, 1)'
            ],
            borderWidth: 1
          }]
        }}
        />
*/
*/