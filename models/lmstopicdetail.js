"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("lmstopicdetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    lmstopicId: {
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
    content: {
      type: DataTypes.STRING,
    },
  },{
    tableName: 'lms_topic_details',
    timestamps: false,
  });
  return Model;
};

