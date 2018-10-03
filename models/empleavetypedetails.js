"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("empleavetypedetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    empLeaveTypeId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        len: {
          args: [1, 100],
          msg: 'Length can not be more than 100 characters.',
        },
        isExist: function(value , next){
          this.Model.find({where:{id:{$ne: this.id}, name:value, languageId:this.languageId, masterId:this.masterId}}).then(function(data){
            if (data !== null) {
                next('isUnique');
            } else {
                next();
            }
          });
        }	
      }
    }
  },{
    tableName: 'emp_leave_type_details',
    timestamps: false,
  });
  return Model;
};
