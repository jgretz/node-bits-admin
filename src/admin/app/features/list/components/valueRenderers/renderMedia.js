import React from 'react';

import {Image} from '../../../shared/components';
import {makeTitle} from '../../../shared/services';
import {IMAGE} from '../../../shared/constants';

export default (item, key, schema, modelSchema) => {
  const value = item[key];
  if (!value) {
    return null;
  }

  if (schema.displayType === IMAGE) {
    return (
      <Image item={item} field={key} model={modelSchema.model} />
    );
  }

  return (
    <div className="center">
      <a href={value} target="_blank">{makeTitle(key, {plural: false})}</a>
    </div>
  );
};
