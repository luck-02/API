// const http = require('http');
// const app = require('./app');

// // renvoi un port valide
// const normalizePort = val => {
// 	const port = parseInt(val, 10);

// 	if (isNaN(port)) return val;
// 	if (port >= 0) return port;
// 	return false;
// };
// const port = normalizePort(process.env.PORT || '3000');
// app.set('port', port);

// // gestion des retours d'erreurs
// const errorHandler = error => {
//     if (error.syscall !== 'listen') throw error;
  
//     const address = server.address();
//     const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;

// 	if (error.code === 'EACCES'){
// 		console.error(bind + ' requires elevated privileges.');
// 		process.exit(1);
// 	}

// 	if (error.code === 'EADDRINUSE') {
// 		console.error(bind + ' is already in use.');
// 		process.exit(1);
// 	}

// 	throw error;
// };

// const server = http.createServer(app);
// server.on('error', errorHandler);
// server.on('listening', () => {
// 	const address = server.address();
// 	const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
// 	console.log('Listening on ' + bind);
// });
// server.listen(port);

require('dotenv').config();
const express = require('express');
const cors = require('cors')
const mongoose = require('mongoose');
const routes = require('./router');

const app = express();
app.use(express.json());
app.use(cors())

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connecté à MongoDB'))
    .catch(err => console.error('Erreur MongoDB :', err));

app.use('/potions', routes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});


//Athentification
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(require('sanitize').middleware);
app.use('/auth', require('./auth.routes'));
//-------------------------------------------------------------------

const swaggerOptions = {
	definition: {
	  openapi: '3.0.0',
	  info: {
		title: 'API',
		version: '1.0.0',
		description: 'API de gestion des potions et users'
	  },
	  servers: [
		{
		  url: 'http://localhost:3000/'
		}
	  ]
	},
	apis: ['./router.js', './auth.routes.js']
};
  
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
