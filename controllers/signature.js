var async = require('async');
const models = require('../models');
var language = require('./language');

function Signature() {
  /*
   * saveTcSignature
  */
  this.saveTcSignature = function(req, res){
    if (typeof req.id !== 'undefined' && req.id !== '') {
      models.signature.update(req, {where:{id: req.id}, individualHooks: true}).then(function(data){
        res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }else{
      models.signature.create(req, {individualHooks: true}).then(function(data){
        res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }
  }

  /*
   * getTcSignature
  */
  this.tcSignatures = function (req) {
    return models.signature.find({
      where: {
        academicsessionId: req.academicsessionId,
        masterId: req.masterId,
        module: req.module
      }
    })
  .then((data)=> ({status: true, data}));
};
  
}

module.exports = new Signature();
