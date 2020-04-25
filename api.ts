import * as ws from 'ws';

const PLAYERS_PER_GAME = 2;

const lobby: ws[] = [];

export function handleConnection(ws: ws) {
  lobby.push(ws);

  ws.onerror = ws.onclose = () => {
    const index = lobby.indexOf(ws);
    if (index >= 0) lobby.splice(index, 1);
  };

  if (lobby.length >= PLAYERS_PER_GAME) {
    const players = lobby.splice(0, PLAYERS_PER_GAME).map(ws => ({ws, progress: 0}));

    const textChallenge = "The quick brown fox jumps over the lazy dog. And then after that he decides to learn HTML, CSS, and JavaScript because those are the most preferred languages to use for the web. Not to mention that typing can sometimes be found hard for some people that did not practice typing a lot during their childhood.";

    for (const i in players) {
      const player = players[i];
      player.ws.send(JSON.stringify({
        player: i,
        playerCount: players.length,
        textChallenge,
      }));

      player.ws.on("message", (typed: string) => {
        player.progress = typed.length;

        // send the updated position to everyone
        for (const playerInternal of players) {
          playerInternal.ws.send(JSON.stringify({
            control: "progress",
            player: i,
            position: player.progress,
          }));
        }

        // check win condition
        if (player.progress >= textChallenge.length) {
          for (const player of players) {
            player.ws.send(JSON.stringify({
              control: "win",
              player: i,
            }));

            player.ws.close();
          }

          // TODO add to bank account
        }
      });
    }
  }
}
