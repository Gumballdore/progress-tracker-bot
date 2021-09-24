const { SlashCommandBuilder, codeBlock } = require('@discordjs/builders');
const { ApiKeys } = require('../db');
const axios = require("axios");
const nerdeEmbed = require('../embeds/nerde_embed');
const seriesListing = require('../helpers/seriesListing');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seri-listesi')
        .setDescription('Çevirdiğimiz serilerin listesine bakın.'),
    async execute(interaction) {
        let groupData

        await interaction.reply({ content: 'https://i.imgur.com/T9qCrmB.gif', ephemeral: true });

        const group = await ApiKeys.findOne({
            where: {
                discordGuildId: interaction.guild.id
            }
        })

        try {
            groupData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}.json`)
            seriesListing({ pagination: 0, interaction, shows: groupData.data.shows })
        } catch (err) {
            return await interaction.editReply({ content: `Bilgileri alırken bir sorunla karşılaştık.`, ephemeral: true });
        }
    },
};