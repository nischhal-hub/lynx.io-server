import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
  BelongsTo,
} from 'sequelize-typescript';
import User from './user.Model';

@Table({
  tableName: 'vehicles',
  modelName: 'Vehicle',
  timestamps: true, // Add this if you want createdAt/updatedAt
})
class Vehicle extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4, 
  })
  declare id: string; 


  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  })
  declare numberPlate: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  })
  declare model: string; // Fixed spelling from "modal"

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  })
  declare brand: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  })
  declare owner: string;

  @Column({
    type: DataType.ENUM('two-wheeler', 'four-wheeler'),
    allowNull: false,
    validate: { notEmpty: true },
  })
  declare vehicleType: string; // Fixed spelling from "vechile_type"

}

export default Vehicle;
