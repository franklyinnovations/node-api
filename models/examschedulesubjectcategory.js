"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("examschedulesubjectcategory", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    examScheduleDetailId: {
      type: DataTypes.INTEGER
    },
    examScheduleId: {
      type: DataTypes.INTEGER
    },
    subjectCategoryId: {
      type: DataTypes.INTEGER
    },
    max_marks: {
      type: DataTypes.INTEGER
    }
  },{
    tableName: 'exam_schedule_subject_categories',
    timestamps: false,
  });
  return Model;
};

