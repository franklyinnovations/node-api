"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("studentleave", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    userId: {
      type: DataTypes.INTEGER
    },
    tagId: {
      type: DataTypes.INTEGER
    },
    academicSessionId: {
      type: DataTypes.INTEGER
    },
    bcsMapId: {
      type: DataTypes.INTEGER
    },
    start_date: {
      type: DataTypes.DATEONLY,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    end_date: {
      type: DataTypes.DATEONLY,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isValid: function(value, next){
          if (value !== '' && this.start_date !== '') {
            this.Model.find({where:{id:{$ne: this.id}, $or:[{start_date:{$lt:this.start_date}, end_date:{$gt:this.start_date}}, {start_date:{$lt:value}, end_date:{$gt:value}}, {start_date:{$gte:this.start_date}, end_date:{$lte:value}}], masterId:this.masterId, leavestatus:{$ne:2}, userId:this.userId, academicSessionId:this.academicSessionId}}).then(function(data){
              if(data !==null){
                return next('isLeaveExist');
              } else{
                return next();
              }
            });
          } else {
            next();
          }
        }
      }
    },
    comment: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    leavestatus: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    status_updatedby: {
      type: DataTypes.STRING,
    },
    status_updatedbytype: {
      type: DataTypes.STRING,
    },
    duration: {
      type: DataTypes.DECIMAL,
    },
    halfday: {
      type: DataTypes.INTEGER,
    },
    applied_by: {
      type: DataTypes.STRING,
    }
  },{
    tableName: 'student_leaves'
  });
  return Model;
};
