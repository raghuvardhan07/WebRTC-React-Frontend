import React, {useState, useCallback, useEffect} from 'react'
import { useSocket } from '../../context/SocketProvider'
import { usePeer } from '../../context/PeerProvider'
import ReactPlayer from 'react-player'
import './styles.css'

const Room = () => {
    const socket = useSocket()
    const peer = usePeer()
    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const [myStream, setMyStream] = useState(null)
    const [remoteStream, setRemoteStream] = useState(null)

    const sendStream = useCallback(async () => {
        if (!myStream) return;
        await myStream.getTracks().forEach(async (track) => await peer.addTrack(track, myStream));
    }, [myStream, peer])

    const handleUserJoined = useCallback(({username, id}) => {
        setRemoteSocketId(id)
        socket.emit('room:ack', {to: id, id: socket.id})
    }, [socket])
    
    const handleRoomAck = useCallback(({id}) => {
        setRemoteSocketId(id)
    }, [])

    // 1. Setup tracks, create offer, setLocalDescription, send message to socket
    const handleCall = useCallback(async () => {
        sendStream();
        const offer = await peer.createOffer()
        await peer.setLocalDescription(offer)
        socket.emit("user:call", {to: remoteSocketId, offer})

    }, [sendStream, peer, socket, remoteSocketId])
    
    // 2. recieve offer, update remoteId, set Tracks, setRemoteDesc, create Answer and update localDesc, socket
    const handleIncomingCall = useCallback(async ({from, offer}) => {
        console.log(`Offer: ${offer} recieved from ${from}`);
        setRemoteSocketId(from)
        sendStream()
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer(offer);
        await peer.setLocalDescription(answer)
        socket.emit('accepted:call', {to: from, answer})

    }, [sendStream, peer, socket])

    // 3. Recieve answer, setRemoteDesc and id
    const handleAcceptedCall = useCallback(async ({from, answer}) => {
        console.log(`Answer: ${answer} recieved from ${from}`);
        setRemoteSocketId(from)
        await peer.setRemoteDescription(answer)
    }, [peer])

    // 4. If icecandidate received, then add it
    const handleIceCandidate = useCallback(async (candidate) =>  {
        // Add the ICE candidate to the peer connection
        console.log("handling ice incoming", candidate);
        await peer.addIceCandidate(candidate.candidate);
    }, [peer])

    // Peer Connection Events
    // 1. Send the ice candidate to other person
    const handleIceCandidateEvent = useCallback((event) => {
        console.log("handling ice sending");
        if (event.candidate) {
            console.log("candidate", event.candidate);
            socket.emit("ice:candidate", {candidate: event.candidate, to: remoteSocketId});
        }
    }, [remoteSocketId, socket])

    // 2. Add the remote tracks to remoteStream
    const handleTrackEvent = useCallback(async (e) => {
        console.log("received tracks");
        const remoteTracks = e.streams[0];
        setRemoteStream(remoteTracks);
    }, [])
    
    // Peer object Event Listener
    useEffect(() => {
        peer.addEventListener("track", handleTrackEvent)
        peer.addEventListener("icecandidate", handleIceCandidateEvent)
        return () => {
            peer.removeEventListener("track", handleTrackEvent)
            peer.removeEventListener("candidate", handleIceCandidateEvent)
        }
    }, [handleIceCandidateEvent, handleTrackEvent, peer])

    // Socket object Event Listener
    useEffect(() => {
        socket.on('user:joined', handleUserJoined)
        socket.on('room:ack', handleRoomAck)
        socket.on('incoming:call', handleIncomingCall)
        socket.on('accepted:call', handleAcceptedCall)
        socket.on('ice:candidate', handleIceCandidate)
        return () => {
            socket.off('user:joined', handleUserJoined)
            socket.off('incoming:call', handleIncomingCall)
            socket.off('accepted:call', handleAcceptedCall)
            socket.on('room:ack', handleRoomAck)
        }
    }, [socket, handleUserJoined, handleRoomAck, handleIncomingCall, handleAcceptedCall, handleIceCandidate])

    // Set up myStream as soon as i come in room
    const setUpPeer = useCallback(async () => {
        if (peer) {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true, video:true})
            setMyStream(stream)
        }
    }, [peer])
    
    useEffect(() => {
        setUpPeer()
    }, [setUpPeer])

    return (
        <div className="room" >
            <p className='title'>Room Page</p>
            <p className='connectedTo'>{remoteSocketId ? `Room Member: ${remoteSocketId}` : `No one in Room`}</p>
            {remoteSocketId && <button onClick={handleCall}>Call</button>}
            <div className="streams">
            {myStream &&
            <div className='myStream'><p className='myStreamTitle'>My Stream</p>
              
                <ReactPlayer playing muted url={myStream} className="myVideo"/></div>
            }
            {remoteStream &&
                <div className='remoteStream'><p className='remoteStreamTitle'>Remote Stream</p>
                <ReactPlayer playing muted url={remoteStream} className="remoteVideo"/></div>
            }
            </div>
        </div>
    )
}

export default Room