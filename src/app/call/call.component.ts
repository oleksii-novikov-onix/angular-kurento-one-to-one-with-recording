import {Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {User} from '../models/user';
import {AuthenticationService} from '../services/authentication.service';
import {RxStompService} from '@stomp/ng2-stompjs';
import {Message} from '@stomp/stompjs';
import {rxStompConfig} from '../core/rx.stomp.config';
import {WebRtcPeer} from 'kurento-utils';
import {Router} from '@angular/router';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.css']
})
export class CallComponent implements OnInit, OnDestroy {

  public callWith: string;
  public currentUser: User;
  public poster: string;

  private topicSubscription: any;
  private webRtcPeer: WebRtcPeer;
  private inCall: boolean;
  private inPlay: boolean;
  private hasRecord: boolean;
  private localVideo: Element;
  private remoteVideo: Element;

  public modes: string[];
  public mode: string;

  constructor(
    private router: Router,
    private authentication: AuthenticationService,
    private rxStompService: RxStompService,
    private elRef: ElementRef
  ) {
    this.currentUser = authentication.currentUserValue;
    this.inCall = false;
    this.inPlay = false;
    this.hasRecord = false;
    this.mode = 'default';
    this.modes = ['default', 'audio', 'video'];
    this.poster = '/assets/images/webrtc.png';
  }

  ngOnInit() {
    this.localVideo = this.elRef.nativeElement.querySelector('#local-video');
    this.remoteVideo = this.elRef.nativeElement.querySelector('#remote-video');
    this.connectAndSubscribe();
    this.sendStompMessage('register', {});
  }

  ngOnDestroy() {
    this.topicSubscription.unsubscribe();
    this.rxStompService.deactivate();
  }

  private connectAndSubscribe(): void {
    const config = {...rxStompConfig, connectHeaders: {'user-id': this.currentUser.id.toString()}};
    this.rxStompService.configure(config);
    this.rxStompService.activate();
    this.topicSubscription = this.rxStompService.watch('/topic/' + this.currentUser.id)
      .subscribe((message: Message) => {
        console.log('Received message: ' + message.body);
        const payload = JSON.parse(message.body);
        switch (payload.id) {
          case 'registerResponse':
            this.onRegisterResponse(payload);
            break;
          case 'callResponse':
            this.onCallResponse(payload);
            break;
          case 'incomingCall':
            this.onIncomingCall(payload);
            break;
          case 'startCommunication':
            this.onStartCommunication(payload);
            break;
          case 'stopCommunication':
            this.onStopCommunication();
            break;
          case 'playResponse':
            this.onPlayResponse(payload);
            break;
          case 'playEnd':
            this.onPlayEnd();
            break;
          case 'iceCandidate':
            this.onIceCandidate(payload);
            break;
        }
      });
  }

  public call(): void {
    this.inCall = true;
    const options = {
      mediaConstraints: {
        audio: this.isWithAudio(),
        video: this.isWithVideo()
      },
      localVideo: this.localVideo,
      remoteVideo: this.remoteVideo,
      onicecandidate: (iceCandidate: any) => {
        this.sendStompMessage('ice-candidate', {candidate: iceCandidate});
      }
    };
    this.webRtcPeer = WebRtcPeer.WebRtcPeerSendrecv(options, (error) => {
      if (error) {
        console.error(error);
      }
      this.webRtcPeer.generateOffer((error: string, sdp: string) => {
        if (error) {
          console.error(error);
        }
        this.sendStompMessage('call', {
          from: this.authentication.currentUserValue.name,
          to: this.callWith,
          sdpOffer: sdp,
          mode: this.mode
        });
      });
    });
  }

  public stop(): void {
    this.sendStompMessage('stop', {});
    this.finalizeWebRtcPeer();
  }

  public play(): void {
    this.inPlay = true;
    const options = {
      mediaConstraints: {
        audio: this.isWithAudio(),
        video: this.isWithVideo()
      },
      remoteVideo: this.remoteVideo,
      onicecandidate: (iceCandidate: any) => {
        this.sendStompMessage('ice-candidate', {candidate: iceCandidate});
      }
    };
    this.webRtcPeer = WebRtcPeer.WebRtcPeerRecvonly(options, (error) => {
      if (error) {
        console.error(error);
      }
      this.webRtcPeer.generateOffer((error: string, sdp: string) => {
        this.sendStompMessage('play', {
          user: this.callWith,
          sdpOffer: sdp
        });
      });
    });
  }

