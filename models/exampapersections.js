"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("exampapersection", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        languageId: {
            type: DataTypes.INTEGER
        },
        examPaperId: {
            type: DataTypes.INTEGER
        },
        section_title: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
    },{
        tableName: 'exam_paper_sections',
        timestamps: false
    });
    return Model;
};
