import { useState } from 'react'
import Home from './ui/Home.tsx'
import Listing from './ui/Listing.tsx'

interface Attribute {
  label: string
  value: any
}

const BASE_URL = 'https://real-estate-ml-app-team-10.onrender.com'

function App() {
  const [page, setPage] = useState<'home' | 'listing'>('home')
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [salesData, setSalesData] = useState<{date_of_sale: string, sale_amount: number}[]>([])

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
    .replace(/\bWAY\b/g, 'WAY')
    .replace(/\bHILL\b/g, 'HL')
    .replace(/\bMOUNT\b/g, 'MT')
    .replace(/\bNORTH\b/g, 'N')
    .replace(/\bSOUTH\b/g, 'S')
    .replace(/\bEAST\b/g, 'E')
    .replace(/\bWEST\b/g, 'W')
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
        if (salesJson.status === 'success') {
          setSalesData(salesJson.data)
        } else {
          setSalesData([])
        }


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
        />
      )}
    </>
  )
}

export default App