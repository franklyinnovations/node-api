'use strict';

module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define('vehicledetail', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		vehicleId: {
			type: DataTypes.INTEGER
		},
		languageId: {
			type: DataTypes.INTEGER
		},
		masterId: {
			type: DataTypes.INTEGER
		},
		name: {
			type: DataTypes.STRING,
			validate: {
				unique: async function(name , next) {
					let where = {name, languageId: [this.languageId, 1]};
					if (this.vehicleId) where.vehicleId = {$ne: this.vehicleId};
					let duplicate = await this.Model.find({
						include: [{
							model: this.Model.sequelize.models.vehicle,
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
				},
			}
		},
		model: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		colour: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		place: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
	},{
		tableName: 'vehicle_details',
		timestamps: false
	});
	return Model;
};
