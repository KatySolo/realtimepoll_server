import {Request, Response} from 'express';
const express = require('express');
const path = require('path');
const fs = require('fs');
var cors = require('cors');
var bodyParser = require("body-parser");
var rimraf = require('rimraf');

var port = process.env.PORT || 8080;

type SessionType = {
    id: number,
    name: string
}
let sessions: SessionType[] = [{id: 17, name: "Арина (Методы атак и защиты веб-приложений)"}, {id: 24, name: "Андрей (Особенности гос. регулирования Интернета)"}];
let sessionsId: number[] = [17, 24];
var currentSessions: number[] = [];
var results: ResultsType = null;

type SessionDataType = {
    lector: LectorResultType,
    results: ListenersResultType,
    delta: ListenersResultType,
    coments: CommentsType,
    rawResults: PersonDataType[]
}

type ResultsType = {
    [key: string]: PersonDataType[] 
}

const testData = [{
    "name":"Солодовникова Екатерина",
    "form":"6",
    "content":"7",
    "interest":"3",
    "comment":"Все было очень душевно и качественно",
    "isLector":true
},{
    "name":"Боб Джонстон",
    "form":"7",
    "content":"6",
    "interest":"2",
    "comment":"Абсолютная чушь!\r\n",
    "isLector":false
},{
    "name":"Марк",
    "form":"10",
    "content":"7",
    "interest":"4",
    "comment":"Уже лучше\r\n",
    "isLector":false
}]

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

app.post('/results', (req: Request, res: Response) => {
    var {sessionId, form, content, interest, username, comment, lector} = req.body; 
    console.log(req.body);
    try {
        if (currentSessions.indexOf(parseInt(sessionId)) === -1) {
            res.status(403).send('Опрос еще не начался');
        } else {
            let curResults = results[sessionId];
            let userResults = {name: username, form, content, interest, comment, isLector: lector === 'on' ? true : false};
            if (curResults) {
                results[sessionId].push(userResults);
            } else {
                results[sessionId] = [userResults];
            }
            res.status(200).send(`${username}, ваш ответ принят\n`);
        }
    } catch(err) {
        res.send('Произошла ошибка на сервере');
    }
})

app.get('/sessions', (_req: Request, res: Response) => {
    res.send(sessions);
})

app.post('/start', (req: Request, res: Response) => {
    const sessionId = req.body.id;
    if (sessionsId.indexOf(parseInt(sessionId)) !== -1) {
        currentSessions.push(parseInt(sessionId));
        res.status(200).send(`Начинаем опрос: ${sessionId}\n`);
    } else {
        res.status(404).send(`Опрос id=${sessionId} не существует.\nСоздайте его POST запросом /add?name=newName\n`);
    }
})

app.post('/stop', (req: Request, res: Response) => {
    const sessionId = req.body.id;
    if (currentSessions.indexOf(parseInt(sessionId)) === -1) {
        res.status(403).send(`Невозможно остановить опрос, так как он еще не был начат.\n`);
    } else {
        currentSessions.splice(currentSessions.indexOf(parseInt(sessionId)), 1);
        const result = performCalc(results[sessionId]);
        fs.writeFile(__dirname+'/results/'+sessionId+".json", JSON.stringify(result), function(err: Error) {
            if (err) {
                fs.mkdir(__dirname+'/results', () => {
                    fs.writeFile(__dirname+'/results/'+sessionId+".json", JSON.stringify(result), () => {})
                });
            }
        });
        res.status(200).send(`Опрос id=${sessionId} останевлен.\nЧтобы получить результаты, используйте GET запрос /results?id=${sessionId}\n`);
    }
});

type LectorResultType = {
    name: string,
    form: string,
    content: string,
    interest: string;
}

type ListenersResultType = {
    form: number,
    content: number,
    interest: number;
}

type CommentsType = {
    [key: string]: string
}

type PersonDataType = {
    name: string,
    form: string;
    content: string,
    interest: string,
    comment: string,
    isLector: boolean
}

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
    const path = __dirname+'/results/'+sessionId+'.json'; 
    if (fs.existsSync(path)){
        res.download(__dirname + '/results/' + sessionId+'.json');
    } else {
        res.status(404).send('Опрос еще не завершен.\n');
    }
})

app.get('/current', (_req: Request, res: Response) => {
    res.send({id: currentSessions});
})

app.post('/add', (req: Request, res: Response) => {
    const name = req.body.name;
    
    let id = Math.ceil(Math.random() * 100);
    while (sessionsId.indexOf(id) !== -1) {
        id = Math.ceil(Math.random() * 100);
    }
    sessions.push({id, name});
    sessionsId.push(id);

    res.status(200).send({id});
})

app.get('/files', (_req: Request, res: Response) => {
    var filesList: string[] = [];
    if (fs.existsSync(__dirname+'/results')) {
        fs.readdir(__dirname+'/results', function (err: Error, files: string[]) {
            files.forEach(function (file: string) {
                if (file.endsWith('.json')) {
                    filesList.push(file); 
                }
            });
            res.send(filesList);
        });
    } else {
        res.send([]);
    }
})

app.get('/clean', (_req: Request, res: Response) => {
    rimraf(__dirname+'/results', () => res.status(200).send('Все результаты удалены.'));
})

app.listen(port, () => {
    console.log(`Приложение запущенно на порту ${port}`);
});

// curl -d "name=Mарк" -X POST http://localhost:8080/add
module.exports = app;