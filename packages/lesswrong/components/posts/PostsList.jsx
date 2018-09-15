import { Components, withList, withCurrentUser, Utils } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Posts } from 'meteor/example-forum';
import Alert from 'react-bootstrap/lib/Alert'
import { FormattedMessage, intlShape } from 'meteor/vulcan:i18n';
import classNames from 'classnames';
import defineComponent from '../../lib/defineComponent';

const Error = ({error}) => <Alert className="flash-message" bsStyle="danger">
  <FormattedMessage id={error.id} values={{value: error.value}}/>{error.message}
</Alert>

const PostsList = ({
  className,
  results,
  loading,
  count,
  totalCount,
  loadMore,
  showHeader = true,
  showLoadMore = true,
  showNoResults = true,
  networkStatus,
  currentUser,
  error,
  terms}) => {

  const loadingMore = networkStatus === 2;
  const renderContent = () => {
    if (results && results.length) {
      return <div>
        <div className="posts-list-wrapper">
          {results.map(post => <Components.PostsItem post={post} key={post._id} currentUser={currentUser} terms={terms} />)}
        </div>
        {showLoadMore ? <Components.PostsLoadMore loading={loadingMore} loadMore={loadMore} count={count} totalCount={totalCount} /> : null}
      </div>
    } else if (loading) {
      return <Components.PostsLoading/>
    } else if (showNoResults) {
      return <Components.PostsNoResults/>
    }
  }
  return (
    <div className={classNames(className, 'posts-list')}>
      {showHeader ? <Components.PostsListHeader/> : null}
      {error ? <Error error={Utils.decodeIntlError(error)} /> : null }
      <div className="posts-list-content">
        { renderContent() }
      </div>
    </div>
  )
};

PostsList.propTypes = {
  results: PropTypes.array,
  terms: PropTypes.object,
  hasMore: PropTypes.bool,
  loading: PropTypes.bool,
  count: PropTypes.number,
  totalCount: PropTypes.number,
  loadMore: PropTypes.func,
  showHeader: PropTypes.bool,
};

PostsList.contextTypes = {
  intl: intlShape
};

const options = {
  collection: Posts,
  queryName: 'postsListQuery',
  fragmentName: 'PostsList',
  totalResolver: false,
  enableCache: true,
  fetchPolicy: 'cache-and-network',
  ssr: true
};

export default defineComponent({
  name: 'PostsList',
  component: PostsList,
  hocs: [ withCurrentUser, [withList, options] ]
});
