import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile.js'
import {OSM} from 'ol/source'
import { useEffect, useState } from 'react'
import './style.mapStyle.css'
import { fromLonLat, transformExtent } from 'ol/proj'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Style } from 'ol/style'
import GeoJSON from 'ol/format/GeoJSON'
import {bbox} from 'ol/loadingstrategy'
import { Polygon } from 'ol/geom'
import { fromExtent } from 'ol/geom/Polygon'
import { Feature, Overlay } from 'ol'
import { intersects } from 'ol/extent'


const STARTING_ZOOM = 8;

function NavMap () {
    const STATE_BOUNDARY_GEOJSON = '/Connecticut_State_layer.geojson'
    // layer holding the parcel layer

    const zoomOverlay = new Overlay({
        id: "zoom-level",
        position: [20,20]
    })

    const [zoomLevel, setZoomLevel] = useState<number|undefined>(STARTING_ZOOM);

    useEffect(() => {
        
        const loadedCogs = new Set<String>()
        const maskLayer = new VectorLayer ({
            source: new VectorSource(),
            style:new Style({
                fill: new Fill({
                    color: 'rgba(0,0,0,0.2)',
                }),
            }),
        });

        fetch(STATE_BOUNDARY_GEOJSON)
            .then(res => res.json)
            .then(data => {
                console.log(data)
                const format = new GeoJSON()
                const features = format.readFeatures(data,{featureProjection:'EPSG:3857'})
                const ctGeom = features[0].getGeometry() as Polygon

                // forms a polygon excluding connecticut
                const worldExtent = [-20037508, -20037508, 20037508, 20037508]
                const worldPolygon = fromExtent(worldExtent)

                const maskPolygon = new Polygon([
                    worldPolygon.getCoordinates()[0],
                    ...ctGeom.getCoordinates(),
                ])
                const maskFeature = new Feature(maskPolygon)

                maskLayer.getSource()?.addFeature(maskFeature)
        });

        const parcelSource = new VectorSource({
            format: new GeoJSON({
                dataProjection: 'EPSG:4326',
                featureProjection:'EPSG:3857'
            }),
            strategy: bbox,
            loader: (extent, resolution, projection) => {
                setZoomLevel(map.getView().getZoom());
                if(!zoomLevel || zoomLevel <= 9) return
                fetch('/data/cogBounds.json')
                    .then(res => res.json())
                    .then((cogBounds: Record<string, number[]>) => {
                        Object.entries(cogBounds).forEach(
                            ([cog, bounds4326]) => {
                                if (loadedCogs.has(cog)) return
                                const bounds3857 = transformExtent(bounds4326,
                                    'EPSG:4326',
                                    'EPSG:3857');

                                if (!intersects(extent, bounds3857)) return

                                loadedCogs.add(cog)
                                console.log(`Loading COG: ${cog}`)
                                fetch(`/data/parcels/${cog}.geojson`)
                                    .then(res => res.json())
                                    .then(data => {
                                        const features = parcelSource.getFormat()?.readFeatures(
                                            data,
                                            {featureProjection: projection}
                                        );undefined
                                        if (features) {
                                            parcelSource.addFeatures(features)
                                        }
                                    })
                                    .catch(err =>
                                        console.error(`Failed ${cog}`, err)
                                    )
                            }
                        )
                    })
            }
        })

        const parcelLayer = new VectorLayer({
            source: parcelSource,
            style: new Style ({
                stroke: new Stroke( {
                    color: 'rgba(0,0,255,0.5)',
                    width:1,
                }),
            }),
        });
        const map = new Map( {
            target: 'map',
            layers: [
                new TileLayer({source: new OSM()}),
                parcelLayer,
                maskLayer
            ],
            view: new View({
                center: fromLonLat([-72.7,41.6]),
                zoom: STARTING_ZOOM,
                minZoom:9
                ,
                }),
            overlays: [
                 zoomOverlay
            ]
        });
        return () => map.setTarget(undefined)
        },[]); 
          
    return (
        <>
            <div className="overlay-container">
                <span className="otext" id="zoom-level"></span>
            </div>
            <div id="map">{zoomLevel}</div>
        </>
    )
}

export default NavMap