var async = require('async');
const models = require('../models');
var language = require('./language');
var mail = require('./mail');

function Feedback() {
  /*
   * save
  */
  this.sentQuery = function(req, res){
    if(!req.lang){
      req.lang = 'en';
    }
    var feedback = models.feedback.build(req);
    var errors = [];
    async.parallel([
        function (callback) {
        feedback.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }

            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }
    ], function (err, errors) {
        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
        if (uniqueError.length === 0) {
          models.feedback.create(req).then(function(data){
          res({status:true, message:language.lang({key:"Your Query has been submitted Successfully", lang:req.lang}), data:data});
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        } else {
          language.errors({errors:uniqueError, lang:req.lang}, function(errors){
            var newArr = {};
            newArr.errors = errors;
            res(newArr);
          });
        }
    });
  };


  /*
   * list of all
  */
 this.list = function(req, res) {
    var setPage = req.app.locals.site.page;
    var currentPage = 1;
    var isWhere = {};
    var pag = 1;
    if (typeof req.query.page !== 'undefined') {
        currentPage = +req.query.page;
        pag = (currentPage - 1)* setPage;
        delete req.query.page;
    } else {
        pag = 0;
    }
     /*
    * for  filltering
    */
    var reqData = req.body;
	if(typeof req.body.data !== 'undefined'){
		reqData = JSON.parse(req.body.data);
	}
    var isWhere = {};
    var orderBy = '';
    if (req.query) {
      var responseData = {};
      responseData.feedback = {masterId:reqData.masterId};
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
    //isWhere['delete'] = 1;
    orderBy = 'id DESC';

    models.feedback.belongsTo(models.user);
    models.user.hasMany(models.userdetail);

    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
    );

    models.feedback.findAndCountAll({
      include:[{
        model:models.user,
        include:[{
          model:models.userdetail,
          where:isWhere.userdetail
        }]
      }],
      where: isWhere.feedback,
      order: [
        ['id', 'DESC']
      ],
      limit: setPage,
      offset: pag, subQuery: false
    }).then(function(result){
      var totalData = result.count;
      var pageCount = Math.ceil(totalData / setPage);
      res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
  };

  /*
   * get By ID
  */
 this.getById = function(req, res) {
    var isWhere = {};
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
    );
    models.feedback.belongsTo(models.user);
    models.user.hasMany(models.userdetail);
    models.feedback.find({
      include:[{
        model:models.user,
        include:[{
          model:models.userdetail,
          where:isWhere.userdetail
        }]
      }],
      where:{
        id:req.id,
        masterId: req.masterId
      },
      masterId:req.masterId
    }).then(function(data){
      res({status:false, data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
}

module.exports = new Feedback();
