const STREET_VIEW_KEY = "AIzaSyC10WuDUmrqJg0OkAS99Oyn76yb3brq8I4"

export async function fetchStreetViewUrl(lat: number, lon: number): Promise<string | null> {
  try {
    const metadataRes = await fetch(
      `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lon}&source=outdoor&key=${STREET_VIEW_KEY}`
    )
    const metadataJson = await metadataRes.json()
    const panoId = metadataJson.pano_id
    if (!panoId) return null

    const imageRes = await fetch(
      `https://maps.googleapis.com/maps/api/streetview?size=400x250&pano=${panoId}&source=outdoor&key=${STREET_VIEW_KEY}`
    )
    const blob = await imageRes.blob()
    return window.URL.createObjectURL(blob)
  } catch (err) {
    console.error('Street view fetch failed', err)
    return null
  }
}

