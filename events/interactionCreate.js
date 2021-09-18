module.exports = {
    name: 'interactionCreate',
    execute(interaction) {
        logger.info({
            message: `${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`
        })
    },
};