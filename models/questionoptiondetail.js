"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("questionoptiondetail", {
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
        questionOptionId: {
            type: DataTypes.INTEGER
        },
        option_title: {
            type: DataTypes.STRING
        },
        option_image: {
            type: DataTypes.STRING
        },
    },{
        tableName: 'question_option_details'
    });
    return Model;
};
