import {Request, Response} from 'express';
import {
    SessionType,
    ResultsType,
    PersonDataType,
    SessionDataType,
    LectorResultType,
    ListenersResultType,
    CommentsType
} from './types'
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { User } from './models/User';
import { Results } from './models/Results';
import { Session } from './models/Session';

const express = require('express');
const path = require('path');
const fs = require('fs');
var cors = require('cors');
var bodyParser = require("body-parser");

var port = process.env.PORT || 8080;

// let sessions: SessionType[] = [{id: 17, name: "Арина (Методы атак и защиты веб-приложений)"}, {id: 24, name: "Андрей (Особенности гос. регулирования Интернета)"}];
// let sessionsId: number[] = [17, 24];
// var currentSessions: number[] = [];
// var results: ResultsType = null;

// const testData = [{
//     "name":"Солодовникова Екатерина",
//     "form":"6",
//     "content":"7",
//     "interest":"3",
//     "comment":"Все было очень душевно и качественно",
//     "isLector":true
// },{
//     "name":"Боб Джонстон",
//     "form":"7",
//     "content":"6",
//     "interest":"2",
//     "comment":"Абсолютная чушь!\r\n",
//     "isLector":false
// },{
//     "name":"Марк",
//     "form":"10",
//     "content":"7",
//     "interest":"4",
//     "comment":"Уже лучше\r\n",
//     "isLector":false
// }]

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
    // TODO get params from req
    User.findOne({
        attributes: ['id'],
        where: {
            name: 'Солодовникова Екатерина'
        }
    }).then(res => {
        const userId = res.id;
        Session.create({
            title: 'Great session',
            lectorId: userId,
            start: new Date(2020, 3, 5, 12, 10),
            finish: new Date(2020, 3, 5, 16, 10)
        })
        .then(res => {
            console.log(res.id);
        })
    })
})

app.post('/results', (req: Request, res: Response) => {
    // TODO add input format type
    var {sessionId, form, content, interest, username, comment, lector} = req.body; 
    console.log(req.body);
    let currentSessions: number[] = [];
    let userId: number = 0;
    Session.findAll({
        attributes: ['id'],
        where: {
            start: {
                [Op.lt]: new Date()
            },
            finish: {
                [Op.gt]: new Date()
            }
        }})
    .then(res => {
        currentSessions = res.map(a => a.id);
    });

    User.findOne({
        attributes: ['id'],
        where: {
            name: username
        }
    }).then(user => {
        userId = user.id;
        if (currentSessions.find(sessionId) === undefined) {
            res.status(403).send('Опрос еще не начался');
        } else {
            Results.create({
                sessionId,
                userId,
                form,
                content, 
                interest,
                comment
            })
            .then(result => res.status(200).send(`${username}, ваш ответ принят\n`));
     }
    })
    .catch(err => {
        res.send('Произошла ошибка на сервере')
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

app.get('/current', (_req: Request, res: Response) => {
    Session.findAll({
        attributes: ['id'],
        where: {
            start: {
                [Op.lt]: new Date()
            },
            finish: {
                [Op.gt]: new Date()
            }
        }})
        .then(res => console.log(res));
    // res.send({id: currentSessions});
})

// GETTING SESSION RESULTS

function performCalc(results: PersonDataType[]): SessionDataType {

    if (results === undefined) return null;
    
    let lectorResult: LectorResultType = {name:'', form: '', content: '', interest: ''};
    let listenersResults: ListenersResultType = {form: 0, content: 0, interest: 0};
    let coments: CommentsType = {};

    results.forEach(result => {
        if (result.isLector) {
            lectorResult = {
                name: result.name,
                form: result.form,
                content: result.content,
                interest: result.interest
            };
        } else {
            listenersResults.form += parseInt(result.form)
            listenersResults.content += parseInt(result.content);
            listenersResults.interest += parseInt(result.interest);
        }
        coments[result.name] = result.comment;
    });

    listenersResults.form = listenersResults.form / (results.length - 1);
    listenersResults.content = listenersResults.content / (results.length - 1);
    listenersResults.interest = listenersResults.interest / (results.length - 1);

    const delta = {
        form: Math.abs(parseInt(lectorResult.form) - listenersResults.form),
        content: Math.abs(parseInt(lectorResult.content) - listenersResults.content),
        interest: Math.abs(parseInt(lectorResult.interest) - listenersResults.interest)
    }
    return {
        lector: {
            name: lectorResult.name, 
            form: lectorResult.form,
            content: lectorResult.content,
            interest: lectorResult.interest
        }, 
        results: listenersResults, 
        delta,
        coments,
        rawResults: results
    }

}

app.get('/results', (req: Request, res: Response) => {
    let sessionId = req.query.id;
    // TODO get results by DB query
    // const path = __dirname+'/results/'+sessionId+'.json'; 
    // if (fs.existsSync(path)){
    //     res.download(__dirname + '/results/' + sessionId+'.json');
    // } else {
    //     res.status(404).send('Опрос еще не завершен.\n');
    // }
})


app.listen(port, () => {
    console.log(`Приложение запущенно на порту ${port}`);
})

// curl -d "name=Mарк" -X POST http://localhost:8080/add
module.exports = app