class Container {
  constructor() {
    this.services = {};
    this.controllers = {};
  }

  registerService(name, instance) {
    this.services[name] = instance;
    return instance;
  }

  registerController(name, instance) {
    this.controllers[name] = instance;
    return instance;
  }

  getService(name) {
    return this.services[name];
  }

  getController(name) {
    return this.controllers[name];
  }
}

module.exports = new Container();
