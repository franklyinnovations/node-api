var async = require('async');
const models = require('../models');
var language = require('./language');
var country = require('./country');
var state = require('./state');

function DealRegistration() {
  /*
   * save
  */
  this.save = function(req, res){
   var deal_registrations = models.dealregistration.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
        deal_registrations.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }

            })
        }
     ], function (err, errors) {
        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
        if (uniqueError.length === 0) {
          models.dealregistration.create(req).then(function(data){
            res({status:true, message:language.lang({key:'Details submitted succesfully.', lang:req.lang}), data:data});
            });
          
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

    models.dealregistration.findAndCountAll({
      where: isWhere.dealregistration,
      order: [
        ['id', 'DESC']
      ],
      limit: setPage,
      offset: pag
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
    models.dealregistration.belongsTo(models.country);
    models.country.hasMany(models.countrydetail);

    models.dealregistration.belongsTo(models.state);
    models.state.hasMany(models.statedetail);

    models.dealregistration.find({
      include: [
      {
        model: models.country,
        required: false,
        attributes: ['id'],
        include: [{
          model: models.countrydetail,
          attributes: ['name'],
          required: false,
          where: language.buildLanguageQuery(
            {}, req.langId, '`country`.`id`', models.countrydetail, 'countryId'
          )
        }]
      },
      {
        model: models.state,
        required: false,
        attributes: ['id'],
        include: [{
          model: models.statedetail,
          attributes: ['name'],
          required: false,
          where: language.buildLanguageQuery(
            {}, req.langId, '`state`.`id`', models.statedetail, 'stateId'
          )
        }]
      }],
      where:{id:req.id}
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getMetaInformations = function(req, res){
    country.getAllCountry(req, function(countries){
        res({countries:countries});
    });
  };

  this.getMetaStates = function(req, res){
    state.getAllState(req, function(states){
        res({states:states});
    });
  };
};


module.exports = new DealRegistration();
