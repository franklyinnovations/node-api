"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("mark", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    examScheduleId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    academicSessionId:{
      type: DataTypes.INTEGER,
    },
    bcsMapId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    subjectId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    exam_type: {
      type: DataTypes.STRING,
      validate:{
        isExist:function(value, next){
          this.Model.find({
            where:{
              id:{$ne:this.id},
              masterId:this.masterId,
              examScheduleId:this.examScheduleId,
              academicSessionId:this.academicSessionId,
              bcsMapId:this.bcsMapId,
              subjectId:this.subjectId,
              exam_type:value
            }
          }).then(function(data){
            if(data){
              next('isExist');
            } else {
              next();
            }
          });
        }
      }
    },
    max_mark: {
      type: DataTypes.DECIMAL
    },
    min_passing_mark: {
      type: DataTypes.DECIMAL
    },
    examscheduledetailId: {
      type: DataTypes.VIRTUAL,
    }
  },{
    tableName: 'marks'
  });
  return Model;
};
