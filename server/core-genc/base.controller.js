const TableListViewModel = require('../viewmodels/TableListViewModel');
const logger = require('../utils/logger');

/**
 * Enterprise BaseController
 * Provides standard CRUD HTTP route handlers, standardized JSON response structures,
 * and method execution tracing for Express routes.
 */
class BaseController {
  constructor(service, viewModel = null, name = 'BaseController') {
    this.service = service;
    this.viewModel = viewModel;
    this.name = name;

    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
  }

  async getById(req, res) {
    const startTime = Date.now();
    logger.logMethodCall(this.name, 'getById', { params: req.params });

    try {
      const result = await this.service.getById(req.params.id);
      if (!result.success || !result.data) {
        logger.logMethodError(this.name, 'getById', new Error('Record not found'), Date.now() - startTime);
        return res.status(404).json({ success: false, message: result.message || 'Record not found.' });
      }

      const payload = this.viewModel ? this.viewModel.toDTO(result.data) : result.data;
      logger.logMethodSuccess(this.name, 'getById', Date.now() - startTime);
      return res.status(200).json({ success: true, data: payload });
    } catch (error) {
      logger.logMethodError(this.name, 'getById', error, Date.now() - startTime);
      return res.status(500).json({ success: false, message: 'Server error processing request.' });
    }
  }

  async list(req, res) {
    const startTime = Date.now();
    logger.logMethodCall(this.name, 'list', { query: req.query });

    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;

      let filter = {};
      if (req.query.filter) {
        try {
          filter = typeof req.query.filter === 'string' ? JSON.parse(req.query.filter) : req.query.filter;
        } catch (e) {
          filter = {};
        }
      }

      const result = await this.service.list(filter, { limit, skip });
      if (!result.success) {
        logger.logMethodError(this.name, 'list', new Error(result.message), Date.now() - startTime);
        return res.status(400).json({ success: false, message: result.message });
      }

      const dtoList = this.viewModel ? this.viewModel.toDTOList(result.data) : result.data;
      const pagedResult = TableListViewModel.toPagedResult(dtoList, result.totalCount, page, limit);

      logger.logMethodSuccess(this.name, 'list', Date.now() - startTime);
      return res.status(200).json({ success: true, data: pagedResult });
    } catch (error) {
      logger.logMethodError(this.name, 'list', error, Date.now() - startTime);
      return res.status(500).json({ success: false, message: 'Server error fetching records.' });
    }
  }

  async create(req, res) {
    const startTime = Date.now();
    logger.logMethodCall(this.name, 'create');

    try {
      const result = await this.service.save(req.body);
      if (!result.success) {
        logger.logMethodError(this.name, 'create', new Error(result.message), Date.now() - startTime);
        return res.status(400).json({ success: false, message: result.message });
      }

      const payload = this.viewModel ? this.viewModel.toDTO(result.data) : result.data;
      logger.logMethodSuccess(this.name, 'create', Date.now() - startTime);
      return res.status(201).json({ success: true, data: payload, message: 'Created successfully.' });
    } catch (error) {
      logger.logMethodError(this.name, 'create', error, Date.now() - startTime);
      return res.status(500).json({ success: false, message: 'Server error creating record.' });
    }
  }

  async update(req, res) {
    const startTime = Date.now();
    logger.logMethodCall(this.name, 'update', { id: req.params.id });

    try {
      const result = await this.service.update(req.params.id, req.body);
      if (!result.success) {
        logger.logMethodError(this.name, 'update', new Error(result.message), Date.now() - startTime);
        return res.status(400).json({ success: false, message: result.message });
      }

      const payload = this.viewModel ? this.viewModel.toDTO(result.data) : result.data;
      logger.logMethodSuccess(this.name, 'update', Date.now() - startTime);
      return res.status(200).json({ success: true, data: payload, message: 'Updated successfully.' });
    } catch (error) {
      logger.logMethodError(this.name, 'update', error, Date.now() - startTime);
      return res.status(500).json({ success: false, message: 'Server error updating record.' });
    }
  }

  async remove(req, res) {
    const startTime = Date.now();
    logger.logMethodCall(this.name, 'remove', { id: req.params.id });

    try {
      const result = await this.service.remove(req.params.id);
      if (!result.success) {
        logger.logMethodError(this.name, 'remove', new Error(result.message), Date.now() - startTime);
        return res.status(400).json({ success: false, message: result.message });
      }

      logger.logMethodSuccess(this.name, 'remove', Date.now() - startTime);
      return res.status(200).json({ success: true, message: 'Deleted successfully.' });
    } catch (error) {
      logger.logMethodError(this.name, 'remove', error, Date.now() - startTime);
      return res.status(500).json({ success: false, message: 'Server error removing record.' });
    }
  }
}

module.exports = BaseController;
