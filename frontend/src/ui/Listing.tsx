import React, { useState } from "react";
import House from './assets/house.jpg'
import './Listing.css'
import DynamicLineChart from "./components/DynamicLineChart.tsx"
import PropertyListCard from "./components/PropertyListCard.tsx"
import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete'
import '@geoapify/geocoder-autocomplete/styles/round-borders-dark.css'
import PropertySearch from "./components/PropertySearch.tsx";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

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
  const houseFutureX: string[] = ["21", "2026", "2027"]
  let houseFutureY: ChartDataset[] = [{
    label: "Price Prediction (USD $)",
    data: [0, 0, 0],
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

  const currentYear = new Date().getFullYear();

  let lastSaleText = "Last Sale Price";
  let lastSale = salesData.length > 0 ? salesData[salesData.length - 1] : null
  let lastSalePrice =  "—"
  let lastSaleYear =  "—"
  
  // get final entry in salesData if it isnt blank
  if(lastSale !== null) {
    lastSalePrice = lastSale?.sale_amount.toLocaleString()
    lastSaleYear = lastSale?.date_of_sale
  } 

  const checkCurrentPrice = attributes.find(a =>a.label === "Current Price")?.value
  const checkMarketStatus = attributes.find(a =>a.label === "On the Market")?.value

  if (checkCurrentPrice !== null && checkMarketStatus !== null &&
    checkCurrentPrice !== undefined && checkMarketStatus !== undefined) {
    lastSalePrice = checkCurrentPrice.toLocaleString()
    lastSaleYear = "—"
    houseFutureY[0].data[0] = parseInt(lastSalePrice.replaceAll(',', ''))
    houseFutureX[0] = currentYear.toString()

    if(checkMarketStatus === true) lastSaleText = "Current Listing Price"
    else if(checkMarketStatus === false) lastSaleText = "Current Estimation"
  }

  //const displayAttributes = attributes.slice(0,7)

  const [open, setOpen] = useState(false);

  return (
    <main className="pdp-wrapper">

      {/*Header with search bar*/}
      <header className="pdp-header">
        <h1>HomeView</h1>
        <PropertySearch onSubmit={onSubmit} onPlaceSelected={onPlaceSelected}/>
        {/* <GeoapifyContext apiKey="c56847c51cc54d77a23f9d4caed09c74">
          <GeoapifyGeocoderAutocomplete
            placeholder="Enter an address..."
            lang="en"
            limit={9}
            filterByPlace="512b2c5d66fd2e52c0590f9fcfdb33d34440f00101f901a287020000000000c0020a"
            placeSelect={onPlaceSelected}
          />
        </GeoapifyContext>
        <button onClick = {onSubmit}>Submit</button> */}
      </header>

      {/*Loading / Error states*/}
      {loading && <p className="status-msg">Loading property data...</p>}
      {error   && <p className="status-msg error">{error}</p>}

      {/*Main two-column layout */}
      {!loading && attributes.length > 0 && (
        <div className="pdp-body">

          {/* LEFT: photo + attribute table */}
          <section className="pdp-main">
              <img src="https://maps.googleapis.com/maps/api/streetview?size=640x640&pano=zVlgKG1os5SqSbzP0beWxA&source=outdoor&key=AIzaSyC10WuDUmrqJg0OkAS99Oyn76yb3brq8I4" alt="Property" className="pdp-photo" onClick={() => setOpen(true)} /> 

              <Lightbox 
                open={open} 
                close={() => setOpen(false)} 
                controller={{ closeOnBackdropClick: true }}
                carousel={{ finite: true , padding:70}}
                slides={[{ src: House }]} 
                styles={{ container: { backgroundColor: "rgba(0, 0, 0, .6)"} }}
                render={{
                  buttonPrev: () => null,
                  buttonNext: () => null,
                  buttonClose: () => null,
                }}
              />

            <div className="pdp-price">
              <h2>{lastSaleText}</h2>
              <p className="price-value">
                ${lastSalePrice}
              </p>
              <p className="price-date">Sold: {lastSaleYear}</p>
            </div>

            <div className="pdp-attributes">
              <h2>Property Details</h2>
              <PropertyListCard
              attributes = {attributes}
              />
            </div>
          </section>

          {/* RIGHT: charts sidebar */}
          <aside className="pdp-sidebar">

            <p>Disclaimer: prediction data is experimental and should not be used solely to make any financial decisions</p>

            <div className="chart-block">
              <DynamicLineChart
                pastX={housePastX} pastY={housePastY}
                futureX={houseFutureX} futureY={houseFutureY}
                name = {"Property Price"}
              />
            </div>

            <div className="chart-block">
              <DynamicLineChart
                pastX={zipPastX} pastY={zipPastY}
                futureX={houseFutureX} futureY={houseFutureY}
                name = {"Zip-Code Price"}
              />
            </div>

            <div className="chart-block">
              <DynamicLineChart
                pastX={cityPastX} pastY={cityPastY}
                futureX={houseFutureX} futureY={houseFutureY}
                name = {"City Price"}
              />
            </div>

            <div className="chart-block">
              <DynamicLineChart
                pastX={statePastX} pastY={statePastY}
                futureX={houseFutureX} futureY={houseFutureY}
                name = {"State Price"}
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