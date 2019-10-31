var assert = require('assert');
var chai = require('chai');
var chaiHttp = require ('chai-http');
var app = require ('../server');

chai.use(chaiHttp);
chai.should();

describe('Server', () => {
    it("should get intro", (done) => {
        chai.request(app)
            .get('/')
            .end((err, res) => {
            res.should.have.status(200);
            // res.body.should.be.a('object');
            done();
        });
    });

    describe('start poll', ()=>{
        it('should not start non-existing session', (done) => {
            chai.request(app)
                .post('/start')
                .send({id: 666})
                .end((err, res) => {
                    res.should.have.status(404);
                    res.error.text.should.be.equal(`Опрос id=666 не существует.\nСоздайте его POST запросом /add?name=newName\n`)
                })
                done();
        });

        it('should start session', (done) => {
            chai.request(app)
                .post('/start')
                .send({id: 66})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.text.should.be.equal('Начинаем опрос: 66\n');
                });
                done();
        });
    });

    describe('finish poll', () => {
        it('should not stop non-started session' , () => {
            chai.request(app)
            .post('/stop')
            .send({id: 66})
            .end((err, res) => {
                res.should.have.status(403);
                res.error.text.should.be.equal('Невозможно остановить опрос, так как он еще не был начат.\n');
            });
        });

        it('should stop poll', () => {});
    })
});

// TODO сделать изоляцию тестов
