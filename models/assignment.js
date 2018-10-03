"use strict";

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("assignment", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    academicSessionId: {
      type: DataTypes.INTEGER
    },
    bcsMapId:{
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    /*bcsIds:{
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
    },*/
    subjectId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    start_date: {
      type: DataTypes.DATEONLY,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
      }
    },
    end_date: {
      type: DataTypes.DATEONLY,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isValid:function(value, next){
          if (value !=='' && value < this.start_date) {
            next('endDateEqualOrGreater');
          } else {
            next();
          }
        },
      }
    },
    assignment_file: {
      type: DataTypes.STRING
    },
    assignment_type: {
      type: DataTypes.STRING
    },
    assignment_size: {
      type: DataTypes.STRING
    },
    assignment_file_name:{
      type: DataTypes.STRING
    },
    is_active: {
      type: DataTypes.STRING
    },
    assignment_status: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
      }
    },
    reviewedAt: {
      type: DataTypes.DATEONLY,
    },
    timetableallocationId: {
      type: DataTypes.VIRTUAL,
    },
  },{
    tableName: 'assignments',
    hooks: {
      beforeCreate: makeOptimizerHook('assignment_file'),
      beforeUpdate: makeOptimizerHook('assignment_file')
    }
  });
  return Model;
};
