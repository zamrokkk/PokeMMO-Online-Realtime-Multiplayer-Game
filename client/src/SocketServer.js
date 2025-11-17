import * as Colyseus from "colyseus.js";

/*================================================
| Array with current online players
*/
let onlinePlayers = {};

const SOCKET_PROTOCOL = window.location.protocol === "https:" ? "wss" : "ws";
const SOCKET_HOST = window.location.hostname;
const SOCKET_PORT = 3000;
const SOCKET_URL = `${SOCKET_PROTOCOL}://${SOCKET_HOST}:${SOCKET_PORT}`;

/*================================================
| Colyseus connection with server
*/
var client = new Colyseus.Client(SOCKET_URL);
let room = client.joinOrCreate("poke_world").then(room => {
    console.log(room.sessionId, "joined", room.name);
    return room
}).catch(e => {
    console.log("JOIN ERROR", e);
});

export {onlinePlayers, room};
