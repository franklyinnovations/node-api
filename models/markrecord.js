"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("markrecord", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    markId: {
      type: DataTypes.INTEGER
    },
    studentId: {
      type: DataTypes.INTEGER
    },
    obtained_mark: {
      type: DataTypes.DECIMAL
    },
    subjectcategory_marks: {
      type: DataTypes.TEXT
    },
    tags: {
      type: DataTypes.TEXT
    }
  },{
    tableName: 'mark_records',
    timestamps: false,
  });
  return Model;
};
