import { useState } from 'react'
import Home from './ui/Home.tsx'
import Listing from './ui/Listing.tsx'

interface Attribute {
  label: string
  value: any
}

const BASE_URL = 'https://real-estate-ml-app-team-10.onrender.com'

const cache: Record<string, any> = {}

//Used to catche the calculated average sales for zipcode, city, and state
async function cachedFetch(url: string, body: object) {
  const key = url + JSON.stringify(body)
  if (cache[key]) {
    console.log('Cache hit:', key)
    return cache[key]
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  const json = await res.json()
  cache[key] = json
  return json
}

function App() {
  const [page, setPage] = useState<'home' | 'listing'>('home')
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [salesData, setSalesData] = useState<{date_of_sale: string, sale_amount: number}[]>([])

  const [cityData,   setCityData]   = useState<{year: string, avg_price: number}[]>([])
  const [zipData,    setZipData] = useState<{year: string, avg_price: number}[]>([])
  const [stateData,  setStateData]  = useState<{year: string, avg_price: number}[]>([])

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

  const [loading, setLoading]       = useState<boolean>(false)
  const [error, setError]           = useState<string | null>(null)

  // Needs to be normalized so the backend can read
  function normalizeAddress(address: string): string {
  return address
    .toUpperCase()
    .replace(/\bROAD\b/g, 'RD')
    .replace(/\bSTREET\b/g, 'ST')
    .replace(/\bAVENUE\b/g, 'AVE')
    .replace(/\bDRIVE\b/g, 'DR')
    .replace(/\bLANE\b/g, 'LN')
    .replace(/\bCOURT\b/g, 'CT')
    .replace(/\bBOULEVARD\b/g, 'BLVD')
    .replace(/\bCIRCLE\b/g, 'CIR')
    .replace(/\bPLACE\b/g, 'PL')
    .replace(/\bHIGHWAY\b/g, 'HWY')
    .replace(/\bTERRACE\b/g, 'TER')
    .replace(/\bTRAIL\b/g, 'TRL')
    .replace(/\bHILL\b/g, 'HL')
    .replace(/\bNORTH\b/g, 'N')
    .replace(/\bSOUTH\b/g, 'S')
    .replace(/\bEAST\b/g, 'E')
    .replace(/\bWEST\b/g, 'W')
    .replace(/\bTURNPIKE\b/g, 'TPKE')
    .replace(/\bPARKWAY\b/g, 'PKWY')
    .replace(/\bEXPRESSWAY\b/g, 'EXPY')
    .replace(/\bFREEWAY\b/g, 'FWY')
    .replace(/\bROUTE\b/g, 'RTE')
    .replace(/\bMOUNT\b/g, 'MT')
    .replace(/\bFORD\b/g, 'FRD')
    .replace(/\bSPRING\b/g, 'SPG')
    .replace(/\bCROSSING\b/g, 'XING')
    .replace(/\bJUNCTION\b/g, 'JCT')
    .trim()
  }

  const onPlaceSelected = async (feature: any) => {
    if (feature?.properties.result_type !== "building") return

    const { address_line1, city, postcode, state_code } = feature.properties
    console.log('Selected:', address_line1, city, postcode, state_code)

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BASE_URL}/property/attributes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: normalizeAddress(address_line1),  // ← normalize before sending
          city:    city.toUpperCase(),               // ← DB has uppercase cities
          zipcode: postcode,
          state:   state_code
        })
      })
      const json = await res.json()

      if (json.status === 'success') {
        setAttributes(json.data)

        const salesRes = await fetch(`${BASE_URL}/property-sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: normalizeAddress(address_line1),
            city:    city.toUpperCase(),
            zipcode: postcode,
            state:   state_code
          })
        })
        const salesJson = await salesRes.json()
        if (salesJson.status === 'success') setSalesData(salesJson.data)
        else setSalesData([])


        //  Zip Code
        const zipJson = await cachedFetch(`${BASE_URL}/property-sales/zipcode-history`, {
          zipcode: postcode,
          state: state_code
        })
        if (zipJson.status === 'success') setZipData(zipJson.data)
        else setZipData([])


       // City
        const cityJson = await cachedFetch(`${BASE_URL}/property-sales/city-history`, {
          city: city.toUpperCase(),
          state: state_code
        })
        if (cityJson.status === 'success') setCityData(cityJson.data)
        else setCityData([])

        
        // State
        const stateJson = await cachedFetch(`${BASE_URL}/property-sales/state-history`, {
          state: state_code
        })
        if (stateJson.status === 'success') setStateData(stateJson.data)
        else setStateData([])
        
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

  

  return (
    <>
      {page === 'home' && (
        <Home onPlaceSelected={onPlaceSelected} />
      )}
      {page === 'listing' && (
        <Listing
          onPlaceSelected={onPlaceSelected}
          attributes={attributes}
          loading={loading}
          error={error}
          salesData={salesData}
          cityData={cityData}
          zipData={zipData}
          stateData={stateData}
        />
      )}
    </>
  )
}

export default App