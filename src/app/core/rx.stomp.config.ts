import {InjectableRxStompConfig} from '@stomp/ng2-stompjs';
import {CONST} from '../consts';

export const rxStompConfig: InjectableRxStompConfig = {
  brokerURL: CONST.WEBSOCKET_URL,
  heartbeatIncoming: 20000,
  heartbeatOutgoing: 20000,
  reconnectDelay: 200,
  debug: (msg) => {
    console.log(msg);
  }
};
