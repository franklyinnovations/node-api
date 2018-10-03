"use strict";

module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define("subjectcategorydetail", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		subjectCategoryId: {
			type: DataTypes.INTEGER,
			unique: 'subjectcategorydetail_langugage'
		},
		languageId: {
			type: DataTypes.INTEGER,
			unique: 'subjectcategorydetail_langugage',
		},
		name: {
			type: DataTypes.INTEGER,
		},
	}, {
		tableName: 'subject_category_details',
		timestamps: false,
	});
	return Model;
};
