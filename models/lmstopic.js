"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("lmstopic", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER,
    },
    lmschapterId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'lms_topics'
  });
  return Model;
};

