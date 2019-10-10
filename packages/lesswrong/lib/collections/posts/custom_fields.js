import { Posts } from './collection';
import Users from "meteor/vulcan:users";
import { makeEditable } from '../../editor/make_editable.js'
import { addFieldsDict, foreignKeyField, arrayOfForeignKeysField, accessFilterMultiple, resolverOnlyField, denormalizedCountOfReferences, accessFilterSingle } from '../../modules/utils/schemaUtils'
import { localGroupTypeFormOptions } from '../localgroups/groupTypes';
import { Utils } from 'meteor/vulcan:core';
import GraphQLJSON from 'graphql-type-json';
import { schemaDefaultValue } from '../../collectionUtils';
import { getWithLoader } from '../../loaders.js';
import moment from 'moment';

export const formGroups = {
  default: {
    name: "default",
    order: 0,
    paddingStyle: true
  },
  adminOptions: {
    name: "adminOptions",
    order: 25,
    label: "Admin Options",
    startCollapsed: true,
  },
  event: {
    name: "event details",
    order: 21,
    label: "Event Details"
  },
  moderationGroup: {
    order: 60,
    name: "moderation",
    label: "Moderation Guidelines",
    helpText: "We prefill these moderation guidelines based on your user settings. But you can adjust them for each post.",
    startCollapsed: true,
  },
  options: {
    order:10,
    name: "options",
    defaultStyle: true,
    paddingStyle: true,
    flexStyle: true
  },
  content: { //TODO – should this be 'contents'? is it needed?
    order:20,
    name: "Content",
    defaultStyle: true,
    paddingStyle: true,
  },
  canonicalSequence: {
    order:30,
    name: "canonicalSequence",
    label: "Canonical Sequence",
    startCollapsed: true,
  },
  advancedOptions: {
    order:40,
    name: "advancedOptions",
    label: "Options",
    startCollapsed: true,
    flexStyle: true
  },
};


const userHasModerationGuidelines = (currentUser) => {
  return !!(currentUser && ((currentUser.moderationGuidelines && currentUser.moderationGuidelines.html) || currentUser.moderationStyle))
}

