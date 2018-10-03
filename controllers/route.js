var async = require('async');
const models = require('../models');
var language = require('./language');

function Route() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    if (typeof req.routeaddresses === 'undefined' || req.routeaddresses.length < 2) {
      req.routeaddresse = '';
    }
    var RouteHasMany = models.route.hasMany(models.routeaddress, {as: 'routeaddresses'});
    var route = models.route.build(req);
    //var routeaddresses = models.routeaddress.build(req.routeaddresses);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
            route.validate().then(function (err) {
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
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) === pos;});
        if (uniqueError.length === 0) {
          req.routeaddresses = req.routeaddresses.filter(function(n){ return n; });
          if (typeof req.id !== 'undefined' && req.id !== '') {
            var newrouteaddresses = [];
            var addressIds = [];
            req.routeaddresses.forEach(function(item){
              item.routeId = req.id;
              if(item.id){
                addressIds.push(item.id);
              }
              newrouteaddresses.push(item);
            });

            let where = {routeId:req.id};

            if(addressIds.length > 0) {
              where.id = {$notIn:addressIds};
            }

            models.routeaddress.destroy({
              where
            }).then(function(data){
              return Promise.all([
                models.route.update(req, {
                  where:{
                    id:req.id
                  }
                }),
                models.routeaddress.bulkCreate(newrouteaddresses,{
                  updateOnDuplicate:['position'],
                  ignoreDuplicates:true
                })
              ])
            }).then(function(){
              res({
                status:true, 
                message:language.lang({key:"updatedSuccessfully", lang:req.lang}), 
                data:[]
              });
            }).catch(() => res({
              status:false, 
              error: true, 
              error_description: language.lang({key: "Internal Error", lang: req.lang}), 
              url: true
            }));
          } else {
            req.routeaddresses = req.routeaddresses.filter(function(n){ return n !== undefined; });
            models.route.create(req, {
              include: [RouteHasMany]
            }).then(function(data){
              res({
                status:true,
                message:language.lang({key:"addedSuccessfully", lang:req.lang}),
                data:data
              });
            }).catch(() => res({
              status:false,
              error: true,
              error_description: language.lang({key: "Internal Error", lang: req.lang}),
              url: true
            }));
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
      if (reqData.masterId !==1) {
        responseData.route = {masterId:reqData.masterId};
      }
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

    models.route.hasMany(models.routeaddress);
    models.route.findAndCountAll({
      include: [
        {model: models.routeaddress, where:isWhere.routeaddress, group:['routeId']},
      ],
      where: isWhere.route,
      order: [
        ['id', 'DESC'],
        [models.routeaddress, 'position', 'ASC']
      ],
      distinct: true,
      limit: setPage,
      offset: pag,
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
    models.route.hasMany(models.routeaddress);
    models.route.find({include: [{model: models.routeaddress}],
       where:{
        id:req.id,
        masterId: req.masterId
      },
       order: [
         [models.routeaddress, 'position', 'ASC']
       ]
     }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };


  /*
   * status update
  */
 this.status = function(req, res) {
    models.route.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };


  this.getRoutes = function(req, res){
    models.route.findAll({
      where:{
        is_active:1,
        masterId:req.masterId
      }
    }).then(function(result){
      res({
        status:true,
        data: result
      });
    }).catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: req.lang}),
      url: true
    }));
  };

  this.removeAddress = function(req, res){
    models.rvdhsmapaddress.find({
      where:{
        routeaddressId:req.id
      }
    }).then(function(result){
      if(result === null){
        res({
          status:true, 
        });
      } else {
        res({
          status:false, 
          message:language.lang({key:"unableToDeleteAddress", lang:req.lang})
        })
      }
    }).catch(() => res({
      status:false, 
      error: true, 
      error_description: language.lang({key: "Internal Error", lang: req.lang}), 
      url: true
    }));
  };

  this.viewAddress = function(req, res){
    models.routeaddress.findAll({
      where:{
        routeId:req.routeId
      },
      order: [
        ['position', 'ASC']
      ]
    }).then(function(result){
      res({status:true, data:result});
    }).catch(() => res({
      status:false, 
      error: true, 
      error_description: language.lang({key: "Internal Error", lang: req.lang}), 
      url: true
    }));
  };

  this.remove = async req => {
    try {
      await models.route.destroy({where: {id: req.id}});
    } catch (err) {
      return {
        status: false,
        message: language.lang({key: 'Can not delete route, It is being used.'}),
      }
    }

    return {
      status: true,
      message: language.lang({key: 'deletedSuccessfully', lang: req.lang}),
    };
  };
}

module.exports = new Route();
