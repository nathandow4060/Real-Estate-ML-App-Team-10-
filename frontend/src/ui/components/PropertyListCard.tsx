import { useEffect, useState } from 'react'
import { fetchStreetViewUrl } from '../../utils/streetView'
import House from '../assets/house.jpg'
import './style/PropertyListCard.css'
import type { Attribute } from '../Listing.tsx'
import { BASE_URL } from '../../App'
import Lightbox, { type SlideImage } from 'yet-another-react-lightbox'
interface PropertyListCardProps {
  attributes: Attribute[]
  lat?: number
  lon?: number
}

async function fetchImage(pid: number) {
    const urlPath:string = '/property/images'
    const query:string = `?pid=${pid}`
    let fetchLink:string = BASE_URL + urlPath + query
    const res = await fetch(fetchLink).then((res) => res.json())
    console.log(res)
    console.log(res.count)
    console.log(res.data)
    return res
}

function PropertyListCard({ attributes, lat, lon }: PropertyListCardProps) {
  const [streetViewUrl, setStreetViewUrl] = useState<string | null>(null)
  const [open, setOpen] = useState(false);
  const lightBoxSlides:SlideImage[] = []

  useEffect(() => {
    if (!lat || !lon) return
    fetchStreetViewUrl(lat, lon).then(url => setStreetViewUrl(url))
    let pid = attributes.find(i=>i.label === "pid")?.value
    
     
    lightBoxSlides.push({src:streetViewUrl || House})
    lightBoxSlides.push()
    fetchImage(pid)
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
        {lightBoxSlides.length > 0 ? (
            <Lightbox 
                open={open} 
                close={() => setOpen(false)} 
                controller={{ closeOnBackdropClick: true }}
                carousel={{ finite: true , padding:70}}
                slides={lightBoxSlides} 
                styles={{ container: { backgroundColor: "rgba(0, 0, 0, .6)"} }}
                // render={{
                //     buttonPrev: () => null,
                //     buttonNext: () => null,
                //     buttonClose: () => null,
                // }}
            />
        ) : <span className="property-card__image--placeholder">No image</span>
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