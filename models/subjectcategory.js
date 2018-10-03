"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("subjectcategory", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    subjectId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'subject_categories'
  });
  return Model;
};

