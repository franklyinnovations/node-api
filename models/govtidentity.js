"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("govtidentity", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    countryId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    display_order: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        len: {
          args: [1, 4],
          msg: 'DisplayOrderLength',
        },
        isInt:{
          min:0,
          msg:'Please enter valid number'
        }
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'govt_identities'
  });
  return Model;
};

