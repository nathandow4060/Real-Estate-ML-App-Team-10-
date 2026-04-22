import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete'
import '@geoapify/geocoder-autocomplete/styles/round-borders-dark.css'
import "./style/searchStyle.css"
import { useState } from 'react'

interface searchProp {
    onPlaceSelected: (feature: any) => void,
    onSubmit: (feature: any) => void,
    onUserInput?: (value: string) => void,
    address?: string,
    disabled?: boolean
}



function PropertySearch({onPlaceSelected, onSubmit, onUserInput, address, disabled}: searchProp) {
    const [loading, setLoading] = useState(false)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const firstSuggestion = document.querySelector('.geoapify-autocomplete-items .geoapify-autocomplete-item') as HTMLElement
            if (firstSuggestion) {
                firstSuggestion.click()
            } else {
                onSubmit(e)
            }
        }
    }

    return (
        <div className="search-wrap">
            <div className="search-bar" onKeyDown={handleKeyDown}>
                <GeoapifyContext apiKey="c56847c51cc54d77a23f9d4caed09c74">
                    {address && onUserInput &&
                        <GeoapifyGeocoderAutocomplete
                            placeholder="Enter an address..."
                            lang="en"
                            limit={9}
                            placeSelect={onPlaceSelected}
                            filterByRect={{lon1:-73.817139, lat1:40.998972, lat2:42.028644643491326, lon2: -71.79274724265612}}
                            onRequestStart={() => setLoading(true)}
                            onRequestEnd={() => setLoading(false)}
                            onUserInput={onUserInput}
                            value={address}
                        />
                    }
                    {(address == undefined || address == '') &&
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
            </div>
            <button onClick={onSubmit} disabled={disabled || loading}>
                {loading ? 'Loading...' : 'Submit'}
            </button>
        </div>
    )
}

export default PropertySearch