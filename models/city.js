"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("city", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    countryId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    stateId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    alias: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        len: {
          args: [1, 20],
          msg: 'Length can not be more than 20.',
        },
        isUnique: sequelize.validateIsUnique('alias', 'isUnique')
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'cities'
  });
  return Model;
};

