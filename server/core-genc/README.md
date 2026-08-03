# core-genc

This folder contains the core Express architecture components for the project:

- `db.js` — central MongoDB connection helper.
- `base.service.js` — transaction-safe base service with shared CRUD.
- `base.controller.js` — generic base controller exposes reusable API actions.
- `router.factory.js` — optional generic router generator for controller classes.
- `container.js` — manual dependency injection container.
