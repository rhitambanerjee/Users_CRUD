import { Sequelize, Model, DataTypes } from 'sequelize';
import { User } from './user';

export class Item extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public userId!: number;
  public readonly user?: User;
}

export const initItem = (sequelize: Sequelize) => {
  Item.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'item',
    },
  );
  Item.belongsTo(User, { foreignKey: 'userId' });
};
