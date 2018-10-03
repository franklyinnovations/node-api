var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');
var utils = require('./utils');
var exampapers = require('./exampapers');
var question = require('./question');

function PaperMapWithQuestion() {
	this.list = function(req, res) {
		var setMethodForGetBcsList = req.user_type === 'teacher' ? 'getAllbcsByTeacher' : 'getAllbcsByInstitute';
        
        async.parallel({
			bcs_list: function (callback) {
            	utils[setMethodForGetBcsList](req, function(data) {
            		callback(null, data.data);
            	});
        	},
		}, function (err, result) {
            res(result);
		});
	}

    this.paperandquestiondata = function(req, res) {
        async.parallel({
            exam_papers: function (callback) {
                exampapers.listForMapQustion(req, function(data) {
                    callback(null, data);
                });
            },
            questions: function (callback) {
                question.listForMapQustion(req, function(data) {
                    callback(null, data);
                });
            },
        }, function (err, result) {
            res(result);
        });
    }

    this.save = function(req, res) {
        if(typeof req.is_mapped !== "undefined" && req.is_mapped.length > 0) {
            var dataToSave = []
            var dataArray = [];
            var countTotalMarks = 0;
            async.forEach(req.is_mapped, function (quesId, callback) {
                var setData = {
                    examPaperId: req.examPaperId,
                    questionId: quesId,
                    examPaperSectionId: req['examPaperSectionId___'+quesId],
                    question_mark: req['question_mark___'+quesId],
                    is_negative_marking_allowed: req['is_negative_marking_allowed___'+quesId] === "on" ? 1 : 0,
                    negative_marking_marks: req['negative_marking_marks___'+quesId],
                    languageId: req.langId,
                    masterId: req.masterId
                }
                dataArray.push(setData);
                countTotalMarks += parseInt(req['question_mark___'+quesId])
            });
            var errors = [];
            async.parallel([
                function (callback) {
                    async.forEachOf(dataArray, function (values, key, callback) {
                        var mappingexampaperquestion_build = models.mappingexampaperquestion.build(values);
                        mappingexampaperquestion_build.validate().then(function (err) {
                            if (err != null) {
                                async.forEach(err.errors, function (errObj, inner_callback) {
                                    errObj.path = errObj.path+"___"+values.questionId;
                                    errors = errors.concat(errObj);
                                });
                            }
                            callback(null, errors);

                        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                    }, function (err) {
                        callback(null, errors);
                    });
                },
            ], function (err, errors) {
                var merged = [].concat.apply([], errors);
                var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
                if (uniqueError.length === 0) {
                    var setWhereData = {id: req.examPaperId, masterId: req.masterId, langId: req.langId, lang: req.lang}
                    exampapers.getById(setWhereData, function({data: examPaperData}) {
                        exampapers.getCountOfMappedQuestion({examPaperId: req.examPaperId, masterId: req.masterId, langId: req.langId}, function(getMappQuesCount) {
                            if(getMappQuesCount.count === examPaperData.total_questions) {
                                var setErrMessage = "Cannot map question(s) to the "+examPaperData.exampaperdetails[0].paper_title+" paper. It's already have "+getMappQuesCount.count+" questions mapped";
                                res({status:false, error: true, error_description: language.lang({key: setErrMessage, lang: req.lang}), url: true})
                            } else {
                                var max_marks = examPaperData.max_marks;
                                var total_questions = examPaperData.total_questions;
                                if(total_questions === dataArray.length) {
                                    if(max_marks === countTotalMarks) {
                                        module.exports.checkAllSectionFilled({dataArray: dataArray, sections: examPaperData.exampapersections}, function(getStatus) {
                                            if(getStatus.status) {
                                                models.mappingexampaperquestion.bulkCreate(dataArray, {}).then(function(data){
                                                    res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                                                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                                            } else {
                                                var setErrMessage = "Please map question(s) in all sections.";
                                                res({status:false, error: true, error_description: language.lang({key: setErrMessage, lang: req.lang}), url: true})    
                                            }                
                                        })
                                    } else {
                                        var setErrMessage = "Total marks of mapped questions should be equal to the paper max marks";
                                        res({status:false, error: true, error_description: language.lang({key: setErrMessage, lang: req.lang}), url: true})    
                                    }
                                } else {
                                    var setErrMessage = "Please map required questions";
                                    res({status:false, error: true, error_description: language.lang({key: setErrMessage, lang: req.lang}), url: true})
                                }
                            }
                        })
                    });
                } else {
                    language.errors({errors:uniqueError, lang:req.lang}, function(errors){
                        var newArr = {};
                        newArr.errors = errors;
                        newArr.message = "Please fill all required fields";
                        res(newArr);
                    });
                }
            });
        } else {
            res({status:false, message:language.lang({key:"You did not have mapped any question to the paper", lang:req.lang})});
        }
    }

    this.checkAllSectionFilled = function(req, res) {
        if(req.sections.length) {
            var status = true;
            async.forEachOf(req.sections, function (values, key, callback) {
                status = req.dataArray.some(function (el) {
                    return parseInt(el.examPaperSectionId) === values.id;
                });
                callback(null, status);
            }, function (err) {
                if(err) {
                    res.send({status: false});
                }
                res({status: status})
            });
        } else {
            res({status: true})
        }
    }
}

module.exports = new PaperMapWithQuestion();
