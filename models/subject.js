"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("subject", {
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
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'subjects'
  });
  return Model;
};

