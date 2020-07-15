class Logger {
    log(...args) {
        const timestamp = new Date().toISOString();
        args[0] = `[${timestamp}] ${args[0]}`;
        console.log(...args);
    }
}

module.exports = (function() {
    return new Logger(); 
}());