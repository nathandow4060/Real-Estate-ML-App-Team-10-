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

function LineChart({X, Y}: {
  X: string[]
  Y: any[]

}) 
  // the DynamicLineChart will take X and Y data for 2 graphs 
  {
  const chartData ={
    labels: X,
    datasets: Y,
  };

  return (
    <div>
      <Line data={chartData} />
    </div>
  );
}
export default LineChart;