addFieldsDict(Posts, {
  // URL (Overwriting original schema)
  url: {
    order: 12,
    control: 'EditUrl',
    placeholder: 'Add a linkpost URL',
    group: formGroups.options,
    editableBy: [Users.owns, 'sunshineRegiment', 'admins']
  },
  // Title (Overwriting original schema)
  title: {
    order: 10,
    placeholder: "Title",
    control: 'EditTitle',
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    group: formGroups.default,
  },

  // Legacy: Boolean used to indicate that post was imported from old LW database
  legacy: {
    type: Boolean,
    optional: true,
    hidden: false,
    defaultValue: false,
    viewableBy: ['guests'],
    editableBy: ['admin'],
    insertableBy: ['admin'],
    control: "checkbox",
    order: 12,
    group: formGroups.adminOptions,
  },

  // Legacy ID: ID used in the original LessWrong database
  legacyId: {
    type: String,
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
  },

  // Legacy Spam: True if the original post in the legacy LW database had this post
  // marked as spam
  legacySpam: {
    type: Boolean,
    optional: true,
    defaultValue: false,
    hidden: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
  },

  // Feed Id: If this post was automatically generated by an integrated RSS feed
  // then this field will have the ID of the relevant feed
  feedId: {
    ...foreignKeyField({
      idFieldName: "feedId",
      resolverName: "feed",
      collectionName: "RSSFeeds",
      type: "RSSFeed"
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    group: formGroups.adminOptions,
  },

  // Feed Link: If this post was automatically generated by an integrated RSS feed
  // then this field will have the link to the original blogpost it was posted from
  feedLink: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    group: formGroups.adminOptions
  },
 

  // lastVisitedAt: If the user is logged in and has viewed this post, the date
  // they last viewed it. Otherwise, null.
  lastVisitedAt: resolverOnlyField({
    type: Date,
    viewableBy: ['guests'],
    resolver: async (post, args, { ReadStatuses, currentUser }) => {
      if (!currentUser) return null;

      const readStatus = await getWithLoader(ReadStatuses,
        `readStatuses`,
        { userId: currentUser._id },
        'postId', post._id
      );
      if (!readStatus.length) return null;
      return readStatus[0].lastUpdated;
    }
  }),
  
  isRead: resolverOnlyField({
    type: Boolean,
    viewableBy: ['guests'],
    resolver: async (post, args, { ReadStatuses, currentUser }) => {
      if (!currentUser) return false;
      
      const readStatus = await getWithLoader(ReadStatuses,
        `readStatuses`,
        { userId: currentUser._id },
        'postId', post._id
      );
      if (!readStatus.length) return false;
      return readStatus[0].isRead;
    }
  }),

  lastCommentedAt: {
    type: Date,
    denormalized: true,
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    onInsert: () => new Date(),
  },

  // curatedDate: Date at which the post was promoted to curated (null or false
  // if it never has been promoted to curated)
  curatedDate: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['sunshineRegiment', 'admins'],
    editableBy: ['sunshineRegiment', 'admins'],
    group: formGroups.adminOptions,
  },
  // metaDate: Date at which the post was marked as meta (null or false if it
  // never has been marked as meta)
  metaDate: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['sunshineRegiment', 'admins'],
    editableBy: ['sunshineRegiment', 'admins'],
    group: formGroups.adminOptions,
  },
  suggestForCuratedUserIds: {
    type: Array,
    viewableBy: ['members'],
    insertableBy: ['sunshineRegiment', 'admins'],
    editableBy: ['sunshineRegiment', 'admins'],
    optional: true,
    label: "Suggested for Curated by",
    control: "UsersListEditor",
    group: formGroups.adminOptions,
    resolveAs: {
      fieldName: 'suggestForCuratedUsernames',
      type: 'String',
      resolver: async (post, args, context) => {
        // TODO - Turn this into a proper resolve field.
        // Ran into weird issue trying to get this to be a proper "users"
        // resolve field. Wasn't sure it actually needed to be anyway,
        // did a hacky thing.
        const users = await Promise.all(_.map(post.suggestForCuratedUserIds,
          async userId => {
            const user = await context.Users.loader.load(userId)
            return user.displayName;
          }
        ))
        if (users.length) {
          return users.join(", ")
        } else {
          return null
        }
      },
      addOriginalField: true,
    }
  },
  'suggestForCuratedUserIds.$': {
    type: String,
    foreignKey: 'Users',
    optional: true,
  },

  // frontpageDate: Date at which the post was promoted to frontpage (null or
  // false if it never has been promoted to frontpage)
  frontpageDate: {
    type: Date,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    optional: true,
    hidden: true,
  },

  collectionTitle: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.canonicalSequence,
  },

  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User"
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    hidden: false,
    control: "text",
    group: formGroups.adminOptions,
  },

  coauthorUserIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "coauthorUserIds",
      resolverName: "coauthors",
      collectionName: "Users",
      type: "User"
    }),
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    optional: true,
    label: "Co-Authors",
    control: "UsersListEditor",
    group: formGroups.advancedOptions,
  },
  'coauthorUserIds.$': {
    type: String,
    foreignKey: 'Users',
    optional: true
  },

  canonicalSequenceId: {
    ...foreignKeyField({
      idFieldName: "canonicalSequenceId",
      resolverName: "canonicalSequence",
      collectionName: "Sequences",
      type: "Sequence"
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.canonicalSequence,
    hidden: false,
    control: "text",
  },

  canonicalCollectionSlug: {
    type: String,
    foreignKey: {
      collection: 'Collections',
      field: 'slug'
    },
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    hidden: false,
    control: "text",
    group: formGroups.canonicalSequence,
    resolveAs: {
      fieldName: 'canonicalCollection',
      addOriginalField: true,
      type: "Collection",
      // TODO: Make sure we run proper access checks on this. Using slugs means it doesn't
      // work out of the box with the id-resolver generators
      resolver: (post, args, context) => {
        if (!post.canonicalCollectionSlug) return null;
        return context.Collections.findOne({slug: post.canonicalCollectionSlug})
      }
    },
  },

  canonicalBookId: {
    ...foreignKeyField({
      idFieldName: "canonicalBookId",
      resolverName: "canonicalBook",
      collectionName: "Books",
      type: "Book"
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.canonicalSequence,
    hidden: false,
    control: "text",
  },

  canonicalNextPostSlug: {
    type: String,
    foreignKey: {
      collection: "Posts",
      field: 'slug',
    },
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.canonicalSequence,
    hidden: false,
    control: "text"
  },

  canonicalPrevPostSlug: {
    type: String,
    foreignKey: {
      collection: "Posts",
      field: 'slug',
    },
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.canonicalSequence,
    hidden: false,
    control: "text"
  },

  // The next post. If a sequenceId is provided, that sequence must contain this
  // post, and this returns the next post after this one in that sequence. If
  // no sequenceId is provided, uses this post's canonical sequence.
  nextPost: resolverOnlyField({
    type: "Post",
    graphQLtype: "Post",
    viewableBy: ['guests'],
    graphqlArguments: 'sequenceId: String',
    resolver: async (post, { sequenceId }, { currentUser, Posts, Sequences }) => {
      if (sequenceId) {
        const nextPostID = await Sequences.getNextPostID(sequenceId, post._id);
        if (nextPostID) {
          const nextPost = await Posts.loader.load(nextPostID);
          return accessFilterSingle(currentUser, Posts, nextPost);
        }
      }
      if (post.canonicalNextPostSlug) {
        const nextPost = await Posts.findOne({ slug: post.canonicalNextPostSlug });
        return accessFilterSingle(currentUser, Posts, nextPost);
      }
      if(post.canonicalSequenceId) {
        const nextPostID = await Sequences.getNextPostID(post.canonicalSequenceId, post._id);
        if (!nextPostID) return null;
        const nextPost = await Posts.loader.load(nextPostID);
        return accessFilterSingle(currentUser, Posts, nextPost);
      }

      return null;
    }
  }),

  // The previous post. If a sequenceId is provided, that sequence must contain
  // this post, and this returns the post before this one in that sequence.
  // If no sequenceId is provided, uses this post's canonical sequence.
  prevPost: resolverOnlyField({
    type: "Post",
    graphQLtype: "Post",
    viewableBy: ['guests'],
    graphqlArguments: 'sequenceId: String',
    resolver: async (post, { sequenceId }, { currentUser, Posts, Sequences }) => {
      if (sequenceId) {
        const prevPostID = await Sequences.getPrevPostID(sequenceId, post._id);
        if (prevPostID) {
          const prevPost = await Posts.loader.load(prevPostID);
          return accessFilterSingle(currentUser, Posts, prevPost);
        }
      }
      if (post.canonicalPrevPostSlug) {
        const prevPost = await Posts.findOne({ slug: post.canonicalPrevPostSlug });
        return accessFilterSingle(currentUser, Posts, prevPost);
      }
      if(post.canonicalSequenceId) {
        const prevPostID = await Sequences.getPrevPostID(post.canonicalSequenceId, post._id);
        if (!prevPostID) return null;
        const prevPost = await Posts.loader.load(prevPostID);
        return accessFilterSingle(currentUser, Posts, prevPost);
      }

      return null;
    }
  }),

  // A sequence this post is part of. Takes an optional sequenceId; if the
  // sequenceId is given and it contains this post, returns that sequence.
  // Otherwise, if this post has a canonical sequence, return that. If no
  // sequence ID is given and there is no canonical sequence for this post,
  // returns null.
  sequence: resolverOnlyField({
    type: "Sequence",
    graphQLtype: "Sequence",
    viewableBy: ['guests'],
    graphqlArguments: 'sequenceId: String',
    resolver: async (post, { sequenceId }, { currentUser, Sequences }) => {
      let sequence = null;
      if (sequenceId && await Sequences.sequenceContainsPost(sequenceId, post._id)) {
        sequence = await Sequences.loader.load(sequenceId);
      } else if (post.canonicalSequenceId) {
        sequence = await Sequences.loader.load(post.canonicalSequenceId);
      }

      return accessFilterSingle(currentUser, Sequences, sequence);
    }
  }),

  // unlisted: If true, the post is not featured on the frontpage and is not
  // featured on the user page. Only accessible via it's ID
  unlisted: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    label: "Make only accessible via link",
    control: "checkbox",
    order: 11,
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },

  // disableRecommendation: If true, this post will never appear as a
  // recommended post (but will still appear in all other places, ie on its
  // author's profile, in archives, etc).
  // Use for things that lose their relevance with age, like announcements, or
  // for things that aged poorly, like results that didn't replicate.
  disableRecommendation: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    label: "Exclude from Recommendations",
    control: "checkbox",
    order: 12,
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },

  // defaultRecommendation: If true, always include this post in the recommendations
  defaultRecommendation: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    label: "Include in default recommendations",
    control: "checkbox",
    order: 13,
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },

  // Drafts
  draft: {
    label: 'Save to Drafts',
    type: Boolean,
    optional: true,
    ...schemaDefaultValue(false),
    viewableBy: ['members'],
    insertableBy: ['members'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    hidden: true,
  },


  // meta: The post is published to the meta section of the page
  meta: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    hidden: true,
    label: "Publish to meta",
    control: "checkbox",
    ...schemaDefaultValue(false)
  },

  hideFrontpageComments: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    control: 'checkbox',
    group: formGroups.moderationGroup,
    ...schemaDefaultValue(false),
  },

  // maxBaseScore: Highest baseScore this post ever had, used for RSS feed generation
  maxBaseScore: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    hidden: true,
    onInsert: (document) => document.baseScore || 0,
  },
  // The timestamp when the post's maxBaseScore first exceeded 2
  scoreExceeded2Date: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    onInsert: document => document.baseScore >= 2 ? new Date() : null
  },
  // The timestamp when the post's maxBaseScore first exceeded 30
  scoreExceeded30Date: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    onInsert: document => document.baseScore >= 30 ? new Date() : null
  },
  // The timestamp when the post's maxBaseScore first exceeded 45
  scoreExceeded45Date: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    onInsert: document => document.baseScore >= 45 ? new Date() : null
  },
  // The timestamp when the post's maxBaseScore first exceeded 75
  scoreExceeded75Date: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    onInsert: document => document.baseScore >= 75 ? new Date() : null
  },
  bannedUserIds: {
    type: Array,
    viewableBy: ['guests'],
    group: formGroups.moderationGroup,
    //insertableBy: (currentUser, document) => Users.canModeratePost(currentUser, document),
    //editableBy: (currentUser, document) => Users.canModeratePost(currentUser, document),
    insertableBy: ['members'],
    editableBy: ['members'],
    hidden: true,
    optional: true,
    label: "Users banned from commenting on this post",
    control: "UsersListEditor",
  },
  'bannedUserIds.$': {
    type: String,
    foreignKey: "Users",
    optional: true
  },
  commentsLocked: {
    type: Boolean,
    viewableBy: ['guests'],
    group: formGroups.moderationGroup,
    insertableBy: (currentUser, document) => Users.canCommentLock(currentUser, document),
    editableBy: (currentUser, document) => Users.canCommentLock(currentUser, document),
    optional: true,
    control: "checkbox",
  },

  // Event specific fields:
  /////////////////////////////////////////////////////////////////////////////

  organizerIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "organizerIds",
      resolverName: "organizers",
      collectionName: "Users",
      type: "User"
    }),
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    optional: true,
    hidden: true,
    control: "UsersListEditor",
    group: formGroups.event,
  },

  'organizerIds.$': {
    type: String,
    foreignKey: "Users",
    optional: true,
  },

  groupId: {
    ...foreignKeyField({
      idFieldName: "groupId",
      resolverName: "group",
      collectionName: "Localgroups",
      type: "Localgroup",
    }),
    viewableBy: ['guests'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    optional: true,
    hidden: true,
    group: formGroups.event,
  },

  isEvent: {
    type: Boolean,
    hidden: true,
    group: formGroups.event,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment'],
    insertableBy: ['members'],
    optional: true,
    ...schemaDefaultValue(false),
  },

  reviewedByUserId: {
    ...foreignKeyField({
      idFieldName: "reviewedByUserId",
      resolverName: "reviewedByUser",
      collectionName: "Users",
      type: "User",
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    hidden: true,
  },

  reviewForCuratedUserId: {
    type: String,
    foreignKey: "Users",
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    group: formGroups.adminOptions,
    label: "Curated Review UserId"
  },

  startTime: {
    type: Date,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    control: 'datetime',
    label: "Start Time",
    group: formGroups.event,
    optional: true,
  },

  localStartTime: {
    type: Date,
    viewableBy: ['guests'],
  },

  endTime: {
    type: Date,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    control: 'datetime',
    label: "End Time",
    group: formGroups.event,
    optional: true,
  },

  localEndTime: {
    type: Date,
    viewableBy: ['guests'],
  },

  mongoLocation: {
    type: Object,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    hidden: true,
    blackbox: true,
    optional: true
  },

  googleLocation: {
    type: Object,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    label: "Group Location",
    control: 'LocationFormComponent',
    blackbox: true,
    group: formGroups.event,
    optional: true
  },

  location: {
    type: String,
    searchable: true,
    viewableBy: ['guests'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    hidden: true,
    optional: true
  },

  contactInfo: {
    type: String,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Contact Info",
    control: "MuiInput",
    optional: true,
    group: formGroups.event,
  },

  facebookLink: {
    type: String,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    label: "Facebook Event",
    control: "MuiInput",
    optional: true,
    group: formGroups.event,
  },

  website: {
    type: String,
    hidden: (props) => !props.eventForm,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    control: "MuiInput",
    optional: true,
    group: formGroups.event,
  },

  types: {
    type: Array,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    hidden: (props) => !props.eventForm,
    control: 'MultiSelectButtons',
    label: "Group Type:",
    group: formGroups.event,
    optional: true,
    form: {
      options: localGroupTypeFormOptions
    },
  },

  'types.$': {
    type: String,
    optional: true,
  },

  metaSticky: {
    order:10,
    type: Boolean,
    optional: true,
    label: "Sticky (Meta)",
    ...schemaDefaultValue(false),
    group: formGroups.adminOptions,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    control: 'checkbox',
    onInsert: (post) => {
      if(!post.metaSticky) {
        return false;
      }
    },
    onEdit: (modifier, post) => {
      if (!modifier.$set.metaSticky) {
        return false;
      }
    }
  },

  sticky: {
    order:10,
    group: formGroups.adminOptions
  },

  postedAt: {
    group: formGroups.adminOptions
  },

  status: {
    group: formGroups.adminOptions,
  },

  shareWithUsers: {
    type: Array,
    order: 15,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    optional: true,
    control: "UsersListEditor",
    label: "Share draft with users",
    group: formGroups.options
  },

  'shareWithUsers.$': {
    type: String,
    foreignKey: "Users",
    optional: true
  },

  commentSortOrder: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins'],
    optional: true,
    group: formGroups.adminOptions,
  },

  // hideAuthor: Post stays online, but doesn't show on your user profile anymore, and doesn't
  // link back to your account
  hideAuthor: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins'],
    optional: true,
    group: formGroups.adminOptions,
    ...schemaDefaultValue(false),
  },

  tableOfContents: {
    type: Object,
    optional: true,
    viewableBy: ['guests'],
    resolveAs: {
      fieldName: "tableOfContents",
      type: GraphQLJSON,
      resolver: async (document, args, options) => {
        return await Utils.getTableOfContentsData(document);
      },
    },
  },

  // GraphQL only field that resolves based on whether the current user has closed
  // this posts author's moderation guidelines in the past
  showModerationGuidelines: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      type: 'Boolean',
      resolver: async (post, args, { LWEvents, currentUser }) => {
        if(currentUser){
          const query = {
            name:'toggled-user-moderation-guidelines',
            documentId: post.userId,
            userId: currentUser._id
          }
          const sort = {sort:{createdAt:-1}}
          const event = await LWEvents.findOne(query, sort);
          const author = await Users.findOne({_id: post.userId});
          if (event) {
            return !!(event.properties && event.properties.targetState)
          } else {
            return !!(author.collapseModerationGuidelines ? false : ((post.moderationGuidelines && post.moderationGuidelines.html) || post.moderationStyle))
          }
        } else {
          return false
        }
      },
      addOriginalField: false
    }
  },

  moderationStyle: {
    type: String,
    optional: true,
    control: "select",
    group: formGroups.moderationGroup,
    label: "Style",
    viewableBy: ['guests'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    insertableBy: [userHasModerationGuidelines],
    blackbox: true,
    order: 55,
    form: {
      options: function () { // options for the select form control
        return [
          {value: "", label: "No Moderation"},
          {value: "easy-going", label: "Easy Going - I just delete obvious spam and trolling."},
          {value: "norm-enforcing", label: "Norm Enforcing - I try to enforce particular rules (see below)"},
          {value: "reign-of-terror", label: "Reign of Terror - I delete anything I judge to be annoying or counterproductive"},
        ];
      }
    },
  },
  
  recentComments: resolverOnlyField({
    type: Array,
    graphQLtype: "[Comment]",
    viewableBy: ['guests'],
    graphqlArguments: 'commentsLimit: Int, maxAgeHours: Int, af: Boolean',
    resolver: async (post, { commentsLimit=5, maxAgeHours=18, af=false }, { currentUser, Comments }) => {
      const timeCutoff = moment().subtract(maxAgeHours, 'hours').toDate();
      const comments = Comments.find({
        ...Comments.defaultView({}).selector,
        postId: post._id,
        score: {$gt:0},
        deletedPublic: false,
        postedAt: {$gt: timeCutoff},
        ...(af ? {af:true} : {}),
      }, {
        limit: commentsLimit,
        sort: {postedAt:-1}
      }).fetch();
      return accessFilterMultiple(currentUser, Comments, comments);
    }
  }),
  'recentComments.$': {
    type: Object,
    foreignKey: 'Comments',
  },
});

