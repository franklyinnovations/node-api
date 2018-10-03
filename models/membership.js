"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("membership", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    price: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isDecimal:{
          msg:'isNumeric'
        },
        isInt:{
          min:0,
          msg:'isInt'
        }
      }
    },
    mode: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    allowed_users: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isInt:{
          min:0,
          msg:'isInt'
        }
      }
    },
    start_date: {
      type: DataTypes.DATE,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'memberships'
  });
  return Model;
};

