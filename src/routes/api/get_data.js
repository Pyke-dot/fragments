const { createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const path = require('path');
// src/routes/api/get.js

/**
 * Get a list of fragments for the current user
 */
let fragment, fragmentM;
module.exports = {
  get_data: async (req, res) => {
    if (req.user) {
      if (req.query) {
        if (req.params.id) {
          let q = path.parse(req.params.id);
          try {
            fragmentM = await Fragment.byId(req.user, q.name);
            fragment = await fragmentM.getData();
            if (q.ext != '') {
              if (q.ext == '.html') {
                if (fragmentM.type == 'text/markdown') {
                  res.setHeader('Content-Type', 'text/html');
                  var result = fragmentM.convert(q.ext);
                  res.status(200).send(result);
                  logger.info({ targetType: q.ext }, `successfully convert to ${q.ext}`);
                } else {
                  res
                    .status(415)
                    .json(createErrorResponse(415, `fragment cannot be returned as a ${q.ext}`));
                }
              }
            } else {
              res.setHeader('Content-Type', fragmentM.type);
              res.status(200).send(fragment);
              logger.info(
                { fragmentData: fragment, contentType: fragmentM.type },
                `successfully get fragment data`
              );
            }
          } catch (err) {
            res
              .status(404)
              .json(createErrorResponse(404, `id does not represent a known fragment`));
          }
        }
      }
    }
  },
};
