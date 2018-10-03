"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("studentdiscount", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    feediscountId: {
      type: DataTypes.STRING,
    },
    studentId: {
      type: DataTypes.STRING,
    }
  },{
    tableName: 'student_discounts'
  });
  return Model;
};

