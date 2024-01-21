class PeerService {
    constructor() {
    if (!this.peer) {
        this.peer = new RTCPeerConnection({
                iceServers: [
                { urls: 'stun:stun2.l.google.com:19302' }
                ]
            })
            
        }
    }

    async getOffer() {
        if (this.peer) {
            const offer = await this.peer.createOffer();
            await this.peer.setLocalDescription(offer)
            return offer;
        }
    }

    async getAnswer(offer) {
        if (this.peer) {
            await this.peer.setRemoteDescription(offer)
            const answer = await this.peer.createAnswer();
            await this.peer.setLocalDescription(answer)
            return answer;
        }
    }
    async setRemoteDescription(answer) {
        if (this.peer) {
            await this.peer.setRemoteDescription(answer)
        }
    }
}

const peer = new PeerService()
export default peer;