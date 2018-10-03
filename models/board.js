"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("board", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    tableName: 'boards'
  });
  return Model;
};
