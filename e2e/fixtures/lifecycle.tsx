import { render } from "solid-js/web";
import { App } from "../../src/App";
import { createGame } from "../../src/game/config";

const host = document.createElement("div");
document.body.append(host);
const dispose = render(
  () => (
    <App
      loadGame={async () => ({
        createGame: (parent) => {
          const game = createGame(parent);
          game.events.once("destroy", () => {
            document.body.dataset["destroyed"] = "true";
          });
          const stop = document.createElement("button");
          stop.id = "dispose-game";
          stop.onclick = () => {
            window.dispatchEvent(new Event("blur"));
            document.body.dataset["sleeping"] = String(!game.loop.running);
            dispose();
            document.body.dataset["canvasRemoved"] = String(game.canvas.parentNode === null);
          };
          document.body.append(stop);
          return game;
        },
      })}
    />
  ),
  host,
);
