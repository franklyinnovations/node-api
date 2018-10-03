var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');
var utils = require('./utils');

function QuestionControlType() {
	this.getAll = function(req, res) {
		var isWhere = {};
		var reqData = req;
		models.questioncontroltype.hasMany(models.questioncontroltypedetail);
		/*isWhere.questioncontroltypedetail = language.buildLanguageQuery(
            isWhere.questioncontroltypedetail, reqData.langId, '`question_control_type`.`id`', models.questioncontroltypedetail, 'questionControlTypeId'
        );*/
        
		models.questioncontroltype.findAll({
            include: [
                {model: models.questioncontroltypedetail, group:['questionControlTypeId']},
            ],
            order: [
                ['id', 'DESC']
            ],
            distinct: true,
            subQuery: false
        }).then(function(result){
            res({question_control_types:result });
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	}
}

module.exports = new QuestionControlType();
