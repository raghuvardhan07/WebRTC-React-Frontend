import React, {useState, useCallback, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import { useSocket } from '../../context/SocketProvider'
import './styles.css'

const Lobby = () => {
    const [username, setUserName] = useState("")
    const [roomId, setRoomId] = useState("")
    const navigate = useNavigate()
    const socket = useSocket()

    const handleSubmit = useCallback((e) => {
        e.preventDefault()
        console.log(socket);
        socket.emit('room:join', {username, roomId})
    }, [username, roomId, socket])

    const handleRoomJoin = useCallback((data) => {
        const {roomId} = data 
        navigate(`/room/${roomId}`)
    }, [navigate])
    useEffect(() => {
        socket.on('room:join', handleRoomJoin)
        return () => {
            socket.off('room:join', handleRoomJoin)
        }
    }, [socket, handleRoomJoin])

    return (
        <div className="lobby">
            <form className='join-form'> 
                <input type="text" id="username" name="username" placeholder='Enter Username: '
                    value={username} onChange={e => setUserName(e.target.value)}>
                </input><br/>
                <input type="text" id="roomId" name="roomId" placeholder='Enter Room ID: '
                    value={roomId} onChange={e => setRoomId(e.target.value)}>
                </input><br/>
                <button onClick={handleSubmit}>Join</button>
            </form>
        </div>
    );
}

export default Lobby;