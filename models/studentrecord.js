"use strict";
var moment = require('moment');

module.exports =  function(sequelize, DataTypes){
  var Model = sequelize.define("studentrecord", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    studentId: {
      type: DataTypes.INTEGER
    },
    bcsMapId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    roll_no: {
      type: DataTypes.INTEGER,
      validate: {
        valid: function (value, next) {
          if (! value) next();
          if (! /^\d+$/.test(value)) return next('Please enter valid number');
          if (value <= 0) return next('Please enter valid number');
          if (typeof value === 'string' && value.length > 20)
            return next('Roll no can not have more than 20 digits');
          this.Model.find({
            where: {
              id: {$ne: this.id}, 
              roll_no:value, 
              bcsMapId:this.bcsMapId, 
              academicSessionId: this.academicSessionId,
              record_status:1,
              $or: [
                {transferred: 0}, 
                {transferred: 1, transerred_effective_from: {$gt: moment().format('YYYY-MM-DD')}}, 
                {transferred: 2, transerred_effective_from: {$lte: moment().format('YYYY-MM-DD')}}
              ]
            }
          })
          .then(function(data){
            if (data !== null) {
              next('isUnique');
            } else {
              next();
            }
          });
        }
      }
    },
    academicSessionId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isAcademicSession'
        }
      }
    },
    promoted: {
      type: DataTypes.INTEGER
    },
    transferred: {
      type: DataTypes.INTEGER
    },
    transferred_date: {
      type: DataTypes.DATEONLY
    },
    transerred_effective_from: {
      type: DataTypes.DATEONLY
    },
    record_status: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'student_records',
    timestamps: false,
  });
  return Model;
};
