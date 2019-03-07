const WebSockets = require('ws');
const BlockCahin = require('./blockchain');

const {
  getNewestBlock, isStructureValid, addBlockToChain, replaceChain,
} = BlockCahin;

const sockets = [];

// Message Types
const GET_LASTEST = 'GET_LASTEST';
const GET_ALL = 'GET_ALL';
const BLOCKCHAIN_RESPONSE = 'BLOCKCHAIN_RESPONSE';

// Message Creators
const getLatest = () => ({
  type: GET_LASTEST,
  data: null,
});

const getAll = () => ({
  type: GET_ALL,
  data: null,
});

const blockchainResponse = data => ({
  type: BLOCKCHAIN_RESPONSE,
  data,
});

const getSockets = () => sockets;

const parseData = (data) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.eror(e);
    return null;
  }
};

const sendMessage = (ws, message) => ws.send(JSON.stringify(message));

const responseLatest = () => blockchainResponse([getNewestBlock()]);

const handleBlockChainResponse = (receivedBlocks) => {
  if (receivedBlocks.length === 0) {
    console.log('Received blocks have a length of 0');
    return null;
  }
  const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
  if (!isStructureValid(latestBlockReceived)) {
    console.log('The block structure of the block received is not valid');
    return null;
  }
  const newestBlock = getNewestBlock();
  if (latestBlockReceived.index > newestBlock.index) {
    if (latestBlockReceived.prevHash === newestBlock.hash) {
      addBlockToChain(latestBlockReceived);
    } else if (receivedBlocks.length === 1) {
      // TODO: get all the blocks
    } else {
      console.log('FA');
      replaceChain(latestBlockReceived);
    }
  }
  return null;
};

const handleSocketMessages = (ws) => {
  ws.on('message', (data) => {
    const message = parseData(data);
    if (message === null) {
      return null;
    }
    console.log(message);
    switch (message.type) {
      case GET_LASTEST:
        sendMessage(ws, responseLatest());
        break;
      case BLOCKCHAIN_RESPONSE:
        {
          const receivedBlocks = message.data;
          if (receivedBlocks === null) {
            break;
          }
          handleBlockChainResponse(receivedBlocks);
        }
        break;
      default:
        return null;
    }
    return null;
  });
};

const handleSocketError = (ws) => {
  const closeSocketConnection = (ws) => {
    ws.close();
    sockets.splice(sockets.indexOf(ws), 1);
  };
  ws.on('error', () => closeSocketConnection(ws));
};

const initSocketConnection = (ws) => {
  sockets.push(ws);
  handleSocketMessages(ws);
  handleSocketError(ws);
  sendMessage(ws, getLatest());
};

const startP2PServer = (server) => {
  const wsServer = new WebSockets.Server({ server });
  wsServer.on('connection', (ws) => {
    initSocketConnection(ws);
  });
  console.log('Coin P2P Server running!');
};

const connectToPeers = (newPeer) => {
  const ws = new WebSockets(newPeer);
  ws.on('open', () => {
    initSocketConnection(ws);
  });
};

module.exports = {
  startP2PServer,
  connectToPeers,
};
