"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("membershipdetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    membershipId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    feature: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    }
  },{
    tableName: 'membership_details',
    timestamps: false,
  });
  return Model;
};

