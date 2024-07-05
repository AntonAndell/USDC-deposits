import React from 'react';
import './Data.css'; // Import CSS file for Data component
import Graph from './Graph';

const Data = ({ data, liquidate, graphData }) => {
    return (
        <div className="data-container">
            {Object.keys(data).map(key => (
                <div key={key} className="data-category">
                    <h2>{key} Price: ${data[key]["price"]}</h2>
                    <div className="data-content">
                        <ul className="data-list">
                            {data[key].data.map((item, index) => (
                                <li key={index} className="data-entry">
                                    <div className="entry-info">
                                        <div className="info-row">
                                            <div className="info-label"><strong>Address:</strong></div>
                                            <div className="info-value">{item.address}</div>
                                        </div>
                                        <div className="info-row">
                                            <div className="info-label"><strong>Liquidation Price:</strong></div>
                                            <div className="info-value">${item.liquidationPrice}</div>
                                        </div>
                                        <div className="info-row">
                                            <div className="info-label"><strong>Debt:</strong></div>
                                            <div className="info-value">${item.debt}</div>
                                        </div>
                                    </div>
                                    <button className="liquidate-button" onClick={() => liquidate(item.address, key)}>Liquidate</button>
                                </li>
                            ))}
                        </ul>
                        <Graph data={graphData} symbol={key} />

                    </div>
                </div>
            ))}
        </div>
    );
};

export default Data;