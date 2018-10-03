"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("lmsstudymaterial", {
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
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
      }
    },
    lmschapterId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
      }
    },
    lmstopicId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
      }
    },
  },{
    tableName: 'lms_study_materials'
  });
  return Model;
};

