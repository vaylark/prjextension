"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearSecretStorage2 = exports.clearSecretStorage = exports.saveAuthKeys = exports.handleCNPMlogin = exports.handleNPMUSERValidation = exports.handleAuthExtUserData = exports.getPAT = exports.getEXTDATAINFOstorage = exports.getEXTUSERstorage = exports.getEXTDATAstorage = exports.getPATstorage = void 0;
const vscode = __importStar(require("vscode"));
const getPATstorage = async (context) => {
    const secretStorage = context.secrets;
    const pat = await secretStorage.get('personalAccessToken');
    if (pat) {
        return pat;
    }
    else {
        vscode.window.showInformationMessage('No PAT found.');
        return null;
    }
};
exports.getPATstorage = getPATstorage;
const getEXTDATAstorage = async (context) => {
    const secretStorage = context.secrets;
    const extdata = await secretStorage.get('EXTDATA');
    const EXECUTORID = await secretStorage.get('EXECUTORID');
    const FRONTENDID = await secretStorage.get('FRONTENDID');
    const PAT = await secretStorage.get('personalAccessToken');
    if (extdata && EXECUTORID && FRONTENDID) {
        const data = JSON.parse(extdata);
        return { EXECUTORID, FRONTENDID, extdata: data };
    }
    else if (PAT) {
        return { PAT };
    }
    else {
        // vscode.window.showInformationMessage('No user data found.');
        return null;
    }
};
exports.getEXTDATAstorage = getEXTDATAstorage;
const getEXTUSERstorage = async (context) => {
    const secretStorage = context.secrets;
    const extuser = await secretStorage.get('EXTUSERINFO');
    if (extuser) {
        const data = JSON.parse(extuser);
        return data;
    }
    else {
        vscode.window.showInformationMessage('No extension user data found.');
        return null;
    }
};
exports.getEXTUSERstorage = getEXTUSERstorage;
const getEXTDATAINFOstorage = async (context) => {
    const secretStorage = context.secrets;
    const UID = await secretStorage.get('PRJACCUID');
    if (UID) {
        return UID;
    }
    else {
        vscode.window.showInformationMessage('No extension user data found.');
        return null;
    }
};
exports.getEXTDATAINFOstorage = getEXTDATAINFOstorage;
const getPAT = async (context) => {
    const secretStorage = context.secrets;
    const PAT = await secretStorage.get('personalAccessToken');
    if (PAT) {
        return PAT;
    }
    else {
        vscode.window.showInformationMessage('No extension user data found.');
        return null;
    }
};
exports.getPAT = getPAT;
const handleAuthExtUserData = async (user, context) => {
    const { NPMUID, NPMSOCKETID, PAT, PRJACCUID, ...rest } = user;
    const secretStorage = context.secrets;
    const EXTUSERINFO = { NPMUID, NPMSOCKETID };
    await secretStorage.store('EXTUSERINFO', JSON.stringify(EXTUSERINFO));
    await secretStorage.store('PRJACCUID', PRJACCUID);
    await secretStorage.store('personalAccessToken', PAT);
};
exports.handleAuthExtUserData = handleAuthExtUserData;
const handleNPMUSERValidation = async (npmuser, context) => {
    const extuser = await (0, exports.getEXTUSERstorage)(context);
    if (extuser) {
        const { NPMUID, NPMSOCKETID } = extuser;
        if (npmuser.uid === NPMUID && npmuser.SOCKETID === NPMSOCKETID) {
            return true;
        }
        else {
            vscode.window.showInformationMessage('NPM user not validated.');
            return false;
        }
    }
    else {
        return false;
    }
};
exports.handleNPMUSERValidation = handleNPMUSERValidation;
const handleCNPMlogin = async (context, socket, NEWNPMSOCKETID, newpat) => {
    const secretStorage = context.secrets;
    const extuser = await (0, exports.getEXTUSERstorage)(context);
    const { NPMUID, NPMSOCKETID } = extuser;
    if (NPMSOCKETID !== NEWNPMSOCKETID) {
        await secretStorage.delete('EXTUSERINFO');
        await secretStorage.delete('personalAccessToken');
        const EXTUSERINFO = { NPMUID, NPMSOCKETID: NEWNPMSOCKETID };
        await secretStorage.store('personalAccessToken', newpat);
        await secretStorage.store('EXTUSERINFO', JSON.stringify(EXTUSERINFO));
    }
};
exports.handleCNPMlogin = handleCNPMlogin;
const saveAuthKeys = async (type, data, context) => {
    const secretStorage = context.secrets;
    switch (type) {
        case 'S':
            await secretStorage.store('EXECUTORID', data.EXECUTORID);
            await secretStorage.store('FRONTENDID', data.FRONTENDID);
            break;
        case 'R':
            await secretStorage.store('EXTDATA', JSON.stringify(data));
            break;
        default:
            break;
    }
};
exports.saveAuthKeys = saveAuthKeys;
const clearSecretStorage = async (secretStorage) => {
    const secretKeys = ['EXTDATA', 'EXECUTORID', 'FRONTENDID',]; // Las claves que conoces y has usado
    for (const key of secretKeys) {
        await secretStorage.delete(key);
    }
};
exports.clearSecretStorage = clearSecretStorage;
const clearSecretStorage2 = async (secretStorage) => {
    const secretKeys = ['EXTDATA', 'EXECUTORID', 'FRONTENDID', 'personalAccessToken', 'EXTUSERINFO']; // Las claves que conoces y has usado
    for (const key of secretKeys) {
        await secretStorage.delete(key);
    }
};
exports.clearSecretStorage2 = clearSecretStorage2;
//# sourceMappingURL=storage.js.map