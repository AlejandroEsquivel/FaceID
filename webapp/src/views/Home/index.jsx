import './index.css';
import { useStore } from '../../store';
import Button from '@material-ui/core/Button';
import { useEffect } from 'react';
import { getIdToken } from '../../auth';
import CircularProgress from '@material-ui/core/CircularProgress';


function Home() {

    const { state: globalState, actions } = useStore();

    useEffect(()=>{
        if(!globalState.user){
            actions.login(getIdToken());
        }
    },[]);

    return globalState.user && (
        <div className="view-container">
            <div className="home-view shadow1 text-align-center">
                Logged in as { globalState.user.email} &#128075;
                <Button className="mt-1" variant="outlined" color="secondary" onClick={()=>actions.logout()} fullWidth>
                    Sign Out
                </Button>
            </div>
        </div>
    ) || (
         <div className="view-container">
            <div className="home-view shadow1 text-align-center">
               <CircularProgress/>
            </div>
        </div>
    ) || null
}

export default Home;
