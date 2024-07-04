import React from 'react';
import './Data.css'; // Import CSS file for Data component

const Data = ({ data, liquidate }) => {
  return (
    <div className="data-container">
      {Object.keys(data).map(key => (
        <div key={key} className="data-category">
          <h2>{key} Price: ${data[key]["price"]}</h2>
          <ul>
            {data[key].data.map((item, index) => (
              <li key={index} className="data-entry">
                <div className="entry-info">
                  <span><strong>Address:</strong> {item.address}</span>
                  <span><strong>Liquidation Price:</strong> {item.liquidationPrice}</span>
                  <span><strong>Debt:</strong> ${item.debt}</span>
                </div>
                <button className="liquidate-button" onClick={() => liquidate(item.address, key)}>Liquidate</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Data;