const Server = require('./server');

new Server()
  .createHttp()
  .createSocketRoutes()
  .listen();
