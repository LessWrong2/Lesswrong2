import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import Books from '../../lib/collections/books/collection.js';
import defineComponent from '../../lib/defineComponent';

const BooksNewForm = (props) => {
  return (
    <div className="chapters-new-form">
      <Components.SmartForm
        collection={Books}
        successCallback={props.successCallback}
        cancelCallback={props.cancelCallback}
        prefilledProps={props.prefilledProps}
        fragment={getFragment('BookPageFragment')}
        queryFragment={getFragment('BookPageFragment')}
        mutationFragment={getFragment('BookPageFragment')}
      />
    </div>
  )
}

export default defineComponent({
  name: 'BooksNewForm',
  component: BooksNewForm,
  hocs: [ withMessages ]
});
