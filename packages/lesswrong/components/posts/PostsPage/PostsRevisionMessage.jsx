import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { QueryLink } from '../../../lib/reactRouterWrapper.jsx';
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle
  },
})

const PostsRevisionMessage = ({post, classes}) => {
  if (!post.contents)
    return null;

  const { FormatDate } = Components
  return (
    <div className={classes.root}>
      You are viewing a version of this post published on the <FormatDate date={post.contents.editedAt} format="Do MMM YYYY"/>. 
      <QueryLink query={{revision: undefined}}>This link</QueryLink> will always display the most recent version of the post..
    </div>
  );
}

PostsRevisionMessage.propTypes = {
  post: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

registerComponent('PostsRevisionMessage', PostsRevisionMessage, withStyles(styles, {name:"PostsRevisionMessage"}));
