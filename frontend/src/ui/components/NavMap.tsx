import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile.js'
import { OSM } from 'ol/source'
import { useEffect, useRef, useState, useCallback } from 'react'
import { fromLonLat, Projection, transformExtent } from 'ol/proj'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Style, Circle as CircleStyle, RegularShape, Icon } from 'ol/style'
import { bbox } from 'ol/loadingstrategy'
import { Select, Pointer as PointerInteraction, Extent } from 'ol/interaction'
import { pointerMove, singleClick } from 'ol/events/condition'
import Feature from 'ol/Feature'
import { Point } from 'ol/geom'
import { normalizeAddress } from '../../App'
import Overlay from 'ol/Overlay'
import './style.mapStyle.css'

const BASE_URL = 'https://real-estate-ml-app-team-10.onrender.com'

// Property data item from backend (array of label/value objects)
interface PropertyDataItem {
  label: string
  value: any
}

interface NavMapProps {
  onPlaceSelected: (feature: any) => void,
  address: string,
  setAddress: (addy:string) => void
}

const STARTING_ZOOM = 9
const MIN_PIN_ZOOM = 12

// SVG pin for hover/selected state
const pinSvg = encodeURIComponent(`
  <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 12.5 15 25 15 25s15-12.5 15-25C30 6.716 23.284 0 15 0z" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
    <circle cx="15" cy="15" r="5" fill="white"/>
  </svg>
`)

