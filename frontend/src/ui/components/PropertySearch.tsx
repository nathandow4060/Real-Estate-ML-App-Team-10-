import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete'
import '@geoapify/geocoder-autocomplete/styles/round-borders-dark.css'
import "../Home.css"
import { useState } from 'react'

interface searchProp {
    onPlaceSelected: (feature: any) => void,
    onSubmit: (feature: any) => void,
    setAddress?: React.Dispatch<React.SetStateAction<string>>,
    address?: string,
}

function PropertySearch({onPlaceSelected, onSubmit, setAddress, address}:searchProp) {
    const [loading, setLoading] = useState(false)

    return (
    <div className="home-search" style={{display:'inline'}}>
        {loading && 
            <div className="loading-spinner">Loading...</div>
        }
        <GeoapifyContext apiKey="c56847c51cc54d77a23f9d4caed09c74">
            {address && setAddress &&
                <GeoapifyGeocoderAutocomplete
                placeholder="Enter an address..."
                lang="en"
                limit={9}
                placeSelect={onPlaceSelected}
                filterByRect={{lon1:-73.817139, lat1:40.998972, lat2:42.028644643491326, lon2: -71.79274724265612}}
                onRequestStart={() => setLoading(true)}
                onRequestEnd={() => setLoading(false)}
                onUserInput={(addy) => setAddress(addy)}
                value={address}
                />
            }
            {(address==undefined || address=='') &&
                <GeoapifyGeocoderAutocomplete
                placeholder="Enter an address..."
                lang="en"
                limit={9}
                placeSelect={onPlaceSelected}
                filterByRect={{lon1:-73.817139, lat1:40.998972, lat2:42.028644643491326, lon2: -71.79274724265612}}
                onRequestStart={() => setLoading(true)}
                onRequestEnd={() => setLoading(false)}
                />
            
            }
        </GeoapifyContext>
        <button style={{display:'inline'}} onClick = {onSubmit}>Submit</button> 
    </div>
    )
}
export default PropertySearch