require('jest-extended');
const express = require('express');
const { getEndpoints } = require('../src/index');

let app;
let router;

function checkResults(endpoints) {
  describe('should retrieve an array', () => {
    // eslint-disable-next-line no-unused-expressions
    it('checkResults pre-expects', () => {
      expect(Object.keys(endpoints)).not.toHaveLength(0);
      expect(Array.isArray(endpoints)).toBe(true);
      expect(endpoints).toHaveLength(2);
    });

    it('of objects', () => {
      endpoints.forEach((endpoint) => {
        // eslint-disable-next-line no-unused-expressions
        expect(Object.keys(endpoint)).not.toHaveLength(0);
        expect(endpoint).toBeInstanceOf(Object);
      });
    });

    describe('with the app endpoints', () => {
      endpoints.forEach((endpoint) => {
        describe('containing', () => {
          describe('the path', () => {
            it('as a string', () => {
              // eslint-disable-next-line no-unused-expressions
              expect(endpoint.path).not.toHaveLength(0);
              expect(typeof endpoint.path).toBe('string');
            });

            it('with the slashes', () => {
              expect(endpoint.path).toStartWith('/');
            });
          });

          describe('the methods', () => {
            it('as an array', () => {
              // eslint-disable-next-line no-unused-expressions
              expect(endpoint.methods).not.toHaveLength(0);
              expect(Array.isArray(endpoint.methods)).toBe(true);
            });

            endpoint.methods.forEach((method) => {
              it('of strings', () => {
                // eslint-disable-next-line no-unused-expressions
                expect(Object.keys(method)).not.toHaveLength(0);
                expect(typeof method).toBe('string');
              });

              it('in uppercase', () => {
                expect(method).toBe(method.toUpperCase());
              });

              it('excluding the _all ones', () => {
                expect(method).not.toBe('_ALL');
              });
            });
          });
        });
      });
    });
  });
}

