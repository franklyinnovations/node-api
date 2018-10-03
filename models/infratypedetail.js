'use strict';

module.exports = (sequelize, DataTypes) => 
	sequelize.define('infratypedetail', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		infratypeId: {
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
					args: [1, 64],
					msg: 'Length can not be more than 64.',
				},
				unique: async function (name, next) {
					let where = {name, languageId: [this.languageId, 1]};
					if (this.infratypeId) where.infratypeId = {$ne: this.infratypeId};
					let duplicate = await this.Model.find({
						include: [{
							model: this.Model.sequelize.models.infratype,
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
			},
		},
		masterId: {
			type: DataTypes.VIRTUAL,
		}
	}, {
		tableName: 'infratype_details',
		timestamps: false,
	});
