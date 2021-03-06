import React from 'react';
import { useDialog } from '../common/withDialog';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema'
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import HistoryIcon from '@material-ui/icons/History';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';

const styles = (theme: ThemeType): JssStyles => ({
  buttonsRow: {
    ...theme.typography.body2,
    ...theme.typography.uiStyle,
    marginTop: 2,
    marginBottom: 16,
    color: theme.palette.grey[700],
    display: "flex",
    flexWrap: "wrap",
    '& svg': {
      height: 20,
      width: 20,
      marginRight: 4,
      cursor: "pointer",
      color: theme.palette.grey[700]
    }
  },
  button: {
    display: "flex",
    alignItems: "center",
    marginRight: 16
  },
  buttonLabel: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  disabledButton: {
    '&&': {
      color: theme.palette.grey[500],
      cursor: "default",
      marginBottom: 12
    }
  },
  ctaPositioning: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto"
  },
  subscribeToWrapper: {
    display: "flex !important",
  },
  subscribeTo: {
    marginRight: 16
  },
  callToAction: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto",
    fontStyle: 'italic',
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  callToActionFlagCount: {
    position: "relative",
    marginLeft: 4,
    marginRight: 0
  }
});

const TagPageButtonRow = ({tag, editing, setEditing, classes}: {
  tag: TagPageWithRevisionFragment|TagPageFragment,
  editing: boolean,
  setEditing: (editing: boolean)=>void,
  classes: ClassesType
}) => {
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  const { LWTooltip, SubscribeTo, TagDiscussionButton } = Components;
  
  const numFlags = tag.tagFlagsIds?.length
  
  return <div className={classes.buttonsRow}>
    {!editing && <a className={classes.button} onClick={(ev) => {
      if (currentUser) {
        setEditing(true)
      } else {
        openDialog({
          componentName: "LoginPopup",
          componentProps: {}
        });
        ev.preventDefault();
      }
    } }>
      <EditOutlinedIcon /><span className={classes.buttonLabel}>Edit</span>
    </a>} 
    {<Link className={classes.button} to={`/tag/${tag.slug}/history`}>
      <HistoryIcon /><span className={classes.buttonLabel}>History</span>
    </Link>}
    {!tag.wikiOnly && !editing && <LWTooltip title="Get notifications when posts are added to this tag." className={classes.subscribeToWrapper}>
      <SubscribeTo
        document={tag}
        className={classes.subscribeTo}
        showIcon
        hideLabelOnMobile
        subscribeMessage="Subscribe"
        unsubscribeMessage="Unsubscribe"
        subscriptionType={subscriptionTypes.newTagPosts}
      />
    </LWTooltip>}
    <div className={classes.button}>
      <TagDiscussionButton tag={tag} hideLabelOnMobile />
    </div>
    <div className={classes.callToAction}>
      <LWTooltip
        title={ tag.tagFlagsIds?.length > 0 ? 
          <div>
            {tag.tagFlags.map((flag, i) => <span key={flag._id}>{flag.name}{(i+1) < tag.tagFlags?.length && ", "}</span>)}
          </div> :
          <span>
            This tag does not currently have any improvement flags set.
          </span>
        }
        >
        <a onClick={(ev) => {
          if (currentUser) setEditing(true);
          openDialog({
            componentName: currentUser ? "TagCTAPopup" : "LoginPopup",
            componentProps: {}
          })
          ev.preventDefault();
        }}>
          <span className={classes.callToAction}> Help improve this page{/*
          */}<span className={classes.callToActionFlagCount}>{!!numFlags&&`(${numFlags} flags)`}</span>
          </span>
        </a> 
      </LWTooltip>
    </div>
  </div>
}

const TagPageButtonRowComponent = registerComponent("TagPageButtonRow", TagPageButtonRow, {styles});

declare global {
  interface ComponentTypes {
    TagPageButtonRow: typeof TagPageButtonRowComponent
  }
}

