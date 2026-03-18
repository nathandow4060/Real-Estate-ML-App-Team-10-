import React, { useState } from 'react'
import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete'
import '@geoapify/geocoder-autocomplete/styles/round-borders-dark.css'
/* 
var request;

const Search = () => {
 
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

  const onSuggestionsChange = (list) => {
    console.log('Suggestions:', list);
  };
 
  return <GeoapifyContext apiKey="c56847c51cc54d77a23f9d4caed09c74">
      <GeoapifyGeocoderAutocomplete placeholder="Enter address here"
        lang={'en'}
        limit={9}
        filterByPlace={"512b2c5d66fd2e52c0590f9fcfdb33d34440f00101f901a287020000000000c0020a"}
        placeSelect={onPlaceSelected}
        //suggestionsChange={onSuggestionsChange}
      />
    </GeoapifyContext>
  }
export default Search */