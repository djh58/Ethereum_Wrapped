# Ethereum_Wrapped
Cry yourself to sleep knowing how much you spent on gas in 2021, but hey, you can write it off now on your tax return

## Backend Proof of Concept
Prints gas fees for one account

### To run
1) Make sure you have node and yarn installed. I'm currently using 16.3.0, but if you're getting issues on other versions please put in a PR with a `.nvmrc` file 
2) Install dependencies via `yarn`
3) Make a file with environment variables via `cp .env.example .env`, you'll need an API key for Etherscan which you can get by making an account on their site, and you'll need a valid Ethereum address
4) Run `yarn dev`
