import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
// import * as osc from 'osc';
// import * as osc from 'osc';
// import osc from 'osc';
// import 'osc';

@Injectable({
  providedIn: 'root'
})
export class AbletonService {
  // osc = osc;
  events = {
    note$: new Subject<number>()
  }

  // osc :Osc
  constructor() {

    // @ts-ignore
    // const oscA = new window.osc()

    let osc = window.osc;

    let oscPort = new osc.WebSocketPort({
      url: 'ws://localhost:4200', // URL to your Web Socket server.
      metadata: true
    });

    oscPort.on('open', () => {
      console.log('open');
    });

    oscPort.open();

    oscPort.on('message', (msg: any) => {
      console.log(msg);
    });

    // let oscA = new osc.Osc();
    console.log(osc)
    console.log(oscPort);

    // const osc = new OSC({ plugin: new OSC.WebsocketServerPlugin() })
    // osc.open() // listening on 'ws://localhost:8080'

    // let webmidi = from(
    //   WebMidi.enable()
    // )
    //   .pipe(
    //
    //   )
    //   .subscribe(value => {
    //     // const mySynth = WebMidi.inputs[0];
    //     const mySynth = WebMidi.getInputByName('MIDILOOP')
    //
    //     mySynth.channels[1].addListener('noteon', e => {
    //       this.events.note$.next(e.note.number)
    //     });
    //   });
  }
}
