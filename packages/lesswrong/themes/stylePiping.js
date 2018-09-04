import { linkStyle } from './createThemeDefaults'
import deepmerge from 'deepmerge';
import isPlainObject from 'is-plain-object';

const sidenoteStyles = theme => {
  return {
    '& .sidenote': {
      display: 'none',
      [theme.breakpoints.up('lg')]: {
        display: 'initial',
        position: 'relative',
        float: 'right',
        clear: 'right',
        width: '40%',
        top: '0.5rem',
        marginRight: '-45%',
        marginBottom: '13px',
        fontSize: '1.1rem',
        lineHeight: '1.3'
      },
      '&:before': {
        [theme.breakpoints.up('lg')]: {
          content: 'counter(sidenote-counter) " "',
          fontSize: '1rem',
          verticalAlign: 'super'
        }
      },
      '&Number': {
        counterIncrement: 'sidenote-counter',
        display: 'none',
        [theme.breakpoints.up('lg')]: {
          display: 'initial',
          '&:after': {
            content: 'counter(sidenote-counter)',
            fontSize: '1rem',
            verticalAlign: 'super'
          }
        }
      }
    },
    '&': {
      counterReset: 'sidenote-counter'
    }
  }
}

export const postBodyStyles = (theme, fontSize) => {
  return {
    ...theme.typography.body1,
    ...theme.typography.postStyle,
    ...sidenoteStyles(theme),
    '& pre': {
      ...theme.typography.codeblock
    },
    '& code': {
      ...theme.typography.code
    },
    '& blockquote': {
      ...theme.typography.blockquote,
      ...theme.typography.body1,
      ...theme.typography.postStyle
    },
    '& li': {
      ...theme.typography.body1,
      ...theme.typography.li,
      ...theme.typography.postStyle
    },
    '& h1': {
      ...theme.typography.display3,
      ...theme.typography.postStyle,
      ...theme.typography.headerStyle
    },
    '& h2': {
      ...theme.typography.display2,
      ...theme.typography.postStyle,
      ...theme.typography.headerStyle
    },
    '& h3': {
      ...theme.typography.display2,
      ...theme.typography.postStyle,
      ...theme.typography.headerStyle
    },
    '& h4': {
      ...theme.typography.body1,
      ...theme.typography.postStyle,
      fontWeight:600,
    },
    '& img': {
      maxWidth: "100%"
    },
    '& a, & a:hover, & a:focus, & a:active, & a:visited': {
      ...linkStyle({
        theme: theme,
        underlinePosition: (
          (theme.typography.postStyle && theme.typography.postStyle.linkUnderlinePosition) ||
          "97%"
        ),
        background: (
          (theme.typography.body1 && theme.typography.body1.backgroundColor) ||
          (theme.typography.body1 && theme.typography.body1.background) ||
          "#fff"
        )
      })
    }
  }
}

export const commentBodyStyles = theme => {
  const commentBodyStyles = {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    '& blockquote': {
      ...theme.typography.commentBlockquote,
      ...theme.typography.body2,
      ...theme.typography.commentStyle
    },
    '& li': {
      ...theme.typography.body2,
      ...theme.typography.commentStyle
    },
    '& h1, & h2, & h3': {
      ...theme.typography.commentHeader,
      ...theme.typography.commentStyle
    },
    '& a, & a:hover, & a:focus, & a:active, & a:visited': {
      backgroundImage: "none",
      textShadow: "none",
      textDecoration: "none",
    },
    '& pre code a, & pre code a:hover, & pre code a:focus, & pre code a:active, & pre code a:visited': {
        backgroundImage: "none",
        textShadow: "none",
        textDecoration: "none",
    }
  }
  return deepmerge(postBodyStyles(theme), commentBodyStyles, {isMergeableObject:isPlainObject})
}

export const postHighlightStyles = theme => {
  const postHighlightStyles = {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    '& blockquote': {
      ...theme.typography.body2,
      ...theme.typography.postStyle,
      '& > p': {
        margin:0
      },
    },
    '& li': {
      ...theme.typography.body2,
      ...theme.typography.postStyle,
    },
    '& h1, & h2, & h3': {
      ...theme.typography.commentHeader,
    },
  }
  return deepmerge(postBodyStyles(theme), postHighlightStyles, {isMergeableObject:isPlainObject})
}

export const editorStyles = (theme, styleFunction) => ({
    '& .public-DraftStyleDefault-block': {
      marginTop: '1em',
      marginBottom: '1em',
    },
    '& code .public-DraftStyleDefault-block': {
      marginTop: 0,
      marginBottom: 0,
    },
    '& blockquote .public-DraftStyleDefault-block': {
      marginTop: 0,
      marginBottom: 0,
    },
    ...styleFunction(theme)
})
