import {Table, Column, Model, PrimaryKey, DataType, AutoIncrement} from 'sequelize-typescript';
import { Col } from '../../node_modules/sequelize/types/lib/utils';

@Table
class Session extends Model<Session> {
    @Column(DataType.INTEGER)
    @PrimaryKey
    @AutoIncrement
    id: number

    @Column(DataType.STRING)
    title: string;

    @Column(DataType.NUMBER)
    lectorId: number;

    @Column(DataType.DATE)
    start: Date;

    @Column(DataType.DATE)
    finish: Date;
}