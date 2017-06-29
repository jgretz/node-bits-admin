import React from 'react';
import {connect} from 'react-redux';
import {API_BASE_URL} from 'configs'; // eslint-disable-line

import {userSelector, loginInfoSelector} from '../../../auth/selectors';

const image = ({url, user, loginInfo}) => {
  let src = url;
  if (loginInfo.required) {
    src = `${url}&token=${user.token}`;
  }

  return (
    <img src={src} />
  );
};

const ConnectedImage = connect(state =>
({
  loginInfo: loginInfoSelector(state),
  user: userSelector(state),
}))(image);

export default (item, key, schema, fullSchema) => {
  const url = `${API_BASE_URL}media?model=${fullSchema.model}&field=${key}&id=${item.id}`;

  return item[key] ? <ConnectedImage url={url} /> : null;
};
