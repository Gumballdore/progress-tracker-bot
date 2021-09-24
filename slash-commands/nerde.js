const { SlashCommandBuilder } = require('@discordjs/builders');
const { ApiKeys } = require('../db');
const axios = require("axios");
const nerdeEmbed = require('../embeds/nerde_embed')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nerde')
        .setDescription('Bir bölüm hakkında bilgi alın.')
        .addStringOption(option => option.setName("show_name").setDescription("Detaylarını görmek istediğiniz seri adını girin.").setRequired(true)),
    async execute(interaction) {
        const showName = interaction.options.getString("show_name")

        let groupData, showData

        await interaction.reply({ content: 'https://i.imgur.com/T9qCrmB.gif' });

        const group = await ApiKeys.findOne({
            where: {
                discordGuildId: interaction.guild.id
            }
        })

        if (!group) {
            return await interaction.editReply({ content: `Discord sunucunuzla eşleşmiş bir API key bulunamadı. Lütfen /set komutuyla eşleştirme yapın.`, ephemeral: true });
        }

        if (!showName) {
            return await interaction.editReply({ content: `Bölüm detaylarına bakmak için seri ismini girmeniz gerekiyor.`, ephemeral: true });
        }

        try {
            groupData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}.json`)
            showData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}/shows/${showName}.json`)
        } catch (err) {
            return await interaction.editReply({ content: `Bilgileri alırken bir sorunla karşılaştık.`, ephemeral: true });
        }

        let fEpisode = showData.data.episodes.find(show => !show.released)
        if (!fEpisode?.id && !showData.data.episodes[showData.data.episodes.length - 1].released) {
            return await interaction.editReply({ content: `İstediğiniz bölüm bulunamadı.`, ephemeral: true });
        } else if (!fEpisode?.id) {
            fEpisode = showData.data.episodes[showData.data.episodes.length - 1]
        }

        const { data } = showData
        for (let episode in data.episodes) {
            if (data.episodes[episode].number == fEpisode.number) {
                const episodeData = data.episodes[episode]

                const groupEmbed = nerdeEmbed({ data, episodeData, groupData, interaction })

                return await interaction.editReply({
                    content: "-", embeds: [groupEmbed]
                });
            }
        }
        return await interaction.editReply({ content: `Aradığınız bölüm detaylarına ulaşılamadı.` });
    },
};