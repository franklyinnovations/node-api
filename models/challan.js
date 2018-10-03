"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("challans", {
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
    total:{
     type: DataTypes.STRING	
    },
    studentId:{
     type: DataTypes.INTEGER 
    },
    bcsMapId:{
     type: DataTypes.INTEGER 
    },
    form_data:{
     type: DataTypes.STRING 
    },
    status:{
     type: DataTypes.STRING 
    }
  },{
    tableName: 'challans',
    timestamps: true,
  });
  return Model;
};

