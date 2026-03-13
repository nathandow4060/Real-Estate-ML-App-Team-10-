import React, { useState } from "react";
import { Line } from "react-chartjs-2";

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

function DynamicLineChart({pastX, pastY, futureX, futureY}) 
  // the DynamicLineChart will take X and Y data for 2 graphs 
  {
  const [chartData, setChartData] = useState({
    labels: pastX,
    datasets: pastY,
  });
  const[buttonText, setButtonText] = useState("view prediction");
  // I should really use a unique use state variable

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