"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("examhead", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'examheads'
  });
  return Model;
};
