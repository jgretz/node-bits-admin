import {logError} from 'node-bits';

export default () => ({
  store: file => file.data.toString('base64'),

  getFile: (req, res, db) => {
    const model = req.query.model;
    if (!model) {
      res.status(404).send('You must provide model for this configuration.');
      return;
    }

    const field = req.query.field;
    if (!field) {
      res.status(404).send('You must provide field for this configuration.');
      return;
    }

    const id = req.query.id;
    if (!id) {
      res.status(404).send('You must provide id for this configuration.');
      return;
    }

    db.findById(model, id)
      .then(item => {
        const data = item[field];
        if (!data) {
          res.send();
          return;
        }

        const img = new Buffer(data, 'base64');
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': img.length,
        });
        res.end(img);
      })
      .catch(err => {
        logError(err);
        res.status(500).send(err);
      });
  },
});
