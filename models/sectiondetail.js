"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("sectiondetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sectionId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        len: {
          args: [1, 100],
          msg: 'Length can not be more than 100.',
        },
        unique: async function (name, next) {
          let where = {name, languageId: [this.languageId, 1], masterId: this.masterId};
          if (this.sectionId) where.sectionId = {$ne: this.sectionId};
          let duplicate = await this.Model.find({
            where,
            order: [
              ['languageId', 'DESC'],
            ],
          });
          next(duplicate === null ? null : 'isUnique');
        }
      }
    },
    masterId: {
      type: DataTypes.INTEGER
    },
  },{
    tableName: 'section_details',
    timestamps: false,
  });
  return Model;
};

