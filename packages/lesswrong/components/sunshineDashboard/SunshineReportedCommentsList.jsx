import {
  Components,
  registerComponent,
  withList,
  withCurrentUser,
  withEdit
} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Reports from '../../lib/collections/reports/collection.js';
import defineComponent from '../../lib/defineComponent';

const styles = theme => ({
  root: {
    backgroundColor: "rgba(60,0,0,.04)"
  }
})

class SunshineReportedCommentsList extends Component {
  render () {
    const { results, editMutation, classes } = this.props
    if (results && results.length) {
      return (
        <div className={classes.root}>
          <Components.SunshineListTitle>Flagged Comments</Components.SunshineListTitle>
          {results.map(report =>
            <div key={report._id} >
              <Components.SunshineReportsItem
                report={report}
                reportEditMutation={editMutation}
              />
            </div>
          )}
        </div>
      )
    } else {
      return null
    }
  }
}

const withListOptions = {
  collection: Reports,
  queryName: 'sunshineCommentsListQuery',
  fragmentName: 'unclaimedReportsList',
};

const withEditOptions = {
  collection: Reports,
  fragmentName: 'unclaimedReportsList',
}

export default defineComponent({
  name: 'SunshineReportedCommentsList',
  component: SunshineReportedCommentsList,
  styles: styles,
  hocs: [ [withList, withListOptions], [withEdit, withEditOptions], withCurrentUser ]
});
