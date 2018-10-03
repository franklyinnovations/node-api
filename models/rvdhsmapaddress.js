"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("rvdhsmapaddress", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rvdhsmapId: {
      type: DataTypes.INTEGER
    },
    routeaddressId: {
      type: DataTypes.STRING
    },
    pick_up_time: {
      type: DataTypes.STRING
    },
    drop_time: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'rvdhs_map_addresses',
    timestamps: false
});
  return Model;
}
