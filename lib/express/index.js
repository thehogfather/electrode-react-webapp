"use strict";

const _ = require("lodash");
const assert = require("assert");
const ReactWebapp = require("../react-webapp");

const HTTP_ERROR_500 = 500;
const HTTP_REDIRECT = 302;

const registerRoutes = (app, options, next) => {
  ReactWebapp.setupOptions(options)
    .then((registerOptions) => {
      _.each(registerOptions.paths, (v, path) => {
        assert(v.content, `You must define content for the webapp plugin path ${path}`);

        const routeHandler = ReactWebapp.makeRouteHandler(
          registerOptions, ReactWebapp.resolveContent(v.content));

        /*eslint max-nested-callbacks: [0, 4]*/
        let methods = v.method || ["GET"];
        if (!Array.isArray(methods)) {
          methods = [methods];
        }
        _.each(methods, (method) => {
          if (method === "*") {
            method = "ALL";
          }
          app[method.toLowerCase()](path, (request, response) => { //eslint-disable-line
            const handleStatus = (data) => {
              const status = data.status;
              if (status === HTTP_REDIRECT) {
                response.redirect(data.path);
              } else {
                response.send({message: "error"}).code(status);
              }
            };

            return routeHandler({mode: request.query.__mode || "", request})
              .then((data) => {
                return data.status ? handleStatus(data) : response.send(data);
              })
              .catch((err) => {
                response.send(err.html).code(err.status || HTTP_ERROR_500);
              });
          });
        });
      });
    })
    .then(() => next())
    .catch(next);
};

module.exports = registerRoutes;
