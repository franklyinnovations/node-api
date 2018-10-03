"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("section", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    display_order: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        len: {
          args: [1, 4],
          msg: 'DisplayOrderLength',
        },
        isInt:{
          min: 1,
          msg:'isInt'
        },
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'sections'
  });
  return Model;
};
