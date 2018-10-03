"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("theme", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'themes'
  });
  return Model;
};

