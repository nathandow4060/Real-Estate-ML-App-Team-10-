import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Listing from './Listing.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Listing />
  </StrictMode>,
)
