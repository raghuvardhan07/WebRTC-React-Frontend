import './App.css';
import Lobby from './pages/Lobby/Lobby'
import Room from './pages/Room/Room';
import {Routes, Route} from 'react-router-dom'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={<Lobby />} />
        <Route path='/room/:roomId' element={<Room />} />
      </Routes>
    </div>
  );
}

export default App;
