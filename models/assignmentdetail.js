"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("assignmentdetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assignmentId: {
      type: DataTypes.INTEGER
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    title: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        len: {
          args: [1, 200],
          msg: 'Max length must be 200 Characters.',
        },
      }
    },
    comment: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    }
  },{
    tableName: 'assignment_details',
    timestamps: false,
  });
  return Model;
};
