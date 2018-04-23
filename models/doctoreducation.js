module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('doctoreducation', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        doctorProfileId: {
            type: DataTypes.INTEGER,
        },
        tagtypeId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        year_of_passing: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        college_name: {
            type: DataTypes.VIRTUAL,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        edu_proof: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        edu_proof_file_name: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }  
        }
    }, {
        tableName: 'doctor_educations'
    });
    return Model;
};