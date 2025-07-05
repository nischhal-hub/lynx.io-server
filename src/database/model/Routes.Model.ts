import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
@Table({
  tableName: 'routes',
  modelName: 'Route',
  timestamps: true,
})
class Route extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4, // Auto-generates UUID
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: "Format: 'latitude,longitude' or address",
  })
  declare start_location: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare end_location: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: "Array of intermediate points as ['lat,lng', 'lat,lng']",
  })
  declare intermediate_locations: string[];

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Distance in kilometers',
  })
  declare distance: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'ISO 8601 duration format (e.g., PT2H30M)',
  })
  declare estimated_duration: string;
  @Column({
    type: DataType.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'planned',
  })
  declare status: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare started_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare completed_at: Date;


}

export default Route;
