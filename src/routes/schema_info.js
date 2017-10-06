import _ from 'lodash';
import {
  GET, READ_WRITE, HIDDEN, LIST,
  MANY_TO_MANY, ONE_TO_MANY, ONE_TO_ONE, MANY_TO_ONE,
  STRING, DECIMAL, DATE, BOOLEAN, MEDIA, IMAGE,
} from 'node-bits';
import pluralize from 'pluralize';

const mapListFieldSource = (key, schemaConfig, modelConfig) => {
  let reference = key;
  let field = key;

  switch (modelConfig.source.type) {
    case MANY_TO_MANY:
    case ONE_TO_MANY:
      reference = pluralize.singular(key);
      break;

    case ONE_TO_ONE:
    case MANY_TO_ONE:
      reference = key.replace('Id', '');
      field = reference;
      break;

    default:
      break;
  }

  return {
    reference,
    referenceKey: 'id',
    referenceDisplay: 'name',
    referenceField: field,

    ...modelConfig.source,
  };
};

const mapMediaFieldDisplayType = (key, schemaConfig, modelConfig) => modelConfig.displayType || IMAGE;

const typeMap = {
  [String]: STRING,
  [Number]: DECIMAL,
  [Date]: DATE,
  [Boolean]: BOOLEAN,
};

const mapType = type => typeMap[type] || type;

const mapField = (key, schemaConfig, modelConfig) => {
  switch (modelConfig.type) {
    case LIST:
      modelConfig.source = mapListFieldSource(key, schemaConfig, modelConfig);
      break;

    case MEDIA:
      modelConfig.displayType = mapMediaFieldDisplayType(key, schemaConfig, modelConfig);
      break;

    default:
      break;
  }

  return {
    mode: READ_WRITE,

    ...schemaConfig,
    ...modelConfig,

    type: mapType(modelConfig.type || schemaConfig.type),
  };
};

const mapFields = (keys, schema, configMap) =>
  _.reduce(keys, (result, key) => {
    const schemaConfig = schema[key];
    const modelConfig = configMap[key] || {};
    return {
      ...result,
      [key]: mapField(key, schemaConfig, modelConfig),
    };
  }, {
    id: {
      mode: HIDDEN,
    },
  });

const mapSchema = (schema, models) =>
  _.reduce(schema, (result, value, key) => {

    const config = _.find(models, m => m.model === key);

    if (!config) {
      return [
        ...result,
        {
          model: key,
          mode: READ_WRITE,
          pluralizeTitle: true,
          map: mapFields(_.keys(value), value, {}),
          order: _.keys(value),
        },
      ];
    }

    if (config.mode === HIDDEN) {
      return result;
    }

    const configMap = config.map || {};
    const allKeys = _.uniq([..._.keys(value), ..._.keys(configMap)]);
    const order = config.order || allKeys;

    return [
      ...result,
      {
        pluralizeTitle: true,
        ...config,
        map: mapFields(order, value, configMap),
        order,
      },
    ];
  }, []);

export default config => {
  const apiRoot = config.root || '/api';
  return {
    verb: GET,
    route: `${apiRoot}/schema_info`,
    implementation: {
      get: (req, res) => {
        const result = _.reduce(config.schema,
          (result, value) => [...result, ...mapSchema(value.schema, config.models)], []);

        res.json(result);
      },
    },
  };
};
