# XPUB Watcher

This repository provides scripts to derive receive and change addresses from XPUBs and import them into a Bitcoin Core watch-only wallet.

# What it does

It periodically checks for new incoming transactions and imports new lookahead addresses on active chains. This script provides a simple way to verify incoming transactions on a full bitcoin node while at the same time leverage the security of hardware wallets.

# Requirements

- Bitcoin Core 0.18.0 or later
- Node.js
- Optional: PM2

# How to use it

Clone this repository:
```
git clone https://github.com/mutatrum/xpub-watcher.git
```

Review the code.

There are no external dependencies. It uses the built-in `http` library to communicate with the bitcoin node.

Edit `config.json` by supplying parameters for communicating with Bitcoin Core and add your XPUBs. You can also add single use addresses from legacy wallets:
```
{
  "bitcoind": {
    "host": "localhost",
    "port": 8332,
    "username": "rpcusername",
    "password": "rpcpassword"
  },
  "lookahead": 20,
  "addresses": [
    "1***",
    "3***",
    "xpub***"
  ]
}
```

To get the XPUB from a Ledger, see https://support.ledger.com/hc/en-us/articles/360011069619-Extended-public-key. Different accounts have different XPUBs.

Start the script:
```
node xpub-watcher.js
```

Alternatively, you can manage the script by a task manager such as PM2. This will make sure the script restart after a reboot:
```
pm2 start xpub-watcher.js
```

For installing Node.js, see https://nodejs.org/en/download/package-manager/.

For installing PM2, see https://pm2.keymetrics.io/docs/usage/quick-start/.

# Initial startup

The initial startup will most likely take a long time. For each XPUB, it will import the base address in p2pkh (Legacy 1x), p2sh (Segwit 3x) and bech32 (Native Segwit bc1x) format. The script will then initiate a full rescan which will probably take several hours. After the initial rescan, it will add the lookahead change and receive addresses for each base address is active, e.g. that receive a transaction. After this, it will initiate another rescan and repeat this cycle until there are 20 lookahead addresses per active chain. 

If your wallets are very heavily used, you expect a lot of transactions or have large gaps in addresses, you can increasing the `lookahead` value in the configuration. This will extend the number of pre-imported addresses, cross larger haps and reduce the number of rescan cycles at startup.  

When all the rescans are done, transactions which use a new receive or change address will be picked up by the wallet after the first confirmation. It will extend the lookahead addresses without doing a rescan.

When the initial rescans are don, you can then check the wallet balance with the CLI:
```
bitcoin-cli getbalance "*" 0 true
```
or, for all separate addresses:
```
bitcoin-cli listunspent
```

# Why

Running a bitcoin node is not equal to using a node. This script enabled me to receive transactions into cold storage while at the same time verifying these transaction using a full node. This enabled me to easilty integrate this into reporting tools, without running any other tools. With this script running, it continuously monitors the wallet and import new lookahead addresses so any future transaction will be added to the wallet as soon as they confirm.

# Example log

When connected to a brand new node:
```
[2020-07-15T09:46:08.141Z] XPUB Watcher
[2020-07-15T09:46:08.151Z] Connected to Bitcoin Core on localhost subversion /Satoshi:0.20.0/
[2020-07-15T09:46:08.151Z] Registered 11 address handlers
[2020-07-15T09:46:08.153Z] Initial block download: 0.00%
[2020-07-15T09:47:08.159Z] Initial block download: 0.01%
[2020-07-15T09:48:08.157Z] Initial block download: 0.02%
...
```

# Disclaimers

I have only tested this with Ledger account XPUBs and single addresses. If you use this with any other device, or if you have other usecases for this, please let me know.

I am no JavaScript devloper, so I probably violated some Node.js best practices.

# License

MIT