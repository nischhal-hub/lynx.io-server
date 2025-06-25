import { Sequelize } from 'sequelize-typescript';
import { envConfig } from '../config/config';
const sequelize = new Sequelize(envConfig.connection as string, {
  dialect: 'postgres', // 👈 REQUIRED
});

try{
    sequelize
  .authenticate()
  .then(() => console.log('Connection has been established successfully.'))
  .catch((err) => console.error('Unable to connect to the database:', err));
}
catch(err){
    console.log(err);
}

export default sequelize;
