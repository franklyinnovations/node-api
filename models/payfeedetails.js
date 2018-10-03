"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("payfeedetails", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
    },
    head_name: {
      type: DataTypes.STRING
    },
    head_id:{
      type: DataTypes.INTEGER,
    },
    type:{
      type: DataTypes.INTEGER,
    }
  },{
    tableName: 'pay_fee_details',
    timestamps:false
  });
  return Model;
};

