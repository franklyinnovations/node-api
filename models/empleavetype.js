"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("empleavetype", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    total_leaves: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        max: {
          args: [999],
          msg: 'Length can not be more than 3 digits.'
        },
        min: {
          args: [1],
          msg: 'Please enter valid number.'
        },
        isInt: {
          msg: 'Please enter valid number.'
        }
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'emp_leave_types'
  });
  return Model;
};
