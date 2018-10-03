"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("contact", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nature_of_interest: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    organization_name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    mobile: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isValid:function(value, next){
          if(value !==''){
            var mob = /^\d{6,15}$/;
            if (mob.test(value)===false) {
              next('notValidMobile');
            } else {
              next();
            }
          }else{
            next();
          }
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        isEmail: {
          msg: 'isEmail'
        }
      }
    },
    query: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    try_demo: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    countryId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    skypeId: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'contacts'
  });
  return Model;
};

