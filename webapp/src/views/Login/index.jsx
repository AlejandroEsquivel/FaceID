import './index.css';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

import { useEffect, useState } from 'react';


function Login() {

    const [webcam, setWebcam] = useState(null);
    const [headlessCanvas, setCanvas] = useState(null);
    const [webcamReady, setWebcamReady] = useState(false);

    const takeSnapshot = () => {
        if(webcamReady){
            const context = headlessCanvas.getContext('2d');
            const width = headlessCanvas.width;
            const height = headlessCanvas.height;
            context.drawImage(webcam, 0, 0, width, height);
    
            const base64 = headlessCanvas.toDataURL('image/png');
            document.getElementById('photo').setAttribute('src', base64);
        }
    }

    useEffect(()=>{
        startWebRTC();
    },[]);

    const startWebRTC = async () => {
        try {
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

   

    return (
        <div className="container">
            <div className="login-form shadow1">
                <TextField id="email" label="Email" fullWidth />
                <TextField className="mt-1" id="pass" label="Password" type={'password'} fullWidth />
                <Button variant="contained" color="primary" onClick={takeSnapshot} disabled={!webcamReady} fullWidth>
                    Login
                </Button>
                <img id="photo" />
            </div>
        </div>
    );
}

export default Login;
