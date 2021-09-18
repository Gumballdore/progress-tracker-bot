const { SlashCommandBuilder } = require('@discordjs/builders');
const { ApiKeys } = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set')
        .setDescription('Discord kanalınızla DESCHTIMES API keyinizi eşleştirin.')
        .addStringOption(option => option.setName("deschtimes_api_key").setDescription("API keyinizi girin.").setRequired(true)),
    async execute(interaction) {
        const deschtimesApiKey = interaction.options.getString("deschtimes_api_key")

        const result = await ApiKeys.findOne({
            where: {
                "discordGuildId": interaction.guild.id
            }
        })

        if (!result) {
            await ApiKeys.create({
                deschtimesApiKey,
                "discordGuildId": interaction.guild.id
            })
            return await interaction.reply({ content: `${interaction.guild.name} için API key eşleştirilmesi yapıldı.`, ephemeral: true });
        }

        if (result.deschtimesApiKey !== deschtimesApiKey)
            await ApiKeys.update({
                deschtimesApiKey
            }, {
                where: {
                    "discordGuildId": interaction.guild.id
                }
            })

        return await interaction.reply({ content: `${interaction.guild.name} için API key eşleştirilmesi yapıldı.`, ephemeral: true });
    },
};