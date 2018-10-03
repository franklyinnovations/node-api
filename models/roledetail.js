"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("roledetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    roleId: {
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
          args: [1, 150],
          msg: 'Length can not be more than 150.',
        },
        unique: async function (name, next) {
          let where = {name, languageId: [this.languageId, 1]};
          if (this.roleId) where.roleId = {$ne: this.roleId};
          let duplicate = await this.Model.find({
            include: [{
              model: this.Model.sequelize.models.role,
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
    tableName: 'role_details',
    timestamps: false,
  });
  return Model;
};
