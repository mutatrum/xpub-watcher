const logger = require('./logger');
module.exports = function(address) {
    let isUsed = false;
    this.registerAddresses = async function(registeredAddresses, usedAddresses, importAddressCallback) {
        const result = new Set();
        if (!registeredAddresses.has(address)) {
            await importAddressCallback(address);
            return true;
        } else {
            if (!isUsed) {
                if (usedAddresses.has(address)) {
                    isUsed = true;
                    logger.log(`Address ${address} used`);
                }
            }
        }
        return false;
    }
}
