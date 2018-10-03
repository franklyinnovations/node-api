"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("boarddetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    boardId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        len: {
          args: [1, 255],
          msg: 'Length can not be more than 255.',
        },
        unique: async function (name, next) {
          let where = {name, languageId: [this.languageId, 1]};
          if (this.boardId) where.boardId = {$ne: this.boardId};
          let duplicate = await this.Model.find({
            include: [{
              model: this.Model.sequelize.models.board,
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
          if (this.boardId) where.boardId = {$ne: this.boardId};
          let duplicate = await this.Model.find({
            include: [{
              model: this.Model.sequelize.models.board,
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
    masterId: {
      type: DataTypes.INTEGER
    },
  },{
    tableName: 'board_details',
    timestamps: false,
  });
  return Model;
};
