String.prototype.mapReplace = function (map) {
    var regex = [];
    for (var key in map)
        regex.push(key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
    return this.replace(new RegExp(regex.join("|"), "g"), function (word) {
        return map[word];
    });
};

const seasonMap = {
    "Fall": "Sonbahar",
    "Winter": "Kış",
    "Spring": "İlkbahar",
    "Summer": "Yaz",
}

module.exports = function (season) {
    return season.mapReplace(seasonMap);
}