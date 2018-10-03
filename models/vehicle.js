"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("vehicle", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    number: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        len: {
          args: [1, 20],
          msg: 'Length can not be more than 20.',
        },
        isExist: function(value , next){
          this.Model.find({where:{id:{$ne: this.id}, number:value, masterId:this.masterId}}).then(function(data){
            if (data !== null) {
                next('isUnique');
            } else {
                next();
            }
          });
        }
      }
    },
    insurance_number: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        len: {
          args: [1, 20],
          msg: 'Length can not be more than 20.',
        },
        isExist: function(value , next){
          this.Model.find({where:{id:{$ne: this.id}, number:value, masterId:this.masterId}}).then(function(data){
            if (data !== null) {
                next('isUnique');
            } else {
                next();
            }
          });
        }
      }
    },
    insurance_expiry_date: {
      type: DataTypes.DATEONLY,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isValid: function(value, next){
          if(value === 'notValid'){
            next('dateFormatNotValid');
          } else {
            next();
          }
        }
      }
    },
    vehicle_type: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    total_seats: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        min: {
          args: [0],
          msg: 'Please enter valid number'
        },
        max: {
          args: [1000],
          msg: 'Value should be from 1 to 1000'
        },
        isValid: function (value, next) {
          var num = parseInt(value);
          if (value !== '' ) {
            if (isNaN(num) || num <= 0 || num != value) {
              next('Please enter valid number');
            } else {
              next();
            }
          } else {
            next();
          }
        }
      }
    },
    fuel_type: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      },
    },
    make: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      },
    },    
    registration_number: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    pollution_control_number: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    pollution_control_expiry_date: {
      type: DataTypes.DATEONLY,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    vehicle_image: {
      type: DataTypes.STRING,
    },
    vehicle_document: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    pollution_control_certificate: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    insurance_certificate: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'vehicles'
});
  return Model;
}