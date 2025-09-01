import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import User from './user.Model';
import Vehicle from './Vechile.Model';

@Table({
  tableName: 'activity_logs',
  modelName: 'ActivityLog',
  timestamps: true, // adds createdAt & updatedAt
})
class ActivityLog extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare userId: string | null; // the user who triggered the activity

  @ForeignKey(() => Vehicle)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare vehicleId: string | null; // related vehicle if any

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare activityType: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null; // detailed description

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;
}

export default ActivityLog;
