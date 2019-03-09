const CryptoJS = require('crypto-js');
const EC = require('elliptic').ec;
const utils = require('./utils');

const ec = new EC('specp256k1');

class TxIn {
  // TODO: uTxOutId, uTxOutIndex, Signature
}

class TxOut {
  constructor(address, amount) {
    this.address = address;
    this.amount = amount;
  }
}

class Transaction {
  // TODO: Id, txIns[], txOuts[]
}

class UTxOut {
  constructor(txOutId, txOutIndex, address, amount) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
    this.address = address;
    this.amount = amount;
  }
}

const uTxOuts = [];

const getTxId = (tx) => {
  const txInContent = tx.txIns
    .map(txIn => txIn.uTxOutId + txIn.uTxOutIndex)
    .reduce((prev, curr) => prev + curr, '');
  const txOutContent = tx.txOuts
    .map(txOut => txOut.address + txOut.amount)
    .reduce((prev, curr) => prev + curr, '');
  return CryptoJS.SHA256(txInContent + txOutContent);
};

const findUTxOut = (txOutId, txOutIndex, uTxOutList) => (
  uTxOutList.find(uTxOut => (
    uTxOut.txOutId === txOutId && uTxOut.txOutIndex === txOutIndex
  ))
);

const signTxIn = (tx, txInIndex, privateKey) => {
  const txIn = tx.txIns[txInIndex];
  const referenctdUTxOut = findUTxOut(txIn.txOutId, tx.txOutIndex, uTxOuts);
  if (referenctdUTxOut === null) { return null; }
  const dataToSign = tx.id;
  const key = ec.keyFromPrivate(privateKey, 'hex');
  const signature = utils.toHexString(key.sign(dataToSign).toDER());
  return signature;
};

const updateUTxOuts = (newTxs, uTxOutList) => {
  const newUTxOuts = newTxs
    .map(tx => (
      tx.txOuts.map((txOut, index) => (
        new UTxOut(tx.id, index, txOut.address, txOut.amount)
      ))
    ))
    .reduce((prev, curr) => prev.concat(curr), []);
  const spentTxOuts = newTxs
    .map(tx => tx.txIns)
    .reduce((prev, curr) => prev.concat(curr), [])
    .map(txIn => new UTxOut(txIn.txOutId, txIn.txOutIndex, '', 0));
  const resultingUTxOuts = uTxOutList
    .filter(uTxO => !findUTxOut(uTxO.txOutId, uTxO.txOutIndex, spentTxOuts))
    .concat(newUTxOuts);
  return resultingUTxOuts;
};

const isTxInStructureValid = (txIn) => {
  if (txIn === null) {
    console.error('The txIn appears to be null');
    return false;
  }
  if (typeof txIn.signature !== 'string') {
    console.error('The txIn doesn\'t have a valid signature');
    return false;
  }
  if (typeof txIn.txOutId !== 'string') {
    console.error('The txIn doesn\'t have a valid txOutId');
    return false;
  }
  if (typeof txIn.txOutIndex !== 'number') {
    console.error('The txIn doesn\'t have a valid txOutIndex');
    return false;
  }
  return true;
};

const isTxOutStructureValid = (txIn) => {
  // TODO
};

const isTxStructureValid = (tx) => {
  if (typeof tx.id !== 'string') {
    console.error('Tx Id is not valid');
    return false;
  }
  if (!(tx.txIns instanceof Array)) {
    console.error('The txIns are not an array');
    return false;
  }
  // if () {
  // console.error('The structure of one of the txIn is not valid');
  // return false;
  // }
  if (!(tx.txOuts instanceof Array)) {
    console.error('The txOuts are not an array');
    return false;
  }
  // if () {
  // console.error('The structure of one of the txOut is not valid');
  // return false;
  // }
  return true;
};