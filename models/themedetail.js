"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("themedetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    themeId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    }
  },{
    tableName: 'theme_details',
    timestamps: false,
  });
  return Model;
};

