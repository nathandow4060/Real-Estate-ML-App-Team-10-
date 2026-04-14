import React, { useState } from "react";
import { Line } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

/* 
X format: [] - String array
Y format: [
      {
        label: "",
        data: [],
        backgroundColor: "rgba()",
        borderColor: 'rgba()',
        borderWidth: 1
      },
    ]
*/


function DynamicLineChart({pastX, pastY, futureX, futureY, name}: {
  pastX: string[]
  pastY: any[]
  futureX: string[]
  futureY: any[]
  name: string
}) 

  // the DynamicLineChart will take X and Y data for 2 graphs 
  {
  const [chartData, setChartData] = useState({
    labels: pastX,
    datasets: pastY,
  });
  const[buttonText, setButtonText] = useState<'view prediction' | 'view history'>("view prediction");
  const[headerText, setHeaderText] = useState(name + " History")

  const switchData = () => {
    if(buttonText === "view prediction"){
      setChartData(() => ({
        labels: futureX,
        datasets: futureY,
      }));
      setButtonText("view history");
      setHeaderText(name + " Prediction")
    }
    if(buttonText === "view history"){
      setChartData(() => ({
        labels: pastX,
        datasets: pastY,
      }));
      setButtonText("view prediction");
      setHeaderText(name + " History")
    }
  };

  return (
    <div>
      <h2>{headerText}</h2>
      <Line data={chartData} />
      <button onClick={switchData}>{buttonText}</button>
    </div>
  );
}
export default DynamicLineChart;