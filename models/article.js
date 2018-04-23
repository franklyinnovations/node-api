"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("article", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        keyId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        article_image: {
            type: DataTypes.STRING,
            validate: {
                isEmpty : function (value, next){
                    if(this.id == '' && value == '') {
                        return next('isRequired');
                    }
                    return next();
                }
            }
        },
        article_tags: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        is_active: {
            type: DataTypes.INTEGER
        },
        status: {
            type: DataTypes.INTEGER
        }
    },{
        tableName: 'articles'
    });
    return Model;
};
