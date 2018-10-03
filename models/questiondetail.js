"use strict";

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("questiondetail", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        masterId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        languageId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        questionId: {
            type: DataTypes.INTEGER
        },
        question_title: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        tags_for_search: {
            type: DataTypes.STRING,
            validate: {
                len: function(value, next){
                  if (value !== '' && value.length > 200) {
                    next('Length can not be more than 200.');
                  } else {
                    next();
                  }
                }
            }
            // validate: {
            //     notEmpty: {
            //         msg:'isRequired'
            //     }
            // }
        },
        comments: {
            type: DataTypes.TEXT,
            // validate: {
            //     notEmpty: {
            //         msg:'isRequired'
            //     }
            // }
        }
    },{
        tableName: 'question_details'
    });
    return Model;
};
