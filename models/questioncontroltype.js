"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("questioncontroltype", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        languageId: {
            type: DataTypes.INTEGER
        },
    },{
        tableName: 'question_control_type'
    });
    return Model;
};
