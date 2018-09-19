import React, { Component } from 'react';
import { Components, withList, Loading, withEdit } from 'meteor/vulcan:core';
import { Posts, Comments } from 'meteor/example-forum';
import defineComponent from '../../lib/defineComponent';
import withUser from '../common/withUser';

const RecentDiscussionThreadsList = ({
  results,
  loading,
  loadMore,
  networkStatus,
  editMutation,
  currentUser,
  threadView = "recentDiscussionThread"
}) => {
  const loadingMore = networkStatus === 2;
  if (!loading && results && !results.length) {
    return null
  }

  return (
    <div>
      <div className="discussion-thread-list">
        {loading || !results ? <Loading /> :
        <div className="discussion-threads">
          {results.map((post, i) =>
            <Components.RecentDiscussionThread
              key={post._id}
              post={post}
              postCount={i}
              terms={{view:threadView, postId:post._id}}
              currentUser={currentUser}
              editMutation={editMutation}/>

          )}
          {loadMore && <Components.CommentsLoadMore loading={loadingMore || loading} loadMore={loadMore}  />}
        </div>}
      </div>
    </div>)
  }

const discussionThreadsOptions = {
  collection: Posts,
  queryName: 'selectCommentsListQuery',
  fragmentName: 'PostsList',
  totalResolver: false,
  pollInterval: 0,
  enableCache: true,
};

const withEditOptions = {
  collection: Comments,
  fragmentName: 'SelectCommentsList',
};

export default defineComponent({
  name: 'RecentDiscussionThreadsList',
  component: RecentDiscussionThreadsList,
  hocs: [ [withList, discussionThreadsOptions], [withEdit, withEditOptions], withUser ]
});
