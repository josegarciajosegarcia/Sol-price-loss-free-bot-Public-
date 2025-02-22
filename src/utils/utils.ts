import { Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { Logger } from 'pino';
import dotenv from 'dotenv';
import base58 from "bs58";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import axios from "axios";

dotenv.config();


const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const QUOTE_MINT = process.env.QUOTE_MINT!;
const RPC_ENDPOINT = process.env.RPC_ENDPOINT!;


export const retrieveEnvVariable = (variableName: string, logger: Logger) => {
  const variable = process.env[variableName] || '';
  if (!variable) {
    logger.error(`${variableName} is not set`);
    process.exit(1);
  }
  return variable;
};

export async function getSolBalance() {
  try {
    const solanaConnection = new Connection(RPC_ENDPOINT, "processed");
    const keypair = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY));
    const walletPublicKey = keypair.publicKey;
    let solBalance = await solanaConnection.getBalance(new PublicKey(walletPublicKey));
    console.log(`Wallet Balance: ${solBalance / (10 ** 9)}`)
    let solBalancePerLam = solBalance / (10 ** 9);
    return solBalancePerLam;
  } catch (error) {
    console.error("Error fetching Sol balance:", error);
    return 0; // Return 0 in case of an error to maintain consistency
  }
}

export async function getSOLPrice() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const solPrice = response.data.solana.usd;
    console.log('Price of SOL:', solPrice, 'USD');
    return solPrice;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
  }
}

