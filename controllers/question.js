var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');
var utils = require('./utils');
var questioncontroltype = require('./questioncontroltype');
var questionformattype = require('./questionformattype');
var optionformattype = require('./optionformattype');
var XLSX = require('xlsx');

function Question() {
	this.getAddData = function(req, res) {
		var setMethodForGetBcsList = req.user_type === 'teacher' ? 'getAllbcsByTeacher' : 'getAllbcsByInstitute';
        
        async.parallel({
			bcs_list: function (callback) {
            	utils[setMethodForGetBcsList](req, function(data) {
            		callback(null, data.data);
            	});
        	},
        	question_control_types: function (callback) {
            	questioncontroltype.getAll(req, function(data) {
            		callback(null, data.question_control_types);
            	});
        	},
		}, function (err, result) {
            res(result);
		});
	}

    this.save = function(req, res) {
        req.languageId = req.langId;
        
        module.exports.setData(req, function(resultData) {

            var questionHasOne = models.question.hasOne(models.questiondetail, {as: 'question_details'});
            var questionHasMany = models.question.hasMany(models.questionoption, {as: 'question_options'});
            
            var question_build = models.question.build(resultData);
            var question_detail_build = models.questiondetail.build(resultData.question_details);

            var errors = [];
            async.parallel([
                function (callback) {
                    question_build.validate().then(function (err) {
                        if (err !== null) {
                            errors = errors.concat(err.errors);
                            callback(null, errors);
                        } else {
                            callback(null, errors);
                        }
                    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error8", lang: req.lang}), url: true}));
                },
                function (callback) {
                    question_detail_build.validate().then(function (err) {
                        if (err !== null) {
                            errors = errors.concat(err.errors);
                            callback(null, errors);
                        } else {
                            callback(null, errors);
                        }
                    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error7", lang: req.lang}), url: true}));
                },
                function (callback) {
                    async.forEachOf(resultData.question_options, function (values, key, callback) {
                        var question_option_build = models.questionoption.build(values);
                        question_option_build.validate().then(function (err) {
                            if (err != null) {
                                async.forEach(err.errors, function (errObj, inner_callback) {
                                    errObj.path = errObj.path + '_' + key;
                                    errors = errors.concat(errObj);
                                });
                            }
                            callback(null, errors);

                        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error6", lang: req.lang}), url: true}));
                    }, function (err) {
                        callback(null, errors);
                    });
                },
            ], function (err, errors) {
                var merged = [].concat.apply([], errors);
                var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
                if (uniqueError.length === 0) {

                    module.exports.checkIsAnyAnswerMarked(resultData, function(getStatus) {
                        if(getStatus.status === true) {
                            if (typeof req.id !== 'undefined' && req.id !== '') {
                                models.question.update(resultData, {
                                    where: {id: req.id}
                                }).then(function(resp){
                                    async.parallel([
                                        function (callback) {
                                            models.questiondetail.update(resultData.question_details, {where: {questionId: req.id}}).then(function (results) {
                                                callback(null);
                                            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error5", lang: req.lang}), url: true}));
                                        },
                                        function (callback) {
                                            async.forEach(resultData.question_options, function (dataValues, callback1) {
                                                var getOpId = dataValues.id;
                                                delete dataValues.id;
                                                models.questionoption.update(dataValues, {
                                                    where: { id: getOpId }
                                                }).then(function (results) {
                                                    callback1(null);
                                                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error4", lang: req.lang}), url: true}));
                                            }, function (innErrr) {
                                                callback(null);
                                            });
                                        },
                                    ], function (saveErr) {
                                        res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang})});
                                    });
                                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error3", lang: req.lang}), url: true}));
                            } else {
                                var langId = parseInt(resultData.languageId);
                                models.question.create(resultData, {include: [questionHasOne, questionHasMany]}).then(function(data){
                                    if (langId === 1) {
                                        res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                                    } else {
                                        resultData.question_details.questionId = data.id;
                                        resultData.question_details.languageId = 1;
                                        models.questiondetail.create(resultData.question_details).then(function(){
                                            res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                                        })
                                    }
                                })
                            }
                        } else {
                            res({status:false, message:language.lang({key:getStatus.message, lang:req.lang})});
                        }

                    })

                } else {
                    language.errors({errors:uniqueError, lang:req.lang}, function(errors){
                        var newArr = {};
                        newArr.errors = errors;
                        res(newArr);
                    });
                }
            });
        })
    }

    this.setData = function(req, res) {

        var common_body_data = {
            masterId: req.masterId,
            academicSessionId: req.academicSessionId,
            languageId: req.languageId,
            userId: req.userId,
            classId: req.classId,
            subjectId: req.subjectId,
            time_to_attempt_question: req.time_to_attempt_question,
            questionControlTypeId: req.questionControlTypeId,
            number_of_options: req.number_of_options,
            question_type_slug: req.question_type_slug
        };

        var common_question_details = {
            masterId: req.masterId,
            languageId: req.languageId,
            tags_for_search: req.tags_for_search,
            comments: req.comments
        };

        switch(req.question_type_slug) {
            case 'single_choice':
            case 'multi_choice':
                var setData = common_body_data;
                    
                setData.question_details = common_question_details;
                setData.question_details.question_title = "undefined" === typeof req.question_title ? '' : req.question_title;

                question_options = [];
                for(var i = 0; i < req.number_of_options; i++) {

                    var is_answered_status;
                    if(req.question_type_slug === 'single_choice') {
                        is_answered_status = req.is_answered_marked == i ? 1 : 0;
                    }
                    if(req.question_type_slug === 'multi_choice') {
                        var getIndex = i;
                        is_answered_status = typeof req.is_answer_marked !== "undefined" && req.is_answer_marked.indexOf(getIndex.toString()) !== -1 ? 1 : 0;
                    }

                    if(typeof req['option_id_'+i] !== "undefined" && req['option_id_'+i] != "") {
                        question_options.push({
                            id: req['option_id_'+i],
                            masterId: req.masterId,
                            option_title: req['option_title_'+i],
                            is_answered_marked: is_answered_status,
                            languageId: req.languageId,
                        });
                    } else {
                        question_options.push({
                            masterId: req.masterId,
                            option_title: req['option_title_'+i],
                            is_answered_marked: is_answered_status,
                            languageId: req.languageId,
                        });
                    }
                }
                setData.question_options = question_options;

                res(setData);
                break;
            case 'text_type':
                var setData = common_body_data;
                    
                setData.question_details = common_question_details;
                setData.question_details.question_title = "undefined" === typeof req.question_title ? '' : req.question_title;

                delete setData.number_of_options;

                res(setData);
                break;
            default:
                var setData = common_body_data;
                    
                setData.question_details = common_question_details;

                res(setData);
        }

    }

    this.checkIsAnyAnswerMarked = function(req, res) {
        switch(req.question_type_slug) {
            case 'single_choice':
            case 'multi_choice':
                var getObj = question_options.find((o, i) => {
                    if (o.is_answered_marked === 1) {
                        return true; // stop searching
                    }
                });
                var setResponse = {status: typeof getObj === "undefined" ? false : true, message: req.question_type_slug === "single_choice" ? "Please mark one option as a answer" : "Please mark at least one option as answer"}
                res(setResponse);
                break;
            default: 
                res({status: true})
        }
    }

    /*
     * get By ID
     */
    this.getById = function(req, res) {
        var isWhere = {};
        isWhere.questiondetail = language.buildLanguageQuery(
            isWhere.questiondetail, req.langId, '`question`.`id`', models.questiondetail, 'questionId'
        );
        isWhere.questionoption = language.buildLanguageQuery(
            isWhere.questionoption, '', '`question`.`id`', models.questionoption, 'questionId'
        );

        models.question.belongsTo(models.questioncontroltype, {foreignKey: 'questionControlTypeId', targetKey: 'id'});
        models.questioncontroltype.hasMany(models.questioncontroltypedetail, {foreignKey: 'questionControlTypeId', sourceKey: 'id'});
        /*isWhere.questioncontroltypedetail = language.buildLanguageQuery(
            isWhere.questioncontroltypedetail, req.langId, '`question_control_type`.`id`', models.questioncontroltypedetail, 'questionControlTypeId'
        );*/

        models.question.hasMany(models.questiondetail);
        models.question.hasMany(models.questionoption);
        models.question.findOne({
            include: [
                {model: models.questiondetail, where:isWhere.questiondetail}, 
                {model: models.questionoption, where:isWhere.questionoption, required: false},
                {model: models.questioncontroltype, where:{}, include: [{model: models.questioncontroltypedetail}]},
            ],
            where:{
                id:req.id,
                masterId: req.masterId
            }
        }).then(function(data){
            let classFunc = req.user_type === "teacher" ? "getAllbcsByTeacher" : "getAllbcsByInstitute";
            let subjectFunc = req.user_type === "teacher" ? "getSubjectByTeacher" : "getSubjectByInstitute";

            utils[classFunc]({academicSessionId: req.academicSessionId, masterId: req.masterId, langId: req.langId, userId: req.userId}, function(classes) {
                utils[subjectFunc]({academicSessionId: req.academicSessionId, masterId: req.masterId, langId: req.langId, bcsMapId: data.classId, userId: req.userId}, function(subjects) {
                    questioncontroltype.getAll(req, function(questionCData) {
                        res({data: data, classes: classes, subjects: subjects, question_control_types: questionCData.question_control_types})
                    });
                })
            })
            //res(data);
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    };

    this.list = function(req, res) {

        var setPage = req.app.locals.site.page;
        var currentPage = 1;
        var pag = 1;
        if (typeof req.query.page !== 'undefined') {
            currentPage = +req.query.page;
            pag = (currentPage - 1)* setPage;
            delete req.query.page;
        } else {
            pag = 0;
        }

        var reqData = req.body;
        if(typeof req.body.data !== 'undefined'){
            reqData = JSON.parse(req.body.data);
        }

        var isWhere = {};

        if (req.query) {
            var responseData = {};
            responseData.question = {masterId:reqData.masterId, academicSessionId:reqData.academicSessionId};
            async.forEach(Object.keys(req.query), function (item, callback) {
                if (req.query[item] !== ''){
                    var modelKey = item.split('__');
                    if(typeof responseData[modelKey[0]] =='undefined'){
                        var col = {};
                        col[modelKey[1]] = {$like: '%' + req.query[item] + '%'};
                        responseData[modelKey[0]] = col;
                    } else {
                        responseData[modelKey[0]][modelKey[1]] = {$like: '%' + req.query[item] + '%'};
                    }
                }
                callback();
            }, function () {
                isWhere = responseData;
            });
        }

        models.question.hasMany(models.questionoption);

        models.question.hasMany(models.questiondetail);
        isWhere.questiondetail = language.buildLanguageQuery(
            isWhere.questiondetail, reqData.langId, '`question`.`id`', models.questiondetail, 'questionId'
        );

        models.question.belongsTo(models.questioncontroltype, {foreignKey: 'questionControlTypeId', targetKey: 'id'});
        models.questioncontroltype.hasMany(models.questioncontroltypedetail, {foreignKey: 'questionControlTypeId', sourceKey: 'id'})
        /*isWhere.questioncontroltypedetail = language.buildLanguageQuery(
            isWhere.questioncontroltypedetail, reqData.langId, '`question_control_type`.`id`', models.questioncontroltypedetail, 'questionControlTypeId'
        );*/

        models.question.findAndCountAll({
            include: [
                {model: models.questiondetail, where:isWhere.questiondetail, /*group:['questionId'],*/},
                {model: models.questionoption, where:{}, /*group:['questionId'],*/ required: false},
                {model: models.questioncontroltype, where:{}, include: [{model: models.questioncontroltypedetail}]},
            ],
            where: isWhere.question,
            order: [
                ['id', 'DESC']
            ],
            distinct: true, 
            limit: setPage,
            offset: pag 
        }).then(function(result){
            var totalData = result.count;
            var pageCount = Math.ceil(totalData / setPage);
            res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));

    }

    this.listForMapQustion = function(req, res) {
        var isWhere = {};
        isWhere.question = {
            masterId: req.masterId,
            academicSessionId: req.academicSessionId,
            languageId: req.langId,
            userId: req.userId,
            classId: req.classId,
            subjectId: req.subjectId
        }

        models.question.hasMany(models.questionoption);

        models.question.hasMany(models.questiondetail);
        isWhere.questiondetail = language.buildLanguageQuery(
            isWhere.questiondetail, req.langId, '`question`.`id`', models.questiondetail, 'questionId'
        );

        models.question.belongsTo(models.questioncontroltype, {foreignKey: 'questionControlTypeId', targetKey: 'id'});
        models.questioncontroltype.hasMany(models.questioncontroltypedetail, {foreignKey: 'questionControlTypeId', sourceKey: 'id'});
        /*isWhere.questioncontroltypedetail = language.buildLanguageQuery(
            isWhere.questioncontroltypedetail, req.langId, '`question_control_type`.`id`', models.questioncontroltypedetail, 'questionControlTypeId'
        );*/

        models.question.findAll({
            include: [
                {model: models.questiondetail, where:isWhere.questiondetail, group:['questionId'], required: false},
                {model: models.questionoption, where:{}, group:['questionId'], required: false},
                {model: models.questioncontroltype, where:{}, include: [{model: models.questioncontroltypedetail}]}
            ],
            where: isWhere.question,
            order: [
                ['id', 'ASC']
            ],
            distinct: true
        }).then(function(result){
            res(result);
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
    }

    this.bulkupload = function(req, res) {
        var langId = req.langId, 
        masterId = req.masterId, 
        academicSessionId = req.academicSessionId,
        userId = req.userId, 
        classId = req.classId, 
        subjectId = req.subjectId, 
        questionControlTypeId = req.questionControlTypeId, 
        number_of_options = 4, 
        question_type_slug = req.question_type_slug;

        var workbook = XLSX.readFile(req.file);
        const defaultHeaders = ["Question Title", "Option A", "Option B", "Option C", "Option D", "Answer(A,B,C,D)", "Time to attempt question", "Tags for search", "Comments"];
        
        const fieldsForHeaders = {
            "Question Title": "question_title", 
            "Option A": "option_1",
            "Option B": "option_2",
            "Option C": "option_3",
            "Option D": "option_4",
            "Time to attempt question": "time_to_attempt_question", 
            "Tags for search": "tags_for_search", 
            "Comments": "comments", 
            "Answer(A,B,C,D)": "answer_value"
        };
        var getRight = {
            'option_1': 'A',
            'option_2': 'B',
            'option_3': 'C',
            'option_4': 'D'
        }
        var dataToSave = [], excelDataErrors = [];

        var dataValidationErrors = [];

        const totalSheets = workbook.SheetNames.length;
        async.forEachOf(workbook.SheetNames, function (sheetName, sheetNameIndex, sheetNameCallback) {
            var sheet = workbook.Sheets[sheetName], range = XLSX.utils.decode_range(sheet["!ref"]), C, R = range.s.r, headers = [];

            for (C = range.s.c; C <= range.e.c; ++C) {
                var cell = sheet[XLSX.utils.encode_cell({c:C, r:R})], hdr = "UNKNOWN " + C;
                cell && cell.t && (hdr = XLSX.utils.format_cell(cell));
                headers.push(hdr);
            }
            
            //For check the heading string 
            Array.prototype.diff = function(a){return this.filter(function(b){ return 0 > a.indexOf(b) })};
            var differHeaders = defaultHeaders.diff(headers)

            if(0 === differHeaders.length) {
                var getAllRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                if(0 < getAllRows.length) {
                    var singleQuestionData = [];
                    async.forEachOf(getAllRows, function (dataRow, dataIterationIndex, dataRowCallback) {    
                        var setData = {}, isAnswerStatus = 0, currentActiveRow = dataIterationIndex + 2;

                        async.forEachOf(headers, function (headersRow, headersIterationIndex, headersRowCallback) {
                            if("undefined" === typeof fieldsForHeaders[headersRow]) {
                                headersRowCallback();
                            } else {
                                setData.languageId = langId, setData.masterId = masterId, setData.userId = userId, setData.classId = classId, setData.subjectId = subjectId, setData.questionControlTypeId = questionControlTypeId, setData.number_of_options = number_of_options;

                                if(-1 !== ["question_title", "time_to_attempt_question", "option_1", "option_2", "option_3", "option_4"].indexOf(fieldsForHeaders[headersRow])) {
                                    "" != dataRow[headersRow] && "undefined" != typeof dataRow[headersRow] ? 
                                    setData[fieldsForHeaders[headersRow]] = dataRow[headersRow] : 
                                    dataValidationErrors.push("Row " + currentActiveRow + " in sheet " + sheetName + " : " + headersRow + " cannot be left empty");
                                    
                                    headersRowCallback();
                                }

                                if(fieldsForHeaders[headersRow] == "time_to_attempt_question" && dataRow[headersRow] !== ''){
                                    if(isNaN(dataRow[headersRow])){
                                        dataValidationErrors.push("Row " + currentActiveRow + " in sheet " + sheetName + " : " + headersRow + " must be a number");
                                    }
                                }
                                
                                if("answer_value" === fieldsForHeaders[headersRow]) {
                                    if("" != dataRow[headersRow] && "undefined" != typeof dataRow[headersRow]) {
                                        let noOfAnswers = dataRow[headersRow].split(",");
                                        
                                        let isAnswerFine = noOfAnswers.every(function(value) { return ["A", "B", "C", "D"].indexOf(value) >= 0; })

                                        if(isAnswerFine) {
                                            if("single_choice" === question_type_slug) {
                                                1 === noOfAnswers.length ? 
                                                setData[fieldsForHeaders[headersRow]] = dataRow[headersRow].split(",") : 
                                                dataValidationErrors.push("Row " + currentActiveRow + " in sheet " + sheetName + 
                                                " : " + " Only one answer allow for single choice type question");
                                            } else {
                                                4 >= noOfAnswers.length ? 
                                                setData[fieldsForHeaders[headersRow]] = dataRow[headersRow].split(",") : 
                                                dataValidationErrors.push("Row " + currentActiveRow + " in sheet " + sheetName + 
                                                " : " + "Max four option allow as answer");
                                            }    
                                        } else {
                                            dataValidationErrors.push("Row " + currentActiveRow + " in sheet " + sheetName + 
                                            " : Invalid answer");
                                        }
                                    } else {
                                        dataValidationErrors.push("Row " + currentActiveRow + " in sheet " + sheetName + 
                                            " : " + headersRow + " cannot be left empty");
                                    }
                                    headersRowCallback();
                                }
                                if("tags_for_search" === fieldsForHeaders[headersRow] || "comments" === fieldsForHeaders[headersRow]) {
                                    setData[fieldsForHeaders[headersRow]] = typeof dataRow[headersRow] === "undefined" ? '' : dataRow[headersRow];
                                    headersRowCallback();
                                }
                            }
                        }, function(headersRowError) {
                            if (headersRowError) res({status:false, error: true, error_description: language.lang({key: "Internal error", lang: req.lang}), url: true})
                            if(dataValidationErrors.length === 0) {
                                let answeredOptionArray = setData.answer_value;

                                var setOptionsData = [];
                                for(var i = 1; i <= 4; i++) {
                                    setOptionsData.push({
                                        masterId: masterId,
                                        languageId: langId,
                                        option_title: setData["option_"+i],
                                        is_answered_marked: -1 === answeredOptionArray.indexOf(getRight["option_"+i]) ? 0 : 1
                                    })
                                    delete setData["option_"+i];
                                }
                                setData.question_options = setOptionsData;
                                setData.question_details = { masterId: masterId, languageId: langId, question_title: setData.question_title, tags_for_search: setData.tags_for_search, comments: setData.comments };
                                delete setData.question_title, delete setData.tags_for_search, delete setData.comments, delete setData.answer_value;
                                singleQuestionData.push(setData);
                                dataRowCallback();
                            } else {
                                dataRowCallback();    
                            }
                        });
                    }, function (dataRowError) {
                        if (dataRowError) res({status:false, error: true, error_description: language.lang({key: "Internal error", lang: req.lang}), url: true})
                        if(dataValidationErrors.length === 0) singleQuestionData.map(function(questionData, index) { dataToSave.push(questionData); });
                        sheetNameCallback();
                    });
                } else {
                    var setErrMessage = "Cannot read data from an empty file.";
                    res({status:false, error: true, error_description: language.lang({key: setErrMessage, lang: req.lang}), url: true})  
                }
            } else {
                var setErrMessage = "Headers are not same as of the sample excel file";
                res({status:false, error: true, error_description: language.lang({key: setErrMessage, lang: req.lang}), url: true})
            }
        }, function(sheetNameError) {
            if (sheetNameError) res({status:false, error: true, error_description: language.lang({key: "Internal error", lang: req.lang}), url: true})

            if(dataValidationErrors.length === 0) {
                res({status:true, data:dataToSave});
            } else {
                res({status:false, lang: req.lang, errors: dataValidationErrors});
            }
        })
    }

    this.saveBulkQuestions = function(req, res) {
        async.forEachOf(req.data, function (data, dataIndex, saveCallback) {
            var questionHasOne = models.question.hasOne(models.questiondetail, {as: 'question_details'});
            var questionHasMany = models.question.hasMany(models.questionoption, {as: 'question_options'});   
            data.classId = req.classId; data.subjectId = req.subjectId; data.academicSessionId = req.academicSessionId;
            //saveCallback();
            models.question.create(data, {include: [questionHasOne, questionHasMany]}).then(function(data){
                saveCallback();
            }).catch((errr) => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }, function(headersRowError) {
            if(headersRowError) res({status:false, error: true, error_description: language.lang({key: "Internal error", lang: req.lang}), url: true})
            res({status:true, message:language.lang({key:"Uploaded Successfully", lang:req.lang}), data:[]});
        })
    }

    this.remove = async req => {
        try {
            await models.question.destroy({where: {id: req.id}});
        } catch (err) {
            return {
                status: false,
                message: language.lang({key: 'Can not delete question, It is being used.'}),
            };
        }

        return {
            status: true,
            message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
        };
    };
}

module.exports = new Question();
