import React, { useState, useEffect } from 'react';
import { IconService, HttpProvider, IconBuilder, CallBuilder, CallTransactionBuilder } from 'icon-sdk-js';
import Data from './Data';
import Graph from './Graph';
import './App.css';
const { IconConverter } = IconService;
const httpProvider = new HttpProvider('https://wallet.icon.foundation/api/v3/');
const iconService = new IconService(httpProvider);
const tokens = {
    "ICX": "cx2609b924e33ef00b648a409245c7ea394c467824",
    "AVAX": "cx66a031cc3bd305c76371fb586e93801b948254f0",
    "BNB": "cx2d552c485ec8bcaa75aac02424e2aca6ffdb2f1b",
    "BTC": "cx07b184a37f03c6ab681fcbd0b45aec6dc3eafbeb",
    "BTCB": "cx5b5a03cb525a1845d0af3a872d525b18a810acb0",
    "ETH": "cx288d13e1b63563459a2ac6179f237711f6851cb5",
    "INJ": "cx4297f4b63262507623b6ad575d0d8dd2db980e4e",
    "SUI": "cx508002ec116fbf3ab406329c0df28e70d7e75fb3",
    "tBTC": "cx15ddac8c2663bd7e71ca1688dffa426070752fbd",
    "weETH": "cxce7b23917ddf57656010decd6017fe5016de681b",
    "wstETH": "cxb940dbfbc45c92f3a0cde464c4331102e7a84da8"
  };
  function App() {
    const [walletAddress, setWalletAddress] = useState('');
    const [db, setDB] = useState('');
    const [badDebt, setBadDebt] = useState('');
    const [bdAmount, setBdAmount] = useState('');
    const [selectedToken, setSelectedToken] = useState(Object.keys(tokens)[0]);
    const [graphData, setGraphData] = useState([]);

    const handleInputChange = (event) => {
        setBdAmount(event.target.value);
    };

    const handleTokenChange = (event) => {
        setSelectedToken(event.target.value);
    };


    useEffect(() => {
        window.addEventListener('ICONEX_RELAY_RESPONSE', (event) => {
            const { type, payload } = event.detail;
            console.log(type)
            console.log(payload)
            if (type === 'RESPONSE_ADDRESS') {
                setWalletAddress(payload);
            }

        });
        sync()
    }, []);



    function connectWallet() {
        window.dispatchEvent(new CustomEvent('ICONEX_RELAY_REQUEST', {
            detail: {
                type: 'REQUEST_ADDRESS',
            },
        }));
    }

    async function sync() {
        let data = {}

        for (const [symbol, collateral] of Object.entries(tokens)) {
            let remaining = await getBorrowerCount(collateral);
            let currentId = 0;
            data[symbol] = {}
            data[symbol]["data"] = []
            console.log(remaining)
            data[symbol]["price"] = roundToFixed(await getPrice(symbol), 4)

            while (remaining > 0) {
                const nrOfPositions = Math.min(100, remaining);
                const borrowers = await getBorrowers(collateral, nrOfPositions, currentId);
                remaining -= nrOfPositions;
                currentId = parseInt(borrowers[borrowers.length - 1].nextId, 16);

                for (const borrower of borrowers) {
                    if (parseInt(borrower.debt, 16) != 0) {
                        let c = parseInt(borrower[symbol], 16);
                        if (symbol == "ICX") {
                            c = parseInt(borrower["sICX"], 16);
                        }
                        let d = parseInt(borrower.debt, 16);


                        let liquidationPrice = ((((11765 * 10 ** 18) / 10000) * d) / c)
                        if (symbol == "ICX") {
                            liquidationPrice = liquidationPrice / (await getRate())
                        }
                        data[symbol]["data"].push({
                            collateral: c,
                            debt: roundToFixed(d / 10 ** 18, 4),
                            liquidationPrice: roundToFixed(liquidationPrice / 10 ** 18, 4),
                            address: borrower.address
                        });
                    }

                }
            }
            data[symbol]["data"].sort((a, b) => b.liquidationPrice - a.liquidationPrice);
        }

        updateGraphData(data);

        for (const [symbol, collateral] of Object.entries(tokens)) {
            data[symbol]["data"] = data[symbol]["data"].slice(0, 5)

        }
        setDB(data)
        syncBadDebt()
    }

    async function syncPrice() {
        let newData = { ...db }; // Create a shallow copy of the db object

        for (const [symbol, collateral] of Object.entries(tokens)) {
            newData[symbol] = { ...newData[symbol] }; // Create a shallow copy of the nested object
            if (symbol == "sICX") {
                newData[symbol]["price"] = roundToFixed(await getPrice("ICX"), 4)
            } else {
                newData[symbol]["price"] = roundToFixed(await getPrice(symbol), 4)
            }
        }

        setDB(newData); // Set the newData as the updated state
        console.log("Updated data:", newData); // Logging the updated data for debugging
    }

    function roundToFixed(value, decimalPlaces) {
        return Number(value.toFixed(decimalPlaces));
    }


    async function getPrice(symbol) {
        const callBuilder = new CallBuilder();
        const call = callBuilder
            .from(walletAddress)
            .to("cx133c6015bb29f692b12e71c1792fddf8f7014652")
            .method("getLastPriceInUSD")
            .params({
                "symbol": symbol,
            })
            .build();
        const result = await iconService.call(call).execute();
        return parseInt(result, 16) / 10 ** 18;
    }

    async function getRate() {
        const callBuilder = new CallBuilder();
        const call = callBuilder
            .from(walletAddress)
            .to("cx43e2eec79eb76293c298f2b17aec06097be606e0")
            .method("getTodayRate")
            .build();
        const result = await iconService.call(call).execute();
        return parseInt(result, 16) / 10 ** 18;
    }


    async function syncBadDebt(symbol) {
        const callBuilder = new CallBuilder();
        const call = callBuilder
            .from(walletAddress)
            .to("cx66d4d90f5f113eba575bf793570135f9b10cece1")
            .method("getAvailableAssets")
            .build();
        const data = await iconService.call(call).execute();
        let totalBadDebt = 0;

        // Iterate over the debt_details and add each bad_debt
        for (const key in data.bnUSD.debt_details) {
            totalBadDebt += Number((data.bnUSD.debt_details[key].bad_debt));
        }

        setBadDebt(totalBadDebt / 10 ** 18)
    }


    async function getBorrowers(collateral, amount, start) {
        const callBuilder = new CallBuilder();
        const call = callBuilder
            .from(walletAddress)
            .to("cx66d4d90f5f113eba575bf793570135f9b10cece1")
            .method("getBorrowers")
            .params({
                "collateralAddress": collateral,
                "nrOfPositions": amount.toString(),
                "startId": start.toString()
            })
            .build();
        const result = await iconService.call(call).execute();
        console.log(result)
        return result;
    }

    async function liquidate(address, symbol) {
        const timestamp = (new Date()).getTime() * 1000;
        let tx = new CallTransactionBuilder()
            .nid("0x1")
            .from(walletAddress)
            .stepLimit(400000000)
            .timestamp(timestamp)
            .to("cx66d4d90f5f113eba575bf793570135f9b10cece1")
            .method("liquidate")
            .params({
                "_owner": address,
                "_collateralSymbol": symbol
            })
            .version("0x3")
            .build();
        let rpc = JSON.stringify({
            jsonrpc: "2.0",
            method: "icx_sendTransaction",
            params: IconConverter.toRawTransaction(tx),
            id: 50889
        });

        window.dispatchEvent(
            new CustomEvent("ICONEX_RELAY_REQUEST", {
                detail: {
                    type: "REQUEST_JSON-RPC",
                    payload: JSON.parse(rpc)
                }
            }))

    }

    async function redeem() {
        const timestamp = (new Date()).getTime() * 1000;
        let tx = new CallTransactionBuilder()
            .nid("0x1")
            .from(walletAddress)
            .stepLimit(400000000)
            .timestamp(timestamp)
            .to("cx66d4d90f5f113eba575bf793570135f9b10cece1")
            .method("retireBadDebt")
            .params({
                "_symbol": "",
                "_value": IconConverter.toBigNumber(bdAmount * 10 ** 18)
            })
            .version("0x3")
            .build();
        let rpc = JSON.stringify({
            jsonrpc: "2.0",
            method: "icx_sendTransaction",
            params: IconConverter.toRawTransaction(tx),
            id: 50889
        });

        window.dispatchEvent(
            new CustomEvent("ICONEX_RELAY_REQUEST", {
                detail: {
                    type: "REQUEST_JSON-RPC",
                    payload: JSON.parse(rpc)
                }
            }))

    }

    async function redeemAndSwap() {
        const timestamp = (new Date()).getTime() * 1000;
        let tx = new CallTransactionBuilder()
            .nid("0x1")
            .from(walletAddress)
            .stepLimit(400000000)
            .timestamp(timestamp)
            .to("cx88fd7df7ddff82f7cc735c871dc519838cb235bb")
            .method("transfer")
            .params({
                "_to": "cx5bd0bdbd07550141c6bfd3bd039168a9aa0bf0b6",
                "_value": IconConverter.toBigNumber(bdAmount * 10 ** 18)
            })
            .version("0x3")
            .build();
        let rpc = JSON.stringify({
            jsonrpc: "2.0",
            method: "icx_sendTransaction",
            params: IconConverter.toRawTransaction(tx),
            id: 50889
        });

        window.dispatchEvent(
            new CustomEvent("ICONEX_RELAY_REQUEST", {
                detail: {
                    type: "REQUEST_JSON-RPC",
                    payload: JSON.parse(rpc)
                }
            }))

    }

    String.prototype.hexEncode = function () {
        var hex, i;

        var result = "";
        for (i = 0; i < this.length; i++) {
            hex = this.charCodeAt(i).toString(16);
            result += ("" + hex).slice(-4);
        }

        return "0x" + result
    }

    async function redeemCollateral() {
        const timestamp = (new Date()).getTime() * 1000;
        let tx = new CallTransactionBuilder()
            .nid("0x1")
            .from(walletAddress)
            .stepLimit(400000000)
            .timestamp(timestamp)
            .to("cx88fd7df7ddff82f7cc735c871dc519838cb235bb")
            .method("transfer")
            .params({
                "_to": "cxa5316f98fe4c6f4ffa3ac1f05ead895a8423b121",
                "_value": IconConverter.toBigNumber(bdAmount * 10 ** 18),
                "_data": tokens[selectedToken].hexEncode()
            })
            .version("0x3")
            .build();
        let rpc = JSON.stringify({
            jsonrpc: "2.0",
            method: "icx_sendTransaction",
            params: IconConverter.toRawTransaction(tx),
            id: 50889
        });

        window.dispatchEvent(
            new CustomEvent("ICONEX_RELAY_REQUEST", {
                detail: {
                    type: "REQUEST_JSON-RPC",
                    payload: JSON.parse(rpc)
                }
            }))

    }



    async function getBorrowerCount(collateral) {
        const callBuilder = new CallBuilder();
        const call = callBuilder
            .from(walletAddress)
            .to("cx66d4d90f5f113eba575bf793570135f9b10cece1")
            .method("getBorrowerCount")
            .params({
                "collateralAddress": collateral
            })
            .build();

        const result = await iconService.call(call).execute();
        console.log(result)
        return result // Convert hexadecimal result to integer
    }
    function updateGraphData(data) {
        const newGraphData = [];
        for (const [symbol, collateral] of Object.entries(tokens)) {
            const symbolData = data[symbol]["data"];
            symbolData.forEach(item => {
                newGraphData.push({
                    price: item.liquidationPrice,
                    amount: item.debt,
                    symbol: symbol
                });
            });
        }
        setGraphData(newGraphData);
    }


    return (
        <div className="App">
            <h1>ICON React Example</h1>
            <div className="container">
                <button onClick={connectWallet}>Connect Wallet</button>
                <p>Connected Wallet Address: {walletAddress}</p>
                <button onClick={syncBadDebt}>Update Bad Debt</button>
                <p>Current Bad Debt: {badDebt}</p>
                <input
                    type="text"
                    value={bdAmount}
                    onChange={handleInputChange}
                    placeholder="bnUSD amount"
                />
                <div className="actions">
                    <button onClick={redeem}>Redeem Bad Debt</button>
                    <button onClick={redeemAndSwap}>Redeem Bad Debt and Swap</button>
                </div>
                <select value={selectedToken} onChange={handleTokenChange}>
                    {Object.keys(tokens).map((token) => (
                        <option key={token} value={token}>
                            {token}
                        </option>
                    ))}
                </select>
                <button onClick={redeemCollateral}>Redeem Collateral 2% Fee</button>
                <button onClick={syncPrice}>Sync Price</button>
                <button onClick={sync}>Sync All</button>
                <Data data={db} liquidate={liquidate} graphData={graphData} />

            </div>
        </div>

    );
}

export default App;
