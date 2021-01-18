const ID_TOKEN_KEY = 'idToken';
const REFRESH_TOKEN_KEY = 'refreshToken';


export const setIdToken = (idToken) => localStorage.setItem(ID_TOKEN_KEY, idToken);
export const setRefreshToken = (refreshToken) => localStorage.setItem(REFRESH_TOKEN_KEY,refreshToken);

export const removeIdToken = () => localStorage.removeItem(ID_TOKEN_KEY);
export const removeRefreshToken = () => localStorage.removeItem(REFRESH_TOKEN_KEY);

export const getIdToken = () => localStorage.getItem(ID_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const getDecodedToken = (idToken) => {
    const token = idToken || getIdToken();
    const payloads = (token || '').split('.');
    if(!payloads.length || !payloads[1]){ return null; }
    const decodedToken = JSON.parse(Buffer.from(payloads[1],'base64').toString());
    return decodedToken;
}

export const isIdTokenValid = ()=> {
    let isValid = false;
    const decodedToken = getDecodedToken();
    if(decodedToken){
        const expTimeInMs = decodedToken && decodedToken.exp*1000;
        const currTimeInMs = new Date().getTime();
        isValid = expTimeInMs - currTimeInMs > 0;
    }
   return isValid; 
}

export const refreshIdToken = async () => {
    try {
        /*const { id_token: idToken, refresh_token: refreshToken } = await apiClient.post('/refresh_token',{
            refresh_token: getRefreshToken()
        })
        return { idToken, refreshToken };*/
    } catch(err){
        console.log('Error refreshing token');
        console.error(err);
        return {};
    }

}