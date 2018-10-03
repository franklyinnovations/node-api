"use strict";

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("mappingexampaperquestion", {
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
        examPaperId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        questionId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        examPaperSectionId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        question_mark: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        is_negative_marking_allowed: {
            type: DataTypes.INTEGER
        },
        negative_marking_marks: {
            type: DataTypes.INTEGER,
            validate: {
                checkNum:function(value, next){
                    if(!(/^\d+$/.test(value)) && value !== ''){
                        next('Enter only numeric value');
                    } else {
                        next();
                    }
                },
                notEmp:function(value, next){
                    if(this.is_negative_marking_allowed === 1 && value == ''){
                        next('isRequired');
                    } else {
                        next();
                    }
                },
                isGreaterThanMark:function(value, next){
                    if(value != '' && parseInt(value) > parseInt(this.question_mark)){
                        next('Should be less than or equal to the question mark');
                    } else {
                        next();
                    }
                },
            }
        }
    },{
        tableName: 'mapping_exam_paper_questions'
    });
    return Model;
};
