import {Table, Column, Model, PrimaryKey, DataType, AutoIncrement} from 'sequelize-typescript';

@Table
class User extends Model<User> {

    @Column(DataType.INTEGER)
    @PrimaryKey
    @AutoIncrement
    id: number

    @Column(DataType.STRING)
    set name(value: string) {
        this.setDataValue('name', value);
    }

    get name(): string {
        return this.getDataValue('name');
      }
}