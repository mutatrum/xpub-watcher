const config = require('./config.json');
const XpubWatcher = require('./src/xpub-watcher.js');
new XpubWatcher(config).run();
