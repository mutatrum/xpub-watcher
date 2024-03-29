const logger = require('./logger');
const AddressHandler = require('./address-handler.js');
const XpubHandler = require('./xpub-handler.js');
const BitcoinRpc = require('./bitcoin-rpc.js');

const ADDRESS_TYPE = require('./address-type.js');
const handlers = [];
let lastTransaction;
let bitcoin_rpc;
let lookahead;
let wallet_name;

module.exports = function(config) {
    bitcoin_rpc = new BitcoinRpc(config.bitcoind, config.wallet);
    wallet_name = config.wallet;
    lookahead = config.lookahead;
    this.run = async function() {
        logger.log('XPUB Watcher');

        const networkInfo = await bitcoin_rpc.getNetworkInfo();

        logger.log(`Connected to Bitcoin Core ${networkInfo.subversion} on ${config.bitcoind.host}`);

        await loadWallet();

        const walletInfo = await bitcoin_rpc.getWalletInfo()

        logger.log(`Wallet '${walletInfo.walletname}' loaded`);

        await createHandlers(config.addresses);

        logger.log(`Registered ${handlers.length} address handlers`);

        onInterval();
        setInterval(onInterval, 60_000);
    }
}

async function loadWallet() {
  const wallets = await bitcoin_rpc.listWallets();

  if (!wallets.includes(wallet_name)) {

    const walletDir = await bitcoin_rpc.listWalletDir();   
    if (walletDir.wallets.map(wallet => wallet.name).includes(wallet_name)) {

      await bitcoin_rpc.loadWallet(wallet_name);

    } else {

      logger.log(`Creating new wallet`);

      await bitcoin_rpc.createWallet(wallet_name);
    }
  }
}

async function createHandlers(addresses) {
    for(address of addresses) {
        if (address.startsWith('1') || address.startsWith('3')) {
            handlers.push(new AddressHandler(address));
        }
        if (address.startsWith('xpub')) {
            handlers.push(new XpubHandler(bitcoin_rpc, address, ADDRESS_TYPE.P2PKH, lookahead));
            handlers.push(new XpubHandler(bitcoin_rpc, address, ADDRESS_TYPE.P2SH, lookahead));
            handlers.push(new XpubHandler(bitcoin_rpc, address, ADDRESS_TYPE.BECH32, lookahead));
        }
    }
}

async function onInterval() {
    if (await isInitialBlockDownload()) return;
    if (await isScanning()) return;
    if (!(await hasNewTransaction())) return;

    const registeredAddresses = await getRegisteredAddresses();
    logger.log(`Registered addresses: ${registeredAddresses.size}`);

    const usedAddresses = await getUsedAddresses();
    logger.log(`Used addresses: ${usedAddresses.size}`);

    const rescanNeeded = await registerAddresses(registeredAddresses, usedAddresses);
    if (rescanNeeded) {
        logger.log("Rescanning blockchain");

        bitcoin_rpc.rescanBlockchain();
        lastTransaction = null;
    }
}

async function isInitialBlockDownload() {
    const blockchainInfo = await bitcoin_rpc.getBlockchainInfo();
    if (blockchainInfo.initialblockdownload) {
        logger.log(`Initial block download: ${(blockchainInfo.verificationprogress * 100).toFixed(2)}% (block ${blockchainInfo.blocks}/${blockchainInfo.headers})`);
        return true;
    }
    return false;
}

async function isScanning() {
    const walletInfo = await bitcoin_rpc.getWalletInfo();
    const scanning = walletInfo.scanning;
    if (scanning) {
        logger.log(`Rescanning blockchain: ${(scanning.progress * 100).toFixed(2)}%`);
        return true;
    }
    return false;
}

async function hasNewTransaction() {
    const listTransactions = await bitcoin_rpc.listTransactions(1, 0, true);
    if (listTransactions.length == 0) {
        if (lastTransaction != null) {
            return false;
        }
        lastTransaction = '';
    } else {
        lastTx = listTransactions[0];
        if (lastTx.txid == lastTransaction) {
            return false;
        }
        logger.log(`Last transaction: ${lastTx.txid}`);
        if (lastTransaction != null) {
            logger.log(`New transaction: ${lastTx.category} ${Math.abs(lastTx.amount)} BTC ${lastTx.category == 'receive' ? 'on' : 'to'} ${lastTx.address}`);

        }
        lastTransaction = lastTx.txid;
    }
    return true;
}

async function getRegisteredAddresses() {
    const result = new Set();
    const addressesByLabel = await bitcoin_rpc.getAddressesByLabel('');
    for (address in addressesByLabel) {
        result.add(address);
    }

    return result;
}

async function getUsedAddresses() {
    const skipSize = 100;

    const result = new Set();
    let count = 0;
    let transactions;

    do {
        transactions = await bitcoin_rpc.listTransactions(skipSize, count, true);
        for (transaction of transactions) {
            if (transaction.category == 'receive') {
                result.add(transaction.address);
            }
        }
        count += transactions.length;
        logger.log(`Retrieving transactions (${count})`);
    } while (transactions.length == skipSize)
    return result;
}

async function registerAddresses(registeredAddresses, usedAddresses)
{
    let result = false;
    for (handler of handlers) {
        const rescanNeeded = await handler.registerAddresses(registeredAddresses, usedAddresses, importAddress);
        if (rescanNeeded) result = true;
    }
    return result;
}

async function importAddress(address) {
    await bitcoin_rpc.importAddress(address, null, false, false);
}
