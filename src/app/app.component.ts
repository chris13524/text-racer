import {Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild} from '@angular/core';
import {isPlatformBrowser} from "@angular/common";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) platformId: string) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  readonly isBrowser: boolean;

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.websocket = new WebSocket(`${window.location.protocol == "https:" ? "wss" : "ws"}://${window.location.host}/api/ws`);
    this.websocket.onmessage = event => {
      const {player, playerCount, textChallenge}: { player: number, playerCount: number, textChallenge: string } = JSON.parse(event.data);
      this.player = player;

      for (let i = 0; i < playerCount; i++) {
        this.players.push({progress: 0});
      }

      for (let i = 0; i < textChallenge.length; i++) {
        this.textChars.push({
          char: textChallenge.charAt(i),
          state: "pending",
        });
      }

      setTimeout(() => this.textAreaElement.nativeElement.focus());

      this.websocket.onmessage = event => {
        const data: { control: "progress", player: number, position: number } | { control: "win", player: number } = JSON.parse(event.data);
        if (data.control == "progress") {
          this.players[data.player].progress = data.position / this.textChars.length;
        } else {
          // inform winner
          if (data.player == this.player) {
            alert("You win!");
          } else {
            alert("You loose :(");
          }

          // reload game
          location.reload();
        }
      };
    };
  }

  websocket: WebSocket;
  player: number | null = null;
  players: { progress: number }[] = [];

  textChars: { char: string, state: "pending" | "incorrect" | "typed" }[] = [];
  allowProgress = true;

  @ViewChild("textAreaElement") textAreaElement: ElementRef;

  typed = "";

  typedChanged() {
    setTimeout(() => {
      this.allowProgress = true;
      for (let i = 0; i < this.textChars.length; i++) {
        const textChar = this.textChars[i];
        if (i < this.typed.length) {
          if (textChar.char == this.typed.charAt(i)) {
            textChar.state = "typed";
          } else {
            //textChar.state = "incorrect";
            this.typed = this.typed.substr(0, i);
            console.log("adjusting to: " + this.typed);
          }
        } else {
          textChar.state = "pending";
        }
      }

      this.websocket.send(this.typed);
    });
  }
}
