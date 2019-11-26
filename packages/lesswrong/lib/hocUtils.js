import React from 'react';

// Given a hook function, return a higher-order component which calls it and
// adds the result as extra props. If componentPropsToHookParams is given, calls
// it on the component's props and passes the result as an argument to hookFn;
// otherwise hookFn is assumed to take no arguments.
export const hookToHoc = (hookFn, componentPropsToHookParams) => {
  return (Component) => (props) => {
    const hookProps = componentPropsToHookProps ? hookFn(componentPropsToHookParams(props)) : hookFn();
    return <Component {...props} {...hookProps}/>;
  }
}
