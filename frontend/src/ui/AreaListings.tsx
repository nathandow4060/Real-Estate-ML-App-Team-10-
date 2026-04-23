import React, { useState } from "react";
import House from './assets/house.jpg'
import './Listing.css'
import PropertyListCard from "./components/PropertyListCard.tsx"
import '@geoapify/geocoder-autocomplete/styles/round-borders-dark.css'
import Carousel from "./components/Carousel.tsx";
import PropertySearch from "./components/PropertySearch.tsx";

interface Attribute {
  label: string
  value: any
}

interface AreaListingsProps {
  onPlaceSelected: (feature: any) => void
  onSubmit: (feature: any) => void
  area: string
  listings: (Attribute[])[]
  loading: boolean
  error: string | null

}

function AreaListings({ onPlaceSelected, onSubmit, listings, area, loading, error}: AreaListingsProps) {

    console.log("Hello from inside AreaListings", listings)
    console.log("Hello from inside AreaListings ", area)

    const DisplayAttributes = listings.map(listing =>
    listing.filter(attr =>
            attr.label !== "On the Market" &&
            attr.label !== "Longitude" &&
            attr.label !== "Latitude" &&
            attr.label !== "pid" &&
            attr.label !== "City" &&
            attr.label !== "State" &&
            attr.label !== "Zip Code"
        )
    );
    console.log("Hello from inside AreaListings display attributes ", DisplayAttributes);


    return(<>
        <PropertySearch onSubmit={onSubmit} onPlaceSelected={onPlaceSelected} disabled={loading}/>
      {loading && <p className="status-msg">Loading property data...</p>}
      {error   && <p className="status-msg error">{error}</p>}
        <h2>Listings {area} </h2>

        {DisplayAttributes.map((listing, i: number) => 

        <div key={i}>
            <PropertyListCard
            attributes={listing}
            />
        </div>
            
)}

    </>)
}
export default AreaListings