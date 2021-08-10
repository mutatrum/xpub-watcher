const http = require('http');
const logger = require('./logger');

module.exports = function(config, wallet_name) {
    this.getNetworkInfo = () => request('getnetworkinfo', []);
    this.getBlockchainInfo = () => request('getblockchaininfo', []);
    this.getWalletInfo = () => request('getwalletinfo', []);
    this.listTransactions = (count, skip, watchOnly) => request('listtransactions', ['*', count, skip, watchOnly]);
    this.listWalletDir = () => request('listwalletdir', []);
    this.listWallets = () => request('listwallets', []);
    this.createWallet = (wallet_name) => request('createwallet', [wallet_name, true]);
    this.loadWallet = (wallet_name) => request('loadwallet', [wallet_name]);
    this.getWalletInfo = () => request('getwalletinfo', []);
    this.getAddressesByLabel = (label) => request('getaddressesbylabel', [label]);
    this.getDescriptorInfo = (descriptor) => request('getdescriptorinfo', [descriptor]);
    this.deriveAddresses = (descriptor, range) => request('deriveaddresses', [descriptor, range]);
    this.importAddress = (address, label, rescan, p2sh) => request('importaddress', [address, label, rescan, p2sh]);
    this.rescanBlockchain = () => request('rescanblockchain', []);

    const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    const options = {
        host: config.host,
        port: config.port,
        path: `/wallet/${wallet_name}`,
        method: 'POST',
        headers : {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
        }
    }
    
    function request(command, params) {
        return new Promise(function(resolve, reject) {
            const request = http.request(options, (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    const result = JSON.parse(data);
                    if (result.error) {
                        reject(result.error);
                    }
                    resolve(result.result); 
                });
            }).on('error', (error) => {
                logger.log(`Error: ${error}`);
                reject(error);
            });
    
            const body = {
                method: command,
                params: params
            };
    
            request.write(JSON.stringify(body));
            request.end();
        });
    }
}
