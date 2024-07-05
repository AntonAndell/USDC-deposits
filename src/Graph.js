import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const Graph = ({ data, symbol }) => {
  // Filter the data for the selected symbol
  const filteredData = data.filter(item => item.symbol === symbol);

  // Sort the filtered data by price in descending order
  const sortedData = filteredData.sort((a, b) => b.price - a.price);

  // Extract the price and accumulated amount data
  const prices = sortedData.map(item => item.price);
  let accumulatedAmount = 0;
  const accumulatedAmounts = sortedData.map(item => {
    accumulatedAmount += item.amount;
    return accumulatedAmount;
  });
  console.log("loading")
  // Determine the minimum and maximum price values
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Create a range of labels between minPrice and maxPrice
  const priceRange = [];
  const numLabels = 10; // Number of labels to display
  const step = (maxPrice - minPrice) / (numLabels - 1);
  for (let i = 0; i < numLabels; i++) {
    priceRange.push((minPrice + step * i).toFixed(2));
  }

  console.log(data)
  console.log("priceRange")
  console.log(priceRange)
  console.log("accumulatedAmounts")
  console.log(accumulatedAmounts)

  // Prepare the data for the chart
  const chartData = {
    labels: prices,
    datasets: [
      {
        label: 'Debt',
        data: accumulatedAmounts,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  // Chart options
  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Price',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Total bnUSD liquidated',
        },
        min: 0,
        max: accumulatedAmount,
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default Graph;