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
}

function AreaListings({ onPlaceSelected, onSubmit, listings, area, loading, error }: AreaListingsProps) {
  return (
    <>
      <PropertySearch onSubmit={onSubmit} onPlaceSelected={onPlaceSelected} disabled={loading} />
      {loading && <p className="status-msg">Loading property data...</p>}
      {error && <p className="status-msg error">{error}</p>}
      <h2>Listings {area}</h2>

      {listings.map((listing, i: number) => {

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
          <div key={i}>
            <PropertyListCard
              attributes={displayAttrs}
              lat={lat}
              lon={lon}
            />
          </div>
        )
      })}
    </>
  )
}

export default AreaListings