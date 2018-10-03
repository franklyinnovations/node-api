var async = require('async');
const models = require('../models');
var language = require('./language');
const utils = require('../utils');

function Board() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    models.boarddetail.belongsTo(models.board);
    var BoardHasOne = models.board.hasOne(models.boarddetail, {as: 'board_detail'});
    req.board_detail.languageId = req.langId;
    req.board_detail.masterId = req.masterId;
    var board = models.board.build(req);
    var boardDetails = models.boarddetail.build(req.board_detail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
        board.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }

            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        },
        function (callback) {
            boardDetails.validate().then(function (err) {
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
          if (typeof req.id !== 'undefined' && req.id !== '') {
            req.board_detail.boardId = req.id;
            models.board.update(req,{where: {id:req.id}}).then(function(data){
              models.boarddetail.find({where:{boardId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.board_detail.id = resultData.id;
                  models.boarddetail.update(req.board_detail, {where:{id:resultData.id}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.board_detail.id;
                  models.boarddetail.create(req.board_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            var langId = parseInt(req.board_detail.languageId);
            models.board.create(req, {include: [BoardHasOne]}).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
                req.board_detail.boardId = data.id;
                req.board_detail.languageId = 1;
                models.boarddetail.create(req.board_detail).then(function(){
                  res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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
    //var data = JSON.parse(req.body.data);

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
      responseData.board = {masterId:reqData.masterId};
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

    models.board.hasMany(models.boarddetail);
    isWhere.boarddetail = language.buildLanguageQuery(
      isWhere.boarddetail, reqData.langId, '`board`.`id`', models.boarddetail, 'boardId'
    );
    Promise.all([
      models.board.findAndCountAll({
        include: [
          {model: models.boarddetail, where:isWhere.boarddetail},
        ],
        where: isWhere.board,
        order: [
          ['id', 'DESC']
        ],
        distinct: true,
        limit: setPage,
        offset: pag, subQuery: false
      }),
    ])
    .then(([result]) => {
      var totalData = result.count;
      var pageCount = Math.ceil(totalData / setPage);
      res({
        data:result.rows,
        totalData: totalData,
        pageCount: pageCount,
        pageLimit: setPage,
        currentPage:currentPage,
      });
    })
    // .catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
  };

  /*
   * get By ID
  */
 this.getById = function(req, res) {
    models.board.hasMany(models.boarddetail);
    var isWhere = {};
    isWhere.boarddetail = language.buildLanguageQuery(
      isWhere.boarddetail, req.langId, '`board`.`id`', models.boarddetail, 'boardId'
    );
    models.board.find({
      include: [
        {model: models.boarddetail, where:isWhere.boarddetail}],
        where:{
          id:req.id,
          masterId: req.masterId
        }
      }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get All Boards
  */
 this.getAllBoard = function(req, res) {
    models.board.hasMany(models.boarddetail);
    var isWhere = {};
    isWhere.boarddetail = language.buildLanguageQuery(
      isWhere.boarddetail, req.langId, '`board`.`id`', models.boarddetail, 'boardId'
    );
    
    models.board.findAll({
      include: [
        {model: models.boarddetail, where:isWhere.boarddetail}],
        where:{is_active:1, masterId:req.masterId},
        order: [
          ['display_order', 'ASC'],
          ['id', 'ASC']
        ]}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.board.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.remove = async req => {
    try {
      await models.board.destroy({where: {id: req.id}});
    } catch (err) {
      return {
        status: false,
        message: language.lang({key: 'Can not delete curriculum type, It is being used.'}),
      }
    }

    return {
      status: true,
      message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
    };
  };
}

module.exports = new Board();
