const express = require('express');
const path = require('path');
const fs = require('fs');
var cors = require('cors');
var bodyParser = require("body-parser");

let sessions = [{id: 45, name: 'Катя'}, {id: 88, name: 'Рома'}];
let sessionsId = [45,88];
var currentSession = -1;
var results = {};

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.post('/results', (req, res) => {
    var {sessionId, fa, ca, ia, fd, cd ,id, username} = req.body;
    if (parseInt(sessionId)!== parseInt(currentSession)) {
        // console.log('Session hasn`t started yet');
        // console.log('Expected: ', currentSession, '\nAcutal: ', sessionId);
        res.status(403).send('Session has not started yet');
    } else {
        let curResults = results[sessionId];
        let userResults = {name: username, fa, ca, ia, fd, cd, id};
        if (curResults) {
            results[sessionId].push(userResults);
        } else {
            results[sessionId] = [userResults];
        }
        // console.log('Saving answers for a session', sessionId, username);
        res.status(200).send(`Dear ${username}, your answer is accepted\n`);
    }
})

app.get('/sessions', (_req, res) => {
    console.log('Sending all sessions');
    res.send(sessions);
})

app.post('/start', (req, res) => {
    const sessionId = req.body.id;
    if (sessionsId.indexOf(parseInt(sessionId)) !== -1) {
        currentSession = sessionId;
        // console.log('Starting session ',sessionId);
        res.status(200).send(`Starting session: ${sessionId}\n`);
    } else {
        // console.log('No such session');
        res.status(404).send(`Session with id=${sessionId} do not exist.\nCreate it by query /add?name=...\n`);
    }
})

app.post('/stop', (req, res) => {
    const sessionId = req.body.id;
    console.log(sessionId, currentSession);
    if (parseInt(sessionId) !== parseInt(currentSession)) {
        // console.log('You can not stop non-active session');
        res.status(403).send(`Can't stop session because session not in progress\n`);
    } else {
        currentSession = -1;
        // console.log('Stopping session ',sessionId);
        fs.writeFile(sessionId+".txt", JSON.stringify(results[sessionId]), function(err) {
            if (err) {
                console.log(err);
            }
        });
        res.status(200).send(`Session with id=${sessionId} has stoped.\nTo get session``s results, use command /results?id=${sessionId}\n`);
    }
});

app.get('/results', (req, res) => {
    sessionId = req.query.id;
    const path = __dirname+'/'+sessionId+'.txt'; 
    if (fs.existsSync(path)){
        res.download(__dirname+'/'+sessionId+'.txt');
    } else {
        // console.log('Session has not finished yet');
        res.status(404).send('Session has not finished yet\n');
    }
})

app.get('/current', (req,res) => {
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

    console.log(sessions);

    res.sendStatus(200);
})

app.listen(8080, () => {
    console.log('App started and available at http://localhost:8080');
  });

   // curl -d "name=Mарк" -X POST http://localhost:8080/add
    // nodemon ./server.js localhost 8080