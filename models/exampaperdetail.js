"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("exampaperdetail", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        languageId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        masterId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        examPaperId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        paper_title: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        tags_for_search: {
            type: DataTypes.STRING
        },
        comments: {
            type: DataTypes.STRING
        }
    },{
        tableName: 'exam_paper_details',
        timestamps: false
    });
    return Model;
};
