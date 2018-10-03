"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("academicsession", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
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
          if (value < this.start_date) {
            next('endDateEqualOrGreater');
          } else if (value !== '' && this.start_date !== '') {
            this.Model.find({where:{id:{$ne: this.id}, $or:[{start_date:{$lt:this.start_date}, end_date:{$gt:this.start_date}}, {start_date:{$lt:value}, end_date:{$gt:value}}, {start_date:{$gte:this.start_date}, end_date:{$lte:value}}], masterId:this.masterId}}).then(function(data){
              if(data !==null){
                return next('isSessionExist');
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
    is_active: {
      type: DataTypes.STRING
    },
    min_admission_date: {
      type: DataTypes.DATEONLY,
    },
    max_admission_date: {
      type: DataTypes.DATEONLY,
    },
    admission_fee: {
      type: DataTypes.DECIMAL(10, 2),
    },
    admission_open: {
      type: DataTypes.BOOLEAN,
    },
  },{
    tableName: 'academic_sessions'
  });
  return Model;
};

