"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("holiday", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    start_date: {
      type: DataTypes.DATEONLY,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    end_date: {
      type: DataTypes.DATEONLY,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }	
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'holidays'
  });
  return Model;
};

