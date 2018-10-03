"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("dealregistration", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    prospect_name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
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
     phone: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        is: {
          args: /^\d{6,15}$/,
          msg: 'notValidMobile'
        }
      }
    },
    institution: {
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
    stateId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    count_of_students: {
      type: DataTypes.STRING,
      validate: {
       isNumeric: {
          msg: 'Please enter valid number'
        },
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    additional_info: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        len: {
            args: [10, 100],
            msg: 'Please provide field within 10 to 100 characters.'
          }
      },
      
    },
    fullname: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    email_address: {
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
    business_name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    business_url: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    institute_erp: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
         len: {
            args: [5, 50],
            msg: 'Please provide field within 5 to 50 characters.'
          }
      }
    },
     partner_code: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    }
  },{
    tableName: 'deal_registrations'
  });
  return Model;
};
