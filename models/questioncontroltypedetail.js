"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("questioncontroltypedetail", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        questionControlTypeId: {
            type: DataTypes.INTEGER  
        },
        languageId: {
            type: DataTypes.INTEGER
        },
        control_title: {
            type: DataTypes.STRING
        },
        control_name: {
            type: DataTypes.STRING
        },
        control_slug: {
            type: DataTypes.STRING
        },
    },{
        tableName: 'question_control_type_details',
        timestamps: false
    });
    return Model;
};
