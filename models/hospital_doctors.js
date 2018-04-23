"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("hospital_doctors", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    doctorProfileId	: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    hospitalId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    consultation_charge : {
      type: DataTypes.DECIMAL,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    appointment_duration	: {
      type: DataTypes.DECIMAL,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    available_on_req	: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    }
  },{
    engine: 'InnoDB',
    tableName: 'hospital_doctors',
  });
  return Model;
};
