"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("studentdetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    father_name: {
      type: DataTypes.STRING,
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
    mother_name: {
      type: DataTypes.STRING,
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
    guardian_name: {
      type: DataTypes.STRING,
      validate: {
        isFun:function(value, next){
          if(this.is_supervision === '1' && value === ''){
            next('isRequired');
          } else {
            next();
          }
        }
      }
    },
    guardian_relationship: {
      type: DataTypes.STRING,
      validate: {
        isFun:function(value, next){
          if(this.is_supervision === '1' && value === ''){
            next('isRequired');
          } else {
            next();
          }
        }
      }
    },
    guardian_address: {
      type: DataTypes.STRING,
      validate: {
        isFun:function(value, next){
          if(this.is_supervision === '1' && value === ''){
            next('isRequired');
          } else {
            next();
          }
        }
      }
    },
    birthmark: {
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
    height: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    address_2: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    birthplace: {
      type: DataTypes.STRING,
      validate: {
        len: function(value, next){
          if (value !== '' && value.length > 150) {
            next('Length can not be more than 150.');
          } else {
            next();
          }
        }
      }
    },
    religion: {
      type: DataTypes.STRING,
      validate: {
        len: function(value, next){
          if (value !== '' && value.length > 150) {
            next('Length can not be more than 150.');
          } else {
            next();
          }
        }
      }
      // validate: {
      //   notEmpty: {
      //     msg: 'isRequired'
      //   }
      // }
    },
    nationality: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        len: {
          args: [1, 150],
          msg: 'Length can not be more than 150.',
        }
      }
    },
    pre_school_name: {
      type: DataTypes.STRING,
      validate: {
        len: function(value, next){
          if (value !== '' && value.length > 150) {
            next('Length can not be more than 150.');
          } else {
            next();
          }
        }
      }
    },
    pre_school_address: {
      type: DataTypes.STRING,
    },
    pre_qualification: {
      type: DataTypes.STRING,
    },
    father_occupation: {
      type: DataTypes.STRING,
      validate: {
        len: function(value, next){
          if (value !== '' && value.length > 150) {
            next('Length can not be more than 150.');
          } else {
            next();
          }
        }
      }
    },
    mother_occupation: {
      type: DataTypes.STRING,
      validate: {
        len: function(value, next){
          if (value !== '' && value.length > 150) {
            next('Length can not be more than 150.');
          } else {
            next();
          }
        }
      }
    },
    standard_of_living: {
      type: DataTypes.STRING,
      validate: {
        len: function(value, next){
          if (value !== '' && value.length > 150) {
            next('Length can not be more than 150.');
          } else {
            next();
          }
        }
      }
    },
    health_issue_detail: {
      type: DataTypes.STRING,
      validate: {
        isFun:function(value, next){
          if(this.is_health_issue === '1' && value === ''){
            next('isRequired');
          } else {
            next();
          }
        }
      }
    },
    allergies_detail: {
      type: DataTypes.STRING,
      validate: {
        isFun:function(value, next){
          if(this.is_allergies === '1' && value === ''){
            next('isRequired');
          } else {
            next();
          }
        }
      }
    },
    medicine_detail: {
      type: DataTypes.STRING,
      validate: {
        isFun:function(value, next){
          if(this.is_medicine === '1' && value === ''){
            next('isRequired');
          } else {
            next();
          }
        }
      }
    },
    asthma_detail: {
      type: DataTypes.STRING,
      validate: {
        isFun:function(value, next){
          if(this.is_asthma === '1' && value === ''){
            next('isRequired');
          } else {
            next();
          }
        }
      }
    },
    disability_detail: {
      type: DataTypes.STRING,
      validate: {
        isFun:function(value, next){
          if(this.is_disability === '1' && value === ''){
            next('isRequired');
          } else {
            next();
          }
        }
      }
    },
    weight: {
      type: DataTypes.STRING,
    },
    is_health_issue:{
      type: DataTypes.VIRTUAL
    },
    is_allergies:{
      type: DataTypes.VIRTUAL
    },
    is_medicine:{
      type: DataTypes.VIRTUAL
    },
    is_asthma:{
      type: DataTypes.VIRTUAL
    },
    is_disability:{
      type: DataTypes.VIRTUAL
    },
    is_supervision:{
      type: DataTypes.VIRTUAL
    },
  },{
    tableName: 'student_details',
    timestamps: false,
  });
  return Model;
};
