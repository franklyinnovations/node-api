"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("state", {
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
    code: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        len: {
          args: [1, 20],
          msg: 'Length can not be more than 20.',
        },
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
    tableName: 'states'
  });
  return Model;
};

