import { Keypair, PublicKey } from "@solana/web3.js";
import { getTokenBalance, getSOLPrice, getBuyTxWithJupiter, getSellTxWithJupiter, getSolBalance } from "./src/utils";
import { executeJitoTx } from "./src/utils/jito"
import base58 from "bs58";
import dotenv from 'dotenv';
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const QUOTE_MINT = process.env.QUOTE_MINT!;
const MAIN_MINT = process.env.MAIN_MINT!;
const IS_JITO = process.env.IS_JITO!;
const LIMIT_SOL_PRICE = Number(process.env.LIMIT_SOL_PRICE!);
const MIN_SOL_BALANCE = Number(process.env.MIN_SOL_BALANCE!);
const tokenLamport = 10 ** 6;



const wallet = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY));

async function main() {
    while (true) {
        try {
            console.log("Fetching SOL price...");
            let SOLPrice = await getSOLPrice();
            console.log("Current SOL Price: ", SOLPrice);

            let solBalance = await getSolBalance();
            let usdcBalance = await getTokenBalance();
            console.log("SOL Balance: ", solBalance);
            console.log("USDC Balance: ", usdcBalance);

            if (SOLPrice > LIMIT_SOL_PRICE) {
                console.log("SOL price is high, swapping USDC to SOL...");
                if (usdcBalance > 0) {
                    let swapTx = await getSellTxWithJupiter(wallet, new PublicKey(QUOTE_MINT), (usdcBalance * tokenLamport));
                    if (swapTx !== null) {
                        let txSig = await executeJitoTx([swapTx], wallet, "confirmed");
                        console.log("Swapped USDC to SOL: ", txSig);
                    } else {
                        console.error("Error: swapTx is null");
                    }
                }
            } else if (SOLPrice < LIMIT_SOL_PRICE) {
                console.log("SOL price is low, swapping SOL to USDC...");
                let solToSwap = solBalance - MIN_SOL_BALANCE;
                if (solToSwap > 0) {

                    console.log(Math.floor(solToSwap * tokenLamport * SOLPrice));
                    let swapTx = await getBuyTxWithJupiter(wallet, new PublicKey(QUOTE_MINT), (Math.floor(solToSwap * tokenLamport * SOLPrice)));
                    if (swapTx !== null) {
                        let txSig = await executeJitoTx([swapTx], wallet, "confirmed");
                        console.log("Swapped SOL to USDC: ", txSig);
                    } else {
                        console.error("Error: swapTx is null");
                    }
                } else {
                    console.log("Not enough SOL to swap after keeping fee reserve.");
                }
            }
        } catch (error) {
            console.error("Error in main loop: ", error);
        }

        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds before next check
    }
}


main();