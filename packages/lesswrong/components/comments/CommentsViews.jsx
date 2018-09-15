import { Components, withCurrentUser, getSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router'
import Users from 'meteor/vulcan:users';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { Comments } from 'meteor/example-forum'
import defineComponent from '../../lib/defineComponent';

const viewNames = {
  'postCommentsTop': 'magical algorithm',
  'postCommentsNew': 'most recent',
  'postCommentsOld': 'oldest',
  'postCommentsBest': 'highest karma',
  'postCommentsDeleted': 'deleted',
  'postCommentsSpam': 'spam',
  'postCommentsReported': 'reported',
  'postLWComments': 'magical algorithm (include LW)',
}

const styles = theme => ({
  root: {
    display: 'inline'
  },
  link: {
    color: theme.palette.secondary.main,
  }
})

class CommentsViews extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
    }
  }

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleViewClick = (view) => {
    const { router, post } = this.props
    const currentQuery = (!_.isEmpty(router.location.query) && router.location.query) ||  {view: 'postCommentsTop'}
    this.setState({ anchorEl: null })
    router.replace({...router.location, query: {...currentQuery, view: view, postId: post._id}})
  };

  handleClose = () => {
    this.setState({ anchorEl: null })
  }

  render() {
    const { currentUser, classes, router, post } = this.props
    const { anchorEl } = this.state
    let views = ["postCommentsTop", "postCommentsNew", "postCommentsOld"]
    const adminViews = ["postCommentsDeleted", "postCommentsSpam", "postCommentsReported"]
    const afViews = ["postLWComments"]
    const currentView = _.clone(router.location.query).view ||  Comments.getDefaultView(post, currentUser)

    if (Users.canDo(currentUser, "comments.softRemove.all")) {
      views = views.concat(adminViews);
    }

    if (getSetting("AlignmentForum", false)) {
      views = views.concat(afViews);
    }

    return (
      <div className={classes.root}>
        <a className={classes.link} onClick={this.handleClick}>
          {viewNames[currentView]}
        </a>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handleClose}
        >
          {views.map(view => {
            return(
              <MenuItem
                key={view}
                onClick={() => this.handleViewClick(view)}
              >
                {viewNames[view]}
              </MenuItem>)})}
        </Menu>
      </div>
  )}
}

CommentsViews.propTypes = {
  currentUser: PropTypes.object,
  post: PropTypes.object.isRequired,
  defaultView: PropTypes.string,
  router: PropTypes.object.isRequired
};

CommentsViews.defaultProps = {
  defaultView: "postCommentsTop"
};

export default defineComponent({
  name: 'CommentsViews',
  component: CommentsViews,
  styles: styles,
  hocs: [ withRouter, withCurrentUser ]
});
