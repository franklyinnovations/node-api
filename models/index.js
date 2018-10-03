'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
require('sequelize-isunique-validator')(Sequelize);
var basename  = path.basename(module.filename);
var env       = process.env.NODE_ENV || 'development';
var config    = require(__dirname + '/../config/config.json')[env];
var db        = {};
var moment    = require('moment');

if (config.use_env_variable) {
  var sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
  var sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(function(file) {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.studentrecord.addScope('transferred', function (date) {
  return{
    where: {
      record_status: 1,
      $or: [
        {transferred: 0},
        {transferred: 1, transerred_effective_from: {$gt:date}},
        {transferred: 2, transerred_effective_from: {$lte:date}}
      ],
    }
  }
});

db.studentrecord.addScope('transferred1', function (date) {
  return{
    where: {
      record_status: 1,
      $or: [
        {transferred: 0},
        {transferred: 1, transerred_effective_from: {$lt:date}},
        {transferred: 2, transerred_effective_from: {$lt:date}}
      ],
    }
  }
});

db.studentrecord.addScope('doa', function (date) {
  return{
    where: {
      doa: sequelize.literal('`student`.`doa` <= '+date+' ')
    }
  }
});

db.student.addScope('doa1', function (date) {
  return{
    where: {
      doa: {
          $lt: date
        }
    }
  }
});

db.studentrecord.addScope('tc', function (releaving_date, academicsessionId) {
  return{
    where: {
      studentId: {
        $notIn: sequelize.literal('(SELECT `studentId` FROM transfer_certificates WHERE releaving_date <= '+releaving_date+' and academicsessionId = '+academicsessionId+' and bcsmapId = `studentrecord`.`bcsMapId`)')
      }
    }
  }
});

//Student removed just after creating a TC, No comparision from date
db.studentrecord.addScope('tcwithoutdate', function (academicsessionId) {
  return{
    where: {
      studentId: {
        $notIn: sequelize.literal('(SELECT `studentId` FROM transfer_certificates WHERE academicsessionId = '+academicsessionId+' and bcsmapId = `studentrecord`.`bcsMapId`)')
      }
    }
  }
});

db.rvdhsmaprecord.belongsTo(db.transfercertificate,{
  foreignKey: 'studentId',
  targetKey: 'studentId',
});
db.rvdhsmaprecord.addScope('tc', studentId => ({
  where: {
    tc: sequelize.literal('(SELECT `transfer_certificates`.`studentId` FROM `transfer_certificates` WHERE `transfer_certificates`.`studentId` = ' + studentId + ' AND `transfer_certificates`.`releaving_date` <= CURRENT_DATE) IS NULL')
  }
}), {
  override: true
})

module.exports = db;