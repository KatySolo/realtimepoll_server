// eslint-disable-next-line no-unused-vars
import { Request, Response } from 'express';

import * as moment from 'moment';
import 'moment-timezone';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { User } from './models/User';
import { Results } from './models/Results';
import { Session } from './models/Session';
import * as jwt from 'express-jwt';
import * as jwksRsa from 'jwks-rsa';

import * as express from 'express';
import * as path from 'path';
// TODO fix cors import
var cors = require('cors');
import * as bodyParser from 'body-parser';

// GENERAL SETTINGS
var port = process.env.PORT;
let sequelize = new Sequelize(process.env.DB_URL);
sequelize.addModels([User, Session, Results]);
sequelize.sync();

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const checkJwt = jwt({
	secret: jwksRsa.expressJwtSecret({
		cache: true,
		rateLimit: true,
		jwksRequestsPerMinute: 5,
		jwksUri: process.env.JWKS_URI
	}),

	// Validate the audience and the issuer.
	audience: ['59bqsavCkAbMf03S4pIzjttAt3dXxPRy', 'http://postman-api/'],
	issuer: process.env.AUTH0_ISSUER,
	algorithms: ['RS256']
});


// ADDING USERS AND SESSIONS
// ONLY ADMIN
app.post('/user', checkJwt, (req: Request, res: Response) => {
	const name = req.body.name;
	User.create({ name })
		.then(() => res.status(201).send('Пользователь успешно добавлен'))
		.catch(() => res.status(409).send({ text: 'Пользователь с таким именем существует' }));
});

// ONLY ADMIN
app.post('/session', checkJwt, (req: Request, res: Response) => {
	const { username, title, start, finish } = req.body;
	User.findOne({
		attributes: ['id'],
		where: {
			name: username
		}
	}).then(userRes => {
		const userId = userRes.id;
		Session.create({
			title,
			lectorId: userId,
			start,
			finish
		})
			.then(() => {
				res.status(201).send('Сессия добавлена');
			})
		// TODO DONT CATCH
			.catch(() => res.status(409).send({ text: 'Сессия с таким названием существует' }));
	}).catch(() => {
		res.status(404).send({ text: 'Такого пользователя не существует.' });
	});
});


app.post('/results', (req: Request, res: Response) => {
	var { sessionId, form, content, interest, username, comment } = req.body;
	Promise.all([Session.findByPk(sessionId), User.findOne({ attributes: ['id'], where: { name: username } })])
		.then(result => {
			const session = result[0];
			const user = result[1];
			const curDate = moment(new Date(), 'Asia/Yekaterinburg').parseZone();
			// TODO fix same day date compare

			if (curDate >= moment(session.start) && curDate <= moment(session.finish)) {
				Results.create({
					sessionId,
					userId: user.id,
					form,
					content,
					interest,
					comment
				})
					.then(() => res.status(201).send({ text: `${username}, ваш ответ принят\n` }))
					.catch(() => res.status(208).send({ text: 'Ответ уже был принят' }));
			} else {
				res.status(403).send('Опрос еще не начался или уже закончился');
			}
		})
		.catch(() => {
			res.status(500).send({ text: 'Такого пользователя не существует' });
		});
});

// GETTING DATA FROM DB
app.get('/', (_req: Request, res: Response) => {
	const intro = `
    <h2>Сервер для создания и проведения опросов в реальном времени </h2>
    Адрес клиента: <a href="https://realtimepoll.now.sh">https://realtimepoll.now.sh</a>
    \n
    Список команд = <a href="https://documenter.getpostman.com/view/10671107/SzYZ1yUT?version=latest"> Документация Postman</a>
    `;
	res.status(200).send(intro);
});

// ONLY ADMIN
app.get('/sessions', (_req: Request, res: Response) => {
	Session.findAll({
		attributes: ['id', 'title', 'start', 'finish'],
		include: [{ model: User, attributes: ['name'] }]
	}).then(sessions => {
		const data = proceedSessionsData(sessions);
		res.send(data);
	});
});

function proceedSessionsData(sessions: Session[]) {
	const curDate = new Date();
	return sessions.map(session => {
		if (new Date(session.start) <= curDate
                && new Date(session.finish) >= curDate) {
			return {
				title: session.title,
				lector: session.lector.name,
				start: new Date(session.start).toLocaleString(),
				finish: new Date(session.finish).toLocaleString(),
				isActive: true,
				id: -1
			};
		} else if (curDate <= new Date(session.start)) {
			return {
				title: session.title,
				lector: session.lector.name,
				start: new Date(session.start).toLocaleString(),
				finish: new Date(session.finish).toLocaleString(),
				id: -1,
				isActive: false
			};
		} else {
			return {
				title: session.title,
				lector: session.lector.name,
				start: new Date(session.start).toLocaleString(),
				finish: new Date(session.finish).toLocaleString(),
				id: session.id,
				isActive: false
			};
		}
	}
	);
}

// TODO current + User to get lector name
// ONLY ADMIN
app.get('/current', (_req: Request, res: Response) => {
	Session.findAll({
		attributes: ['id', 'title'],
		include: [{ model: User, attributes: ['name'] }],
		where: {
			start: {
				[Op.lt]: new Date()
			},
			finish: {
				[Op.gt]: new Date()
			}
		}
	})
		.then(results => res.send(results));
});

// GETTING SESSION RESULTS
// ONLY ADMIN
app.get('/results', (req: Request, res: Response) => {
	let sessionId = req.query.id;
	Promise.all([
		Session.findByPk(sessionId, { include: [{ model: User, attributes: ['name'] }] }),
		Results.findAll({
			attributes: ['form', 'content', 'interest', 'comment'],
			include: [{
				model: Session,
				attributes: ['title', 'start', 'finish']
			}],
			where: {
				sessionId
			}
		})
	])
		.then(results => {
			const caclResults = proceedData(results);
			res.status(200).send(caclResults);
		});
});

function proceedData(results: [Session, Results[]]): object {
	if (results[1][0] === undefined) return {
		title: results[0].title,
		lector: results[0].lector.name,
		start: results[0].start,
		finish: results[0].finish,
		count: 0,
		form: 0,
		content: 0,
		interest: 0,
		comments: []
	};

	const { title, start, finish, lector } = results[0];
	const count = results[1].length;
	let form_sum = 0;
	let content_sum = 0;
	let interest_sum = 0;
	let comments: string[] = [];

	results[1].forEach(result => {
		form_sum += result.form;
		content_sum += result.content;
		interest_sum += result.interest;
		if (result.comment) {
			comments.push(result.comment);
		}
	});

	return {
		title,
		lector: lector.name,
		start,
		finish,
		count,
		form: parseFloat((form_sum * 1.0 / count).toFixed(2)),
		content: parseFloat((content_sum * 1.0 / count).toFixed(2)),
		interest: parseFloat((interest_sum * 1.0 / count).toFixed(2)),
		comments
	};
}

// ONLY ADMIN
// UNESSASSARY
app.get('/comments', (req: Request, res: Response) => {
	let sessionId = req.query.id;
	Results.findAll({
		attributes: ['comment'],
		where: {
			sessionId
		}
	}).then(comments => res.send(comments));
});

// ONLY ADMIN
app.get('/users', (req: Request, res: Response) => {
	User.findAll({
		attributes: ['name']
	})
		.then(users => {
			res.send({
				users,
				totalNumber: users.length
			});
		});
});

app.listen(port, () => {
	console.log(`Приложение запущенно на порту ${port}`);
});

module.exports = app;
