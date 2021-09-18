const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../helpers/logger');

const filebasename = path.basename(__filename);
const db = {};

const config = {
    host: 'localhost',
    dialect: 'sqlite',
    logging: function (msg) {
        logger.debug(msg)
    },
    // SQLite only
    storage: './db/database.sqlite'
}

const sequelize = new Sequelize(config);

fs
    .readdirSync(__dirname + "/models")
    .filter((file) => {
        const returnFile = (file.indexOf('.') !== 0)
            && (file !== filebasename)
            && (file.slice(-3) === '.js');
        return returnFile;
    })
    .forEach((file) => {
        const model = require(path.join(__dirname, "/models", file))(sequelize, DataTypes)
        db[model.name] = model;
    });


Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

const sequelizeOptions = { logging: console.log, };

// Removes all tables and recreates them (only available if env is not in production)
// if (process.env.ENV !== 'production') {
//     sequelizeOptions.force = true;
// }

sequelize.sync(sequelizeOptions)
    .catch((err) => {
        console.log(err);
        process.exit();
    });

module.exports = db;