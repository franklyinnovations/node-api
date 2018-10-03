"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("teachersubject", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    teacherId: {
      type: DataTypes.INTEGER
    },
    subjectId: {
      type: DataTypes.INTEGER
    }
  },{
    tableName: 'teacher_subjects',
    timestamps: false,
  });
  return Model;
};

