"use strict";

const makeOptimizerHookForQuestionOptionImage = require('../controllers/image').makeOptimizerHookForQuestionOptionImage;

module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("questionoption", {
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
        questionId: {
            type: DataTypes.INTEGER
        },
        option_title: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        option_image: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        is_answered_marked: {
            type: DataTypes.INTEGER
        }
    },{
        tableName: 'question_options',
        hooks: {
            //beforeCreate: [makeOptimizerHookForQuestionOptionImage('option_image', true)]
        }
    });
    return Model;
};
