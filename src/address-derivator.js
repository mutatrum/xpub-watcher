const ADDRESS_TYPE = require('./address-type.js');

module.exports = function(bitcoin_rpc, addressType, xpub, chain) {
    const outputDescriptor = getOutputDescriptor(addressType, xpub, chain);
    const descriptorInfo = bitcoin_rpc.getDescriptorInfo(outputDescriptor);
    const addresses = [];

    this.getAddress = async function(index) {
        const descriptor = (await descriptorInfo).descriptor;
        while(index >= addresses.length) {
            const derivedAddresses = await bitcoin_rpc.deriveAddresses(descriptor, [addresses.length, addresses.length + 20]);
            for (address of derivedAddresses) {
                addresses.push(address);
            }
        }
        return addresses[index];
    }
}

function getOutputDescriptor(addressType, xpub, chain) {
    switch(addressType) {
        case ADDRESS_TYPE.P2PKH: {
            return `pkh(${xpub}/${chain}/*)`;
        }
        case ADDRESS_TYPE.P2SH: {
            return `sh(wpkh(${xpub}/${chain}/*))`;
        }
        case ADDRESS_TYPE.BECH32: {
            return `wpkh(${xpub}/${chain}/*)`;
        }
    }
}
;