import {stringToPath} from "@cosmjs/crypto";
import {DirectSecp256k1Wallet} from "@cosmjs/proto-signing";
import {Tendermint34Client} from '@cosmjs/tendermint-rpc'
import dotenv from 'dotenv';
import {Wallet} from "./wallet/Wallet";
import {KeyUtils} from "./utils/KeyUtils";
import express from "express";
import bodyParser from 'body-parser';
import {Response} from "express-serve-static-core";

dotenv.config();

const mnemonic: string = process.env.MNEMONIC as string;
const minimalDenom: string = process.env.MINIMAL_DENOM as string;
const rpc: string = process.env.RPC as string;
const prefix: string = process.env.DENOM as string;
const hdPath: string = process.env.HDPATH as string;
const feeAmount: string = process.env.FEE_AMOUNT as string;
const transferAmount: string = process.env.TRANSFER_AMOUNT as string;
const faucetPort: string = process.env.FAUCET_PORT as string;

const app = express();
app.use(bodyParser.urlencoded({extended: false}));

const sendTx = async (receiverAddress: string, res: Response) => {
    const path = stringToPath(hdPath);
    let privateKey: Uint8Array;
    if (KeyUtils.isPrivateKey(mnemonic)) {
        privateKey = Buffer.from(mnemonic.trim(), "hex");
    } else {
        privateKey = await KeyUtils.getPrivateKeyFromMnemonic(mnemonic, path);
    }

    const directSecrWallet = await DirectSecp256k1Wallet.fromKey(privateKey, prefix);
    const tendermintClient = await Tendermint34Client.connect(rpc);
    const wallet = new Wallet(tendermintClient, directSecrWallet, {prefix: prefix});
    await wallet.useAccount();

    const FEE = {
        amount: [{
            denom: minimalDenom,
            amount: feeAmount
        }],
        gas: '200000'
    }

    try {
        const txResponse = await wallet.sendTokens(
            wallet?.address as string,
            receiverAddress,
            [{
                denom: minimalDenom,
                amount: transferAmount
            }],
            FEE
        );

        res.send(txResponse);
    } catch (e) {
        res.send({error: "Error!"});
    }
};


app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (!req.query.addr) {
        res.send({error: 'Missing receiver address'});
    } else {
        sendTx(req.query.addr as string, res);
    }
})

app.listen(faucetPort, () => {
    console.log('* Cosmos-faucet app listening on port ' + faucetPort)
})
