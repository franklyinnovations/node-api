"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("transfercertificate", {
    academicsessionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    bcsmapId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    releaving_date: {
      type: DataTypes.STRING,
    },
    conduct: {
      type: DataTypes.STRING
    },
    result: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'transfer_certificates'
  });
  return Model;
};

