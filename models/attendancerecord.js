"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("attendancerecord", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    attendanceId: {
      type: DataTypes.INTEGER
    },
    studentId: {
      type: DataTypes.INTEGER
    },
    subjectId: {
      type: DataTypes.INTEGER
    },
    is_present: {
      type: DataTypes.INTEGER
    },
    tags: {
      type: DataTypes.TEXT
    }
  },{
    tableName: 'attendance_records',
    timestamps: false,
  });
  return Model;
};

