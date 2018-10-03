"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("userdetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    fullname: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        len: {
          args: [1, 150],
          msg: 'Length can not be more than 150.',
        }
      }
    },
    address: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    }
  },{
    tableName: 'user_details',
    timestamps: false,
  });
  return Model;
};
