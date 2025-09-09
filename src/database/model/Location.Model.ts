import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import Device from './Device.Model';

@Table({
  tableName: 'locations',
  modelName: 'location',
  timestamps: false,
})
class Location extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;
  @ForeignKey(() => Device)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare deviceId: string;

  @Column({
    type: DataType.STRING,
  })
  declare longitude: string;

  @Column({
    type: DataType.STRING,
  })
  declare latitude: string;

  @Column({
    type: DataType.STRING,
  })
  declare altitude: string;

  @Column({
    type: DataType.STRING,
  })
  declare speed: string;
}

export default Location;
