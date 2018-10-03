'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feediscountdetail', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		feediscountId: {
			type: DataTypes.INTEGER,
			unique: 'feediscountdetail_language',
		},
		languageId: {
			type: DataTypes.INTEGER,
			unique: 'feediscountdetail_language',
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
				unique: async function(name , next) {
					let where = {name, languageId: [this.languageId, 1]};
					if (this.feediscountId) where.feediscountId = {$ne: this.feediscountId};
					let duplicate = await this.Model.find({
						include: [{
							model: this.Model.sequelize.models.feediscount,
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
				}
			}
		},
		masterId: {
			type: DataTypes.VIRTUAL,
		}
	},{
		tableName: 'fee_discount_details',
		timestamps: false,
	});
