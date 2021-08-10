"use strict";

const config = require('./config.json');
const logger = require('./src/logger');
const Main = require('./src/main.js');

new Main(config).run().catch(exception => logger.log(`Code ${exception.code}: ${exception.message}`));
