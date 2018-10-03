"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("statedetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    stateId: {
      type: DataTypes.INTEGER
    },
    languageId: {
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
          msg: 'Length can not be more than 100.',
        },
        isUnique: function(value, next){
          if(this.languageId == 1){
            var langCondition = this.languageId;
          }else{
            var langCondition = {$in:[this.languageId, 1]};
          }
          this.Model.find({where:{id:{$ne: this.id}, name:value, languageId:langCondition}}).then(function(data){
            if(data !==null){
              return next('isUnique');
            } else{
              return next();
            }
          });
        }
      }
    }
  },{
    tableName: 'state_details',
    timestamps: false,
  });
  return Model;
};

