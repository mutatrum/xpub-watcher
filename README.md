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

Running a bitcoin node is not equal to using a node. Only when verifying any incoming transactions with the node version you selected, you are using bitcoin in a self-sovereign way. This script enables you to use your own full node to verify any incoming transactions into your cold storage. This also makes it easy to integrate into reporting tools, without running any other tools. With this script running, it continuously monitors the wallet and import new lookahead addresses so any future transaction will be added to the wallet as soon as they confirm.

# Example log

When connected to a node during initial block download:
```
[2020-07-15T14:20:04.810Z] XPUB Watcher
[2020-07-15T14:20:04.928Z] Connected to Bitcoin Core /Satoshi:0.20.0/ on localhost
[2020-07-15T14:20:04.928Z] Registered 3 address handlers
[2020-07-15T14:20:04.930Z] Initial block download: 43.66% (block 475565/639380)
[2020-07-15T14:21:04.935Z] Initial block download: 43.83% (block 476188/639380)
[2020-07-15T14:23:13.865Z] Initial block download: 43.96% (block 476630/639380)
...
```
For each XPUB, it will import the legacy (1*), segwit (3) and native segwit (bc1) addresses and initiate a rescan:
```
[2020-07-15T23:01:25.596Z] XPUB Watcher
[2020-07-15T23:01:25.614Z] Connected to Bitcoin Core /Satoshi:0.20.0/ on localhost
[2020-07-15T23:01:25.615Z] Registered 3 address handlers
[2020-07-15T23:01:25.622Z] Registered addresses: 0
[2020-07-15T23:01:25.623Z] Retrieving transactions (0)
[2020-07-15T23:01:25.623Z] Used addresses: 0
[2020-07-15T23:01:25.659Z] Address 1G***o imported (xpub6***d m/0/0)
[2020-07-15T23:01:25.683Z] Address 3E***K imported (xpub6***d m/0/0)
[2020-07-15T23:01:25.704Z] Address bc1q***f imported (xpub6***d m/0/0)
[2020-07-15T23:01:25.852Z] Rescanning blockchain
[2020-07-15T23:02:25.897Z] Rescanning blockchain: 1.34%
[2020-07-15T23:03:25.877Z] Rescanning blockchain: 2.91%
[2020-07-15T23:04:25.878Z] Rescanning blockchain: 4.35%
...
```
After the rescan, for each of the addresses that received a transaction it will import 20 receive (m/0) and 20 change (m/1) lookahead addresses:
```
[2020-07-16T01:03:39.233Z] Address bc1q***f used (xpub6***d m/0/0)
[2020-07-16T01:03:39.234Z] Address bc1q***c imported (xpub6***d m/0/1)
[2020-07-16T01:03:39.234Z] Address bc1q***v imported (xpub6***d m/0/2)
[2020-07-16T01:03:39.234Z] Address bc1q***q imported (xpub6***d m/0/3)
...
[2020-07-16T01:03:39.234Z] Address bc1q***r imported (xpub6***d m/1/0)
[2020-07-16T01:03:39.234Z] Address bc1q***8 imported (xpub6***d m/1/1)
[2020-07-16T01:03:39.234Z] Address bc1q***w imported (xpub6***d m/1/2)
...
```
On subsequent cycles, it will import 20 addresses beyond the last used address in each chain. If more then 10 addresses are imported on a chain, it will trigger a rescan.

When all addresses are imported, it will poll the node once a minute for new incoming transactions and import a new lookahead address:
```
[2020-07-20T11:18:58.592Z] New transction: receive 6.15 BTC on bc1q***v
[2020-07-20T11:18:58.594Z] Registered addresses: 204
[2020-07-20T11:18:58.599Z] Retrieving transactions (100)
[2020-07-20T11:18:58.604Z] Retrieving transactions (200)
...
[2020-07-20T11:18:58.908Z] Retrieving transactions (1064)
[2020-07-20T11:18:58.908Z] Used addresses: 79
[2020-07-20T11:18:58.975Z] Address bc1***s used (xpub6***d m/0/5)
[2020-07-20T11:18:58.975Z] Address bc1***0 used (xpub6***d m/0/6)
[2020-07-20T11:18:58.975Z] Address bc1***v used (xpub6***d m/0/7)
[2020-07-20T11:18:58.978Z] Address bc1***z imported (xpub6***d m/0/27)
```

# Disclaimers

I have only tested this with Ledger account XPUBs and single addresses. If you use this with any other device, or if you have other usecases for this, please let me know.

I am no JavaScript devloper, so I probably violated some Node.js best practices.

# License

MIT