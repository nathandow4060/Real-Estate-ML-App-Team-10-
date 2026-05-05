import { useEffect, useState } from 'react'
import { fetchStreetViewUrl } from '../../utils/streetView'
import '../components/style/propertyListCard.css'

interface Attribute {
  label: string
  value: any
}

interface PropertyListCardProps {
  attributes: Attribute[]
  lat?: number
  lon?: number
}

function PropertyListCard({ attributes, lat, lon }: PropertyListCardProps) {
  const [streetViewUrl, setStreetViewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!lat || !lon) return
    fetchStreetViewUrl(lat, lon).then(url => setStreetViewUrl(url))
  }, [lat, lon])

  const displayAttrs = attributes
    .filter(attr => {
      if (attr.label === 'For Sale') return true
      return attr.value !== null && attr.value !== undefined && attr.value !== '' && String(attr.value) !== 'NaN'
    })
    .map(attr => ({
      ...attr,
      value: attr.label === 'For Sale' && !attr.value ? 'Unavailable' : attr.value
    }))

  return (
    <div className="property-card">
      <div className="property-card__image">
        {streetViewUrl
          ? <img src={streetViewUrl} alt="Street view" />
          : <span className="property-card__image--placeholder">No image</span>
        }
      </div>
      <div className="property-card__attrs">
        <table>
          <tbody>
            {displayAttrs.map((attr, i) => (
              <tr key={i}>
                <td className="attr-label">{attr.label}</td>
                <td className="attr-value">{attr.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PropertyListCard