"use strict";

module.exports=  function(sequelize, DataTypes){

  var Model = sequelize.define("govtidentitydetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    govtIdentityId: {
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
        isExist: function(value , next){
          if(this.languageId == 1){
            var langCondition = this.languageId;
          }else{
            var langCondition = {$in:[this.languageId, 1]};
          }
          this.Model.belongsTo(sequelize.models.govtidentity);
          this.Model.find({
            include: [{
              model: sequelize.models.govtidentity,
              where: {
                countryId: this.countryId
              }
            }],
            where:{
              id:{$ne: this.id},
              name:value,
              languageId:langCondition
            }
          }).then(function(data){
            if (data !== null) {
                next('isUnique');
            } else {
                next();
            }
          });
        }
      }
    },
    alias: {
      type: DataTypes.INTEGER,
      validate: {
        len: function(value, next){
          if (value !== '' && value.length > 20) {
            next('Length can not be more than 20.');
          } else {
            next();
          }
        }
      }
    },
    countryId: {
      type: DataTypes.VIRTUAL,
    }
  },{
    tableName: 'govt_identity_details',
    timestamps: false,
  });
  return Model;
};

