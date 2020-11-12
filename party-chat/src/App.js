import React, {useEffect, useRef} from 'react';
import './App.css';

function App() {

    const conn = new WebSocket('wss://chatapp.progmasters.hu/socket');

    const videoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    let localConnection;
    let remoteConnection;

    useEffect(() => {
        const constraints = {
            video: {
                frameRate: {
                    ideal: 10,
                    max: 15,
                },
                width: 1280,
                height: 720,
                facingMode: 'user',
            },
        };
        navigator.mediaDevices.getUserMedia(constraints)
                 .then(stream => {
                     videoRef.current.srcObject = stream;
                     startPeerConnection(stream);
                 })
                 .catch(console.error);

    }, []);

    function startPeerConnection(stream) {
        const configuration = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        };
        localConnection = new RTCPeerConnection({configuration: configuration, iceServers: []});
        remoteConnection = new RTCPeerConnection(configuration);
        stream.getTracks().forEach(
            function (track) {
                localConnection.addTrack(
                    track,
                    stream,
                );
            },
        );

        remoteConnection.ontrack = function (e) {
            remoteVideoRef.current.srcObject = e.streams[0];
        };

        // Set up the ICE candidates for the two peers

        localConnection.onicecandidate = e => !e.candidate
                                              || remoteConnection.addIceCandidate(e.candidate)
                                                                 .catch(console.error);

        remoteConnection.onicecandidate = e => !e.candidate
                                               || localConnection.addIceCandidate(e.candidate)
                                                                 .catch(console.error);

        localConnection.createOffer()
                       .then(offer => localConnection.setLocalDescription(offer))
                       .then(() => remoteConnection.setRemoteDescription(localConnection.localDescription))
                       .then(() => remoteConnection.createAnswer())
                       .then(answer => remoteConnection.setLocalDescription(answer))
                       .then(() => localConnection.setRemoteDescription(remoteConnection.localDescription))
                       .catch(console.error);

    }

    return (
        <div className="App">
            <p>LOCAL</p>
            <video
                ref={videoRef}
                width={400}
                height={300}
                autoPlay
                playsInline
            />
            <p>REMOTE</p>
            <video
                ref={remoteVideoRef}
                width={400}
                height={300}
                autoPlay
                playsInline
            />

        </div>
    );
}

export default App;
