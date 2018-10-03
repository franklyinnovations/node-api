"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("lmschapterdetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    lmschapterId: {
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
          args: [1, 200],
          msg: 'Length can not be more than 200.',
        }
      }
    },
    chapter_number: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        len: {
          args: [1, 100],
          msg: 'Length can not be more than 100.',
        }
      }
    }
  },{
    tableName: 'lms_chapter_details',
    timestamps: false,
  });
  return Model;
};

