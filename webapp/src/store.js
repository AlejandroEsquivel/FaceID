import React, { useState, useContext, useEffect } from 'react';
import { 
    getIdToken, 
    setIdToken, 
    setRefreshToken,
    isIdTokenValid, 
    refreshIdToken, 
    removeIdToken,
    removeRefreshToken,
    getDecodedToken,
    getRefreshToken,
    firebaseAuth
} from './auth';


const initialState = {
    isLoggedIn: isIdTokenValid(),
    idToken: getIdToken(),
    refreshToken: getRefreshToken(),
}
  
const StoreContext = React.createContext();

const StoreProvider = React.memo(({children})=> {

    const [state, setState] = useState(initialState);
    
    const { isLoggedIn } = state;

    const login = async (idToken) => {
        if(idToken){
            try {
                const { user } = await firebaseAuth.signInWithCustomToken(idToken);
                setIdToken(idToken);
                setState({
                    ...state,
                    idToken,
                    isLoggedIn: true
                });
            } catch(err){
                console.error(err);
            }
        }
    };

    const logout = ()=>{
        removeIdToken();
        removeRefreshToken();
        setState({
            ...state,
            idToken: '',
            refreshToken: '',
            isLoggedIn: false
        })
    };


    useEffect(()=>{
        const SECOND = 1000;
        const MINUTE = 60*SECOND;
        const authInterval = setInterval(async()=>{
            const isTokenValid = isIdTokenValid();
            if(isLoggedIn && !isTokenValid){
                logout();
            }
            else if(isLoggedIn && isTokenValid){
                const { idToken, refreshToken } = await refreshIdToken();
                if(idToken && refreshToken){
                    setIdToken(idToken);
                    setRefreshToken(refreshToken);
                    setState({
                        ...state,
                        idToken,
                        refreshToken
                    });
                }
            }
        },5*MINUTE);

        return ()=> authInterval && clearInterval(authInterval);
    },[]);

    useEffect(()=>{
        console.log('Global state update', state)
    },[state])

    return (
        <StoreContext.Provider value={{ 
                state, 
                actions: {
                    setState,
                    login,
                    logout,
                } 
            }}>
            {children}
        </StoreContext.Provider>
    )
});

const useStore = () => useContext(StoreContext);

export { 
    StoreContext,
    StoreProvider,
    useStore,
    initialState
 };
