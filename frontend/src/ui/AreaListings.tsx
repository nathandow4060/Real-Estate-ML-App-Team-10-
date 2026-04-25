import { useState, useEffect, useRef } from "react"
import PropertyListCard from "./components/PropertyListCard.tsx"
import PropertySearch from "./components/PropertySearch.tsx"
import '@geoapify/geocoder-autocomplete/styles/round-borders-dark.css'

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
  onPropertySelect: (listing: Attribute[]) => void 
}

// Lazy Loading size
const PAGE_SIZE = 10

function AreaListings({ onPlaceSelected, onSubmit, listings, area, loading, error, onPropertySelect}: AreaListingsProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Reset visible count when listings change (new search)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [listings])

  // Watch the sentinel div at the bottom — when it scrolls into view, load 10 more
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + PAGE_SIZE, listings.length))
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [listings.length])

  const visibleListings = listings.slice(0, visibleCount)

  return (
    <>
      <PropertySearch onSubmit={onSubmit} onPlaceSelected={onPlaceSelected} disabled={loading} />
      {loading && <p className="status-msg">Loading property data...</p>}
      {error && <p className="status-msg error">{error}</p>}
      <h2>Listings {area}</h2>

      {visibleListings.map((listing, i: number) => {

        // Pull lat/lon out BEFORE filtering, since PropertyListCard needs them
        // for the Street View fetch but they shouldn't show in the attribute table
        const lat = listing.find(a => a.label === 'Latitude')?.value
        const lon = listing.find(a => a.label === 'Longitude')?.value

        // These are the labels we never want to show in the card's attribute table.
        // pid is an internal DB key, lat/lon are used only for street view,
        // city/state/zip are already visible in the address or redundant at this level.
        const displayAttrs = listing.filter(attr =>
          attr.label !== 'Longitude' &&
          attr.label !== 'Latitude' &&
          attr.label !== 'pid' &&
          attr.label !== 'City' &&
          attr.label !== 'State' &&
          attr.label !== 'Zip Code'
        )

        return (
          <div key={i} onClick={() => onPropertySelect(listings[i])}>
            <PropertyListCard
              attributes={displayAttrs}
              lat={lat}
              lon={lon}
            />
          </div>
        )
      })}
      {/* Sentinel — sits just below the last visible card.
          When it enters the viewport the observer fires and loads 10 more. */}
      <div ref={sentinelRef} style={{ height: '1px' }} />

      {visibleCount < listings.length && (
        <p className="status-msg">
          Showing {visibleCount} of {listings.length} properties...
        </p>
      )}
    </>
  )
}

export default AreaListings