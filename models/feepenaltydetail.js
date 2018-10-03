'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feepenaltydetail',{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		feepenaltyId: {
			type: DataTypes.INTEGER,
			unique: 'feepenaltydetail_langugage',
		},
		languageId: {
			type: DataTypes.INTEGER,
			unique: 'feepenaltydetail_langugage',
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
					if (this.feepenaltyId) where.feepenaltyId = {$ne: this.feepenaltyId};
					let duplicate = await this.Model.find({
						include: [{
							model: this.Model.sequelize.models.feepenalty,
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
		},
	},{
		tableName: 'fee_penalty_details',
		timestamps: false,
	});

