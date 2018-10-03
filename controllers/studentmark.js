var async = require('async');
const models = require('../models');
var language = require('./language');

function Mark() {

    this.getMarks = function(req, res){
      models.mark.hasMany(models.markrecord);
      models.mark.belongsTo(models.subject);
      models.subject.hasMany(models.subjectdetail);

      models.student.belongsTo(models.user);
      models.user.hasMany(models.userdetail);
      models.student.hasMany(models.studentdetail);
      Promise.all([
        models.mark.findAll({
          include:[
            {model:models.markrecord, where:{studentId:req.studentId}},
            {model:models.subject, attributes:['id'],
              include:[{model:models.subjectdetail, attributes:['name', 'alias'], where: language.buildLanguageQuery({}, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId')}]
            }
          ],
          where:{masterId:req.masterId, examScheduleId:req.examScheduleId, bcsMapId:req.bcsMapId}
        }),
        models.student.find({
          include:[{
            model:models.user,
            attributes:['id', 'user_image','mobile'],
            include:[{
              model:models.userdetail,
              attributes:['fullname'],
              where: language.buildLanguageQuery({}, req.langId, '`user`.`id`', models.userdetail, 'userId')
            }]
          },{
            model:models.studentdetail,
            attributes:['father_name', 'mother_name', 'guardian_name'],
            where: language.buildLanguageQuery({}, req.langId, '`student`.`id`', models.studentdetail, 'studentId')
          }],
          attributes:['enrollment_no', 'father_contact'],
          where:{
            id:req.studentId
          }
        })
      ]).then(function(data){
        res({status:true, message:language.lang({key:"examSchedule", lang:req.lang}),data:data[0], student:data[1]});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    };
    
    this.getMarksParent = function(req, res){
        
       var cQur=''; 
       
       cQur +=" (select rn from( "
       cQur +=" SELECT studentId,subjectId,examScheduleId,obtained_mark, "
       cQur +=" @student:=CASE WHEN @class <> subjectId THEN 1 ELSE if(@obt=obtained_mark,@student,@student+1) END AS rn, "
       cQur +=" @class:=subjectId AS clset, "
       cQur +=" @obt:=obtained_mark AS obt "
       cQur +=" FROM "
       cQur +=" (SELECT @student:= -1) s, "
       cQur +=" (SELECT @class:= -1) c, "
       cQur +=" (SELECT @obt:='') oooo, "
       cQur +=" ( "
       cQur +=" SELECT subjectId,studentId,examScheduleId,obtained_mark FROM marks m  "
       cQur +=" left join mark_records mr  "
       cQur +=" on m.id=mr.markId order by subjectId,obtained_mark desc"
       cQur +="  ) t ) tab where studentId=markrecords.studentId and subjectId=mark.subjectId and examScheduleId=mark.examScheduleId limit 1) " 
        
        
      models.mark.hasMany(models.markrecord);
      models.mark.belongsTo(models.subject);
      models.subject.hasMany(models.subjectdetail);
      models.mark.findAll({
        include:[
          {model:models.markrecord, where:{studentId:req.studentId}},
          {model:models.subject, attributes:['id'],
            include:[{model:models.subjectdetail, attributes:['name'], where: language.buildLanguageQuery({}, req.langId, '`subject`.`id`', models.subjectdetail, 'subjectId')}]
          }
        ],
        where:{masterId:req.masterId, examScheduleId:req.examScheduleId, bcsMapId:req.bcsMapId},
        //where:{masterId:req.masterId, bcsMapId:req.bcsMapId},
        
        
        attributes: Object.keys(models.mark.attributes).concat([
            [models.sequelize.literal(cQur), 'subject_rank'],
            [models.sequelize.literal('(if(mark.min_passing_mark <= markrecords.obtained_mark,"1","0"))'), 'result_is'],
            [models.sequelize.literal('(round((markrecords.obtained_mark/mark.max_mark)*100,2))'), 'subject_percent']
        ]),

        
        
      }).then(function(data){
        res({status:true, message:language.lang({key:"examSchedule", lang:req.lang}),data:data});
      })//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    };

   this.getExamScheduleHead  = function(req, res){
      models.examschedule.belongsTo(models.examhead);
      models.examhead.hasMany(models.examheaddetail);
      models.examschedule.belongsTo(models.board);
      models.board.hasMany(models.boarddetail);
      models.examschedule.belongsTo(models.classes);
      models.classes.hasMany(models.classesdetail);
      models.examschedule.findAll({
        include: [
            {
              model:models.examhead,
              include:
              [
                {
                  model:models.examheaddetail,
                  where: language.buildLanguageQuery(
                    {},
                    req.langId,
                    '`examhead`.`id`',
                    models.examheaddetail,
                    'examheadId'
                  )
                }
              ]
            },
            {
              model:models.board,
              include:
              [
                {
                  model:models.boarddetail,
                  where: language.buildLanguageQuery(
                    {},
                    req.langId,
                    '`board`.`id`',
                    models.boarddetail,
                    'boardId'
                    )
                }
              ]
            },
            {
              model:models.classes,
              include:
              [
                {
                  model:models.classesdetail,
                  where: language.buildLanguageQuery(
                    {},
                    req.langId,
                    '`class`.`id`',
                    models.classesdetail,
                    'classId'
                  )
                }
              ]
            }
        ],
       order: [
          ['id', 'ASC']
       ],
         where:{is_active:1, masterId:req.masterId, academicSessionId:req.academicSessionId, boardId:req.boardId, classId:req.classId}
      }).then(function(data){
         res({status:true, message:language.lang({key:"examSchedule", lang:req.lang}), data:data});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
   };

}

module.exports = new Mark();
