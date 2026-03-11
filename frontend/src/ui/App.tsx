import { useState } from 'react'
import reactLogo from './assets/react.svg'
import House from './assets/house.jpg'
import './App.css'
import {Chart as ChartJS} from "chart.js/auto"
import {Line} from "react-chartjs-2";
import DynamicLineChart from "./assets/dynamicLineChart.tsx"

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://youtu.be/QWL856dVPIM?si=4lWARAivVvwzxaBK&t=10" target="_blank">
          <img src={House} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>HomeView</h1>
      <div className="card">
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

        <DynamicLineChart/>

        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
