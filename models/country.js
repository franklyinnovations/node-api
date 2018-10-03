"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("country", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    currencyId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    code: {
      type: DataTypes.STRING(2),
      allowNull: true,
      isUnique: true,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        len: {
          args: [1, 20],
          msg: 'Length can not be more than 20.',
        },
        isUnique: sequelize.validateIsUnique('code', 'isUnique')
      }
    },
    iso_code: {
      type: DataTypes.STRING(2),
      allowNull: true,
      isUnique: true,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isUnique: sequelize.validateIsUnique('iso_code', 'isUnique')
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'countries'
  });
  return Model;
};

