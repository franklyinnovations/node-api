"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("examheaddetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    examheadId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        len: {
          args: [1, 150],
          msg: 'Length can not be more than 150.',
        },
        unique: async function (name, next) {
          let where = {name, languageId: [this.languageId, 1]};
          if (this.examheadId) where.examheadId = {$ne: this.examheadId};
          let duplicate = await this.Model.find({
            include: [{
              model: this.Model.sequelize.models.examhead,
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
      }
    },
    alias: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        len: {
          args: [1, 64],
          msg: 'Length can not be more than 64.',
        },
        unique: async function (alias, next) {
          let where = {alias, languageId: [this.languageId, 1]};
          if (this.examheadId) where.examheadId = {$ne: this.examheadId};
          let duplicate = await this.Model.find({
            include: [{
              model: this.Model.sequelize.models.examhead,
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
      }
    }
  },{
    tableName: 'examhead_details',
    timestamps: false,
  });
  return Model;
};
