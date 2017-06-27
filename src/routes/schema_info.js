import _ from 'lodash';
import {
  GET, READ_WRITE, HIDDEN, LIST,
  MANY_TO_MANY, ONE_TO_MANY, ONE_TO_ONE, MANY_TO_ONE,
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

const mapField = (key, schemaConfig, modelConfig) => {
  if (modelConfig.type === LIST) {
    modelConfig.source = mapListFieldSource(key, schemaConfig, modelConfig);
  }

  return {
    mode: READ_WRITE,

    ...schemaConfig,
    ...modelConfig,
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
  }, {});

const mapSchema = (schema, models) =>
  _.reduce(schema, (result, value, key) => {

    const config = _.find(models, m => m.model === key);

    if (!config) {
      return [
        ...result,
        {
          model: key,
          mode: READ_WRITE,
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
