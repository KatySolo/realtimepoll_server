import {Request, Response} from 'express';
import {
    ParsedDate
} from './types'

import * as moment from 'moment';
import 'moment-timezone';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { User } from './models/User';
import { Results } from './models/Results';
import { Session } from './models/Session';

import * as express from 'express';
import * as path from 'path';
// TODO fix cors import
var cors = require('cors');
import * as bodyParser from "body-parser";

// GENERAL SETTINGS
// TODO .env files
var port = process.env.PORT || 8080;
let sequelize = new Sequelize("postgres://lamravjy:l2leG_C0dEUZGhcuiT3zRpVkU4bLwJZn@rogue.db.elephantsql.com:5432/lamravjy");
sequelize.addModels([User, Session, Results]);
sequelize.sync();

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// ADDING USERS AND SESSIONS
app.post('/user', (req: Request, res: Response) => {
    const name = req.body.name;
    User.create({ name }).then(response => res.status(200).send({id: response.getDataValue('id')}));
})

app.post('/session', (req: Request, res: Response) => {
    const { lectorName, title, start, finish} = req.body;
    console.log(start, finish);
    User.findOne({
        attributes: ['id'],
        where: {
            name: lectorName
        }
    }).then(userRes => {
        const userId = userRes.id;
        console.log(userId)
        const {
            year: startYear,
            month: startMonth,
            day: startDay,
            hour: startHour,
            minute: startMinute
        } = parseDate(start);

        const {
            year: finishYear,
            month: finishMonth,
            day: finishDay,
            hour: finishHour,
            minute: finishMinute
        } = parseDate(finish);

        Session.create({
            title,
            lectorId: userId,
            start: new Date(startYear, startMonth, startDay, startHour, startMinute),
            finish: new Date(finishYear, finishMonth, finishDay, finishHour, finishDay, finishMinute)
        })
        .then(result => {
            res.send({ id: result.id }) 
        })
    })
})

function parseDate(dateStr: string): ParsedDate {
    const parsedDate =  dateStr.split(/[- :]/);
    return {
        year: parseInt(parsedDate[0]),
        month: parseInt(parsedDate[1]),
        day: parseInt(parsedDate[2]),
        hour: parseInt(parsedDate[3]),
        minute: parseInt(parsedDate[4])
    }
}

app.post('/results', (req: Request, res: Response) => {
    var {sessionId, form, content, interest, username, comment} = req.body; 
    let currentSessions: number[] = [];
    let userId: number = 0;
    Promise.all([Session.findByPk(sessionId),  User.findOne({attributes: ['id'], where: { name: username }})])
    .then(result => {
        const session = result[0];
        const user = result[1];
        const curDate = moment.tz(new Date(), 'Asia/Yekaterinburg').parseZone();
        // TODO fix same day date compare
        // console.log(curDate);
        // console.log(curDate >= moment(session.start));
        // console.log(curDate <= moment(session.finish))

        if (curDate >= moment(session.start) && curDate <= moment(session.finish)) {
            Results.create({
                sessionId,
                userId: user.id,
                form,
                content, 
                interest,
                comment
            })
            .then(result => res.status(200).send(`${username}, ваш ответ принят\n`))
            .catch(err => res.send('Ответ уже был принят'));
        } else {
            res.status(403).send('Опрос еще не начался или уже закончился');
        }
    })
    .catch(err => {
        res.send('Произошла ошибка на сервере: ' + err)
    })
})

// GETTING DATA FROM DB
app.get('/', (_req: Request, res: Response) => {
    const intro = `
    <h2>Сервер для создания и проведения опросов в реальном времени </h2>
    Адрес клиента: <a href="https://public.colo18.now.sh">https://public.colo18.now.sh</a>
    \n
    <h3>Список команд:</h3>
    <ul>
        <li>POST /add?name=TestName - добавление новой сессии про имени, возвращается id сессии</li>
        <li>GET /sessions - получить объект со всеми сессиями</li>
        <li>POST /start?id=45 - начать сессию</li>
        <li>POST /stop?id=45 - остановить сессию</li>
        <li>GET /results?id=45 - получение результатов сессии в формате .txt</li>
        <li>GET /current - узнать текущую сессию</li>
    </ul>
    `;
    res.status(200).send(intro);
})

app.get('/sessions', (_req: Request, res: Response) => {
    Session.findAll({ attributes: ['id'] }).then(sessions => res.send(sessions));
})

// TODO current + User to get lector name
app.get('/current', (_req: Request, res: Response) => {
    Session.findAll({
        attributes: ['id','title'],
        where: {
            start: {
                [Op.lt]: new Date()
            },
            finish: {
                [Op.gt]: new Date()
            }
        }})
        .then(results => res.send(results));
})

// GETTING SESSION RESULTS
app.get('/results', (req: Request, res: Response) => {
    let sessionId = req.query.id;
    Results.findAll({
        attributes: [
            [Sequelize.fn('AVG', Sequelize.col('form')), 'form_avg'],
            [Sequelize.fn('AVG', Sequelize.col('content')), 'content_avg'],
            [Sequelize.fn('AVG', Sequelize.col('interest')), 'interest_avg']
        ],
        where: {
            sessionId
        }
    })
    .then(results => res.send(results))
})

app.get('/comments', (req: Request, res: Response) => {
    let sessionId = req.query.id;
    Results.findAll({
        attributes: ['comment'],
        where: {
            sessionId
        }
    }).then(comments => res.send(comments));
})

app.listen(port, () => {
    console.log(`Приложение запущенно на порту ${port}`);
})

module.exports = app