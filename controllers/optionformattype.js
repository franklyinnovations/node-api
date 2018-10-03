var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');
var utils = require('./utils');

function OptionFormatType() {
	this.getAll = function(req, res) {
        var isWhere = {};
		var reqData = req;
		models.optionformattype.hasMany(models.optionformattypedetail);
		isWhere.optionformattypedetail = language.buildLanguageQuery(
            isWhere.optionformattypedetail, reqData.langId, '`option_format_type`.`id`', models.optionformattypedetail, 'optionFormatTypeId'
        );

		models.optionformattype.findAll({
            include: [
                {model: models.optionformattypedetail, where:isWhere.optionformattypedetail, group:['optionFormatTypeId']},
            ],
            where: {masterId:reqData.masterId},
            order: [
                ['id', 'DESC']
            ],
            distinct: true,
            subQuery: false
        }).then(function(result){
            res({option_format_types:result });
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	}
}

module.exports = new OptionFormatType();
