"use strict";

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("lmstopicdocument", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    lmstopicId: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING,
    },
    path: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.STRING,
    },
  },{
    tableName: 'lms_topic_documents',
    timestamps: false,
    hooks: {
      beforeUpdate: [makeOptimizerHook('path', false)],
      beforeCreate: [makeOptimizerHook('path', false)],
    }
  });
  return Model;
};

