import {
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';

@Table({
  tableName: 'geofences',
  modelName: 'Geofence',
  timestamps: true, 
})
class Geofence extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.ENUM('circle', 'polygon'),
    allowNull: false,
    defaultValue: 'circle',
  })
  declare type: string;

  // Circle center latitude
  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  declare center_lat: number;

  // Circle center longitude
  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  declare center_lng: number;

  // Circle radius in meters
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare radius: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare active: boolean;

  @Column({
    type: DataType.ENUM('entry', 'exit', 'both'),
    defaultValue: 'both',
  })
  declare trigger: string;
}

export default Geofence;
