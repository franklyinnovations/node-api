"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("questionformattype", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        masterId: {
            type: DataTypes.INTEGER
        },
        languageId: {
            type: DataTypes.INTEGER
        },
    },{
        tableName: 'question_format_type'
    });
    return Model;
};
