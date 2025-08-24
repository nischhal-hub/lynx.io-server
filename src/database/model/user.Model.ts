import {
  Column,
  DataType,
  Model,
  Table,
  BeforeCreate,
} from 'sequelize-typescript';
import AppError from '../../utils/AppError';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig } from '../../config/config';
@Table({
  tableName: 'users',
  modelName: 'User',
  timestamps: true,
})
class User extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  })
  declare lastName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      customValidator(this: User, value: string | null) {
        if (value !== null && this.authProvider === 'local') {
          const isValid = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/.test(value);
          if (!isValid) {
            throw new Error(
              'Password must contain at least one uppercase letter and one special character'
            );
          }
        }
      },
    },
  })
  declare password: string | null;

  @Column({
    type: DataType.ENUM('user', 'driver', 'admin', 'super-admin'),
    allowNull: true,
    defaultValue: 'user',
  })
  declare roles: 'user' | 'driver' | 'admin' | 'super-admin';

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare address: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare phoneNumber: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare profilePicture: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare refreshToken: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare otp: number | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare otpGeneratedTime: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  declare googleId: string | null;

  @Column({
    type: DataType.ENUM('local', 'google'),
    defaultValue: 'local',
  })
  declare authProvider: 'local' | 'google';

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isEmailVerified: boolean;

  @BeforeCreate
  static async hashedPassword(user: User) {
    if (user.authProvider === 'local') {
      if (!user.password) {
        throw new AppError(
          'Password is required for local authentication',
          400
        );
      }
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;
    }
  }

  @Column({ type: DataType.STRING, allowNull: true })
  declare expoPushToken: string;

  async checkPassword(password: string): Promise<boolean> {
    if (this.authProvider === 'local') {
      return await bcrypt.compare(password, this.password || '');
    }
    return false;
  }
  generateAuthToken(): string {
    const token = jwt.sign({ id: this.id }, envConfig.JWT_SECRET as string, {
      expiresIn: '1h',
    });
    return token;
  }
}

export default User;
