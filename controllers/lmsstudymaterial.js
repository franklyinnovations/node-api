'use strict';

const models = require('../models'),
language = require('./language'),
moment = require('moment'),
notification = require('./notification');

models.lmschapter.hasMany(models.lmschapterdetail);
models.lmschapter.belongsTo(models.bcsmap);
models.lmschapter.belongsTo(models.subject);

models.lmstopic.hasMany(models.lmstopicdetail);
models.subject.hasMany(models.subjectdetail);
models.bcsmap.belongsTo(models.board);
models.board.hasMany(models.boarddetail);
models.bcsmap.belongsTo(models.classes);
models.classes.hasMany(models.classesdetail);
models.bcsmap.belongsTo(models.section);
models.section.hasMany(models.sectiondetail);

exports.list = function (req) {
  return Promise.all([
    models.bcsmap.findAll({
      include: [{
        model: models.board,
        attributes: ['id'],
        include:[{
          model: models.boarddetail,
          where: language.buildLanguageQuery(
            {}, req.langId, '`board`.`id`', models.boarddetail, 'boardId'
          ),
          attributes: ['alias']
        }]
      }, {
        model: models.classes,
        attributes: ['id'],
        include:[{
          model: models.classesdetail,
          where: language.buildLanguageQuery(
            {}, req.langId, '`class`.`id`', models.classesdetail, 'classId'
          ),
          attributes: ['name']
        }]
      }, {
        model: models.section,
        attributes: ['id'],
        include:[{
          model: models.sectiondetail,
          where: language.buildLanguageQuery(
            {}, req.langId, '`section`.`id`', models.sectiondetail, 'sectionId'
          ),
          attributes: ['name']
        }]
      }],
      where: {
        is_active: 1,
        masterId: req.masterId
      },
      order: [
        [models.board, 'display_order'],
        ['boardId', 'DESC'],
        [models.classes, 'display_order'],
        ['classId', 'DESC'],
        [models.section, 'display_order'],
        ['sectionId', 'DESC']
      ],
      attributes: ['id']
    })
  ])
  .then(([bcsmaps]) => ({
    status: true,
    bcsmaps: bcsmaps
  }));
};

exports.loadStudyMaterial = function (req) {
  return Promise.all([
    models.lmstopic.find({
      where: {
        id: req.lmstopicId,
        masterId: req.masterId
      },
      include:
      [
        {
          model: models.lmstopicdetail,
          attributes: ['content'],
          required: false,
          where: language.buildLanguageQuery(
            {},
            req.langId,
            '`lmstopic`.`id`',
            models.lmstopicdetail,
            'lmstopicId'
          )
        },{
          model: models.lmstopicdocument,
          required: false
        }
      ],
      attributes: ['id']
    })
  ])
  .then(([data])=> ({status: true, data}));
};

exports.getSubjects = function (req) {
  return Promise.all([
    models.lmschapter.findAll({
      include: [
        {
          model: models.subject,
          attributes: ['id'],
          include: [
            {
              model: models.subjectdetail,
              attributes: ['name'],
              where: language.buildLanguageQuery(
                {},
                req.langId,
                '`subject`.`id`',
                models.subjectdetail,
                'subjectId'
              )
            }
          ],
          where: {
            is_active: 1
          }
        }
      ],
      where: {
        bcsmapId: req.bcsmapId,
        masterId: req.masterId
      },
      group: [['subjectId']],
      attributes: ['id']
    })
  ])
  .then(([data])=> ({status: true, data}));
};

exports.getChapters = function (req) {
  return Promise.all([
    models.lmschapter.findAll({
      where: {
        bcsmapId: req.bcsmapId,
        subjectId: req.subjectId,
        masterId: req.masterId,
        is_active: 1
      },
      include:
      [
        {
          model: models.lmschapterdetail,
          attributes: ['name'],
          where: language.buildLanguageQuery(
            {},
            req.langId,
            '`lmschapter`.`id`',
            models.lmschapterdetail,
            'lmschapterId'
          )
        }
      ],
      attributes: ['id'],
      order: [
        ['id', 'DESC']
      ],
    })
  ])
  .then(([data])=> ({status: true, data}));
};

exports.getTopics = function (req) {
  return Promise.all([
    models.lmstopic.findAll({
      where: {
        lmschapterId: req.lmschapterId,
        masterId: req.masterId,
        is_active: 1
      },
      include:
      [
        {
          model: models.lmstopicdetail,
          attributes: ['name'],
          where: language.buildLanguageQuery(
            {},
            req.langId,
            '`lmstopic`.`id`',
            models.lmstopicdetail,
            'lmstopicId'
          )
        }
      ],
      attributes: ['id']
    })
  ])
  .then(([data])=> ({status: true, data}));
};
