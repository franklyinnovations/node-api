"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("empleave", {
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
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    academicSessionId: {
      type: DataTypes.INTEGER
    },
    empLeaveTypeId: {
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
          if (value !== '' && value < this.start_date) {
            next('endDateEqualOrGreater');
          } else if (value !== '' && this.start_date !== '') {
            this.Model.find({where:{id:{$ne: this.id}, $or:[{start_date:{$lt:this.start_date}, end_date:{$gt:this.start_date}}, {start_date:{$lt:value}, end_date:{$gt:value}}, {start_date:{$gte:this.start_date}, end_date:{$lte:value}}], masterId:this.masterId, leavestatus:{$notIn:[2,3]}, userId:this.userId, academicSessionId:this.academicSessionId}}).then(function(data){
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
    duration: {
      type: DataTypes.DECIMAL(10, 2)
    },
    halfday: {
      type: DataTypes.STRING
    },
    comment: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    reject_reason: {
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
    user_type: {
      type: DataTypes.STRING
    },
    status_updatedby: {
      type: DataTypes.STRING,
    },
    status_updatedbytype: {
      type: DataTypes.STRING,
    },
    balance:{
      type:DataTypes.VIRTUAL,
      validate:{
        isValid:function(value, next){
         var val = parseFloat(value);
         var duration = parseFloat(this.duration);
         if(value !== '' && duration > val){
          next('Balance not sufficient');
         } else {
          next();
         }
        }
      }
    }
  },{
    tableName: 'emp_leaves'
  });
  return Model;
};
