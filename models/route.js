"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("route", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        len: {
          args: [1, 150],
          msg: 'Length can not be more than 150.',
        },
        isExist: function(value , next){
          this.Model.find({where:{id:{$ne: this.id}, name:value, masterId:this.masterId}}).then(function(data){
            if (data !== null) {
                next('isUnique');
            } else {
                next();
            }
          });
        },
      }
    },
    is_active: {
      type: DataTypes.STRING
    },
    routeaddresse: {
      type: DataTypes.VIRTUAL,
      validate: {
        isLocation:function(value, next){
          if (this.name !== '' && this.name.length <= 150 && value === '') {
            next('Please select at least two locations.');
          } else {
            next();
          }
        }
      }
    }
  },{
    tableName: 'routes'
});
  return Model;
}
