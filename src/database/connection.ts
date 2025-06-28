import { Sequelize } from 'sequelize-typescript';
import { envConfig } from '../config/config';


console.log(envConfig.connection);
const sequelize = new Sequelize(envConfig.connection as string, {
  dialect: 'postgres',
  models: [__dirname + '/model/*.ts'],
  logging: false,
});

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
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

export default sequelize;
