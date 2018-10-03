"use strict";

const moment = require('moment');

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("attendance", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    academicSessionId: {
      type: DataTypes.INTEGER
    },
    bcsMapId:{
      type: DataTypes.INTEGER,
    },
    subjectId: {
      type: DataTypes.INTEGER,
      validate: {
            notEmpty: {
                msg:'isRequired'
            }
        }
    },
    period: {
      type: DataTypes.INTEGER
    },
    date: {
      type: DataTypes.DATEONLY,
        validate: {
          notEmpty: {
            msg:'isRequired'
          },
          oldDate: function (value, next) {
            if (moment(value).isSameOrBefore(moment())) {
              next();
            } else {
              next('Not allow to take attendance of future date!!!');
            }
          }
        }
    },
    /*bcsids:{
      type: DataTypes.VIRTUAL,
      validate: {
          isFun: function(value, next){
            if (this.boardId ==='' && this.classId ==='' && this.sectionId ==='') {
              next('isRequired');
            } else {
              next();
            }
          }
      }
    }*/
  },{
    tableName: 'attendances'
  });
  return Model;
};
