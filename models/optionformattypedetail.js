"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("optionformattypedetail", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        masterId: {
            type: DataTypes.INTEGER
        },
        optionFormatTypeId: {
            type: DataTypes.INTEGER  
        },
        languageId: {
            type: DataTypes.INTEGER
        },
        control_title: {
            type: DataTypes.INTEGER
        },
        control_name: {
            type: DataTypes.INTEGER
        },
        control_slug: {
            type: DataTypes.INTEGER
        },
    },{
        tableName: 'option_format_type_details',
        timestamps: false
    });
    return Model;
};
