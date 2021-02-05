import './index.css';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import api from './../../api'
import Alert from './../../components/Alert'
import { useStore } from '../../store';
import FacialIdAnimation from '../../components/FacialIdAnimation';


const VIEW_STATES = {
    SIGN_UP: 'SIGN_UP',
    LOGIN: 'LOGIN',
    HOME: 'HOME'
}

const FACIAL_ID_RESULT_TYPE = {
    INDETERMINATE: 'INDETERMINATE',
    SUCCESS: 'SUCCESS',
    FAILURE: 'FAILURE'
}

function Login() {

    const { state: globalState, actions } = useStore();
    const history = useHistory();

    const [webcam, setWebcam] = useState(null);
    const [headlessCanvas, setCanvas] = useState(null);
    const [webcamReady, setWebcamReady] = useState(false);
    const [viewState, setViewState] = useState(VIEW_STATES.HOME);

    const [signUpState, setSignUpState] = useState({
        email: '',
        snapshot: '',
        faceValidated: null,
        warningCopy: '',
        isSigningUp: false
    })

    const [loginState, setLoginState] = useState({
        isFaceIdRunning: false,
        loginButtonCopy: 'Login',
        thumbnailDataURL: '',
        success: null
    })

    useEffect(()=>{
        startWebRTC();
    },[viewState]);

    useEffect(()=>{
        if(webcamReady && document.getElementById('webcam') && !document.getElementById('webcam').getElementsByTagName('video').length){
            if(viewState === VIEW_STATES.SIGN_UP){
                document.getElementById('webcam').appendChild(webcam);
            }
        }
    },[viewState, webcamReady])

    const switchViewState = (newState) => (e) => {
        e.preventDefault();
        if(viewState === VIEW_STATES.SIGN_UP){
            playVideo();
            setSignUpState({
                email: '',
                faceValidated: null,
                snapshot: '',
                warningCopy: ''
            })
        }
        else if(viewState === VIEW_STATES.LOGIN){
            setLoginState({
                isFaceIdRunning: false,
                loginButtonCopy: 'Login',
                thumbnailDataURL: '',
                success: null
            })
        }
        setViewState(newState);
    }

    const wait = (timeInMs) => new Promise((resolve)=>{ setTimeout(resolve,timeInMs) });

    const pauseVideo = () => {
        const videos = document.getElementsByTagName('video');
        if(videos.length){
            videos[0].pause();
        }
    }

    const playVideo = () => {
        const videos = document.getElementsByTagName('video');
        if(videos.length){
            videos[0].play();
        }
    }

    const takeSnapshot = () => {
        if(webcamReady){
            const context = headlessCanvas.getContext('2d');
            const width = headlessCanvas.width;
            const height = headlessCanvas.height;
            context.drawImage(webcam, 0, 0, width, height);
    
            const dataURL = headlessCanvas.toDataURL('image/png');
            const base64 = dataURL.split(',')[1]
            return { base64, dataURL };
        }
    }

    const validateFace = async() => {
        const snapshot = takeSnapshot();
        let warningCopy;
        if(snapshot && typeof(snapshot) === 'object'){
            const { base64, dataURL } = snapshot;
            pauseVideo();
            let validated;
            try {
                await api.validateFace(base64);
                validated = true;
            } catch(err){
                playVideo();
                validated = false;
                warningCopy = 'No face was detected, please try again.'
            } finally {
                setSignUpState({
                    ...signUpState,
                    snapshot: base64,
                    faceValidated: validated,
                    warningCopy
                })
            }
        }
    }

    const retrySnapshot = async()=> {
        playVideo();
        setSignUpState({
            ...signUpState,
            faceValidated: null,
            snapshot: '',
            warningCopy: ''
        })
    }

    const startWebRTC = async () => {
        try {
            setWebcamReady(false);
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');

            const rtcStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

            video.srcObject = rtcStream;
            video.play();

            setWebcam(video);
            setCanvas(canvas);

            const prepareDimensions = () => {
                const width = 500;
                const height = video.videoHeight / (video.videoWidth / width);
                video.setAttribute('width', width);
                video.setAttribute('height', height);
                canvas.setAttribute('width', width);
                canvas.setAttribute('height', height);
                video.removeEventListener('canplay', prepareDimensions, false);
                setWebcamReady(true);
            };
            video.addEventListener('canplay', prepareDimensions, false);

            
        } catch (err) {
            console.error(err);
        }
    }

    const signUp = async () => {
        const { email, snapshot } = signUpState;
        const emailRe = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!email || !emailRe.test(email)){
            setSignUpState({
                ...signUpState,
                warningCopy: 'Please enter valid email.'
            })
        }
        else {
            setSignUpState({
                ...signUpState,
                isSigningUp: true
            })
            try {
                const { token } = await api.signUp(email,snapshot);
                await actions.login(token);
                history.push('/home')
            } catch(err){
                setSignUpState({
                    ...signUpState,
                    isSigningUp: false,
                    warningCopy: 'User already exists.'
                })
            }
            
        }
    }

    const updateEmail = (email) => {
        setSignUpState({
            ...signUpState,
            email
        })
    }

    const faceId = async () => {
        let _loginState;

        _loginState = {
            ...loginState,
            isFaceIdRunning: true,
            success: null,
            loginButtonCopy: 'Please face towards camera...'
        }
        setLoginState(loginState);

        for(let i=3;i>0; i--){
            _loginState = {
                ..._loginState,
                isFaceIdRunning: true,
                loginButtonCopy: `Please face towards camera... ${i}`
            }
            setLoginState(_loginState);
            await wait(1000);
        }

        try {
            _loginState = {
                ..._loginState,
                isFaceIdRunning: true,
                loginButtonCopy: 'Processing...'
            }
            setLoginState(_loginState);
            const { base64 } = takeSnapshot();
            const { face, token } = await api.signIn(base64);
            await actions.login(token);
            _loginState = {
                ..._loginState,
                isFaceIdRunning: true,
                thumbnailDataURL: face,
                success: true,

            }
            setLoginState(_loginState);
        } catch(err){
            if(err.response && err.response.data && err.response.data.code === 401){
                const face = err.response.data.face;
                _loginState = {
                    ..._loginState,
                    isFaceIdRunning: true,
                    thumbnailDataURL: face,
                    success: false
                }
                setLoginState(_loginState);
            }
            else {
                _loginState = {
                    ..._loginState,
                    loginButtonCopy: 'Login',
                    isFaceIdRunning: false,
                    thumbnailDataURL: '',
                    success: null
                }
                return setLoginState(_loginState);
            }
        }

        setTimeout(()=>{
            setLoginState({
                ..._loginState,
                loginButtonCopy: 'Login',
                thumbnailDataURL: '',
                isFaceIdRunning: false
            });
            if(_loginState.success){
                history.push(`/home`);
            }
        },1000*4);
    }


    return (
        <div className="view-container">
            <div className="login-form shadow1">
                <div className="logo">
                    FacialID &#128123;
                </div>
                {
                    viewState === VIEW_STATES.HOME && (
                        <React.Fragment>
                            {
                                loginState.isFaceIdRunning && (
                                    <React.Fragment>
                                        <FacialIdAnimation thumbnailDataURL={loginState.thumbnailDataURL} success={loginState.success}/>
                                        {
                                            loginState.success && (
                                                <p style={{ textAlign: 'center'}}>Found facial match with user {globalState.user && globalState.user.email} &#127881;.</p>
                                            ) || (typeof loginState.success === 'boolean' && !loginState.success && (
                                                <p style={{ textAlign: 'center'}}>No facial match found.</p>
                                            )) || null
                                        }
                                        
                                    </React.Fragment>
                                ) || null
                            }
                            <Button className="mt" variant="contained" color="primary" onClick={faceId} disabled={!webcamReady || loginState.isFaceIdRunning} fullWidth>
                                {loginState.loginButtonCopy}
                            </Button>
                            <br/>
                            <Button className="mt-1" variant="contained" color="primary" onClick={switchViewState(VIEW_STATES.SIGN_UP)} disabled={!webcamReady} fullWidth>
                                Create User
                            </Button>
                        </React.Fragment>
                    ) || null
                }
                {
                    viewState === VIEW_STATES.SIGN_UP && (
                        <React.Fragment>
                           <TextField id="email" label="Email" fullWidth onChange={(e)=> updateEmail(e.target.value)} />
                            <br/>
                            {
                               signUpState.warningCopy && (
                                    <Alert className="mt" severity="warning">{signUpState.warningCopy}</Alert>
                                ) || null
                            }
                            <div id="webcam" className="mt"></div>
                            {
                                !signUpState.faceValidated && (
                                    <Button className="mt-1" variant="contained" color="primary" onClick={validateFace} disabled={!webcamReady} fullWidth>
                                        Take Picture
                                    </Button>
                                ) || (
                                    <Button className="mt-1" variant="outlined" color="primary" onClick={retrySnapshot} disabled={!webcamReady} fullWidth>
                                        Retake
                                    </Button>
                                )
                            }
                            {
                              signUpState.faceValidated === true && (
                                <Button className="mt success" variant="contained" color="primary" onClick={signUp} disabled={!webcamReady || signUpState.isSigningUp} fullWidth>
                                    Create User
                                </Button>
                                ) || null
                            }
                            <div style={{ textAlign: 'left', color: 'grey'}} className="mt">
                                <a href="#" onClick={switchViewState(VIEW_STATES.HOME)}>Back</a>
                            </div>
                        </React.Fragment>
                    ) || null
                }
            </div>
        </div>
    );
}

export default Login;
