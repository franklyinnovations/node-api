"use strict";
module.exports = function (sequelize, DataTypes) {
    var Model = sequelize.define("ptm", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        info: {
            type: DataTypes.STRING
            ,validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        start_date: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        start_time: {
            type: DataTypes.STRING
            ,validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        end_time: {
            type: DataTypes.STRING
            ,validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        break: {
            type: DataTypes.STRING
            ,validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        masterId: {
            type: DataTypes.STRING
            ,validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        userId: {
            type: DataTypes.STRING
            ,validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        academicSessionId: {
            type: DataTypes.STRING
            ,validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        last_registration_date: {
            type: DataTypes.STRING
            ,validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        per_teacher_time: {
            type: DataTypes.STRING
            ,validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        }
    }, {
        tableName: 'ptm'
    });
    return Model;
};
