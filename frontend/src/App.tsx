import { useState } from 'react'
import Home from './ui/Home.tsx'
import Listing from './ui/Listing.tsx'

interface Attribute {
  label: string
  value: any
}

const BASE_URL = 'https://real-estate-ml-app-team-10.onrender.com'

function App() {
  const [page, setPage]             = useState<'home' | 'listing'>('home')
  const [attributes, setAttributes] = useState<Attribute[]>([])
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