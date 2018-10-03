"use strict";
const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("signature", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    academicsessionId: {
      type: DataTypes.INTEGER
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    module: {
      type: DataTypes.STRING
    },
    prepared_by: {
      type: DataTypes.STRING
    },
    checked_by: {
      type: DataTypes.STRING
    },
    principal: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'signatures',
    hooks: {
      beforeUpdate: [makeOptimizerHook('prepared_by', true),makeOptimizerHook('principal', true),makeOptimizerHook('checked_by', true)],
      beforeCreate: [makeOptimizerHook('prepared_by', true),makeOptimizerHook('principal', true),makeOptimizerHook('checked_by', true)],
    }
});
  return Model;
}
