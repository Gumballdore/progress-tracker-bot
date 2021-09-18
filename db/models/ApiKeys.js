module.exports = (sequelize, DataTypes) => {
    const ApiKeys = sequelize.define("ApiKeys", {
        deschtimesApiKey: {
            type: DataTypes.STRING,
            required: true,
            unique: true,
            allowNull: false
        },
        discordGuildId: {
            type: DataTypes.STRING,
            required: true,
            unique: true,
            allowNull: false
        }
    })
    return ApiKeys;
}