import fs from 'fs';
import path from 'path';
import {logError} from 'node-bits';
import imagemin from 'imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';

const DEFAULT_CONFIG = {
  compressImages: false,
  compressionQuality: '70-85',
};

class OnDevice {
  constructor(config = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  // helper
  tempPath() {
    const {path: dirPath} = this.config;
    return path.join(dirPath, 'temp');
  }

  ensureDirectories() {
    const {path: dirPath, compressImages} = this.config;
    const tempPath = this.tempPath();

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }

    if (compressImages) {
      if (!fs.existsSync(tempPath)) {
        fs.mkdirSync(tempPath);
      }
    }
  }

  // STORE
  storeNormal(file, filePath) {
    file.mv(filePath);
  }

  storeAndCompress(file, filePath) {
    const {compressionQuality} = this.config;

    file.mv(filePath, err => {
      if (err) {
        logError(err);
        return;
      }

      imagemin([filePath], this.tempPath(), {
        plugins: [
          imageminJpegtran(),
          imageminPngquant({quality: compressionQuality}),
        ],
      }).then(files => {
        fs.unlinkSync(filePath);
        fs.renameSync(files[0].path, filePath);
      });
    });
  }

  store(file) {
    const {path: dirPath, compressImages} = this.config;
    const filePath = path.join(dirPath, file.name);

    this.ensureDirectories();

    if (compressImages) {
      this.storeAndCompress(file, filePath);
    } else {
      this.storeNormal(file, filePath);
    }

    return filePath;
  }

  // GET
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
        const filePath = item[field];
        if (!filePath) {
          res.send();
          return;
        }

        res.status(200).sendFile(filePath);
      })
      .catch(err => {
        logError(err);
        res.status(500).send(err);
      });
  }
}

export default config => new OnDevice(config);
