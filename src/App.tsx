import React, {useEffect} from 'react';
import {getKeplrFromWindow} from "./util/getKeplrFromWindow";
import {OsmosisChainInfo} from "./constants";
import {Balances} from "./types/balance";
import {Dec, DecUtils} from "@keplr-wallet/unit";
import {sendMsgs} from "./util/sendMsgs";
import {api} from "./util/api";
import {simulateMsgs} from "./util/simulateMsgs";
import {MsgSend} from "./proto-types-gen/src/cosmos/bank/v1beta1/tx";
import "./styles/container.css";
import "./styles/button.css";
import "./styles/item.css";
import {  Coin, coin } from "@cosmjs/stargate";
import { SigningArchwayClient, ArchwayClient } from '@archwayhq/arch3.js';
import { OfflineAminoSigner } from '@keplr-wallet/types';
import {
    SigningStargateClient, SigningStargateClientOptions, StdFee,
  } from "@cosmjs/stargate";
  import { Decimal } from "@cosmjs/math";

function App() {
  const [address, setAddress] = React.useState<string>('');
  const [balance, setBalance] = React.useState<string>('');

  const [recipient, setRecipient] = React.useState<string>('');
  const [amount, setAmount] = React.useState<string>('');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const keplr = await getKeplrFromWindow();

    if(keplr) {
      try {
        await keplr.experimentalSuggestChain(OsmosisChainInfo);
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
      }
    }
  }

  const getKeyFromKeplr = async () => {
    const key = await window.keplr?.getKey(OsmosisChainInfo.chainId);
    if (key) {
      setAddress(key.bech32Address)
    }
  }

  const getBalance = async () => {
    const key = await window.keplr?.getKey(OsmosisChainInfo.chainId);

    if (key) {
      const uri = `${OsmosisChainInfo.rest}/cosmos/bank/v1beta1/balances/${key.bech32Address}?pagination.limit=1000`;

      const data = await api<Balances>(uri);
      const balance = data.balances.find((balance) => balance.denom === "ibc/43897B9739BD63E3A08A88191999C632E052724AB96BD4C74AE31375C991F48D");
      const osmoDecimal = OsmosisChainInfo.currencies.find((currency) => currency.coinMinimalDenom === "ibc/43897B9739BD63E3A08A88191999C632E052724AB96BD4C74AE31375C991F48D")?.coinDecimals;

      if(balance) {
        const amount = new Dec(balance.amount, osmoDecimal);
        setBalance(`${amount.toString(0)} USDC`)
      } else {
        setBalance(`0 OSMO`)
      }
    }
  }

  async function createAminoTransaction(signer: OfflineAminoSigner | null): Promise<void> {
    if (!signer) {
      console.error("Keplr initialization failed.");
      return;
    }
    const acc = await signer.getAccounts()

    const client = await SigningStargateClient.connectWithSigner(
      "your-rpc-endpoint", // Replace with your RPC endpoint
      signer
    );

    const fee = {
      amount: [{ denom: "uatom", amount: "5000" }], // Replace with your desired fee
      gas: "200000", // Replace with your desired gas
    };

    const result = await client.sendTokens(
      acc[0].address,
      "recipient-address",
      [{ denom: "uatom", amount: "1000" }], // Replace with your desired amount and denomination
      fee,
      "your-memo" // Replace with your memo
    );

    // assertIsBroadcastTxSuccess(result);

    console.log("Transaction sent successfully!");
  }
  const sendBalance = async () => {
    if (!window.keplr) {
        return
    }

    const key = await window.keplr.getKey(OsmosisChainInfo.chainId);
    const signer =  window.keplr.getOfflineSignerOnlyAmino(OsmosisChainInfo.chainId);
    const signingClientObj = await SigningArchwayClient.connectWithSigner(OsmosisChainInfo.rpc, signer);
    const acc = await signer.getAccounts();

    // signingClientObj.execute(
    //     acc[0].address,
    //     "archway19hzhgd90etqc3z2qswumq80ag2d8het38r0al0r4ulrly72t20psdrpna6",
    //     {"set_protocol_fee": {"value": "0"}},
    //     "auto"
    // )
    console.log(amount)
    console.log(recipient)
    // const funds =  [
    //     coin(amount, "ibc/43897B9739BD63E3A08A88191999C632E052724AB96BD4C74AE31375C991F48D"),
    //     coin("1200000000000000000", "aarch")
    // ]

    const funds = [
        {
            denom: "aarch",
            amount: "1200000000000000000",
          },
        {
          denom: "ibc/43897B9739BD63E3A08A88191999C632E052724AB96BD4C74AE31375C991F48D",
          amount: amount,
        },

        ]
    console.log(funds)

    const address = "0x1.icon/" + recipient
    console.log(address)

    signingClientObj.execute(
        acc[0].address,
        "archway1sg2kgqjhj7vyu0x9tflx4ju9vjn2x6c7g39vx3tv9ethfg9d9zns6ajpja",
        {"deposit_denom": {"denom":"ibc/43897B9739BD63E3A08A88191999C632E052724AB96BD4C74AE31375C991F48D", "to":address,"data":[]}},
        "auto",
        "",
        funds
    )
  }


  return (
    <div className="root-container">
        <div style={{
            display: "flex",
            justifyContent: "center",
            padding: "16px"
        }}>
          <img src="/keplr-logo.png" style={{maxWidth: "200px"}} alt="keplr-logo" />
        </div>



      <div className="item-container">
        <div className="item">
          <div className="item-title">
            Get ARCH Address
          </div>

          <div className="item-content">
            <div>
              Address: {address}
            </div>

            <div>
              <button className="keplr-button" onClick={getKeyFromKeplr}>Get Address</button>
            </div>
          </div>
        </div>

        <div className="item">
          <div className="item-title">
            Get USDC Balance
          </div>

          <div className="item-content">
            Balance: {balance}

            <button className="keplr-button" onClick={getBalance}>Get Balance</button>
          </div>
        </div>

        <div className="item">
          <div className="item-title">
            Send USDC
          </div>

          <div className="item-content">
            <div style={{
              display: "flex",
              flexDirection: "column"
            }}>
              Recipient:
              <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column"
            }}>
              Amount:
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <button className="keplr-button" onClick={sendBalance}>Send</button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
