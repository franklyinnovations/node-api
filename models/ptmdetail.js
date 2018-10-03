"use strict";
module.exports = function (sequelize, DataTypes) {
    var Model = sequelize.define("ptm_details", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        class_id: {
            type: DataTypes.INTEGER
        },
        teacher_id: {
            type: DataTypes.STRING
        },
        ptm_id: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'ptm_details'
    });
    return Model;
};
