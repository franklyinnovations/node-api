"use strict";
module.exports = function (sequelize, DataTypes) {
    var Model = sequelize.define("ptm_schedules", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER
        },
        teacher_id: {
            type: DataTypes.STRING
        },
        ptm_id: {
            type: DataTypes.STRING
        },
        start_time: {
            type: DataTypes.STRING
        },
        end_time: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'ptm_schedules'
    });
    return Model;
};
