import React, {useState, useCallback, useEffect} from 'react'
import { useSocket } from '../../context/SocketProvider'
import ReactPlayer from 'react-player'
import peer from '../../services/peer'
import './styles.css'
const Room = () => {
    const socket = useSocket()
    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const [myStream, setMyStream] = useState(null)
    const [remoteStream, setRemoteStream] = useState(null)
    const handleUserJoined = useCallback(({username, id}) => {
        setRemoteSocketId(id)
        socket.emit('room:ack', {to: id, id: socket.id})
    }, [socket])
    
    const handleRoomAck = useCallback(({id}) => {
        setRemoteSocketId(id)
    }, [])

    const handleCall = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true, video:true})

        const offer = await peer.getOffer()
        socket.emit("user:call", {to: remoteSocketId, offer})

        setMyStream(stream)
    }, [socket, remoteSocketId])

    const sendStream = useCallback(() => {
        if (!myStream) return;
        for(const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream)
        }
    }, [myStream])

    const handleIncomingCall = useCallback(async ({from, offer}) => {
        console.log(`Offer: ${offer} recieved from ${from}`);
        setRemoteSocketId(from)
        const stream = await navigator.mediaDevices.getUserMedia({audio: true, video:true})
        setMyStream(stream)
        // Add tracks once offer received
        
        const answer = await peer.getAnswer(offer);
        socket.emit('accepted:call', {to: from, answer})

    }, [socket])
    const handleAcceptedCall = useCallback(async ({from, answer}) => {
        console.log(`Answer: ${answer} recieved from ${from}`);
        setRemoteSocketId(from)
        await peer.setRemoteDescription(answer)
        sendStream()
        socket.emit('sent:stream', {to: from})

    }, [sendStream, socket])

    
    const handleTrack = useCallback(async (e) => {
        console.log("received tracks");
        const remoteTracks = e.streams[0];
        setRemoteStream(remoteTracks);
    }, [])

    // negotiation code
    const handleNegNeed = useCallback(async () => {
        const offer = await peer.getOffer()
        socket.emit("neg:offer", {to: remoteSocketId, offer})
    }, [remoteSocketId, socket])

    const handleNegAnswer = useCallback(async ({from, offer}) => {
        const answer = await peer.getAnswer(offer)
        socket.emit("neg:answer", {to: from, answer})
    }, [socket])

    const handleNegAccepted = useCallback(async ({from, answer}) => {
        if (peer.peer.signalingState === 'stable') return;
        await peer.setRemoteDescription(answer)
    }, [])

    useEffect(() => {
        peer.peer.addEventListener("negotiationneeded", handleNegNeed)
        return () => {
            peer.peer.removeEventListener("negotiationneeded", handleNegNeed)
        }
    }, [handleNegNeed]) 
    useEffect(() => {
        peer.peer.addEventListener("track", handleTrack)
        
        return () => {
            peer.peer.removeEventListener("track", handleTrack)
            
        }
        
    }, [handleTrack])
    useEffect(() => {
        socket.on('user:joined', handleUserJoined)
        socket.on('room:ack', handleRoomAck)
        socket.on('incoming:call', handleIncomingCall)
        socket.on('accepted:call', handleAcceptedCall)
        socket.on('neg:offer', handleNegAnswer)
        socket.on('neg:answer', handleNegAccepted)
        return () => {
            socket.off('user:joined', handleUserJoined)
            socket.off('incoming:call', handleIncomingCall)
            socket.off('accepted:call', handleAcceptedCall)
            socket.off('neg:offer', handleNegAnswer)
            socket.off('neg:answer', handleNegAccepted)
            socket.on('room:ack', handleRoomAck)
        }
    }, [socket, handleUserJoined, handleRoomAck, handleIncomingCall, handleAcceptedCall, handleNegAnswer, handleNegAccepted])


    return (
        <div className="room" >
            <p className='title'>Room Page</p>
            <p className='connectedTo'>{remoteSocketId ? `Connected to ${remoteSocketId}` : `No one in Room`}</p>
            {remoteSocketId && <button onClick={handleCall}>Call</button>}
            <div className="streams">
            {myStream &&
            <div className='myStream'><p className='myStreamTitle'>My Stream</p>
              
                <ReactPlayer playing muted url={myStream} className="myVideo"/></div>
            }
            {remoteStream &&
                <div className='remoteStream'><p className='remoteStreamTitle'>Remote Stream</p>
                <button onClick={sendStream}>Send your stream</button>
                <ReactPlayer playing muted url={remoteStream} className="remoteVideo"/></div>
            }
            </div>
        </div>
    )
}

export default Room