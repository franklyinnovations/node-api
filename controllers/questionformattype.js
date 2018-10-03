var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');
var utils = require('./utils');

function QuestionFormatType() {
	this.getAll = function(req, res) {
        var isWhere = {};
		var reqData = req;
		models.questionformattype.hasMany(models.questionformattypedetail);
		isWhere.questionformattypedetail = language.buildLanguageQuery(
            isWhere.questionformattypedetail, reqData.langId, '`question_format_type`.`id`', models.questionformattypedetail, 'questionFormatTypeId'
        );
        
		models.questionformattype.findAll({
            include: [
                {model: models.questionformattypedetail, where:isWhere.questionformattypedetail, group:['questionFormatTypeId']},
            ],
            where: {masterId:reqData.masterId},
            order: [
                ['id', 'DESC']
            ],
            distinct: true,
            subQuery: false
        }).then(function(result){
            res({question_format_types:result });
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	}
}

module.exports = new QuestionFormatType();
