"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("rvdhsmap", {
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
    routeId: {
      type: DataTypes.INTEGER,
      validate:{
        notEmpty:{
          msg:'isRequired'
        }
      }
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      validate:{
        notEmpty:{
          msg:'isRequired'
        }
      }
    },
    driverId: {
      type: DataTypes.INTEGER,
      validate:{
        notEmpty:{
          msg:'isRequired'
        }
      }
    },
    helperId: {
      type: DataTypes.INTEGER
    },
    total_seats:{
      type: DataTypes.VIRTUAL
    },
    total_mapped:{
      type:DataTypes.VIRTUAL,
       validate:{
        isValid:function(value, next){
          var totalSeats = parseInt(this.total_seats);
          var totalMapped = parseInt(this.total_mapped);
          if(totalMapped > totalSeats) {
            next('vehicleOverloaded');
          } else {
            next();
          }
        }
      }
    }
  },{
    tableName: 'rvdhs_maps'
  });
  return Model;
};
