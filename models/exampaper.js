"use strict";
const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("exampaper", {
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
        academicSessionId: {
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
        userId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        max_marks: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                },
                is: {
                  args: /^\d+$/,
                  msg: 'Enter only numeric value'
                },
                len: {
                  args: [1, 4],
                  msg: 'Length can not be more than 4.',
                },
            }
        },
        classId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        subjectId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        total_questions: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                },
                is: {
                  args: /^\d+$/,
                  msg: 'Enter only numeric value'
                },
                len: {
                  args: [1, 3],
                  msg: 'Length can not be more than 3.',
                },
            }
        },
        published_date: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        duration: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                },
                is: {
                  args: /^\d+$/,
                  msg: 'Enter only numeric value'
                },
                len: {
                  args: [1, 4],
                  msg: 'Length can not be more than 4.',
                },
            }
        },
        exam_paper_image: {
            type: DataTypes.STRING,
        },
        is_active: {
            type: DataTypes.INTEGER
        },
        is_published: {
            type: DataTypes.INTEGER  
        }
    },{
        tableName: 'exam_papers',
        hooks: {
            beforeUpdate: [makeOptimizerHook('exam_paper_image', true)],
            beforeCreate: [makeOptimizerHook('exam_paper_image', true)]
        }
    });
    return Model;
};
