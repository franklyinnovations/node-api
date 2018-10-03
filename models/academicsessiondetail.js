"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("academicsessiondetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    academicSessionId: {
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
          args: [1, 200],
          msg: 'Length can not be more than 200.',
        },
      }
    },
  },{
    tableName: 'academic_session_details',
    timestamps: false,
  });
  return Model;
};

