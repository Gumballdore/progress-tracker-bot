const { SlashCommandBuilder } = require('@discordjs/builders');
const { ApiKeys } = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set')
        .setDescription('Discord kanalınızla Deschtimes API keyinizi eşleştirin.')
        .addStringOption(option => option.setName("deschtimes_api_key").setDescription("API keyinizi girin.").setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.roles.cache.some(role => role.name === "Desch"))
            return await interaction.reply({ content: `Bu komutu kullanma yetkiniz yok!`, ephemeral: true });

        const deschtimesApiKey = interaction.options.getString("deschtimes_api_key")

        await interaction.reply({ content: 'https://i.imgur.com/T9qCrmB.gif', ephemeral: true });

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
            return await interaction.editReply({ content: `${interaction.guild.name} için API key eşleştirilmesi yapıldı.`, ephemeral: true });
        }

        if (result.deschtimesApiKey !== deschtimesApiKey)
            await ApiKeys.update({
                deschtimesApiKey
            }, {
                where: {
                    "discordGuildId": interaction.guild.id
                }
            })

        return await interaction.editReply({ content: `${interaction.guild.name} için API key eşleştirilmesi yapıldı.`, ephemeral: true });
    },
};