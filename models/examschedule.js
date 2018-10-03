"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("examschedule", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    examheadId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    academicSessionId:{
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    boardId: {
      type: DataTypes.INTEGER
    },
    classId: {
      type: DataTypes.INTEGER
    },
    cIds:{
      type: DataTypes.VIRTUAL,
      validate: {
        validFun: function(value, next){
          if (this.classId === '' && this.boardId === '') {
            next('isRequired');
          } else {
            next();
          }
        }
      }
    },
    bcsmapId: {
      type: DataTypes.VIRTUAL
    },
    is_active: {
      type: DataTypes.STRING
    },
    has_activity: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'exam_schedules'
  });
  return Model;
};

