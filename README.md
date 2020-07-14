# XPUB Watcher

This repository provides scripts to derive receive and change addresses from XPUBs into a Bitcoin Core watch-only wallet.

# What it does

It periodically checks for new incoming transactions and registers new lookahead addresses on active chains. This script provides a simple way to verify incoming transactions on a full bitcoin node while using the security of hardware wallets.

# How to use it

Clone this repository:
```
git clone https://github.com/mutatrum/xpub-watcher.git
```

Verify the code. There are no dependencies, it only uses the built-in `http` library to communicate with the bitcoin node.

Edit the config.json by supplying parameters for communicating with Bitcoin Core and add the addresses and XPUBs:

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

To get the xpub from a Ledger, see https://support.ledger.com/hc/en-us/articles/360011069619-Extended-public-key. Different accounts have different XPUBs.

Start the script:
```
node xpub-watcher.js
```

Alternatively, managed the script by a task manager such as PM2:
```
pm2 start xpub-watcher.js
```

See https://nodejs.org/en/download/package-manager/ for installing node.js.
See https://pm2.keymetrics.io/docs/usage/quick-start/ for installing PM2.

# Initial startup

The initial startup will most likely take a long time. For each XPUB, it will import the base address in p2pkh (Legacy 1x), p2sh (Segwit 3x) and bech32 (Native Segwit bc1x) format. The script will then initiate a full rescan which will probably take several hours. After the initial rescan, it will add the lookahead change and receive addresses for each base address is active, e.g. that receive a transaction. After this, it will initiate another rescan and repeat this cycle until there are 20 lookahead addresses per active chain. If the chains have used a lot of addresses, this cycle will repeat many times and can take a very long time. Increasing the `lookahead` value in the configuration will reduce the number of rescan cycles needed.

When all the rescans are done, transactions which use a new receive or change address will be picked up by the wallet after the first confirmation. It will extend the lookahead addresses without doing a rescan.

# Why

Running a node is not equal to using a node. I needed a simple solution to have address and balance monitoring for cold storage, which can be automated. When the script is done importing, it will continue monitoring the wallet and import new lookahead addresses so any incoming transcation will be added to the wallet as soon as it confirms.

You can then check the balance with the CLI:
```
bitcoin-cli getbalance "*" 0 true
```
or, for all separate addresses:
```
bitcoin-cli listunspent
```

# Disclaimers

I have only tested this for Ledger account xpubs. If you use this with any other device, or if you have other usecases for this, please let me know.

I'm not a javascript developer, so I probably violated some node.js best practices.

# License

MIT