//Nathan Dow
import House from './assets/house.jpg'
import './Home.css'
import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete'
import '@geoapify/geocoder-autocomplete/styles/round-borders-dark.css'
import NavMap from './components/NavMap'

interface HomeProps {
  onPlaceSelected: (feature: any) => void
}

function Home({ onPlaceSelected }: HomeProps) {
  return (
    <main className="home-wrapper">
      <header className="home-header">
        <h1>HomeView</h1>
        <p className="home-subtitle">Search any property to view price history and predictions</p>
      </header>

      <div className="home-search">
        <GeoapifyContext apiKey="c56847c51cc54d77a23f9d4caed09c74">
          <GeoapifyGeocoderAutocomplete
            placeholder="Enter an address..."
            lang="en"
            limit={9}
            filterByPlace="512b2c5d66fd2e52c0590f9fcfdb33d34440f00101f901a287020000000000c0020a"
            placeSelect={onPlaceSelected}
          />
        </GeoapifyContext>
      </div>
      <NavMap onPlaceSelected={onPlaceSelected}/>
    </main>
  )
}

export default Home