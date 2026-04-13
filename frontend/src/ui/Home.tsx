//Nathan Dow
import House from './assets/house.jpg'
import './Home.css'

import NavMap from './components/NavMap'
import PropertySearch from './components/PropertySearch'
import { useState } from 'react'

interface HomeProps {
  onPlaceSelected: (feature: any) => void
  onSubmit: (feature: any) => void
}

function Home({ onPlaceSelected, onSubmit }: HomeProps) {
    const [address, setAddress] = useState<string>('')
  return (
    <main className="home-wrapper">
      <header className="home-header">
        <h1>HomeView</h1>
        <p className="home-subtitle">Search any property to view price history and predictions</p>
      </header>
      <PropertySearch onPlaceSelected={onPlaceSelected} onSubmit={onSubmit} address={address} setAddress={setAddress} />
      
      {/* <div>
        <button onClick = {onSubmit}>Submit</button> 
      </div> */}
      <NavMap onPlaceSelected={onPlaceSelected} address={address} setAddress={setAddress} />
    </main>
  )
}

export default Home