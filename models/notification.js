"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("notification", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    senderId: {
      type: DataTypes.INTEGER
    },
    type: {
      type: DataTypes.STRING
    },
    message: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'notifications'
  });
  return Model;
};

