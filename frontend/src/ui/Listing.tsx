import { useState } from 'react'
import House from './assets/house.jpg'
import './Listing.css'
import DynamicLineChart from "./assets/dynamicLineChart.tsx"
import Table from "./assets/table.tsx"
import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete'
import '@geoapify/geocoder-autocomplete/styles/round-borders-dark.css'

const BASE_URL = 'https://real-estate-ml-app-team-10.onrender.com'

interface Attribute {
  label: string
  value: any
}

interface ChartDataset {
  label: string
  data: number[]
  backgroundColor: string
  borderColor: string
  borderWidth: number
}

function Listing() {

  // ── State ─────────────────────────────────────────────────────────────────
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading]       = useState<boolean>(false)
  const [error, setError]           = useState<string | null>(null)
  const [searched, setSearched]     = useState<boolean>(false)

  // ── Chart data ────────────────────────────────────────────────────────────
  const housePastX: string[] = ["1990", "1991", "1992"]
  const housePastY: ChartDataset[] = [
    {
      label: "Purchase History (USD $)",
      data: [65, 59, 80],
      backgroundColor: "rgba(75,192,192,0.4)",
      borderColor: 'rgba(25, 142, 221, 1)',
      borderWidth: 1
    }
  ]
  const houseFutureX: string[] = ["2025", "2026", "2027"]
  const houseFutureY: ChartDataset[] = [
    {
      label: "Price Prediction (USD $)",
      data: [100, 200, 600],
      backgroundColor: 'rgba(255, 26, 104, 0.2)',
      borderColor: 'rgba(255, 26, 104, 1)',
      borderWidth: 1
    }
  ]

  // ── Search handler ────────────────────────────────────────────────────────
  const onPlaceSelected = async (feature: any) => {
    if (feature?.properties.result_type !== "building") return

    const { address_line1, city, postcode, state_code } = feature.properties
    console.log('Selected:', address_line1, city, postcode, state_code)

    setLoading(true)
    setError(null)
    setSearched(true)

    try {
      const res = await fetch(`${BASE_URL}/property/attributes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address_line1,
          city:    city,
          zipcode: postcode,
          state:   state_code
        })
      })
      const json = await res.json()

      if (json.status === 'success') {
        setAttributes(json.data)
      } else {
        setError('Property not found in database.')
        setAttributes([])
      }
    } catch (err) {
      setError('Failed to connect to server.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ── Sales data (kept for debug buttons) ──────────────────────────────────
  function setXY(xValues: any[], yValues: any[], response: any) {
    xValues.push(response.date_of_sale)
    yValues[0].data.push(response.sale_amount)
  }

  async function getSalesData() {
    const urlToCall = BASE_URL + '/property-sales'
    console.log(urlToCall)
    const res = await fetch(urlToCall, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: "185 Hilcrest RD",
        city: "Branford",
        zipcode: 98070,
        state: "CT"
      })
    })
    const jsonRes = await res.json()
    console.log(jsonRes)
    if (jsonRes.data) {
      jsonRes.data.forEach((element: any) => {
        setXY(housePastX, housePastY, element)
      })
    }
  }

  async function getPropertyData() {
    const urlToCall = BASE_URL + '/property/full_addr'
    console.log(urlToCall)
    const res = await fetch(urlToCall, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: "185 Hilcrest RD",
        city: "Branford",
        zipcode: 98070,
        state: "CT"
      })
    })
    const jsonRes = await res.json()
    console.log(jsonRes)
    return jsonRes
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="pdp-wrapper">

      {/* ── Header ── */}
      <header className="pdp-header">
        <h1>HomeView</h1>
        <GeoapifyContext apiKey="c56847c51cc54d77a23f9d4caed09c74">
          <GeoapifyGeocoderAutocomplete
            placeholder="Enter an address..."
            lang="en"
            limit={9}
            filterByPlace="512b2c5d66fd2e52c0590f9fcfdb33d34440f00101f901a287020000000000c0020a"
            placeSelect={onPlaceSelected}
          />
        </GeoapifyContext>
      </header>

      {/* ── Debug buttons — remove before final demo ── */}
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
        <button onClick={getSalesData}>Test Sales Data</button>
        <button onClick={getPropertyData}>Test Property Data</button>
      </div>

      {/* ── Loading / Error states ── */}
      {loading && <p className="status-msg">Loading property data...</p>}
      {error   && <p className="status-msg error">{error}</p>}

      {/* ── Property page — shows after successful search ── */}
      {searched && !loading && attributes.length > 0 && (
        <div className="pdp-body">

          {/* LEFT — photo + attribute table */}
          <section className="pdp-main">
            <img src={House} alt="Property" className="pdp-photo" />

            <div className="pdp-attributes">
              <h2>Property Details</h2>
              <table className="attr-table">
                <tbody>
                  {attributes.map((attr: Attribute, i: number) => (
                    <tr key={i}>
                      <td className="attr-label">{attr.label}</td>
                      <td className="attr-value">{attr.value ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* RIGHT — charts sidebar */}
          <aside className="pdp-sidebar">
            <div className="chart-block">
              <h2>Property Price History</h2>
              <DynamicLineChart
                pastX={housePastX} pastY={housePastY}
                futureX={houseFutureX} futureY={houseFutureY}
              />
            </div>

            <div className="chart-block">
              <h2>City Price History</h2>
              <DynamicLineChart
                pastX={housePastX} pastY={housePastY}
                futureX={houseFutureX} futureY={houseFutureY}
              />
            </div>

            <div className="chart-block">
              <h2>County Price History</h2>
              <DynamicLineChart
                pastX={housePastX} pastY={housePastY}
                futureX={houseFutureX} futureY={houseFutureY}
              />
            </div>

            <div className="chart-block">
              <h2>State Price History</h2>
              <DynamicLineChart
                pastX={housePastX} pastY={housePastY}
                futureX={houseFutureX} futureY={houseFutureY}
              />
            </div>
          </aside>

        </div>
      )}

      {/* ── Empty state — before any search ── */}
      {!searched && (
        <div className="pdp-empty">
          <img src={House} alt="HomeView" className="pdp-hero" />
          <p>Search an address above to view property details</p>
        </div>
      )}

    </main>
  )
}

export default Listing

{/*
<Line id="graph" data = {{
        labels: ['1990', '1991', '1992', '1993', '1994', '1995', '1996'],
          datasets: [{
            label: 'Housing Prices (USD $)',
            data: [18, 12, 6, 9, 12, 3, 9],
            backgroundColor: [
            'rgba(255, 26, 104, 0.2)'
            ],
            borderColor: [
              'rgba(255, 26, 104, 1)'
            ],
            borderWidth: 1
          }]
        }}
        />
*/}