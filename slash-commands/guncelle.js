const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { ApiKeys } = require('../db');
const axios = require("axios");
const moment = require("moment")
const season_langMap = require('../helpers/season_lang.map');
const logger = require('../helpers/logger');
const { default: slugify } = require('slugify');

moment.locale("tr")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guncelle')
        .setDescription('DESCHTIMES\'daki bölümlerini güncelleyin.')
        .addStringOption(option => option.setName("show_name").setDescription("Detaylarını görmek istediğiniz seri adını girin.").setRequired(true))
        .addStringOption(option => option.setName("position").setDescription("Pozisyon bilgisini girin.")),
    async execute(interaction) {
        if (!interaction.member.roles.cache.some(role => role.name === "Desch"))
            return await interaction.reply({ content: `Bu komutu kullanma yetkiniz yok!`, ephemeral: true });

        let groupData, showData

        const showName = interaction.options.getString("show_name")
        const position = interaction.options.getString("position")

        await interaction.reply({ content: 'https://i.imgur.com/T9qCrmB.gif', ephemeral: true });

        const group = await ApiKeys.findOne({
            where: {
                discordGuildId: interaction.guild.id
            }
        })

        if (!group) {
            return await interaction.editReply({ content: `Discord sunucunuzla eşleşmiş bir API key bulunamadı. Lütfen /set komutuyla eşleştirme yapın.`, ephemeral: true });
        }

        if (!showName) {
            return await interaction.editReply({ content: `Seri güncellemek için seri ismi girmeniz gerekiyor.`, ephemeral: true });
        }

        try {
            groupData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}.json`)
        } catch (err) {
            logger.error({
                message: err.toString()
            })
            return await interaction.editReply({ content: `Grup bilgilerini alırken bir sorunla karşılaştık.`, ephemeral: true });
        }

        // If user didn't specified position, update episode status -> released: true or false
        if (!position) {
            try {
                showData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}/shows/${showName}.json`)
            } catch (err) {
                logger.error({
                    message: err.toString()
                })
                return await interaction.editReply({ content: `Seri bilgilerini alırken bir sorunla karşılaştık. Seri ismini yanlış girmiş olabilirsiniz.`, ephemeral: true });
            }

            const fEpisode = showData.data.episodes.find(show => !show.released)
            if (!fEpisode.id)
                return await interaction.editReply({ content: `İstediğiniz bölüm bulunamadı.`, ephemeral: true });

            const body = {
                member: interaction.user.id
            }

            try {
                await axios.patch(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}/shows/${showName}/episodes.json`, body)
            } catch (err) {
                logger.error({
                    message: err.toString()
                })
                return await interaction.editReply({ content: err?.response?.data?.message || `Seriyi güncellerken bir hatayla karşılaştık.`, ephemeral: true });
            }

            try {
                showData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}/shows/${showName}.json`)
            } catch (err) {
                logger.error({
                    message: err.toString()
                })
                return await interaction.editReply({ content: `Seri bilgilerini alırken bir sorunla karşılaştık. Seri ismini yanlış girmiş olabilirsiniz.`, ephemeral: true });
            }

            const { data } = showData
            for (let episode in data.episodes) {
                if (data.episodes[episode].number == fEpisode.number) {
                    const episodeData = data.episodes[episode]

                    const groupEmbed = new MessageEmbed()
                        .setColor("#8A00C0")
                        .setTitle(`${data.name} - ${episodeData.number}. Bölüm`)
                        .setURL(`https://deschtimes.com/groups/${slugify(groupData.data.name)}/shows/${data.id}/episodes/${episodeData.id}`)
                        .setThumbnail(data.poster)
                        .setFooter(interaction.client.user.username, `https://cdn.discordapp.com/avatars/${process.env.BOT_CLIENT_ID}/${interaction.client.user.avatar}.webp`)
                        .setTimestamp()
                        .addFields(
                            { name: `Durum - ${episodeData.released ? "Yayınlandı" : "Yayınlanmadı"}`, value: episodeData.staff.map(staff => staff.finished ? `~~**${staff.position.acronym}**~~` : `**${staff.position.acronym}**`).join(" ") },
                            { name: "Sezon", value: season_langMap(episodeData.season), inline: true },
                            { name: "Yayın Tarihi", value: moment(episodeData.air_date).fromNow().toString(), inline: true },
                            { name: "Emektarlar", value: episodeData.staff.map(staff => `${staff.position.acronym}: ${staff.member.name}`).join("\n"), inline: true }
                        )

                    return await interaction.editReply({
                        content: "-", ephemeral: true, embeds: [groupEmbed]
                    });
                }
            }

            return await interaction.editReply({ content: err?.response?.data?.message || `Seriyi güncellerken bir hatayla karşılaştık.`, ephemeral: true });
        }
        // If user did specified position, update the finished for that position
        else {
            try {
                showData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}/shows/${showName}.json`)
            } catch (err) {
                logger.error({
                    message: err.toString()
                })
                return await interaction.editReply({ content: `Seri bilgilerini alırken bir sorunla karşılaştık. Seri ismini yanlış girmiş olabilirsiniz.`, ephemeral: true });
            }

            const fEpisode = showData.data.episodes.find(show => !show.released)
            if (!fEpisode.id)
                return await interaction.editReply({ content: `İstediğiniz bölüm bulunamadı.`, ephemeral: true });

            const staff = fEpisode.staff.find(staff => staff.position.acronym == position)
            if (!staff)
                return await interaction.editReply({ content: `İstediğiniz pozisyon bulunamadı.`, ephemeral: true });

            const body = {
                member: interaction.user.id,
                position,
                finished: !staff.finished
            }

            await axios.patch(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}/shows/${showName}/staff.json`, body).catch(
                async err => {
                    logger.error({
                        message: err.toString()
                    })
                    return await interaction.editReply({ content: err?.response?.data?.message || `Seriyi güncellerken bir hatayla karşılaştık.`, ephemeral: true });
                }
            )

            try {
                showData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}/shows/${showName}.json`)
            } catch (err) {
                logger.error({
                    message: err.toString()
                })
                return await interaction.editReply({ content: `Seri bilgilerini alırken bir sorunla karşılaştık. Seri ismini yanlış girmiş olabilirsiniz.`, ephemeral: true });
            }

            const { data } = showData
            for (let episode in data.episodes) {
                if (data.episodes[episode].number == fEpisode.number) {
                    const episodeData = data.episodes[episode]

                    const groupEmbed = new MessageEmbed()
                        .setColor("#8A00C0")
                        .setTitle(`${data.name} - ${episodeData.number}. Bölüm`)
                        .setURL(`https://deschtimes.com/groups/${slugify(groupData.data.name)}/shows/${data.id}/episodes/${episodeData.id}`)
                        .setThumbnail(data.poster)
                        .setFooter(interaction.client.user.username, `https://cdn.discordapp.com/avatars/${process.env.BOT_CLIENT_ID}/${interaction.client.user.avatar}.webp`)
                        .setTimestamp()
                        .addFields(
                            { name: `Durum - ${episodeData.released ? "Yayınlandı" : "Yayınlanmadı"}`, value: episodeData.staff.map(staff => staff.finished ? `~~**${staff.position.acronym}**~~` : `**${staff.position.acronym}**`).join(" ") },
                            { name: "Sezon", value: season_langMap(episodeData.season), inline: true },
                            { name: "Yayın Tarihi", value: moment(episodeData.air_date).fromNow().toString(), inline: true },
                            { name: "Emektarlar", value: episodeData.staff.map(staff => `${staff.position.acronym}: ${staff.member.name}`).join("\n"), inline: true }
                        )

                    return await interaction.editReply({
                        content: "-", ephemeral: true, embeds: [groupEmbed]
                    });
                }
            }
        }
    },
};