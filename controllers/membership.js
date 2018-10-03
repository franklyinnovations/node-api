var async = require('async');
const models = require('../models');
var language = require('./language');

function Membership() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var MembershipHasOne = models.membership.hasOne(models.membershipdetail, {as: 'membership_detail'});
    req.membership_detail.languageId = req.langId;
    var membership = models.membership.build(req);
    var membershipDetails = models.membershipdetail.build(req.membership_detail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
      function (callback) {
        membership.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }

            });
        },
        function (callback) {
            membershipDetails.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }
            });
        }
    ], function (err, errors) {
        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
        if (uniqueError.length === 0) {
          if (typeof req.id !== 'undefined' && req.id !== '') {
            req.membership_detail.membershipId = req.id;
            models.membership.update(req,{where: {id:req.id}}).then(function(data){
              models.membershipdetail.find({where:{membershipId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.membership_detail.id = resultData.id;
                  models.membershipdetail.update(req.membership_detail, {where:{id:resultData.id, membershipId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  });
                } else {
                  delete req.membership_detail.id;
                  models.membershipdetail.create(req.membership_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  });
                }
              });
            });
          } else {
            var langId = parseInt(req.membership_detail.languageId);
            models.membership.create(req, {include: [MembershipHasOne]}).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
                req.membership_detail.membershipId = data.id;
                req.membership_detail.languageId = 1;
                models.membershipdetail.create(req.membership_detail).then(function(){
                  res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                });
              }
            });
          }
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
      responseData.membershipdetail = {};
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

    models.membership.hasMany(models.membershipdetail);
    isWhere.membershipdetail = language.buildLanguageQuery(
      isWhere.membershipdetail,
      req.langId,
      '`membership`.`id`',
      models.membershipdetail,
      'membershipId'
    );
    models.membership.findAndCountAll({
      include: [
        {model: models.membershipdetail, where:isWhere.membershipdetail},
      ],
      where: isWhere.membership,
      order: [
        ['id', 'DESC']
      ],
      distinct: true,
      limit: setPage,
      offset: pag, subQuery: false
    }).then(function(result){
      var totalData = result.count;
      var pageCount = Math.ceil(totalData / setPage);
      res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
    })
    .catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));;
  };

  /*
   * get By ID
  */
 this.getById = function(req, res) {
    models.membership.hasMany(models.membershipdetail);
    models.membership.find({include: [{model: models.membershipdetail, where: language.buildLanguageQuery({}, req.langId, '`membership`.`id`', models.membershipdetail, 'membershipId')}], where:{id:req.id}}).then(function(data){
      res(data);
    })
    .catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));;
  };

  /*
   * get All Country
  */
 this.getAllMembership = function(req, res) {
    models.membership.hasMany(models.membershipdetail);
    models.membership.findAll({include: [{model: models.membershipdetail, where: language.buildLanguageQuery({}, req.langId, '`membership`.`id`', models.membershipdetail, 'membershipId')}],  where:{is_active:1}}).then(function(data){
      res(data);
    })
    .catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));;
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.membership.update(req,{where:{id:req.id}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    })
    .catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));;
  };
}

module.exports = new Membership();
