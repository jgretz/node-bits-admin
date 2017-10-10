import AWS from 'aws-sdk';
import _ from 'lodash';
import {logError, BEFORE, AFTER} from 'node-bits';

const DEFAULT_CONFIG = {
  region: 'us-east-1',
  accessKeyId: '',
  secretAccessKey: '',
  bucket: '',
  subFolder: '',
  generateSubFolder: null,
  downloadEndpoint: '',
  executionStage: BEFORE,
};

class OnAmazonS3 {
  constructor(config = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  executeOnStage() {
    return this.config.executionStage;
  }

  store(file, key, args) {
    if (!file || !file.data) return null;

    const config = this.config;

    const s3 = new AWS.S3({
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      sslEnabled: true,
    });

    const subFolder = (_.isFunction(config.generateSubFolder) ? config.generateSubFolder(args) : config.subFolder) || '';
    const subFolderWithSeparator = `${subFolder}${subFolder ? '/' : ''}`;

    const params = {
      Body: file.data,
      Bucket: config.bucket,
      Key: `${subFolderWithSeparator}${file.name}`,
      ContentType: file.mimetype,
    };

    s3.putObject(params, err => {
      if (err) logError(err);
    });

    const downloadUrl = `${config.downloadEndpoint}/${params.Key}`;

    if (this.executeOnStage() !== AFTER) return downloadUrl;

    const objectId = (args.data && args.data.id) ? args.data.id : args.req.body.id;
    const objectChanges = {[key]: downloadUrl};
    args.database.update(args.name, objectId, objectChanges);

    if (args.data.id) {
      args.data[key] = downloadUrl;
    }
    else {
      args.data = objectChanges;
    }

    return downloadUrl;
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
