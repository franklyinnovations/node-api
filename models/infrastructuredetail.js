'use strict';

module.exports = (sequelize, DataTypes) => 
	sequelize.define('infrastructuredetail', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		infrastructureId: {
			type: DataTypes.INTEGER
		},
		languageId: {
			type: DataTypes.INTEGER
		},
		code: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired',
				},
				len: {
					args: [1, 64],
					msg: 'Length can not be more than 64.',
				},
				unique: async function(code , next) {
					let where = {code, languageId: [this.languageId, 1]};
					if (this.infrastructureId) where.infrastructureId = {$ne: this.infrastructureId};
					let duplicate = await this.Model.find({
						include: [{
							model: this.Model.sequelize.models.infrastructure,
							where: {
								infratypeId: this.infratypeId,
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
		remarks: {
			type: DataTypes.TEXT,
			validate: {
				notEmpty: {
					msg: 'isRequired',
				},
			},
		},
		infratypeId: {
			type: DataTypes.VIRTUAL,
		},
	}, {
		tableName: 'infrastructure_details',
		timestamps: false,
	});
