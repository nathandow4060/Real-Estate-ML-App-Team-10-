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

function LineChart({X, Y, name, append}: {
  X: string[]
  Y: any[]
  name: string
  append: string | null
}) 
  // the DynamicLineChart will take X and Y data for 2 graphs 
  {
  const chartData ={
    labels: X,
    datasets: Y,
  };

  return (
    <div>
      <h2>{append? name + " History: " + append  : name + " History"}</h2>
      <Line data={chartData} />
      <p>no prediction data available</p>
    </div>
  );
}
export default LineChart;