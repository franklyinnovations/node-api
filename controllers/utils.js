var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');
var mail = require('./mail');

function Utils() {
  /*
  * Get All Bcs by Master Id
  */
  this.getAllBcsByMasterIdForTransfer = function(req, res) {

    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);

    models.bcsmap.findAll({
           include: [{model: models.board, attributes:['id'],
             include: [{model: models.boarddetail,
               attributes:['id', 'name', 'alias'],
               where: language.buildLanguageQuery({}, req.langId, '`board`.`id`', models.boarddetail, 'boardId')
             }]
           },{model: models.classes, attributes:['id'],
             include: [{model: models.classesdetail,
               attributes:['id', 'name'],
               where: language.buildLanguageQuery({}, req.langId, '`class`.`id`', models.classesdetail, 'classId')
             }]
           },{model: models.section, attributes:['id'],
             include: [{model: models.sectiondetail,
               attributes:['id', 'name'],
               where: language.buildLanguageQuery({}, req.langId, '`section`.`id`', models.sectiondetail, 'sectionId')
             }]
           }],
      where: {masterId:req.masterId, is_active:1, id:{$ne:req.bcsMapId}},
      order: [
        [ models.board, 'display_order', 'ASC'],
        [ models.board, 'id', 'ASC'],
        [ models.classes, 'display_order', 'ASC'],
        [ models.classes, 'id', 'ASC'],
        [ models.section, 'display_order', 'ASC'],
        [ models.section, 'id', 'ASC'],
        ['id', 'DESC']
      ]
    }).then(function(data){
      res({status:true, message:language.lang({key:"bcs_list", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

    /*
     * Get all tagtype with ID
     */
    this.getAllTagTypeId = function(req, res) {
        return {
            ServiceTagId: 1,
            SpecializationTagId: 2,
            EducationQualificationTagId: 3,
            EducationCollegetagId: 4,
            RegistrationCluncilTagId: 5,
            MembershipCouncilTagId: 6,
            ChronicDiseaseTagId: 7,
            ArticleHealthIntrestTopicsTagId: 8,
            SymptomsforDoctorsClinicTagId: 9,
            ProbleTypeTagId: 10,
            InsuranceCompaniesTagId: 11,
            MembershipsTagId: 12,
            AllergiesTagId: 13,
            InjuriesTagId: 14,
            SurgeriestagId: 15,
            Occupation: 16,
            FoodPreferenceTagId: 17,
            LifestyleTagId: 18,
            AlcoholConsumptionTagId: 19,
            CigaretteSmokeTagId: 20,
            MedicalRecordTypeTagId: 21
        }
    }

    /*
     * for hospital profile
     */
    this.updateProfileStatusWhileUpdate = function(req, res) {
      models.hospital.hasMany(models.hospitaldetail);
        
        models.hospital.hasMany(models.hospitalfile);
        
        models.hospital.hasMany(models.hospital_doctors);
        
        models.hospital.hasMany(models.hospital_timings);

        models.hospital.hasMany(models.hospitalservice);

        models.hospital.hasMany(models.hospitalaward);
        
        var isWhere = {};
        isWhere.hospitaldetail = language.buildLanguageQuery(isWhere.hospitaldetail, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId');
        isWhere.countrydetail = language.buildLanguageQuery(isWhere.countrydetail, req.langId, '`country`.`id`', models.countrydetail, 'countryId');
        isWhere.statedetail = language.buildLanguageQuery(isWhere.statedetail, req.langId, '`state`.`id`', models.statedetail, 'stateId');
        isWhere.citydetail = language.buildLanguageQuery(isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId');
        isWhere.hospitalawarddetail = language.buildLanguageQuery(isWhere.hospitalawarddetail, req.langId, '`hospital_awards`.`id`', models.hospitalawarddetail, 'hospitalAwardId');

        models.hospital.findOne({
            where: {id: req.id},
            include: [{
                model: models.hospitaldetail,
                where: isWhere.hospitaldetail
            }, {
                model: models.hospitalfile,
                where: isWhere.hospitalfile,
                required: false
            }, {
                model: models.hospital_timings,
                required: false
            }, {
                model: models.hospital_doctors,
                required: false
            }, {
                model: models.hospitalservice,
                where: isWhere.hospitalservice,
                required: false
            }, {
                model: models.hospitalaward,
                required: false
            }],
        }).then(function(result) {
            if(result != null) {
                let tagTypeIds = module.exports.getAllTagTypeId()

                let servicesTagStatus = result.hospitalservices.some((item) => { return item.tagtypeId == tagTypeIds.ServiceTagId })
                let specializationTagStatus = result.hospitalservices.some((item) => { return item.tagtypeId == tagTypeIds.SpecializationTagId })
                let membershipTagStatus = result.hospitalservices.some((item) => { return item.tagtypeId == tagTypeIds.MembershipsTagId })
                let insuranceCompaniesTagStatus = result.hospitalservices.some((item) => { return item.tagtypeId == tagTypeIds.InsuranceCompaniesTagId })
                let filesStatus = result.hospitalfiles.some((item) => { 
                    return ["prescription_pad", "clinic_reg_proof", "waste_disposal_certificate", "tax_receipt"].indexOf(item.document_type) !== -1;
                })
                
                let profileCompletionStatus = servicesTagStatus && specializationTagStatus && membershipTagStatus && insuranceCompaniesTagStatus && filesStatus;

                if(!profileCompletionStatus) {
                    models.hospital.update({is_complete: 0, is_live: 0, verified_status: 'incomplete-profile'}, {
                        where: {id: req.id}
                    }).then(function(updateStatus) {
                        res({status: true, data: result});    
                    }).catch(() => res({status: false}));
                } else {
                    let updatedValues = {};
                    if("incomplete-profile" === result.verified_status) {
                        updatedValues = {verified_status: "pending", is_live: 0, is_complete: 1}
                        models.hospital.update(updatedValues, { where: {id: req.id} }).then(function(updateStatus) {
                            res({status: true, data: result});
                        }).catch(() => res({status: false}));
                    } else {
                        res({status: true, data: result});
                    }
                }
            }
        })
    }

    this.sendMailfff = function(req, res) {
  var mailData = {
    email: "sagar.jajoriya@planetwebsolution.com", 
    subject: language.lang({key:"registrationDetails", lang:'en'}), 
    list: {fullname: 'Sagar Jajoriya', username:'skj', email:'sagar.jajoriya@planetwebsolution.com', password: '111111', link: 'ffffffffff'}
  };
  mail.sendHtmlMail(mailData, 'en');
}

}
module.exports = new Utils();
