import express from 'express'
import ClassesController from './controllers/ClassesController';
import ConnectionsController from './controllers/ConnectionsController';

const routes = express.Router()

const classeController = new ClassesController();
const connectionsController = new ConnectionsController();

routes.get('/classes', classeController.index)
routes.post('/classes', classeController.create)

routes.get('/connections', connectionsController.index)
routes.post('/connections', connectionsController.create)

export default routes