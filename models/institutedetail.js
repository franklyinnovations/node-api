"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("institutedetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    instituteId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        len: {
          args: [1, 150],
          msg: 'Length can not be more than 150.',
        }
      }
    },
    alias: {
      type: DataTypes.STRING,
      validate: {
        len: function(value, next){
          if (value !== '' && value.length > 50) {
            next('Length can not be more than 50.');
          } else {
            next();
          }
        }
      }
    },
    address: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    tagline: {
      type: DataTypes.STRING,
    },
    google_address: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    }
  },{
    tableName: 'institute_details',
    timestamps: false,
  });
  return Model;
};

