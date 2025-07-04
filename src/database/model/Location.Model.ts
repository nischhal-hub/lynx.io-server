import { Table,Column,Model,DataType } from "sequelize-typescript";

@Table({
    tableName:"locations",
    modelName:"location",
    timestamps:true
})

class Location extends Model{
    @Column({
        type:DataType.UUID,
        primaryKey:true
    })

    declare id:number

    @Column({
        type:DataType.STRING

    })
    declare longitiude:string

    @Column({
        type:DataType.STRING
    })
    declare latitude:string

    @Column({
        type:DataType.STRING
    })
    declare altitude:string

  @Column({
    type:DataType.STRING
  })
  declare speed:string

}

export default Location;