export const makeEditableOptions = {
  formGroup: formGroups.content,
  adminFormGroup: formGroups.adminOptions,
  order: 25
}

makeEditable({
  collection: Posts,
  options: makeEditableOptions
})

export const makeEditableOptionsModeration = {
  // Determines whether to use the comment editor configuration (e.g. Toolbars)
  commentEditor: true,
  // Determines whether to use the comment editor styles (e.g. Fonts)
  commentStyles: true,
  formGroup: formGroups.moderationGroup,
  adminFormGroup: formGroups.adminOptions,
  order: 50,
  fieldName: "moderationGuidelines",
  permissions: {
    viewableBy: ['guests'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    insertableBy: [userHasModerationGuidelines]
  },
}

makeEditable({
  collection: Posts,
  options: makeEditableOptionsModeration
})


// Custom fields on Users collection
addFieldsDict(Users, {
  // Count of the user's posts
  postCount: {
    ...denormalizedCountOfReferences({
      fieldName: "postCount",
      collectionName: "Users",
      foreignCollectionName: "Posts",
      foreignTypeName: "post",
      foreignFieldName: "userId",
      filterFn: (post) => (!post.draft && post.status===Posts.config.STATUS_APPROVED),
    }),
    viewableBy: ['guests'],
  },
  // The user's associated posts (GraphQL only)
  posts: {
    type: Object,
    optional: true,
    viewableBy: ['guests'],
    resolveAs: {
      arguments: 'limit: Int = 5',
      type: '[Post]',
      resolver: (user, { limit }, { currentUser, Users, Posts }) => {
        const posts = Posts.find({ userId: user._id }, { limit }).fetch();
        return accessFilterMultiple(currentUser, Posts, posts);
      }
    }
  },
});
