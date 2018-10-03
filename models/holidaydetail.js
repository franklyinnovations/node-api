"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("holidaydetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    holidayId: {
      type: DataTypes.INTEGER
    },
    masterId: {
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
        },
        len: {
          args: [1, 200],
          msg: 'Length can not be more than 200.',
        },
      }
    }
  },{
    tableName: 'holiday_details',
    timestamps: false,
  });
  return Model;
};

