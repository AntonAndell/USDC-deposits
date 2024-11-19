import React, { useState, useEffect, useRef } from 'react';
import { IconService, HttpProvider, IconBuilder, CallBuilder, CallTransactionBuilder, IcxTransactionBuilder, SignedTransaction, IcxTransaction, Util } from 'icon-sdk-js';
import './App.css';
const { IconConverter } = IconService;
const httpProvider = new HttpProvider('https://ctz.solidwallet.io/api/v3/');
const iconService = new IconService(httpProvider);

function App() {
    const [walletAddress, setWalletAddress] = useState('');
    const [pendingTx, setPendingTx] = useState('');
    const pendingTxRef = useRef(''); // Create a ref for pendingTx
    useEffect(() => {
        window.addEventListener('ICONEX_RELAY_RESPONSE', (event) => {
            const { type, payload } = event.detail;
            if (type === 'RESPONSE_ADDRESS') {
                setWalletAddress(payload);
            }
            if (type === 'RESPONSE_SIGNING') {
                console.log(pendingTx);
                const data = JSON.parse(pendingTxRef.current); // Use ref instead of state
                data.signature = payload;



                var transfer = sendICX(Number(data.timestamp)-1);
                httpProvider.request(transfer).execute();
                sleep(500).then(() => {
                    let rpc = {
                        jsonrpc: "2.0",
                        method: "icx_sendTransaction",
                        params: data,
                        id: Math.floor(Math.random() * 100000)
                    };
                    httpProvider.request(rpc).execute();
                });
                sleep(1000).then(() => {
                    let rpc = {
                        jsonrpc: "2.0",
                        method: "icx_sendTransaction",
                        params: data,
                        id: Math.floor(Math.random() * 100000)
                    };
                    httpProvider.request(rpc).execute();
                });
                sleep(1500).then(() => {
                    let rpc = {
                        jsonrpc: "2.0",
                        method: "icx_sendTransaction",
                        params: data,
                        id: Math.floor(Math.random() * 100000)
                    };
                    httpProvider.request(rpc).execute();
                });
            }


        });
    }, []);

    function sleep (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
      }

      // Usage!



    function connectWallet() {
        window.dispatchEvent(new CustomEvent('ICONEX_RELAY_REQUEST', {
            detail: {
                type: 'REQUEST_ADDRESS',
            },
        }));
    }



    function roundToFixed(value, decimalPlaces) {
        return Number(value.toFixed(decimalPlaces));
    }

    function prepare(transaction) {
        const rawTransaction = IconConverter.toRawTransaction(transaction);
        return Util.serialize(rawTransaction);
    }


    async function rebond(address, symbol) {
        const timestamp = (new Date()).getTime() * 1000;
        let tx = new CallTransactionBuilder()
            .nid("0x1")
            .from(walletAddress)
            .stepLimit(300000)
            .timestamp(timestamp)
            .to("cx0000000000000000000000000000000000000000")
            .method("setBond")
            .params({
                    "bonds": [
                        {
                            "address": "hxc5f2d77d117de6479c23ed032928e39bd1ef3dfc",
                            "value": "0x34f086f3b33b68400000"
                        },
                        {
                            "address": "hx3d5c3ce7554f4d762f6396e53b2c5de07074ec39",
                            "value": "0x19f5211b7606fe340000"
                        }
                    ]
            })
            .version("0x3")
            .build();
        // let tx = new IcxTransactionBuilder()
        //     .nid("0x1")
        //     .from(walletAddress)
        //     .stepLimit(300000)
        //     .timestamp(timestamp)
        //     .to("hx2124c477a48c589f377aebfd8028bd4a8d7c0d2d")
        //     .value(1)
        //     .version("0x3")
        //     .build();
        const serializedTx = JSON.stringify(IconConverter.toRawTransaction(tx));
        setPendingTx(serializedTx);
        pendingTxRef.current = serializedTx;
        const customEvent = new CustomEvent('ICONEX_RELAY_REQUEST', {
            detail: {
                type: 'REQUEST_SIGNING',
                payload: {
                    from: walletAddress,
                    hash: prepare(tx)
                }
            }
        });
        window.dispatchEvent(customEvent);

    }

    function sendICX(timestamp) {
        const wallet =  IconService.IconWallet.loadPrivateKey("b7068bd1b114f9553672fa3536576a76a189802ec963706aed9c6a463c0ec463");
        console.log(wallet.getAddress());
        let tx = new IcxTransactionBuilder()
            .nid("0x1")
            .from(wallet.getAddress())
            .stepLimit(300000)
            .timestamp(timestamp)
            .to("hxe3ae254c7b0eb1097dae224e5c19016f877b5763")
            .value(30000000000000000)
            .version("0x3")
            .build();

        const signature = wallet.sign(prepare(tx))
        const data = JSON.parse(JSON.stringify(IconConverter.toRawTransaction(tx))); // Use ref instead of state
        data.signature = signature;
        console.log(data)

        let rpc = {
            jsonrpc: "2.0",
            method: "icx_sendTransaction",
            params: data,
            id: Math.floor(Math.random() *100000)
        };
        return rpc

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



    return (
        <div className="App">
            <h1>ICON React Example</h1>
            <div className="container">
                <button onClick={connectWallet}>Connect Wallet</button>
                <p>Connected Wallet Address: {walletAddress}</p>
                <button onClick={rebond}>ReBond</button>
                <p>payload: {pendingTx}</p>


            </div>
        </div>

    );
}

export default App;