  public stopPlay(): void {
    this.sendStompMessage('stop-play', {});
    this.finalizeWebRtcPeer();
  }

  private sendStompMessage(destination: string, message: object): void {
    const body = JSON.stringify(message);
    console.log('Send message to ' + destination + ': ' + body);
    this.rxStompService.publish({destination: '/' + destination, body});
  }

  public disableCall(): boolean {
    return this.callWith === '' || this.callWith == null || this.inCall || this.inPlay;
  }

  public disableStop(): boolean {
    return !this.inCall;
  }

  public disablePlay(): boolean {
    return this.callWith === '' || this.callWith == null || this.inCall || this.inPlay || !this.hasRecord;
  }

  public disableStopPlay(): boolean {
    return !this.inPlay;
  }

  private isWithAudio(): boolean {
    return this.mode === 'audio' || this.mode === 'default';
  }

  private isWithVideo(): boolean {
    return this.mode === 'video' || this.mode === 'default';
  }

  private finalizeWebRtcPeer(): void {
    this.inCall = false;
    this.inPlay = false;
    this.hasRecord = true;

    if (this.webRtcPeer) {
      this.webRtcPeer.dispose();
      this.webRtcPeer = null;
    }
    this.localVideo.setAttribute('src', '');
    this.localVideo.setAttribute('poster', this.poster);
    this.remoteVideo.setAttribute('src', '');
    this.remoteVideo.setAttribute('poster', this.poster);
  }

  private onRegisterResponse(payload): void {
    if (payload.response === 'accepted') {
    } else {
      console.log(payload.response);
    }
  }

  private onCallResponse(payload): void {
    if (payload.response === 'accepted') {
      this.webRtcPeer.processAnswer(payload.sdpAnswer, (error) => {
        if (error) {
          console.error(error);
        }
      });
    } else {
      this.stop();
      console.error(payload.message);
    }
  }

  private onIncomingCall(payload): void {
    if (confirm('User ' + payload.from + ' is calling you. Do you accept the call?')) {
      this.callWith = payload.from;
      this.inCall = true;

      const options = {
        mediaConstraints: {
          audio: this.isWithAudio(),
          video: this.isWithVideo()
        },
        localVideo: this.localVideo,
        remoteVideo: this.remoteVideo,
        onicecandidate: (iceCandidate: any) => {
          this.sendStompMessage('ice-candidate', {candidate: iceCandidate});
        }
      };

      this.webRtcPeer = WebRtcPeer.WebRtcPeerSendrecv(options, (error) => {
        if (error) {
          console.error(error);
        }
        this.webRtcPeer.generateOffer((error: string, sdp: string) => {
          if (error) {
            console.error(error);
          }
          this.sendStompMessage('incoming-call-response', {
            from: payload.from,
            callResponse: 'accept',
            sdpOffer: sdp,
            mode: this.mode
          });
        });
      });
    } else {
      this.inCall = false;
      this.sendStompMessage('incoming-call-response', {
        from: payload.from,
        callResponse: 'reject',
        message: 'user declined'
      });
      stop();
    }
  }

  private onStartCommunication(payload): void {
    this.inCall = true;
    this.webRtcPeer.processAnswer(payload.sdpAnswer, (error) => {
      if (error) {
        console.error(error);
      }
    });
  }

  private onStopCommunication(): void {
    this.finalizeWebRtcPeer();
  }

  private onPlayResponse(payload): void {
    if (payload.response === 'accepted') {
      this.webRtcPeer.processAnswer(payload.sdpAnswer, (error) => {
        if (error) {
          console.error(error);
        }
      });
    } else {
      this.stopPlay();
      console.error(payload.error);
    }
  }

  private onPlayEnd(): void {
    this.finalizeWebRtcPeer();
  }

  private onIceCandidate(payload): void {
    this.webRtcPeer.addIceCandidate(payload.candidate, (error) => {
      if (error) {
        return console.error('Error adding candidate: ' + error);
      }
    });
  }

}
