const BaseController = require('../core-genc/base.controller');

class GatePassController extends BaseController {
  constructor(service) {
    super(service);

    this.requestGatePass = this.requestGatePass.bind(this);
  }

  async requestGatePass(req, res) {
    const result = await this.service.requestGatePass(req.body, req.user.id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(201).json(result);
  }
}

module.exports = GatePassController;