describe('express-list-endpoints', () => {
  describe('when called over an app', () => {
    app = express();

    app.route('/')
      .get((req, res) => {
        res.end();
      })
      .all((req, res) => {
        res.end();
      })
      .post((req, res) => {
        res.end();
      });

    app.route('/testing')
      .all((req, res) => {
        res.end();
      })
      .delete((req, res) => {
        res.end();
      });

    checkResults(getEndpoints(app));
  });

  describe('when called over a router', () => {
    router = express.Router();

    router.route('/')
      .get((req, res) => {
        res.end();
      })
      .all((req, res) => {
        res.end();
      })
      .post((req, res) => {
        res.end();
      });

    router.route('/testing')
      .all((req, res) => {
        res.end();
      })
      .delete((req, res) => {
        res.end();
      });

    checkResults(getEndpoints(router));
  });

  describe('when called over an app with mounted routers', () => {
    app = express();
    router = express.Router();

    app.route('/testing')
      .all((req, res) => {
        res.end();
      })
      .delete((req, res) => {
        res.end();
      });

    router.route('/')
      .get((req, res) => {
        res.end();
      })
      .all((req, res) => {
        res.end();
      })
      .post((req, res) => {
        res.end();
      });

    app.use('/router', router);

    checkResults(getEndpoints(app));

    describe('and some of the routers has the option `mergeParams`', () => {
      app = express();
      router = express.Router({ mergeParams: true });

      router.get('/:id/friends', (req, res) => {
        res.end();
      });

      app.use('/router', router);

      const endpoints = getEndpoints(app);

      it('should parse the endpoints correctly', () => {
        expect(endpoints).toHaveLength(1);
        expect(endpoints[0].path).toBe('/router/:id/friends');
      });

      describe('and also has a sub-router on the router', () => {
        app = express();
        router = express.Router({ mergeParams: true });
        const subRouter = express.Router();

        subRouter.get('/', (req, res) => {
          res.end();
        });

        app.use('/router', router);

        router.use('/:postId/sub-router', subRouter);

        // eslint-disable-next-line no-shadow
        const endpoints = getEndpoints(app);

        it('should parse the endpoints correctly', () => {
          expect(endpoints).toHaveLength(1);
          expect(endpoints[0].path).toBe('/router/:postId/sub-router');
        });
      });
    });
  });

  describe('when the defined routes', () => {
    describe('contains underscores', () => {
      router = express.Router();

      router.get('/some_route', (req, res) => {
        res.end();
      });

      router.get('/some_other_router', (req, res) => {
        res.end();
      });

      router.get('/__last_route__', (req, res) => {
        res.end();
      });

      const endpoints = getEndpoints(router);

      it('should parse the endpoint correctly', () => {
        expect(endpoints[0].path).toBe('/some_route');
        expect(endpoints[1].path).toBe('/some_other_router');
        expect(endpoints[2].path).toBe('/__last_route__');
      });
    });

    describe('contains hyphens', () => {
      router = express.Router();

      router.get('/some-route', (req, res) => {
        res.end();
      });

      router.get('/some-other-router', (req, res) => {
        res.end();
      });

      router.get('/--last-route--', (req, res) => {
        res.end();
      });

      const endpoints = getEndpoints(router);

      it('should parse the endpoint corretly', () => {
        expect(endpoints[0].path).toBe('/some-route');
        expect(endpoints[1].path).toBe('/some-other-router');
        expect(endpoints[2].path).toBe('/--last-route--');
      });
    });

    describe('contains dots', () => {
      router = express.Router();

      router.get('/some.route', (req, res) => {
        res.end();
      });

      router.get('/some.other.router', (req, res) => {
        res.end();
      });

      router.get('/..last.route..', (req, res) => {
        res.end();
      });

      const endpoints = getEndpoints(router);

      it('should parse the endpoint corretly', () => {
        expect(endpoints[0].path).toBe('/some.route');
        expect(endpoints[1].path).toBe('/some.other.router');
        expect(endpoints[2].path).toBe('/..last.route..');
      });
    });

    describe('contains multiple different chars', () => {
      router = express.Router();

      router.get('/s0m3_r.oute', (req, res) => {
        res.end();
      });

      router.get('/v1.0.0', (req, res) => {
        res.end();
      });

      router.get('/not_sure.what-1m.d01ng', (req, res) => {
        res.end();
      });

      const endpoints = getEndpoints(router);

      it('should parse the endpoint correctly', () => {
        expect(endpoints[0].path).toBe('/s0m3_r.oute');
        expect(endpoints[1].path).toBe('/v1.0.0');
        expect(endpoints[2].path).toBe('/not_sure.what-1m.d01ng');
      });
    });
  });

  describe('when called over a mounted router with only root path', () => {
    app = express();
    router = express.Router();

    router.get('/', (req, res) => {
      res.end();
    });

    app.use('/', router);

    const endpoints = getEndpoints(app);

    it('should retrieve the list of endpoints and its methods', () => {
      expect(endpoints).toHaveLength(1);
      expect(endpoints[0]).toHaveProperty('path');
      expect(endpoints[0]).toHaveProperty('methods');
      expect(endpoints[0].path).toBe('/');
      expect(endpoints[0].methods[0]).toBe('GET');
    });
  });

  describe('when called over a multi-level base route', () => {
    app = express();
    router = express.Router();

    router.get('/my/path', (req, res) => {
      res.end();
    });

    app.use('/multi/level', router);
    app.use('/super/duper/multi/level', router);

    const endpoints = getEndpoints(app);

    it('should retrieve the correct built path', () => {
      expect(endpoints).toHaveLength(2);
      expect(endpoints[0].path).toBe('/multi/level/my/path');
      expect(endpoints[1].path).toBe('/super/duper/multi/level/my/path');
    });

    describe('with params', () => {
      app = express();
      router = express.Router();

      router.get('/users/:id', (req, res) => {
        res.end();
      });

      router.get('/super/users/:id', (req, res) => {
        res.end();
      });

      app.use('/multi/:multiId/level/:levelId', router);

      // eslint-disable-next-line no-shadow
      const endpoints = getEndpoints(app);

      it('should retrieve the correct built path', () => {
        expect(endpoints).toHaveLength(2);
        expect(endpoints[0].path).toBe('/multi/:multiId/level/:levelId/users/:id');
        expect(endpoints[1].path).toBe('/multi/:multiId/level/:levelId/super/users/:id');
      });
    });

    describe('with params in middle of the pattern', () => {
      app = express();
      router = express.Router();

      router.get('/super/users/:id/friends', (req, res) => {
        res.end();
      });

      app.use('/multi/level', router);

      // eslint-disable-next-line no-shadow
      const endpoints = getEndpoints(app);

      it('should retrieve the correct built path', () => {
        expect(endpoints).toHaveLength(1);
        expect(endpoints[0].path).toBe('/multi/level/super/users/:id/friends');
      });
    });
  });

  describe('when called over a route with params', () => {
    app = express();

    app.get('/users/:id', (req, res) => {
      res.end();
    });

    const endpoints = getEndpoints(app);

    it('should retrieve the correct built path', () => {
      expect(endpoints).toHaveLength(1);
      expect(endpoints[0].path).toBe('/users/:id');
    });
  });

  describe('when called over a route with params in middle of the pattern', () => {
    app = express();

    app.get('/users/:id/friends', (req, res) => {
      res.end();
    });

    const endpoints = getEndpoints(app);

    it('should retrieve the correct built path', () => {
      expect(endpoints).toHaveLength(1);
      expect(endpoints[0].path).toBe('/users/:id/friends');
    });
  });

  describe('when called over a route with multiple methods with "/" path defined', () => {
    router = express.Router();

    router
      .post('/test', (req, res) => {
        res.end();
      })
      .delete('/test', (req, res) => {
        res.end();
      });

    const endpoints = getEndpoints(router);

    it('should retrieve the correct built path', () => {
      expect(endpoints).toHaveLength(1);
      expect(endpoints[0].path).toBe('/test');
      expect(endpoints[0].methods[0]).toBe('POST');
    });

    it('should retrieve the correct built methods', () => {
      expect(endpoints[0].methods).toHaveLength(2);
      expect(endpoints[0].methods[0]).toBe('POST');
      expect(endpoints[0].methods[1]).toBe('DELETE');
    });
  });
});
