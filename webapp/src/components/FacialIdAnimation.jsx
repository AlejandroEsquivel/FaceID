import { useEffect, useState } from "react"
import { Done, Close } from '@material-ui/icons';

export default ({ thumbnailDataURL = '', success = null }) => {

    const [ isAnimationRunning, setAnimationRunning ] = useState(false)

    useEffect(()=>{
        let timer;
        if(thumbnailDataURL && typeof success === 'boolean' ){
            timer = setTimeout(()=>{
                setAnimationRunning(true);
            },1000)
        }
        return () => timer && clearTimeout(timer);
    },[thumbnailDataURL, success]);

    return (

        <div style={{ textAlign: 'center' }}>
            {
                thumbnailDataURL && (
                    <div className="thumbnail shadow1">
                        <div className={`overlay ${typeof success === 'boolean' ? (success && 'success') || 'failure' : ''} ${isAnimationRunning ? 'active' : ''}`}>
                            <div className="icon">
                                {
                                    success && (
                                        <Done style={{ fontSize: 35, color: 'white' }}/>
                                    ) || (
                                        <Close style={{ fontSize: 35, color: 'white' }}/>
                                    ) || null
                                }
                               
                            </div>
                        </div>
                        <img src={thumbnailDataURL}  />
                    </div>
                ) ||
                (
                    <svg height='100px' width='100px' version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', zoom: 0.5 }}>
                        <defs>
                            <filter id="iconfilter" primitiveUnits="objectBoundingBox" >
                                <feFlood floodColor="black" />
                                <feOffset>
                                    <animate attributeName="dy" from="1" to="0" dur="4s" repeatCount="indefinite" />
                                </feOffset>
                                <feComposite operator="in" in2="SourceGraphic" />
                            </filter>
                        </defs>
                        <g id="userIcon" filter="url(#iconfilter)">
                            <path id="body" fill="rgba(9,9,9, .8)" d="M99.73,88.554c0.052-15.177-12.973-39.957-27.744-40.016h-44.51C12.704,48.597-0.319,73.377-0.269,88.554
                                                        H99.73z"></path>
                            <circle fill="#000" cx="50" cy="23" r="22" />
                        </g>
                    </svg>
                ) || null
            }
        </div>
    )
}