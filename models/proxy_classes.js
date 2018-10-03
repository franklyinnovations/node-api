"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("proxy_classes", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    academicSessionId: {
      type: DataTypes.INTEGER,
    },
    bcsmapId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    timetableallocationId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isExist: function(value, next){
            this.Model.find({where:{ id:{$ne: this.id},timetableallocationId:value, date:this.date}}).then(function(data){
              if (data !== null) {
                  next('Already proxy has applied for this period.');
              } else {
                  next();
              }
            });
        }
      }
    },
    teacherId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    date: {
      type: DataTypes.DATEONLY,
    },
  },{
    tableName: 'proxy_classes'
  });
  return Model;
};
