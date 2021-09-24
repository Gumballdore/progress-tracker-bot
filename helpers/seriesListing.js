const { codeBlock } = require("@discordjs/builders");
const progress_langMap = require("./progress_lang.map");

async function seriesListing({ interaction, pagination, shows }) {
    if (!shows || !shows.length) {
        await interaction.editReply({ content: "Grubun herhangi bir serisi yok." })
    }

    let showListString = ""

    let showPage = shows.splice(0, pagination + 1 * 10)

    showPage.forEach(show => {
        showListString += `${show.name}\n${show.episodes.length} Bölüm - ${progress_langMap[show.progress]}\n\n`
    })

    const message = await interaction.editReply({ content: codeBlock(showListString) })
    if (pagination - 1 >= 0) {
        await message.react("◀️")
    }
    if (shows.length) {
        await message.react("▶️")
    }


    const filter = (reaction, user) => {
        return ['◀️', '▶️'].includes(reaction.emoji.name) && user.id === interaction.user.id;
    };

    await message.awaitReactions({ filter, max: 1, time: 3000, errors: ["time"] }).then(collected => {
        const reaction = collected.first();

        if (reaction.emoji.name === '▶️') {
            seriesListing({ interaction, pagination: pagination + 1, shows })
            message.reactions.removeAll()
        } else if (reaction.emoji.name === '◀️' && pagination > 0) {
            seriesListing({ interaction, pagination: pagination - 1, shows })
            message.reactions.removeAll()
        }
    }).catch(_ => _)
}

module.exports = seriesListing