function NavMap({ onPlaceSelected, address, setAddress}: NavMapProps) {
  const mapRef = useRef<Map | null>(null)
  const propertySourceRef = useRef<VectorSource | null>(null)
  const hoveredFeatureRef = useRef<Feature<Point> | null>(null)
  const onPlaceSelectedRef = useRef(onPlaceSelected)
  
  onPlaceSelectedRef.current = onPlaceSelected
  
  const [zoomLevel, setZoomLevel] = useState(STARTING_ZOOM)
  const [isLoading, setIsLoading] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)

  // Circle style (default)
  const circleStyle = new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({ color: '#e74c3c' }),
      stroke: new Stroke({ color: '#c0392b', width: 2 }),
    }),
  })

  // Pin style (hover/selected)
  const pinStyle = new Style({
    image: new RegularShape({
      fill: new Fill({ color: '#e74c3c' }),
      stroke: new Stroke({ color: '#c0392b', width: 2 }),
      points: 3,
      radius: 12,
      rotation: 0,
      angle: 0,
      displacement: [0, 8],
    }),
  })

  // Alternative pin using icon
  const pinIconStyle = new Style({
    image: new Icon({
      anchor: [0.5, 1],
      src: 'data:image/svg+xml;utf8,' + pinSvg,
      scale: 1,
    }),
  })

  // Hover style (pin)
  const hoverStyle = new Style({
    image: new Icon({
      anchor: [0.5, 1],
      src: 'data:image/svg+xml;utf8,' + pinSvg,
      scale: 1.2,
    }),
    zIndex: 100,
  })

  // Parse property array into object and extract coordinates
  const parsePropertyData = (propertyArray: PropertyDataItem[]) => {
    const data: Record<string, any> = {}
    let lat: number | null = null
    let lon: number | null = null

    propertyArray.forEach(item => {
      data[item.label] = item.value
      if (item.label === 'Latitude') lat = item.value
      if (item.label === 'Longitude') lon = item.value
    })

    return { data, lat, lon }
  }

  // Transform property data to Geoapify format
  const transformToGeoapifyFormat = (propertyData: Record<string, any>) => {
    return {
      properties: {
        result_type: 'building',
        address_line1: propertyData['Address'] || '',
        city: propertyData['City'] || '',
        postcode: String(propertyData['Zip'] || ''),
        state_code: propertyData['state'] || 'CT',
        formatted: propertyData['Display Address'] || '',
        raw: propertyData
      }
    }
  }

  // Get style based on feature state
  const getFeatureStyle = (feature: Feature<Point>) => {
    if (feature === hoveredFeatureRef.current) {
      return hoverStyle
    }
    return circleStyle
  }

  useEffect(() => {
    // Initialize property source with viewport-based loading
    propertySourceRef.current = new VectorSource({
      strategy: bbox,
      loader: (extent, resolution, projection) => {
        const zoom = mapRef.current?.getView().getZoom() || STARTING_ZOOM
        
        if (zoom < MIN_PIN_ZOOM) {
          propertySourceRef.current?.clear()
          setLoadedCount(0)
          return
        }

        setIsLoading(true)
        
        const [minLon, minLat, maxLon, maxLat] = transformExtent(
          extent, 
          projection, 
          'EPSG:4326'
        )

        fetch(`${BASE_URL}/property/map`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({
            bbox: [minLon, minLat, maxLon, maxLat],
            zoom: Math.round(zoom)
          })
        })
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.json()
          })
          .then(response => {
            if (response.status === 'success' && Array.isArray(response.data)) {
              const features: Feature<Point>[] = []
              
              response.data.forEach((propertyArray: PropertyDataItem[]) => {
                const { data, lat, lon } = parsePropertyData(propertyArray)
                
                if (lat && lon) {
                  const feature = new Feature({
                    geometry: new Point(fromLonLat([lon, lat])),
                    ...data
                  })
                  feature.setStyle(circleStyle)
                  features.push(feature)
                }
              })
              
              if (features.length > 0) {
                propertySourceRef.current?.addFeatures(features)
                setLoadedCount(features.length)
              }
            }
          })
          .catch(err => {
            console.error('Failed to load properties:', err)
          })
          .finally(() => {
            setIsLoading(false)
          })
      }
    })

    // Create vector layer
    const propertyLayer = new VectorLayer({
      source: propertySourceRef.current,
      zIndex: 1,
      minZoom: MIN_PIN_ZOOM
    })

    // Initialize map
    mapRef.current = new Map({
      target: 'map',
      layers: [
        new TileLayer({ 
          source: new OSM(),
          zIndex: 0,
        }),
        propertyLayer,
      ],
      view: new View({
        center: fromLonLat([-72.7, 41.6]),
        zoom: STARTING_ZOOM,
        minZoom: 9,
        maxZoom: 20,
        // extent: [40.998972, -73.817139, 42.104744, -71.630859], not working for some reason
        showFullExtent:true,

      }),
    })

    // Hover interaction - changes circle to pin on hover
    const hoverInteraction = new Select({
      condition: pointerMove,
      layers: [propertyLayer],
      style: hoverStyle,
      multi: false,
    })

    mapRef.current.addInteraction(hoverInteraction)

    // Track hovered feature
    hoverInteraction.on('select', (e) => {
      const hovered = e.selected[0] as Feature<Point> | undefined
      
      // Reset previous hovered feature to circle
      if (hoveredFeatureRef.current && hoveredFeatureRef.current !== hovered) {
        hoveredFeatureRef.current.setStyle(circleStyle)
      }
      
      hoveredFeatureRef.current = hovered || null
      
      // Set new hovered feature to pin
      if (hovered) {
        hovered.setStyle(hoverStyle)
      }
    })

    // Click interaction - separate from hover to handle clicks
    const clickInteraction = new Select({
      layers: [propertyLayer],
      condition: singleClick,
      style: pinStyle, // Keep pin style when selected
      multi: false,
    })

    mapRef.current.addInteraction(clickInteraction)

    // Handle pin click - navigate to listing
    clickInteraction.on('select', (e) => {
      const selected = e.selected[0] as Feature<Point> | undefined
      
      if (selected) {
        const properties = selected.getProperties()
        const { geometry, ...propertyData } = properties
        console.log(propertyData)
        
        console.log(propertyData)
        // Transform to expected format
        const transformedFeature = transformToGeoapifyFormat(propertyData)
        
        // Call handler via ref to avoid React rerender
        onPlaceSelectedRef.current(transformedFeature)
        setAddress(normalizeAddress(propertyData["Displayed Address"]))
        
        // Keep pin style on selected feature
        selected.setStyle(pinStyle)
      }
    })

    // Track zoom level
    mapRef.current.getView().on('change:resolution', () => {
      const zoom = mapRef.current?.getView().getZoom() || STARTING_ZOOM
      setZoomLevel(Math.round(zoom * 10) / 10)
      
      if (zoom < MIN_PIN_ZOOM - 2) {
        propertySourceRef.current?.clear()
        setLoadedCount(0)
      }
    })

    // Initial load
    const view = mapRef.current.getView()
    const currentZoom = view.getZoom()
    if (currentZoom && currentZoom >= MIN_PIN_ZOOM) {
      propertySourceRef.current?.loadFeatures(
        view.calculateExtent(),
        view.getResolution()!,
        view.getProjection()
      )
    }

    return () => {
      mapRef.current?.setTarget(undefined)
      mapRef.current = null
    }
  }, []) // Empty deps - map created once

  return (
    <div className="navmap-container">
      <div className="map-wrapper">
        <div className="map-controls">
          <div className="zoom-indicator">
            <strong>Zoom: {zoomLevel.toFixed(1)}</strong>
            {zoomLevel < MIN_PIN_ZOOM && (
              <span className="zoom-hint">
                (Zoom in to see properties)
              </span>
            )}
          </div>
          {isLoading && (
            <div className="loading-indicator">
              Loading properties...
            </div>
          )}
          {!isLoading && loadedCount > 0 && (
            <div className="loaded-indicator">
              {loadedCount} properties shown
            </div>
          )}
        </div>
        <div id="map" className="map-view"></div>
      </div>
      <p className="map-instruction">
        Hover over a circle to see pin, click to view property details
      </p>
    </div>
  )
}

export default NavMap