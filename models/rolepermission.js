"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("rolepermission", {
    permissionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    roleId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    }
  },{
    tableName: 'role_permissions',
    timestamps: false,
  });
  return Model;
};

