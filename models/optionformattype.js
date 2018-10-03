"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("optionformattype", {
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
        tableName: 'option_format_type'
    });
    return Model;
};
