"use strict";

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook,
moment = require('moment'),
optimizationHooks = [
  makeOptimizerHook('mark_list_img'),
  makeOptimizerHook('birth_certificate_img'),
  makeOptimizerHook('tc_img'),
  makeOptimizerHook('cast_certificate_img'),
  makeOptimizerHook('migration_certificate_img'),
  makeOptimizerHook('affidavit_img'),
  makeOptimizerHook('income_certificate_img'),
  makeOptimizerHook('ration_card_img'),
  makeOptimizerHook('labour_card_img')
];

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("student", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    enrollment_no: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isExist: function(value , next){
          this.Model.find({where:{id:{$ne: this.id}, enrollment_no:value, masterId:this.masterId}}).then(function(data){
            if (data !== null) {
                next('isUnique');
            } else {
                next();
            }
          });
        }
      }
    },
    form_no: {
      type: DataTypes.STRING,
      validate: {
        isExist: function(value , next){
          if (value === '') {
            next();
            return;
          }
          this.Model.find({where:{id:{$ne: this.id}, form_no:value, masterId:this.masterId}}).then(function(data){
            if (data !== null) {
                next('isUnique');
            } else {
                next();
            }
          });
        }
      }
    },
    fee_receipt_no: {
      type: DataTypes.STRING,
      validate: {
        isExist: function(value , next){
          if (value === '') {
            next();
            return;
          }
          this.Model.find({where:{id:{$ne: this.id}, fee_receipt_no:value, masterId:this.masterId}}).then(function(data){
            if (data !== null) {
                next('isUnique');
            } else {
                next();
            }
          });
        }
      }
    },
    doa: {
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
    dob: {
      type: DataTypes.DATEONLY,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isFun:function(value, next){
          if(value === ''){
            next('isRequired');
          }
          if(value === 'notValid'){
            next('dateFormatNotValid');
          } else {
            value = Date.parse(value);
            if (isNaN(value)) {
              next("Invalid date of birth");
            } else if(value >= Date.parse(this.doa)){
              next('DOB should be before the Date of addmission');
            } else {
              next();
            }
          }
        }
      }
    },
    age: {
      type: DataTypes.VIRTUAL,
      get: function () {
        if (!this.dob || !this.masterId) return undefined;
        let dob = moment(this.dob);
        if (! dob.isValid()) return undefined;
        return moment().diff(dob, 'months');
      },
      validate: {
        addmission_age: function (value, next) {
          if (this.age === undefined) return next();
          sequelize.models.institute.findOne({
            where: {
              userId: this.masterId
            },
            attributes: ['min_admission_years', 'min_admission_months']
          })
          .then(institute => {
            if ((institute === null) || (institute.min_admission_months + institute.min_admission_years * 12 <= this.age))
              next();
            else
              next('Age should be greater than or equal to minimum age limit');
          });
        }
      }
    },
    blood_group: {
      type: DataTypes.STRING,
      validate: {
        // notEmpty: {
        //   msg:'isRequired'
        // },
        isValid:function(value, next){
          var validObj = ['A+','A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
          if(value !=='' && validObj.indexOf(value) === -1){
            next('notValidBloodGroup');
          } else {
            next();
          }
        }
      }
    },
    gender: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isValid:function(value, next){
          var validObj = ['male','female'];
          if(value !=='' && validObj.indexOf(value) === -1){
            next('notValidGender');
          } else {
            next();
          }
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
    cityId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    other_city: {
      type: DataTypes.STRING,
      validate: {
        isReq: function(value, next){
          if(this.cityId == 0 && value =='') {
            next('isRequired');
          } else {
            next();
          }
        }
      }
    },
    zip_code: {
      type: DataTypes.STRING
    },
    zip_code2: {
      type: DataTypes.STRING
    },
    same_as_comm_add: {
      type: DataTypes.BOOLEAN,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    countryId_2: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    stateId_2: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    cityId_2: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    res_category: {
      type: DataTypes.STRING,
      /*validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }*/
    },
    aadhar: {
      type: DataTypes.STRING,
      validate: {
        is: {
          args: [/^\d{12}$/],
          msg: 'Invalid Aadhar'
        }
      }
    },
    income_certificate_img: {
      type: DataTypes.STRING,
    },
    ration_card_img: {
      type: DataTypes.STRING,
    },
    labour_card_img: {
      type: DataTypes.STRING,
    },
    father_contact: {
      type: DataTypes.STRING,
      validate: {
        isFun:function(value, next){
          if (value === ''){
            next('isRequired');
          }else if (/^\d{6,15}$/.test(value)) {
            // if(this.mother_contact !== '' && value === this.mother_contact){
            //   next('notsameasmother');
            // } else if(this.guardian_contact !== '' && value === this.guardian_contact) {
            if(this.guardian_contact !== '' && value === this.guardian_contact) {
              next('notsameasguardian');
            }else{
              next();
            }
          } else {
            next('notValidMobile');
          }
        }
      }
    },
    father_contact_alternate: {
      type: DataTypes.STRING,
      validate: {
        valid: function (value, next) {
          if (!value || /^\d{6,15}$/.test(value)) {
            if (this.father_contact.toString().trim() && value == this.father_contact) {
              next('notSameAsContactNumber');
            } else {
              next();
            }
          } else {
            next('notValidMobile');
          }
        }
      }
    },
    mother_contact: {
      type: DataTypes.STRING,
      validate: {
        isFun:function(value, next){
          if (value === ''){
            next();
          }else if (/^\d{6,15}$/.test(value)) {
            // if(this.father_contact !== '' && value === this.father_contact){
            //   next('notsameasfather');
            // } else if(this.guardian_contact !== '' && value === this.guardian_contact) {
            if(this.guardian_contact !== '' && value === this.guardian_contact) {
              next('notsameasguardian');
            }else{
              next();
            }
          } else {
            next('notValidMobile');
          }
        }
      }
    },
    mother_contact_alternate: {
      type: DataTypes.STRING,
      validate: {
        valid: function (value, next) {
          if (!value || /^\d{6,15}$/.test(value)) {
            if (this.mother_contact.toString().trim() && value == this.mother_contact) {
              next('notSameAsContactNumber');
            } else {
              next();
            }
          } else {
            next('notValidMobile');
          }
        }
      }
    },
    guardian_contact: {
      type: DataTypes.STRING,
      validate: {
        isFun:function(value, next){
          if(this.is_supervision === '1'){
            if (value === ''){
              next('isRequired');
            }else if (/^\d{6,15}$/.test(value)) {
              if(this.father_contact !== '' && value === this.father_contact){
                next('notsameasfather');
              } else if(this.mother_contact !== '' && value === this.mother_contact) {
                next('notsameasmother');
              }else{
                next();
              }
            } else {
              next('notValidMobile');
            }
          } else {
            next();
          }
        }
      }
    },
    guardian_contact_alternate: {
      type: DataTypes.STRING,
      validate: {
        valid: function (value, next) {
          if (this.is_supervision != '1') {
            next();
          } else if (!value || /^\d{6,15}$/.test(value)) {
            if (this.guardian_contact.toString().trim() && value == this.guardian_contact) {
              next('notSameAsContactNumber');
            } else {
              next();
            }
          } else {
            next('notValidMobile');
          }
        }
      }
    },
    mark_list_img: {
      type: DataTypes.STRING
    },
    birth_certificate_img: {
      type: DataTypes.STRING
    },
    tc_img: {
      type: DataTypes.STRING
    },
    cast_certificate_img: {
      type: DataTypes.STRING
    },
    migration_certificate_img: {
      type: DataTypes.STRING
    },
    affidavit_img: {
      type: DataTypes.STRING
    },
    transportType: {
      type: DataTypes.INTEGER
    },
    routeId: {
      type: DataTypes.INTEGER
    },
    stoppage_point: {
      type: DataTypes.INTEGER,
      validate: {
        valid: function (value, next) {
          if(this.routeId !== null && value === ''){
            next('isRequired');
          } else {
            next();
          }
        }
      }
    },
    father_email: {
      type: DataTypes.STRING,
      validate: {
        isFun : function (value, next){
          var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          if(value !=='' && !re.test(value)){
            return next('isEmail');
          }
          return next();
        }
      }
    },
    mother_email: {
      type: DataTypes.STRING,
      validate: {
        isFun : function (value, next){
          var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          if(value !=='' && !re.test(value)){
            return next('isEmail');
          }
          return next();
        }
      }
    },
    no_of_brother: {
      type: DataTypes.INTEGER,
      validate: {
        isFun : function (value, next){
          if(value !=='' && ! /^\d+$/.test(value)){
            return next('Please enter valid number');
          }else if(value !=='' && value.length > 2){
            return next('Length can not be more than 2 digit.');
          }
          return next();
        }
      }
    },
    no_of_sister: {
      type: DataTypes.INTEGER,
      validate: {
        isFun : function (value, next){
          if(value !=='' && ! /^\d+$/.test(value)){
            return next('Please enter valid number');
          }else if(value !=='' && value.length > 2){
            return next('Length can not be more than 2 digit.');
          }
          return next();
        }
      }
    },
    no_of_brother_in_school: {
      type: DataTypes.INTEGER,
      validate: {
        isFun : function (value, next){
          if(value !=='' && ! /^\d+$/.test(value)){
            return next('Please enter valid number');
          }else if(value !=='' && value.length > 2){
            return next('Length can not be more than 2 digit.');
          }
          return next();
        }
      }
    },
    no_of_sister_in_school: {
      type: DataTypes.INTEGER,
      validate: {
        isFun : function (value, next){
          if(value !=='' && ! /^\d+$/.test(value)){
            return next('Please enter valid number');
          }else if(value !=='' && value.length > 2){
            return next('Length can not be more than 2 digit.');
          }
          return next();
        }
      }
    },
    rank_in_family: {
      type: DataTypes.INTEGER,
      validate: {
        isFun : function (value, next){
          if(value !=='' && ! /^\d+$/.test(value)){
            return next('Please enter valid number');
          }else if(value !=='' && value.length > 2){
            return next('Length can not be more than 2 digit.');
          }
          return next();
        }
      }
    },
    residancy_number: {
      type: DataTypes.INTEGER,
      validate: {
        len: function(value, next){
          if (value !== '' && value.length > 50) {
            next('Length can not be more than 150.');
          } else {
            next();
          }
        }
      }
    },
    rn_issuer: {
      type: DataTypes.INTEGER,
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
    date_of_release: {
      type: DataTypes.DATEONLY,
      validate: {
        isFun:function(value, next){
          if (value !== ''){
            if(value === 'notValid'){
              next('dateFormatNotValid');
            } else {
              value = Date.parse(value);
              if (isNaN(value)) {
                next("Invalid date of release.");
              } else {
                next();
              }
            }
          }
          next();
        }
      }
    },
    date_of_expiration: {
      type: DataTypes.DATEONLY,
      validate: {
        isFun:function(value, next){
          if (value !== ''){
            if(value === 'notValid'){
              next('dateFormatNotValid');
            } else {
              value = Date.parse(value);
              if (isNaN(value)) {
                next("Invalid date of expiration.");
              } else if(value <= Date.parse(this.date_of_release)){
                next('Date of expiration should be after the date of release.');
              } else {
                next();
              }
            }
          }
          next();
        }
      }
    },
    is_health_issue:{
      type: DataTypes.INTEGER
    },
    is_allergies:{
      type: DataTypes.INTEGER
    },
    is_medicine:{
      type: DataTypes.INTEGER
    },
    is_asthma:{
      type: DataTypes.INTEGER
    },
    is_disability:{
      type: DataTypes.INTEGER
    },
    is_supervision:{
      type: DataTypes.VIRTUAL
    },
  },{
    tableName: 'students',
    hooks: {
      beforeUpdate: optimizationHooks,
      beforeCreate: optimizationHooks
    }
  });
  return Model;
};
