"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("subjectdetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    subjectId: {
      type: DataTypes.INTEGER,
      unique: 'subjectdetail_langugage'
    },
    languageId: {
      type: DataTypes.INTEGER,
      unique: 'subjectdetail_langugage'
    },
    name: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        unique: async function (name, next) {
          let where = {name, languageId: [this.languageId, 1]};
          if (this.subjectId) where.subjectId = {$ne: this.subjectId};
          let duplicate = await this.Model.find({
            include: [{
              model: this.Model.sequelize.models.subject,
              where: {
                masterId: this.masterId,
              },
            }],
            where,
            order: [
              ['languageId', 'DESC'],
            ],
          });
          next(duplicate === null ? null : 'isUnique');
        },
        len: {
          args: [1, 100],
          msg: 'Length can not be more than 100.',
        }
      }
    },
    alias: {
      type: DataTypes.INTEGER,
      validate: {
        valid: function (value, next) {
          value = value.trim();
          if (value.length !== 0 && value.length > 20) {
           next('Length can not be more than 20.');
          } else {
            next();
          }
        }
      }
    },
    masterId: {
      type: DataTypes.INTEGER
    },
  },{
    tableName: 'subject_details',
    timestamps: false,
  });
  return Model;
};

