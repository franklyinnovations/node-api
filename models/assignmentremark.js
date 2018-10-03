"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("assignmentremark", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assignmentId: {
      type: DataTypes.INTEGER
    },
    studentId: {
      type: DataTypes.INTEGER
    },
    tags: {
      type: DataTypes.TEXT
    }
  },{
    tableName: 'assignment_remarks',
    timestamps: false,
  });
  return Model;
};

