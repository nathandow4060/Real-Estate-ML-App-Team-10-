import { useState } from 'react'
import Home from './ui/Home.tsx'
import Listing from './ui/Listing.tsx'

interface Attribute {
  label: string
  value: any
}

const BASE_URL = 'https://real-estate-ml-app-team-10.onrender.com'

function App() {
  //const [page, setPage] = useState<'home' | 'listing'>('home')
  //const [attributes, setAttributes] = useState<Attribute[]>([])

  //Testing:
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


  const [loading, setLoading]       = useState<boolean>(false)
  const [error, setError]           = useState<string | null>(null)

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
          address: address_line1,
          city:    city,
          zipcode: postcode,
          state:   state_code
        })
      })
      const json = await res.json()

      if (json.status === 'success') {
        setAttributes(json.data)
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
        />
      )}
    </>
  )
}

export default App