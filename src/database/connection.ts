import { Sequelize } from 'sequelize-typescript';
import { envConfig } from '../config/config';
import User from './model/user.Model';
import Device from './model/Device.Model';
import Location from './model/Location.Model';
import Route from './model/Routes.Model';
import Vehicle from './model/Vechile.Model';
import UserLocation from './model/UserLocation.Model';

console.log(envConfig.connection);
const sequelize = new Sequelize(envConfig.connection as string, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  models: [__dirname + '/model/*.ts'],
  logging: false,
});

async function initTimescale() {
  await sequelize.query(
    `SELECT create_hypertable('locations','timestamp',if_not_exists=>TRUE);`
  );
}

try {
  sequelize
    .authenticate()
    .then(() => console.log('Connection has been established successfully.'))
    .catch((err) => console.error('Unable to connect to the database:', err));
} catch (err) {
  console.log(err);
}
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('Database synced successfully.');
    initTimescale();
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

export function setupAssociations() {
  // A User/Admin can have many Vehicles
  User.hasMany(Vehicle, {
    foreignKey: 'driverId',
    as: 'vehicles',
    constraints: true,
    onDelete: 'CASCADE',
  });

  Vehicle.belongsTo(User, {
    foreignKey: 'driverId',
    as: 'driver',
    constraints: true,
  });

  Device.hasOne(Vehicle, {
    foreignKey: 'deviceId',
    as: 'vehicle',
    constraints: true,
    onDelete: 'CASCADE',
  });

  Vehicle.belongsTo(Device, {
    foreignKey: 'deviceId',
    as: 'device',
    constraints: true,
  });

  Device.hasMany(Location, {
    foreignKey: 'deviceId',
    as: 'locations',
    constraints: true,
    onDelete: 'CASCADE',
  });

  Location.belongsTo(Device, {
    foreignKey: 'deviceId',
    as: 'device',
    constraints: true,
    onDelete: 'CASCADE',
  });

  // Vehicle to Route (One-to-Many)
  Vehicle.hasMany(Route, {
    foreignKey: 'vehicleId',
    as: 'routes',
    constraints: true,
    onDelete: 'CASCADE',
  });

  Route.belongsTo(Vehicle, {
    foreignKey: 'vehicleId',
    as: 'vehicle',
    constraints: true,
  });

  User.hasMany(UserLocation, {
    foreignKey: 'userId',
    as: 'userLocations',
    onDelete: 'CASCADE',
  });

  UserLocation.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });
}

export default { sequelize, setupAssociations };
