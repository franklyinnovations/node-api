"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("lmsstudymaterialdetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    lmsstudymaterialId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    content: {
      type: DataTypes.STRING,
    },
  },{
    tableName: 'lms_study_material_details',
    timestamps: false,
  });
  return Model;
};

