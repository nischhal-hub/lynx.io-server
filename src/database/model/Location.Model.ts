import { Table, Column, Model, DataType } from 'sequelize-typescript';

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
  @Column({
    type: DataType.DATE,
    allowNull:false,
    primaryKey: true,
    defaultValue: DataType.NOW,
  })
  declare timestamp: Date;

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
