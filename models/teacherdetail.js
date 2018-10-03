"use strict";

const fs = require('fs');

function deleteOldQualificationImages(instance) {
  var nothing = (() => 0), imageFilter = (x => x.image);
  var old = instance.previous('qualifications');
  if (! old) return;
  old = JSON.parse(old).map(imageFilter);
  var newImages = instance.qualifications;
  if (newImages) {
    newImages = new Set(JSON.parse(newImages).map(imageFilter));
    old = old.filter(x => x && (!newImages.has(x)));
  }
  for (var i = 0; i < old.length; i++) {
    fs.unlink(old[i], nothing);
  }
}

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("teacherdetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    teacherId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    experiences: {
      type: DataTypes.STRING
    },
    qualifications: {
      type: DataTypes.STRING
    },
    last_qualification: {
      type: DataTypes.VIRTUAL(DataTypes.STRING, ['qualifications']),
      get: function () {
        var qualifications;
        try {
          qualifications = JSON.parse(this.qualifications)
        } catch (err) {
          return;
        }
        if (qualifications && qualifications.length !== 0)
          return qualifications[0].name;
      }
    },
    address: {
      type: DataTypes.STRING,
    }
  },{
    tableName: 'teacher_details',
    timestamps: false,
    beforeUpdate: [deleteOldQualificationImages]
  });
  return Model;
};

