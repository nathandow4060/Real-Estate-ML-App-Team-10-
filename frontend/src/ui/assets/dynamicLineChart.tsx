import React, { useState } from "react";
import { Line } from "react-chartjs-2";

function DynamicLineChart() {
  let pastX = ["1990", "1991", "1992"]
  let pastY = [
      {
        label: "Price History (USD $)",
        data: [65, 59, 80],
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: 'rgb(25, 142, 221)',
        borderWidth: 1
      },
    ]
  let futureX = ["2025", "2026", "2027"]
  let futureY = [
      {
        label: "Price Prediction (USD $)",
        data: [100, 200, 600],
        backgroundColor: 'rgba(255, 26, 104, 0.2)',
            borderColor: 'rgba(255, 26, 104, 1)',
            borderWidth: 1
      },
    ]

  const [chartData, setChartData] = useState({
    labels: pastX,
    datasets: pastY,
  });
  const[buttonText, setButtonText] = useState("view prediction");

  const switchData = () => {
    if(buttonText === "view prediction"){
      setChartData(() => ({
        labels: futureX,
        datasets: futureY,
      }));
      setButtonText("view history");
    }
    if(buttonText === "view history"){
      setChartData(() => ({
        labels: pastX,
        datasets: pastY,
      }));
      setButtonText("view prediction");
    }
  };

  return (
    <div>
      <Line data={chartData} />
      <button onClick={switchData}>{buttonText}</button>
      <p>Disclaimer: prediction data is experiemental and should not be used solely to make any financial decisions</p>
    </div>
  );
}
export default DynamicLineChart;