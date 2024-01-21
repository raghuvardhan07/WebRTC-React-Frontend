import React, {createContext, useMemo, useContext} from 'react'
const PeerContext = createContext(null)

export const usePeer = () => {
    const peer = useContext(PeerContext);
    return peer
}
export const PeerProvider = (props) => {
    const peer = useMemo(() => new RTCPeerConnection({
        iceServers: [
        { urls: 'stun:stun2.l.google.com:19302' }
        ]
    }), [])
    console.log("Peer", peer);
    return (
        <PeerContext.Provider value={peer}>
            {props.children}
        </PeerContext.Provider>
    )
}