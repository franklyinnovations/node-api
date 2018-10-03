var async = require('async');
const models = require('../models');
var language = require('./language');
var board = require('./board');
var classes = require('./class');
var feehead = require('./feehead');
var feepenalty = require('./feepenalty');
var feediscount = require('./feediscount');


function Payfee() {
  /*
   * save
  */
  this.save = function(req, res){

    
    module.exports.feeCalc(req,function(data){

    // var payFeeDetails = models.payfee.hasMany(models.payfeedetails, {as: 'payfeedetails'});
    // models.payfee.create(req,{include: [payFeeDetails]}).then(function(feedata){  

    // }); 

    });

  };


  this.createFeeallocation = function(req, res){
    var feeId = req.feeId;
    var feeData = [];
    var masterId = req.masterId ;
    var count = 1;
    var amount = req.amount;
    async.forEach(Object.keys(amount), function (item, callback) {
        var saveData = {};
          saveData.feeId = feeId;
          saveData.masterId = masterId;
          saveData.feeHeadId = item;

          saveData.monthIds = req.monthIds[item];

          if (req.amount[item] !=='') {
            saveData.amount = req.amount[item];
          } else {
            saveData.amount = 0.00;
          }

          feeData.push(saveData);
        if (Object.keys(amount).length ==count) {
          callback(feeData);
        }
        count++;
    }, function () {
      models.feeallocation.destroy({where:{feeId:feeId}}).then(function(){
        models.feeallocation.bulkCreate(feeData).then(function(data){
          res(data);
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      });
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
      responseData.fee = {academicSessionId:reqData.academicSessionId};
      responseData.fee.masterId = reqData.masterId;
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

    models.fee.belongsTo(models.board, {foreignKey:'boardId'});
    models.board.hasMany(models.boarddetail);
    models.fee.belongsTo(models.classes, {foreignKey:'classId'});
    models.classes.hasMany(models.classesdetail);
    
    isWhere.boarddetail = language.buildLanguageQuery(
      isWhere.boarddetail, reqData.langId, '`board`.`id`', models.boarddetail, 'boardId'
    );
    isWhere.classesdetail = language.buildLanguageQuery(
      isWhere.classesdetail, reqData.langId, '`class`.`id`', models.classesdetail, 'classId'
    );

    models.fee.findAndCountAll({
      include: [
        {model:models.board, include: [{model: models.boarddetail, where:isWhere.boarddetail}]},
        {model:models.classes, include: [{model: models.classesdetail, where:isWhere.classesdetail}]},
      ],
      where: isWhere.fee,
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
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
  };


  /*
   * get By ID
  */
 this.getById = function(req, res) {


    models.feehead.hasMany(models.feeheaddetail);
    models.feehead.hasOne(models.feeallocation);

    models.fee.hasMany(models.feeallocationdiscounts);
    models.fee.hasMany(models.feeallocationpenalties);


    //models.feeallocationdiscounts.belongsToMany(models.fee_discounts);
    models.feeallocationdiscounts.belongsTo(models.fee_discounts);

    models.feeallocationpenalties.belongsTo(models.fee_penalties);

    models.fee_discounts.hasOne(models.fee_discount_details);



    models.fee_penalties.hasMany(models.fee_penalty_details);
    models.fee_penalties.hasMany(models.fee_penalty_slabs);  


    //var FeeDiscountHasOne = models.fee_discounts.hasOne(models.fee_discount_details, {as: 'fee_discount_details'});

    var isWhere = {};
    isWhere.feeheaddetail = language.buildLanguageQuery(
      isWhere.feeheaddetail, req.langId, '`feehead`.`id`', models.feeheaddetail, 'feeHeadId'
    );

    models.fee.find({where:{id:req.id},
      
      include: [
      {
        model: models.feeallocationdiscounts,
        include: [
        {model: models.fee_discounts,include: [{model: models.fee_discount_details}]}
        ]
      },
      {
        model: models.feeallocationpenalties,
        include: [
        {model: models.fee_penalties,include:[{model: models.fee_penalty_details},{model: models.fee_penalty_slabs}]}

        ]
      }
      ]

      }).then(function(data){
      models.feehead.findAll({
        include: [
          {model: models.feeheaddetail, where:isWhere.feeheaddetail},
          {model: models.feeallocation, attributes:['amount'], where:{feeId:req.id}, required:false},
        ],
        attributes:['id', 'mode'],
        where:{is_active:1, masterId:req.masterId},
        order:[
          ['id', 'desc'],
          [models.feeallocation, 'id', 'desc']
        ]
      }).then(function(feeheads){
        module.exports.getMetaInformations(req, function(result){

          feepenalty.getAllFeePenalty(req, function(feepenalty){

          feediscount.getAllFeediscount(req, function(feediscount){  


          res({feeData:data, feeheadData:feeheads, boards:result.boards, classes:result.classes,feepenalty:feepenalty,feediscount:feediscount});

          });

          });

        })
      })//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    })//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.fee.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getMetaInformations = function(req, res){

    board.getAllBoard(req, function(boards){
      classes.getAllClasses(req, function(classes){
        feehead.getAllFeeheads(req, function(feeheads){
          feepenalty.getAllFeePenalty(req, function(feepenalty){

          feediscount.getAllFeediscount(req, function(feediscount){  

          res({boards:boards, classes:classes, feeheads:feeheads,feepenalty:feepenalty,feediscount:feediscount});

          });

          });
        });
      });
    });
  };



  this.feeCalc=function(req,res){

  if(req.monthIds && req.monthIds.length){
    var mnthArr=req.monthIds;
  }else{
    var mnthArr=[1,2,3,4,5,6,7,8,9,10,11,12]; 
  }

  
  var mainArr=[];
  var mnthObj={}; 
  async.forEach(mnthArr, function (mnths, callback) {

    var qry=" SELECT f.id,f.classId,fa.monthIds,fa.amount,fh.fee_type,fh.mode,if(pf.id,'paid','unpaid') fee_status,pf.total,pf.pay_date,pf.discount,pf.pay_mode,pf.doc_no ,if(isnull(pf.id) and curdate() > '2017-12-15',1,0) is_py"
    qry +=' FROM '
    qry +=' fees f left join fee_allocations fa on f.id=fa.feeId '
    qry +='  left join fee_heads fh on fa.feeHeadId=fh.id '
    qry +=' left join bcs_maps on f.classId=bcs_maps.classId '
    qry += ' left join pay_fees pf on pf.classId=f.classId and studentId=? and fa.monthIds=pf.monthId '
    qry +=" where bcs_maps.id=? and (find_in_set(?,fa.monthIds) > 0 or mode='Monthly') " ;  


    models.sequelize.query(qry, {replacements: [req.studentId,req.bcsMapId,mnths], type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
       
      var lastPay={monthIds:mnths};
      if(result.length){
      lastPay['monthIds']=mnths//result[0]['monthIds']; 
      lastPay['fee_status']=result[0]['fee_status']; 
      lastPay['total']=result[0]['total']; 
      lastPay['pay_date']=result[0]['pay_date']; 
      lastPay['pay_fee']=0//result[0]['pay_date'];
      lastPay['discount']=0
      }
      lastPay['details']=result;
      mainArr.push(lastPay);
      //mnthObj[mnths]=lastPay;   
      callback();

    });  
  
    }, function () {

      res(mainArr);  
  
    });
  




  };





  this.feeCalcByMonth=function(req,res){

  if(req.monthIds && req.monthIds.length){
    var mnthArr=req.monthIds;
  }else{
    var mnthArr=['1','2','3','4','5','6','7','8','9','10','11','12'];  
  }

  
  var mainArr=[];
  var mnthObj={};
  var queryCon=''; 
  var queryArr=[]; 

  queryArr.push(req.studentId);
  queryArr.push(req.bcsMapId);

  async.forEach(mnthArr, function (mnths, callback) {


  queryCon +=" find_in_set(?,fa.monthIds) > 0  or "  
  queryArr.push(mnths);

  callback();  

  }, function () {

    //res(mainArr);  
    var qry=" SELECT fh.id fee_haed_id,f.id,f.classId,group_concat(fa.monthIds) monthIds,fa.amount,fh.fee_type,fh.mode,if(pf.id,'paid','unpaid') fee_status,pf.total,pf.pay_date,pf.discount,pf.pay_mode,pf.doc_no ,if(isnull(pf.id) and curdate() > '2017-12-15',1,0) is_py"
    qry +=' FROM '
    qry +=' fees f left join fee_allocations fa on f.id=fa.feeId '
    qry +='  left join fee_heads fh on fa.feeHeadId=fh.id '
    qry +=' left join bcs_maps on f.classId=bcs_maps.classId '
    qry += ' left join pay_fees pf on pf.classId=f.classId and studentId=? and fa.monthIds=pf.monthId '
    qry +=" where bcs_maps.id=? and ( " + queryCon + " mode='Monthly') group by fh.id " ; 


    var finalArr=[];
    models.sequelize.query(qry, {replacements:queryArr, type: models.sequelize.QueryTypes.SELECT}).then(function (result) {

  
    //res(result);
    var totalAmu=0;
    async.forEach(result, function (resultList, callback) {

    var objData={};  
    
    objData[resultList.fee_type]={};


    var monthIdsArr=resultList.monthIds.split(',');

    var array3 = monthIdsArr.filter(function(arr2Val) {
            return mnthArr.indexOf(arr2Val) !== -1;
    });

    var acdArr=[];
    for(var i=0; i<array3.length;i++){

    //objData[resultList.fee_type]=resultList;//{[array3[i]]:resultList}  
    totalAmu+=parseFloat(resultList.amount);
    acdArr.push(resultList);

    }

    objData[resultList.fee_type]['month']=acdArr;

    //monthIds

    finalArr.push(objData);
          
 
    callback();
    }, function () {

      var objHead={"head":finalArr,total:totalAmu}

      res(objHead);  
  
    });

    });  



  });  





       
      // var lastPay={monthIds:mnths};
      // if(result.length){
      // lastPay['monthIds']=mnths//result[0]['monthIds']; 
      // lastPay['fee_status']=result[0]['fee_status']; 
      // lastPay['total']=result[0]['total']; 
      // lastPay['pay_date']=result[0]['pay_date']; 
      // lastPay['pay_fee']=0//result[0]['pay_date'];
      // lastPay['discount']=0
      // }
      // lastPay['details']=result;
      // mainArr.push(lastPay);
      // //mnthObj[mnths]=lastPay;   
      // callback();

    
  
    
  




  };



}

module.exports = new Payfee();
