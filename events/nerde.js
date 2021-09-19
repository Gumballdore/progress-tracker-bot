const { MessageEmbed } = require('discord.js');
const { ApiKeys } = require('../db');
const axios = require("axios");
const moment = require("moment")
const season_langMap = require('../helpers/season_lang.map');
const { default: slugify } = require('slugify');

module.exports = {
    name: 'messageCreate',
    async execute(interaction) {
        let messageArr = interaction.content.split(" ")
        if (messageArr[messageArr.length - 1] === "nerde" || messageArr[messageArr.length - 1] === "nerede") {
            messageArr.pop()

            const showName = messageArr.join(" ")

            let groupData, showData

            const msg = await interaction.channel.send({ content: 'https://i.imgur.com/T9qCrmB.gif' });

            const group = await ApiKeys.findOne({
                where: {
                    discordGuildId: interaction.guild.id
                }
            })

            if (!group) {
                return await msg.edit({ content: `Discord sunucunuzla eşleşmiş bir API key bulunamadı. Lütfen /set komutuyla eşleştirme yapın.`, ephemeral: true });
            }

            if (!showName) {
                return await msg.edit({ content: `Bölüm detaylarına bakmak için seri ismini girmeniz gerekiyor.`, ephemeral: true });
            }

            try {
                groupData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}.json`)
                showData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}/shows/${showName}.json`)
            } catch (err) {
                return await msg.edit({ content: err?.response?.data?.message || `Bilgileri alırken bir sorunla karşılaştık.`, ephemeral: true });
            }

            const fEpisode = showData.data.episodes.find(show => !show.released)
            if (!fEpisode.id)
                return await msg.edit({ content: `İstediğiniz bölüm bulunamadı.`, ephemeral: true });

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
                            { name: `Durum - ${episodeData.released ? "Yayınlandı" : "Yayınlanmadı"}`, value: episodeData.staff.map(staff => staff.finished ? `~~${staff.position.acronym}~~` : `**${staff.position.acronym}**`).join(" ") },
                            { name: "Sezon", value: season_langMap(episodeData.season), inline: true },
                            { name: "Yayın Tarihi", value: moment(episodeData.air_date).fromNow().toString(), inline: true },
                            { name: "Emektarlar", value: episodeData.staff.map(staff => `${staff.position.acronym}: ${staff.member.name}`).join("\n"), inline: true }
                        )

                    return await msg.edit({
                        content: "-", embeds: [groupEmbed]
                    });
                }
            }
            return await msg.edit({ content: `Aradığınız bölüm detaylarına ulaşılamadı.` });
        }
    },
};