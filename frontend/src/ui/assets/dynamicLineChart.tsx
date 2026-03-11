import React, { useState } from "react";
import { Line } from "react-chartjs-2";

function DynamicLineChart() {
  const [chartData, setChartData] = useState({
    labels: ["January", "February", "March"],
    datasets: [
      {
        label: "Sales",
        data: [65, 59, 80],
        backgroundColor: "rgba(75,192,192,0.4)",
      },
    ],
  });

  const addData = () => {
    setChartData((prevData) => ({
      ...prevData,
      labels: [...prevData.labels, "April"],
      datasets: prevData.datasets.map((dataset) => ({
        ...dataset,
        data: [...dataset.data, 90],
      })),
    }));
  };

  return (
    <div>
      <Line data={chartData} />
      <button onClick={addData}>Add Data</button>
    </div>
  );
}

export default DynamicLineChart;