"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("complaint", {
     
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    academicsessionId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isAcademicSession'
        }
      }
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    bcsmapId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    complaint_detail: {
      type: DataTypes.TEXT,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
   is_penalty: {
      type: DataTypes.STRING,
    },
    penalty_status: {
      type: DataTypes.STRING,
    },
   fine_amount: {
      type: DataTypes.STRING,
      validate: {
         isNumeric: {
          msg: 'Please enter valid number'
        },
        notEmpty: {
          msg: 'isRequired'
        },
        max: {
          args: [10000000000],
          msg: 'Fine amount can not have more than 10 digits'
        },
        min: {
          args: [0],
          msg: 'Please enter valid number',
        }
      }
    },
    tagIds: {
      type: DataTypes.TEXT
    },
     userId: {
      type: DataTypes.INTEGER
    },
    image : {
      type: DataTypes.TEXT
    }
  },{
    tableName: 'complaints',
   // timestamps: false,
  });
  return Model;
};

