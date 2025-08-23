import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import User from './user.Model';

@Table({
  tableName: 'user_locations',
  modelName: 'UserLocations',
  timestamps: true,
})
class UserLocation extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare latitude: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare longitude: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER, 
    allowNull: false,
  })
  declare userId: number;
}

export default UserLocation;
