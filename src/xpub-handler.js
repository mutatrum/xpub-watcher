const AddressDerivator = require('./address-derivator.js');

module.exports = function(bitcoin_rpc, xpub, addressType, lookahead) {
    let isUsed = false;
    this.registerAddresses = async function(registeredAddresses, usedAddresses, importAddress) {

        const receiveAddressDerivator = new AddressDerivator(bitcoin_rpc, addressType, xpub, 0);
        const address = await receiveAddressDerivator.getAddress(0);

        if (!registeredAddresses.has(address)) {
            await importAddress(address);
            return true;
        }

        if (!usedAddresses.has(address)) {
            return false;
        }

        if (!isUsed) {
            console.log(`Address ${address} used (${xpub} m/0/0)`);
            isUsed = true;
        }

        let receiveIndex = 1;
        let receiveLookahead = lookahead;
        let receiveAddressesImported = 0;
        while(receiveLookahead-- > 0) {
            const receiveAddress = await receiveAddressDerivator.getAddress(receiveIndex);
            if (!registeredAddresses.has(receiveAddress)) {
                await importAddress(receiveAddress);
                receiveAddressesImported++;
            }
            if (usedAddresses.has(receiveAddress)) {
                console.log(`Address ${receiveAddress} used (${xpub} m/0/${receiveIndex})`);
                receiveLookahead = lookahead;
            }
            receiveIndex++;
        }

        const changeAddressDerivator = new AddressDerivator(bitcoin_rpc, addressType, xpub, 1);

        let changeIndex = 0;
        let changeLookahead = lookahead;
        let changeAddressesImported = 0;
        while(changeLookahead-- > 0) {
            const changeAddress = await changeAddressDerivator.getAddress(changeIndex);
            if (!registeredAddresses.has(changeAddress)) {
                await importAddress(changeAddress);
                changeAddressesImported++;
            }
            if (usedAddresses.has(changeAddress)) {
                console.log(`Address ${changeAddress} used (${xpub} m/1/${changeIndex})`);
                changeLookahead = lookahead;
            }
            changeIndex++; 
        }

        const threshold = lookahead / 2;
        return receiveAddressesImported > threshold || changeAddressesImported > threshold;
    }
}
