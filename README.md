## Сервер для создания и проведения опросов в реальном времени 

Адрес клиента: [https://public.colo18.now.sh](https://public.colo18.now.sh)

Адрес сервера: [https://realtimepoll-server.herokuapp.com](https://realtimepoll-server.herokuapp.com)

Команды:
- POST /add?name=TestName - добавление новой сессии про имени, возвращается id сессии
- GET /sessions - получить объект со всеми сессиями
- POST /start?id=45 - начать сессию 
- POST /stop?id=45 - остановить сессию
- GET /results?id=45 - получение результатов сессии в формате .txt
- GET /current - узнать текущую сессию

Замечания: 
1) При добавлении не учитывается уникальность имени 
2) Результаты всех сессий хранятся на сервере в папке results
3) Нет защиты