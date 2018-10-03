"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("exambulkattendancedetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    exambulkattendanceId: {
      type: DataTypes.INTEGER
    },
    studentId: {
      type: DataTypes.INTEGER
    },
    present_days: {
      type: DataTypes.STRING
    },
  },{
    tableName: 'exam_bulk_attendance_details',
    timestamps: false,
  });
  return Model;
};

