import * as React from 'react';
import { Redirect } from 'react-router-dom';
import { isIdTokenValid } from '../auth';
import { useStore } from './../store';

export default (props) => {
    const { component, ...rest } = props;
    const Component = component;

    const { state } = useStore();
    const { isLoggedIn } = state;

    return (
        isLoggedIn
        ? <Component {...rest} />
        : <Redirect to="/login?redirect" noThrow/>
    )
}