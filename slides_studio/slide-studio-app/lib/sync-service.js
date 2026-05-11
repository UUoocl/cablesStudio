/**
 * SyncService
 * Handles SocketCluster synchronization for the Slide Studio App.
 * Provides a unified channel for deck loading and slide navigation.
 */
export class SyncService {
    static CHANNEL = 'slides_sync';

    /**
     * Publishes slide state to the sync channel.
     * @param {Object} data - The state data (url, indexh, indexv, indexf).
     */
    static async publishSync(data) {
        // Wait for scSocket
        while (!window.scSocket) {
            await new Promise(r => setTimeout(r, 100));
        }

        // Wait for it to be open
        if (window.scSocket.state !== 'open') {
            await window.scSocket.listener('connect').once();
        }

        window.scSocket.transmitPublish(this.CHANNEL, {
            eventName: 'sync-state',
            msgParam: data
        });
    }

    /**
     * Subscribes to sync events and calls the provided callback.
     * @param {Function} callback - The function to call when a sync event is received.
     */
    static async subscribeSync(callback) {
        // Wait for scSocket
        while (!window.scSocket) {
            await new Promise(r => setTimeout(r, 100));
        }

        const channel = window.scSocket.subscribe(this.CHANNEL);
        for await (let data of channel) {
            if (data.eventName === 'sync-state') {
                callback(data.msgParam);
            }
        }
    }
}
