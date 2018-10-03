'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('vehiclebreakdown', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		rvdhsmapId: {
			type: DataType.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired',
				},
			},
		},
		replacementRvdhsmapId: {
			type: DataType.INTEGER,
			validate: {
				notEmpty: {
					msg: 'isRequired',
				},
				notSameAsRvdhmapId: function (value, next) {
					if (value && value === this.rvdhsmapId)
						next('Replacement vehicle can not be same broken vehicle.');
					else
						next();
				},
				notBroken: async function (replacementRvdhsmapId, next) {
					if (replacementRvdhsmapId && this.date) {
						const where = {rvdhsmapId: replacementRvdhsmapId, date: this.date};
						if (this.id) where.id = {$ne: this.id};
						next(await this.Model.count({where}) !== 0 ? 'This vehicle is broken.' : null);
					} else {
						next();
					}
				}
			},
		},
		date: {
			type: DataType.DATEONLY,
			validate: {
				notEmpty: {
					msg: 'isRequired',
				},
				unique: async function (date, next) {
					if (this.rvdhsmapId && date) {
						const where = {rvdhsmapId: this.rvdhsmapId, date};
						if (this.id) where.id = {$ne: this.id};
						next(await this.Model.count({where}) !== 0 ? 'This vehicle is already marked as broken on this date.' : null);
					} else {
						next();
					}
				},
			},
		},
	}, {
		tableName: 'vehicle_breakdowns',
	});
};