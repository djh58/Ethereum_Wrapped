import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_KEY: string = process.env.ETHERSCAN_API_KEY || '';

const ADDRESS: string = process.env.ADDRESS || '';

const ETHERSCAN_URL: string = 'https://api.etherscan.io/';

enum WhichBlock {
    before = 'before',
    after = 'after',
}

type Txn = {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    transactionIndex: string;
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    isError: string;
    txreceipt_status: string;
    input: string;
    contractAddress: string;
    cumulativeGasUsed: string;
    gasUsed: string;
    confirmations: string;
};

// get Unix timestamp in seconds for Jan 1, 2021 12:00:00 AM EST
const UNIX_TIMESTAMP_2021: number = 1609477200;
const block_2k21 = 11566426;

// get Unix timestamp in seconds for Jan 1, 2022 12:00:00 AM EST
const UNIX_TIMESTAMP_2022: number = 1641013200;

class EthereumWrapped {
    public block2021: number = 0;
    public block2022: number = 0;
    public ethusd: number = 0;
    public initialized: boolean = false;

    public async init(): Promise<void> {
        if (this.initialized) {
            return;
        }
        this.block2021 = block_2k21;
        this.block2022 = await this.getRecentBlock();
        this.ethusd = await this.getEthereumPrice();
        this.initialized = true;
    }

    protected requireInit(): void {
        if (!this.initialized) {
            throw new Error('EthereumWrapped not initialized');
        }
    }

    // create get request for block number closes to unix timestamp of jan 1, 2021 12:00am est
    public async getRecentBlock(): Promise<number> {
        const now = new Date();
         // now_unix = divide now valueOf by 1000 and round
        const now_unix = Math.round(now.valueOf() / 1000);
        // if now is before 2022, set timestamp to now's value, otherwise set to UNIX_TIMESTAMP_2022
        const timestamp = now_unix < UNIX_TIMESTAMP_2022 ? now_unix : UNIX_TIMESTAMP_2022;
        const timing = now_unix < UNIX_TIMESTAMP_2022 ? WhichBlock.before : WhichBlock.after;
        const {data} = await axios.get(`${ETHERSCAN_URL}api?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=${timing}&apikey=${API_KEY}`);
        return data.result;
    };

    // get fiat price of ethereum from coingecko
    public async getEthereumPrice(): Promise<number> {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`);
        return response.data.ethereum.usd;
    }


    public async getAllTxns(address: string): Promise<Txn[]> {
        this.requireInit();
        const response = await axios.get(`${ETHERSCAN_URL}api?module=account&action=txlist&address=${address}&startblock=${this.block2021}&endblock=${this.block2022}&sort=asc&apikey=${API_KEY}`);
        return response.data.result;
    }

    // filter transaction list by status of 1 and from address
    public getSuccessfulFromTxns(txns: Txn[], address: string): Txn[] {
        this.requireInit();
        return txns.filter((txn: Txn) => txn.from.toLowerCase() === address.toLowerCase() && txn.txreceipt_status === '1');
    }

    // return sum as gas as gwei given a list of transaction: gasUsed * gasPrice
    public getGasUsed(txns: Txn[]): number {
        this.requireInit();
        return txns.reduce((acc: number, txn: Txn) => {
            return acc + parseInt(txn.gasUsed) * parseInt(txn.gasPrice) / 1000000000;
        }, 0);
    }
    
    // get USD value of gas from gwei
    public getGasValue(gas: number): number {
        this.requireInit();
        const amt = gas / 1000000000 * this.ethusd;
        // round to 2 decimal places
        return Math.round(amt * 100) / 100;
    }

    // get total gas spend
    public async getTotalGasSpend(address: string): Promise<number> {
        this.requireInit();
        const txns = await this.getAllTxns(address);
        const successfulTxns = this.getSuccessfulFromTxns(txns, address);
        const gasUsed = this.getGasUsed(successfulTxns);
        return this.getGasValue(gasUsed);
    }
    
}

const ethereum = new EthereumWrapped();
ethereum.init().then(async () => {
    const txns = await ethereum.getAllTxns(ADDRESS);
    const successfulTxns = ethereum.getSuccessfulFromTxns(txns, ADDRESS);
    const gas = await ethereum.getTotalGasSpend(ADDRESS);
    console.log(`You have spent ${gas} USD in gas`);
    console.log(`Address: ${ADDRESS}`);
    console.log(`2021 Block number: ${ethereum.block2021}`);
    console.log(`2022 Block number: ${ethereum.block2022}`);
    console.log(`Ethereum price: ${ethereum.ethusd} USD`);
    console.log(`Total transactions: ${txns.length}`);
    console.log(`Successful transactions: ${successfulTxns.length}`);
    console.log(`Gas used: ${ethereum.getGasUsed(successfulTxns)}`);
})






