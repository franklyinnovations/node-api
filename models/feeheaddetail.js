'use strict';

module.exports = (sequelize, DataTypes) =>
	sequelize.define('feeheaddetail', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		feeheadId: {
			type: DataTypes.INTEGER,
			unique: 'feeheaddetail_langugage',
		},
		languageId: {
			type: DataTypes.INTEGER,
			unique: 'feeheaddetail_langugage',
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
					if (this.feeheadId) where.feeheadId = {$ne: this.feeheadId};
					let duplicate = await this.Model.find({
						include: [{
							model: this.Model.sequelize.models.feehead,
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
		alias: {
			type: DataTypes.STRING,
			validate: {
				len: {
					args: [0, 20],
					msg: 'Length can not be more than 20.',
				},
			}
		},
		masterId: {
			type: DataTypes.VIRTUAL,
		},
	}, {
		tableName: 'fee_head_details',
		timestamps: false,
	});
