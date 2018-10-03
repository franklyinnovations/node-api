"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("bcsmap", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    boardId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      },
      unique: 'bcsmap_unique'
    },
    classId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
      },
      unique: 'bcsmap_unique'
    },
    sectionId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      },
      unique: 'bcsmap_unique'
    },
    gradeId: {
      type: DataTypes.INTEGER
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'bcs_maps'
  });
  return Model;
};

