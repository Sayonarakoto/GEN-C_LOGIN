
const express = require('express');

const createCrudRouter = (controller) => {
  const router = express.Router();

  if (controller.list) router.get('/', controller.list);
  if (controller.getById) router.get('/:id', controller.getById);
  if (controller.create) router.post('/', controller.create);
  if (controller.saveAsDraft) router.post('/draft', controller.saveAsDraft);
  if (controller.update) router.put('/:id', controller.update);
  if (controller.remove) router.delete('/:id', controller.remove);

  return router;
};

module.exports = {
  createCrudRouter,
};
