import React, { useState } from "react";
import House from './assets/house.jpg'
import './Listing.css'
import DynamicLineChart from "./assets/dynamicLineChart.tsx"
import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete'
import '@geoapify/geocoder-autocomplete/styles/round-borders-dark.css'
import Carousel from "./components/Carousel.tsx";

interface Attribute {
  label: string
  value: any
}

interface ChartDataset {
  label: string
  data: number[]
  backgroundColor: string
  borderColor: string
  borderWidth: number
}

interface ListingProps {
  onPlaceSelected: (feature: any) => void
  onSubmit: (feature: any) => void
  attributes: Attribute[]
  loading: boolean
  error: string | null
  salesData: {date_of_sale: string, sale_amount: number}[]
  cityData:   {year: string, avg_price: number}[]
  zipData: {year: string, avg_price: number}[]
  stateData:  {year: string, avg_price: number}[]
}


function Listing({ onPlaceSelected, onSubmit, attributes, loading, error, salesData, cityData, zipData, stateData}: ListingProps) {

  const housePastX: string[] = salesData.map(s => s.date_of_sale)
  const housePastY: ChartDataset[] = [{
    label: "Purchase History (USD $)",
    data: salesData.map(s => s.sale_amount),
    backgroundColor: "rgba(75,192,192,0.4)",
    borderColor: 'rgba(25, 142, 221, 1)',
    borderWidth: 1
  }]

  //Still needs to be predicted
  const houseFutureX: string[] = ["2025", "2026", "2027"]
  const houseFutureY: ChartDataset[] = [{
    label: "Price Prediction (USD $)",
    data: [100, 200, 600],
    backgroundColor: 'rgba(255, 26, 104, 0.2)',
    borderColor: 'rgba(255, 26, 104, 1)',
    borderWidth: 1
  }]

  const zipPastX: string[] = zipData.map(d => d.year)
  const zipPastY: ChartDataset[] = [{
    label: "Avg Zip-Code Sale Price (USD $)",
    data: zipData.map(d => d.avg_price),
    backgroundColor: "rgba(255,159,64,0.4)",
    borderColor: 'rgba(255,159,64,1)',
    borderWidth: 1
  }]

  const cityPastX: string[] = cityData.map(d => d.year)
  const cityPastY: ChartDataset[] = [{
    label: "Avg City Sale Price (USD $)",
    data: cityData.map(d => d.avg_price),
    backgroundColor: "rgba(153,102,255,0.4)",
    borderColor: 'rgba(153,102,255,1)',
    borderWidth: 1
  }]

  

  const statePastX: string[] = stateData.map(d => d.year)
  const statePastY: ChartDataset[] = [{
    label: "Avg State Sale Price (USD $)",
    data: stateData.map(d => d.avg_price),
    backgroundColor: "rgba(255,99,132,0.4)",
    borderColor: 'rgba(255,99,132,1)',
    borderWidth: 1
  }]

  const[lastSaleText, setLastSaleText] = useState<"Last Sale Price" | "Current Estimation" | "Current Listing Price">("Last Sale Price");
  let lastSale = salesData.length > 0 ? salesData[salesData.length - 1] : null
  let lastSalePrice =  "—"
  let lastSaleYear =  "—"
  
  // get final entry in salesData if it isnt blank
  if(lastSale !== null) {
    lastSalePrice = lastSale?.sale_amount.toLocaleString()
    lastSaleYear = lastSale?.date_of_sale
  } 

  /*
  if (attributes.current_price !== null && attributes.market_status !== null) {
    lastSalePrice = attributes.current_price
    lastSaleYear = "—"
    if(attributes.market_status === true){
      setLastSaleText("Current Listing Price")
    }
    if(attributes.market_status === false){
      setLastSaleText("Current Estimation")
    }
  }
  
 */


  return (
    <main className="pdp-wrapper">

      {/*Header with search bar*/}
      <header className="pdp-header">
        <h1>HomeView</h1>
        <GeoapifyContext apiKey="c56847c51cc54d77a23f9d4caed09c74">
          <GeoapifyGeocoderAutocomplete
            placeholder="Enter an address..."
            lang="en"
            limit={9}
            filterByPlace="512b2c5d66fd2e52c0590f9fcfdb33d34440f00101f901a287020000000000c0020a"
            placeSelect={onPlaceSelected}
          />
        </GeoapifyContext>
        <button onClick = {onSubmit}>Submit</button>
      </header>

      {/*Loading / Error states*/}
      {loading && <p className="status-msg">Loading property data...</p>}
      {error   && <p className="status-msg error">{error}</p>}

      {/*Main two-column layout */}
      {!loading && attributes.length > 0 && (
        <div className="pdp-body">

          {/* LEFT: photo + attribute table */}
          <section className="pdp-main">
              <Carousel></Carousel>
              <img src={House} alt="Property" className="pdp-photo" /> 

            <div className="pdp-price">
              <h2>{lastSaleText}</h2>
              <p className="price-value">
                ${lastSalePrice}
              </p>
              <p className="price-date">Sold: {lastSaleYear}</p>
            </div>

            <div className="pdp-attributes">
              <h2>Property Details</h2>
              <table className="attr-table">
                <tbody>
                  {attributes.map((attr: Attribute, i: number) => (
                    <tr key={i}>
                      <td className="attr-label">{attr.label}</td>
                      <td className="attr-value">{attr.value ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* RIGHT: charts sidebar */}
          <aside className="pdp-sidebar">

            <p>Disclaimer: prediction data is experimental and should not be used solely to make any financial decisions</p>

            <div className="chart-block">
              <h2>Property Price History</h2>
              <DynamicLineChart
                pastX={housePastX} pastY={housePastY}
                futureX={houseFutureX} futureY={houseFutureY}
              />
            </div>

            <div className="chart-block">
              <h2>Zip-Code Price History</h2>
              <DynamicLineChart
                pastX={zipPastX} pastY={zipPastY}
                futureX={houseFutureX} futureY={houseFutureY}
              />
            </div>

            <div className="chart-block">
              <h2>City Price History</h2>
              <DynamicLineChart
                pastX={cityPastX} pastY={cityPastY}
                futureX={houseFutureX} futureY={houseFutureY}
              />
            </div>

            

            <div className="chart-block">
              <h2>State Price History</h2>
              <DynamicLineChart
                pastX={statePastX} pastY={statePastY}
                futureX={houseFutureX} futureY={houseFutureY}
              />
            </div>
          </aside>

        </div>
      )}

    </main>
  )
}

export default Listing

{/*
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
*/}