"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("lmschapter", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER,
    },
    bcsmapId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    subjectId: {
      type: DataTypes.STRING,
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
    tableName: 'lms_chapters'
  });
  return Model;
};

