const { MessageEmbed } = require("discord.js");
const { default: slugify } = require('slugify');
const moment = require("moment")
const season_langMap = require('../helpers/season_lang.map');

moment.locale("tr")

module.exports = function ({ data, episodeData, groupData, interaction }) {
    return new MessageEmbed()
        .setColor("#8A00C0")
        .setTitle(`${data.name} - ${episodeData.number}. Bölüm`)
        .setURL(`https://deschtimes.com/groups/${slugify(groupData.data.name)}/shows/${data.id}/episodes/${episodeData.id}`)
        .setThumbnail(data.poster)
        .setFooter(interaction.client.user.username, `https://cdn.discordapp.com/avatars/${process.env.BOT_CLIENT_ID}/${interaction.client.user.avatar}.webp`)
        .setTimestamp()
        .addFields(
            { name: `Durum - ${episodeData.released ? "Yayınlandı" : "Yayınlanmadı"}`, value: episodeData.staff.map(staff => staff.finished ? `~~${staff.position.acronym}~~` : `**${staff.position.acronym}**`).join(" ") },
            { name: "Son Güncelleme", value: moment(episodeData.updated_at).fromNow().toString() },
            { name: "Sezon", value: season_langMap(episodeData.season), inline: true },
            { name: "Yayın Tarihi", value: moment(episodeData.air_date).fromNow().toString(), inline: true },
            { name: "Emektarlar", value: episodeData.staff.map(staff => `${staff.position.acronym}: ${staff.member.name}`).join("\n"), inline: true }
        )
}