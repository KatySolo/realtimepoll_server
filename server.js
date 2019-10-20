const express = require('express');
const path = require('path');
const fs = require('fs');
var cors = require('cors');
var bodyParser = require("body-parser");
var rimraf = require('rimraf');

var port = process.env.PORT || 8080;

let sessions = [{id: 45, name: 'Катя'}, {id: 88, name: 'Рома'}];
let sessionsId = [45,88];
var currentSession = -1;
var results = {};

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (_req, res) => {
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

app.post('/results', (req, res) => {
    var {sessionId, fa, ca, ia, fd, cd ,id, username} = req.body;
    console.log(req.body);
    if (parseInt(sessionId)!== parseInt(currentSession)) {
        res.status(403).send('Опрос еще не начался');
    } else {
        let curResults = results[sessionId];
        let userResults = {name: username, fa, ca, ia, fd, cd, id};
        if (curResults) {
            results[sessionId].push(userResults);
        } else {
            results[sessionId] = [userResults];
        }
        res.status(200).send(`${username}, ваш ответ принят\n`);
    }
})

app.get('/sessions', (_req, res) => {
    res.send(sessions);
})

app.post('/start', (req, res) => {
    const sessionId = req.body.id;
    if (sessionsId.indexOf(parseInt(sessionId)) !== -1) {
        currentSession = sessionId;
        res.status(200).send(`Начинаем опрос: ${sessionId}\n`);
    } else {
        // console.log('No such session');
        res.status(404).send(`Опрос id=${sessionId} не существует.\nСоздайте его POST запросом /add?name=newName\n`);
    }
})

app.post('/stop', (req, res) => {
    const sessionId = req.body.id;
    if (parseInt(sessionId) !== parseInt(currentSession)) {
        res.status(403).send(`Невозможно остановить опрос, так как он еще не был начат.\n`);
    } else {
        currentSession = -1;
        fs.writeFile(__dirname+'/results/'+sessionId+".txt", JSON.stringify(results[sessionId]), function(err) {
            if (err) {
                fs.mkdir(__dirname+'/results', () => {
                    fs.writeFile(__dirname+'/results/'+sessionId+".txt", JSON.stringify(results[sessionId]), () => {})
                });
            }
        });
        res.status(200).send(`Опрос id=${sessionId} останевлен.\nЧтобы получить результаты, используйте GET запрос /results?id=${sessionId}\n`);
    }
});

app.get('/results', (req, res) => {
    sessionId = req.query.id;
    const path = __dirname+'/results/'+sessionId+'.txt'; 
    if (fs.existsSync(path)){
        res.download(__dirname + '/results/' + sessionId+'.txt');
    } else {
        res.status(404).send('Опрос еще не завершен.\n');
    }
})

app.get('/current', (_req,res) => {
    res.send({id: currentSession});
})

app.post('/add', (req, res) => {
    const name = req.body.name;
    
    let id = Math.ceil(Math.random() * 100);
    while (sessionsId.indexOf(id) !== -1) {
        id = Math.ceil(Math.random() * 100);
    }
    sessions.push({id, name});
    sessionsId.push(id);

    res.status(200).send({id});
})

app.get('/files', (_req, res) => {
    var filesList = [];
    if (fs.existsSync(__dirname+'/results')) {
        fs.readdir(__dirname+'/results', function (err, files) {
            files.forEach(function (file) {
                console.log(file)
                if (file.endsWith('.txt')) {
                    filesList.push(file); 
                }
            });
            res.send(filesList);
        });
    } else {
        res.send([]);
    }
})

app.get('/clean', (_req, res) => {
    rimraf(__dirname+'/results', () => res.status(200).send('Все результаты удалены.'));
})

app.listen(port, () => {
    console.log(`Приложение запущенно на порту ${port}`);
  });

   // curl -d "name=Mарк" -X POST http://localhost:8080/add
    // nodemon ./server.js localhost 8080