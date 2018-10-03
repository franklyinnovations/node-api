"use strict";
module.exports = function (sequelize, DataTypes) {
    var Model = sequelize.define("ptm_invitations", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER
        },
        ptm_id: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'ptm_invitations'
    });
    return Model;
};
