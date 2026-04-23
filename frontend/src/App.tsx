import { useState } from 'react'
import Home from './ui/Home.tsx'
import Listing from './ui/Listing.tsx'
import * as addr from 'parse-address'
import AreaListings from './ui/AreaListings.tsx'
import { set } from 'ol/transform'

interface Attribute {
  label: string
  value: any
}

const BASE_URL = 'https://real-estate-ml-app-team-10.onrender.com'

// Wake up the server immediately when the app loads
fetch(`${BASE_URL}/property-sales/state-history`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ state: "CT" })
}).catch(() => {})

const cache: Record<string, any> = {}

//Used to cache the calculated average sales for zipcode, city, and state
async function cachedFetch(url: string, body: object) {
  const key = url + JSON.stringify(body)
  
  // Check in-memory cache first
  if (cache[key]) return cache[key]

  // Check localStorage
  const stored = localStorage.getItem(key)
  if (stored) {
    const parsed = JSON.parse(stored)
    // Only use cached value if it was a successful response
    if (parsed?.status === 'success') {
      cache[key] = parsed
      return parsed
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  const json = await res.json()
  
  // Only cache successful responses
  if (json?.status === 'success') {
    cache[key] = json
    localStorage.setItem(key, JSON.stringify(json))
  }
  
  return json
}


// Needs to be normalized so the backend can read
export function normalizeAddress(address: string): string {
  // parse-address parses and normalizes the street suffix (Road→Rd, Street→St, etc.)
  // without over-abbreviating words that are part of the street name
  const parsed = addr.parseLocation(address)
  if (!parsed) return address.toUpperCase().trim()

  // Reconstruct just the street portion: number + prefix + name + type + suffix
  const parts = [
    parsed.number,
    parsed.prefix,   // e.g. N, S, E, W
    parsed.street,
    parsed.type,     // e.g. Rd, St, Ave — parse-address uses USPS abbreviations
    parsed.suffix,   // e.g. NW, SE
  ].filter(Boolean)

  return parts.join(' ').toUpperCase().trim()
}


function App() {
  const [page, setPage] = useState<'home' | 'listing' | 'area'>('home')
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [areaResults, setAreaResults] = useState<Attribute[][]>([])
  const [areaName, setAreaName] = useState <String>('')

  const [salesData, setSalesData] = useState<{date_of_sale: string, sale_amount: number}[]>([])
  const [cityData,  setCityData]  = useState<{year: string, avg_price: number}[]>([])
  const [zipData,   setZipData]   = useState<{year: string, avg_price: number}[]>([])
  const [stateData, setStateData] = useState<{year: string, avg_price: number}[]>([])

  const[propertyPrediction, setPropertyPrediction] = useState <number | null>(null)

  // Street View image URL — must be state so updates trigger a re-render
  const [streetViewUrl, setStreetViewUrl] = useState<string | null>(null)

  /*Testing:
  const [page, setPage] = useState<'home' | 'listing'>('listing')
  const [attributes, setAttributes] = useState<Attribute[]>([
    { label: "Address",    value: "14 DOWNS RD, Monroe, CT 6468" },
    { label: "Year Built", value: 1951 },
    { label: "Style",      value: "Colonial" },
    { label: "Bedrooms",   value: 4 },
    { label: "Bathrooms",  value: 2 },
    { label: "Sq Ft",      value: 1908 },
    { label: "Stories",    value: 2 },
    { label: "Latitude",   value: 41.3857335 },
    { label: "Longitude",  value: -73.1862192 },
  ])
  */

  let savedAutocomplete = {
    address_line1: "",
    city: "",
    postcode: "",
    state_code: "",
    result_type: ""
  }

  const [loading, setLoading]       = useState<boolean>(false)
  const [error, setError]           = useState<string | null>(null)

  // Needs to be normalized so the backend can read

  const onPlaceSelected = async (feature: any) => {

    if (feature?.properties.result_type !== "building" && feature?.properties.result_type !== "city"&& feature?.properties.result_type !== "postcode") return

    savedAutocomplete.address_line1 = feature.properties.address_line1
    savedAutocomplete.city          = feature.properties.city
    savedAutocomplete.postcode      = feature.properties.postcode
    savedAutocomplete.state_code    = feature.properties.state_code
    savedAutocomplete.result_type   = feature.properties.result_type

    console.log('Selected:', savedAutocomplete.address_line1, savedAutocomplete.city, savedAutocomplete.postcode, savedAutocomplete.state_code, savedAutocomplete.result_type)
  }

  const onSubmit = async () => {
    setLoading(true)
    setError(null)
    setStreetViewUrl(null)

    const type = savedAutocomplete.result_type


    if(type == "city"){

      const normalizedAddress = normalizeAddress(savedAutocomplete.address_line1)
      const city    = savedAutocomplete.city.toUpperCase()
      const state   = savedAutocomplete.state_code

      console.log('Sending to backend:', { address: normalizedAddress, city, state })

      try{

        const responseCity = await fetch(`${BASE_URL}/property/city`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            city: city
          })
        }).then(r => r.json())

        if (responseCity.status === 'success'){

          console.log("properties: ", responseCity)

          setAreaResults(responseCity.data)
          setAreaName("in City: " + city)
          setPage('area')
        }
        else{
          setError('no properties found in this city')
        }

      }catch (err) {
        setError('Failed to connect to server.')
        console.error(err)
      } finally {
        setLoading(false)
      }

    }

    if(type == "postcode"){

      const normalizedAddress = normalizeAddress(savedAutocomplete.address_line1)
      const postcode    = savedAutocomplete.postcode
      const state   = savedAutocomplete.state_code

      console.log('Sending to backend:', { address: normalizedAddress, postcode, state })

      try{

        const responseCity = await fetch(`${BASE_URL}/property/ZIP`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            postcode: postcode
          })
        }).then(r => r.json())

        if (responseCity.status === 'success'){

          console.log("properties: ", responseCity)

          setAreaResults(responseCity.data)
          setAreaName("with ZIP code: " + postcode)
          setPage('area')
        }
        else{
          setError('no properties found with this zipcode')
        }

      }catch (err) {
        setError('Failed to connect to server.')
        console.error(err)
      } finally {
        setLoading(false)
      }

    }

    if(type == "building") {
      const normalizedAddress = normalizeAddress(savedAutocomplete.address_line1)
      const city    = savedAutocomplete.city.toUpperCase()
      const zipcode = savedAutocomplete.postcode.padStart(5, '0')  // fixes "6468" → "06468"
      const state   = savedAutocomplete.state_code
      console.log('Sending to backend:', { address: normalizedAddress, city, zipcode, state })

      try {
        const fetchPromises: Promise<any>[] = [
          fetch(`${BASE_URL}/property/attributes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: normalizedAddress, city, zipcode, state })
          }).then(r => r.json())
        ]

        const [json, mapJson] = await Promise.all(fetchPromises)
        if (mapJson) console.log(mapJson)

        if (json.status === 'success') {
          console.log(json)
          setAttributes(json.data)

          const responseZip = await fetch(`${BASE_URL}/predictions/zipcode-averages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model_name: "Real_Estate_Price_predictor_2004_2020_CT",
              zipcode: savedAutocomplete.postcode
            })
          }).then(r => r.json())

          console.log("Zip avg: ", responseZip)

          if (responseZip.status !== 'success') {
            throw new Error(responseZip.message || 'Request failed')
          }
          

          const responseCity = await fetch(`${BASE_URL}/predictions/city-averages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model_name: "Real_Estate_Price_predictor_2004_2020_CT",
              city: savedAutocomplete.city
            })
          }).then(r => r.json())

          console.log("City avg: ", responseCity)

          
          if (responseZip.status !== 'success') {
            throw new Error(responseCity.message || 'Request failed')
          }
          


          // --- Google Street View ---
          const superSecretKey = "AIzaSyC10WuDUmrqJg0OkAS99Oyn76yb3brq8I4"
          const lat = json.data.find((a: Attribute) => a.label === "Latitude")?.value
          const lon = json.data.find((a: Attribute) => a.label === "Longitude")?.value

          /*
          if (lat && lon) {
            const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lon}&source=outdoor&key=${superSecretKey}`
            const metadataRes = await fetch(metadataUrl)
            const metadataJson = await metadataRes.json()
            console.log(metadataJson)

            const panoId = metadataJson.pano_id
            if (panoId) {
              const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x250&pano=${panoId}&source=outdoor&key=${superSecretKey}`
              const imageRes = await fetch(imageUrl)
              const imageBlob = await imageRes.blob()
              setStreetViewUrl(window.URL.createObjectURL(imageBlob))
            }
          }
          // --- End Google Street View ---
          */

          const [salesJson, zipJson, cityJson, stateJson] = await Promise.all([
            fetch(`${BASE_URL}/property-sales`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: normalizedAddress, city, zipcode, state })
            }).then(r => r.json()),
            cachedFetch(`${BASE_URL}/property-sales/zipcode-history`, { zipcode, state }),
            cachedFetch(`${BASE_URL}/property-sales/city-history`,    { city, state }),
            cachedFetch(`${BASE_URL}/property-sales/state-history`,   { state }),
          ])

          setSalesData(salesJson.status  === 'success' ? salesJson.data  : [])
          setZipData(zipJson.status      === 'success' ? zipJson.data    : [])
          setCityData(cityJson.status    === 'success' ? cityJson.data   : [])
          setStateData(stateJson.status  === 'success' ? stateJson.data  : [])


          const pid = json.data.find((a: Attribute) => a.label === "pid")?.value
          const predictionPropertyJson = await fetch(`${BASE_URL}/predictions/property-predictions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model_name: "Real_Estate_Price_predictor_2004_2020_CT", pid: pid })
          }).then(r => r.json())

          console.log("predictionProperties: ", predictionPropertyJson)
          setPropertyPrediction(predictionPropertyJson !== undefined && predictionPropertyJson.length !== 0 ? predictionPropertyJson[0].predicted_value : null)

          setPage('listing')
        } else {
          setError('Property not found in database.')
          setAttributes([])
        }
      } catch (err) {
        setError('Failed to connect to server.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

  }

  return (
    <>
      {page === 'home' && (
        <Home
          onPlaceSelected={onPlaceSelected}
          onSubmit={onSubmit}
          loading={loading}
        />
      )}
      {page === 'listing' && (
        <Listing
          onPlaceSelected={onPlaceSelected}
          onSubmit={onSubmit}
          attributes={attributes}
          loading={loading}
          error={error}
          salesData={salesData}
          cityData={cityData}
          zipData={zipData}
          stateData={stateData}
          streetViewUrl={streetViewUrl}
          propertyPrediction = {propertyPrediction}
        />
      )}
      {page === 'area' && (
        <AreaListings
          onPlaceSelected={onPlaceSelected}
          onSubmit={onSubmit}
          listings={areaResults}
          area = {areaName}
          loading={loading}
          error={error}
        />
      )}
    </>
  )
}

export default App
