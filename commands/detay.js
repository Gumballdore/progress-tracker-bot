const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { ApiKeys } = require('../db');
const axios = require("axios");
const moment = require("moment")
const slugify = require('slugify')
const season_langMap = require('../helpers/season_lang.map');

moment.locale("tr")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('detay')
        .setDescription('DESCHTIMES\'daki grubunuz ya da serileriniz hakkında detay alın.')
        .addStringOption(option => option.setName("show_name").setDescription("Detaylarını görmek istediğiniz seri adını girin."))
        .addStringOption(option => option.setName("episode_number").setDescription("Detaylarını görmek istediğiniz bölüm numarasını girin.")),
    async execute(interaction) {
        const showName = interaction.options.getString("show_name")
        const episodeNumber = interaction.options.getString("episode_number")

        await interaction.reply({ content: 'https://i.imgur.com/T9qCrmB.gif' });

        const group = await ApiKeys.findOne({
            where: {
                discordGuildId: interaction.guild.id
            }
        })

        if (!group) {
            return await interaction.editReply({ content: `Discord sunucunuzla eşleşmiş bir API key bulunamadı. Lütfen /set komutuyla eşleştirme yapın.`, ephemeral: true });
        }

        if (!showName && episodeNumber) {
            return await interaction.editReply({ content: `Bölüm detaylarına bakmak için seri ismini girmeniz gerekiyor.`, ephemeral: true });
        }

        if (!showName) {
            const groupData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}.json`)

            const { data } = groupData

            const groupEmbed = new MessageEmbed()
                .setColor("#8A00C0")
                .setTitle(data.name)
                .setURL(`https://deschtimes.com/groups/${slugify(data.name)}`)
                .setThumbnail(data.icon)
                .setFooter(interaction.client.user.username, `https://cdn.discordapp.com/avatars/${process.env.BOT_CLIENT_ID}/${interaction.client.user.avatar}.webp`)
                .setTimestamp()
                .addFields(
                    { name: "Seri Sayısı", value: String(data.shows.length) }
                )

            return await interaction.editReply({
                content: "-", ephemeral: true, embeds: [groupEmbed]
            });
        } else if (showName && !episodeNumber) {
            const groupData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}.json`)
            const showData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}/shows/${showName}.json`)

            const { data } = showData

            const groupEmbed = new MessageEmbed()
                .setColor("#8A00C0")
                .setTitle(data.name)
                .setURL(`https://deschtimes.com/groups/${slugify(groupData.data.name)}/shows/${data.id}`)
                .setThumbnail(data.poster)
                .setFooter(interaction.client.user.username, `https://cdn.discordapp.com/avatars/${process.env.BOT_CLIENT_ID}/${interaction.client.user.avatar}.webp`)
                .setTimestamp()
                .addFields(
                    { name: "Ortak Grup", value: data.joint_groups.length ? data.joint_groups.length.map(group => group) : "Bulunamadı.", inline: true },
                    { name: "Durum", value: data.status ? data.status : "Bulunamadı.", inline: true },
                    { name: "Bölüm Sayısı", value: String(data.episodes.length), inline: true }
                )

            return await interaction.editReply({
                content: "-", ephemeral: true, embeds: [groupEmbed]
            });
        } else {
            const groupData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}.json`)
            const showData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}/shows/${showName}.json`)

            const { data } = showData
            for (let episode in data.episodes) {
                if (data.episodes[episode].number == episodeNumber) {
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

                    return await interaction.reply({
                        content: "-", ephemeral: true, embeds: [groupEmbed]
                    });
                }
            }
            return await interaction.editReply({ content: `Aradığınız bölüm detaylarına ulaşılamadı.`, ephemeral: true });

        }
    },
};