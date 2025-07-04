import { Table,Column,Model,DataType } from "sequelize-typescript";

@Table({
    tableName:"devices",
    modelName:"Devices",
    timestamps:true
})

class Device extends Model
{
    @Column({
        type:DataType.UUID,
        // autoIncrement:true,
        primaryKey:true
    })
    declare id:number;

    @Column({
        type:DataType.STRING,
        allowNull:false
    })
    declare deviceName:string;
    @Column({
        type:DataType.ENUM("Active","Inactive","Deleted"),
        allowNull:false
    })
    declare status:string;

}


export default Device