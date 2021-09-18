const logger = require("../helpers/logger");

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        logger.info({
            message: `Ready! Logged in as ${client.user.tag}`
        })
    },
};