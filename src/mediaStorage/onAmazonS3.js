import AWS from 'aws-sdk';
import {logError} from 'node-bits';

const DEFAULT_CONFIG = {
  region: 'us-east-1',
  accessKeyId: '',
  secretAccessKey: '',
  bucket: '',
  subFolder: '',
  downloadEndpoint: '',
};

class OnAmazonS3 {
  constructor(config = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  store(file) {
    const config = this.config;

    const s3 = new AWS.S3({
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      sslEnabled: true,
    });

    if (!file || !file.data) return null;

    const params = {
      Body: file.data,
      Bucket: config.bucket,
      Key: (config.subFolder ? `${config.subFolder}/` : '') + file.name,
      ContentType: file.mimetype,
    };

    s3.putObject(params, err => {
      if (err) logError(err);
    });

    return `${config.downloadEndpoint}/${file.name}`;
  }

  getFile(req, res, db) {
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
        res.redirect(item[field]);
      })
      .catch(err => {
        logError(err);
        res.status(500).send(err);
      });
  }
}

export default config => new OnAmazonS3(config);
