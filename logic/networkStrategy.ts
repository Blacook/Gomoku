import { INetworkStrategy } from '../types';
import { Peer } from 'peerjs';
import type { DataConnection } from 'peerjs';

/**
 * Manages WebRTC P2P connection using PeerJS.
 */
export class PeerNetworkStrategy implements INetworkStrategy {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;

  hostGame(onOpen: (id: string) => void, onData: (data: any) => void, onConnect: () => void): void {
    this.disconnect();
    
    try {
        // Create a new Peer. 
        // debug: 2 prints errors only. 3 prints everything.
        this.peer = new Peer({ debug: 1 });

        this.peer.on('open', (id) => {
          onOpen(id);
        });

        this.peer.on('connection', (connection) => {
          this.conn = connection;
          this.setupConnectionHandlers(onData, onConnect);
        });

        this.peer.on('error', (err) => {
          console.error('PeerJS Error:', err);
          alert('Connection Error: ' + err.type);
        });
    } catch (e) {
        console.error("Failed to initialize Peer:", e);
        alert("Failed to initialize network. See console.");
    }
  }

  joinGame(hostId: string, onData: (data: any) => void, onConnect: () => void): void {
    this.disconnect();
    
    try {
        this.peer = new Peer({ debug: 1 });

        this.peer.on('open', () => {
          if (!this.peer) return;
          this.conn = this.peer.connect(hostId);
          this.setupConnectionHandlers(onData, onConnect);
        });
        
        this.peer.on('error', (err) => {
           console.error('PeerJS Error:', err);
           alert('Connection Error. Check ID and try again.');
        });
    } catch (e) {
        console.error("Failed to join game:", e);
        alert("Failed to initialize network. See console.");
    }
  }

  sendData(data: any): void {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    }
  }

  disconnect(): void {
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  private setupConnectionHandlers(onData: (data: any) => void, onConnect: () => void) {
    if (!this.conn) return;

    this.conn.on('open', () => {
      onConnect();
    });

    this.conn.on('data', (data) => {
      onData(data);
    });
    
    this.conn.on('close', () => {
        alert('Opponent disconnected');
    });
  }
}