import House from './assets/house.jpg'
import './Listing.css'
import DynamicLineChart from "./assets/dynamicLineChart.tsx"
import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete'
import '@geoapify/geocoder-autocomplete/styles/round-borders-dark.css'

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

interface ListingProps {
  onPlaceSelected: (feature: any) => void
  attributes: Attribute[]
  loading: boolean
  error: string | null
}

const housePastX: string[] = ["1990", "1991", "1992"]
const housePastY: ChartDataset[] = [{
  label: "Purchase History (USD $)",
  data: [65, 59, 80],
  backgroundColor: "rgba(75,192,192,0.4)",
  borderColor: 'rgba(25, 142, 221, 1)',
  borderWidth: 1
}]
const houseFutureX: string[] = ["2025", "2026", "2027"]
const houseFutureY: ChartDataset[] = [{
  label: "Price Prediction (USD $)",
  data: [100, 200, 600],
  backgroundColor: 'rgba(255, 26, 104, 0.2)',
  borderColor: 'rgba(255, 26, 104, 1)',
  borderWidth: 1
}]

function Listing({ onPlaceSelected, attributes, loading, error }: ListingProps) {
  return (
    <main className="pdp-wrapper">

      {/* ── Header with search bar ── */}
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

      {/* ── Loading / Error states ── */}
      {loading && <p className="status-msg">Loading property data...</p>}
      {error   && <p className="status-msg error">{error}</p>}

      {/* ── Main two-column layout ── */}
      {!loading && attributes.length > 0 && (
        <div className="pdp-body">

          {/* ── LEFT: photo + attribute table ── */}
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

          {/* ── RIGHT: charts sidebar ── */}
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