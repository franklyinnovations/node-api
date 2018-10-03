"use strict";

module.exports =  function(sequelize, DataTypes){
  var Model = sequelize.define("complaintrecord", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    complaintId: {
      type: DataTypes.INTEGER,
    },
    studentId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
  },{
    tableName: 'complaint_records',
    timestamps: false,
  });
  return Model;
};
