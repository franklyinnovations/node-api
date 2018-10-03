"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("payfees", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    feeId: {
      type: DataTypes.INTEGER
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    parent_id: {
      type: DataTypes.INTEGER
    },
    academicSessionId: {
      type: DataTypes.INTEGER
    },
    pay_date:{
     type: DataTypes.STRING	
    },
    discount:{
     type: DataTypes.STRING	
    },
    total:{
     type: DataTypes.STRING	
    },
    pay_mode:{
     type: DataTypes.STRING	
    },
    doc_no:{
     type: DataTypes.STRING	
    },
    bank_name:{
     type: DataTypes.STRING	
    },
     note:{
     type: DataTypes.STRING	
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
    },
    challan_amu: {
      type: DataTypes.DECIMAL(10, 2),
    },
    studentId:{
     type: DataTypes.INTEGER 
    },
    monthId:{
     type: DataTypes.INTEGER 
    },
    bcsMapId:{
     type: DataTypes.INTEGER 
    },
    status:{
      type: DataTypes.INTEGER  
    },
    pay_log:{
     type: DataTypes.STRING 
    },
    classId:{
     type: DataTypes.INTEGER 
    },
  },{
    tableName: 'pay_fees',
    timestamps: false,
  });
  return Model;
};

