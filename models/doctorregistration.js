module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('doctorregistration', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        doctorProfileId: {
            type: DataTypes.INTEGER,
        },
        council_registration_number: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        year_of_registration: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        council_name: {
            type: DataTypes.VIRTUAL,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        reg_proof: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        reg_proof_file_name: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        }
    }, {
        tableName: 'doctor_registrations'
    });
    return Model;
};