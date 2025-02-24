import * as vscode from 'vscode';
import { io } from 'socket.io-client';
import { saveAuthKeys, handleAuthExtUserData, handleNPMUSERValidation, getEXTDATAstorage, getPATstorage, handleCNPMlogin, getEXTDATAINFOstorage, getPAT } from '../helpers/storage';
import { handlePATregistrationOrPersistence } from '../helpers/handlePATregistrationOrPersistence';
import { handleAuthResponseAfterReset } from '../helpers/handleAuthResponse';
import { showAuthenticatingView, displayView, currentPanel } from '../views/views';
import {  initGitRepository, addFilesToGit, commitChanges, handleRemotes, pushToRemote, pullFromRemote, cloneRepository, listBranch, createBranch, checkoutBranch, status } from '../helpers/git';

const connectToWebSocket = ( context: vscode.ExtensionContext ) => {

  const socket = io('http://localhost:8081');

    socket.on('connect', async() => {
      console.log('Conectado al servidor WebSocket desde la extensión VS Code', socket.id);
      getEXTDATAstorage(context).then( async(authData) => {
        if (authData) { 
          await handlePATregistrationOrPersistence(context, socket, authData); 
        } else {
          const view = showAuthenticatingView(socket.id);
          displayView(view);
        }        
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('Razon de la desconexión', reason);
      if (reason === 'io server disconnect') {
        // El servidor cerró la conexión, intenta reconectar
        socket.connect();
      };  
      console.log('Desconectado del servidor socket.');
      vscode.window.showInformationMessage('Desconectado del servidor socket.');
    });



    socket.on('authenticationResult', (response) => {
      // console.log('Response despues de el reinicio de socket', response);
      handleAuthResponseAfterReset(response, context, socket.id);
    });

    socket.on('onCNPMlogin', (data) => {
      // console.log('Respuesta desde el servidor socket', data);
      if(data.success) {
        handleCNPMlogin(context, socket, data.NPMSOCKETID, data.PAT);
      } else {
        console.log('Error en el login de CNPM');
        vscode.window.showInformationMessage(data.message);
      }
    });
    
    socket.on('onCNPMreconnected', (data) => {
      if(data.success) {
        handleCNPMlogin(context, socket, data.user.SOCKETID);
        socket.emit('NEWCEXTID', { to: data.user.SOCKETID, CEXTID: socket.id });
      } else {
        console.log('Error al reconectar CNPM');
        vscode.window.showInformationMessage(data.message);
      }
    });


    socket.on('command', async(data) => {

      switch (data.command) {
        
        // Authentication
          case 'authenticate':
              getPATstorage(context).then( async(PAT) => {
                  if( PAT ) {
                    socket.emit('authenticationResult', { to: data.EXECUTORID, authStatus: {
                      success: false,
                      message: 'This user is already authenticated, try login instead.',
                    }}); 
                  } else {
                    const authStatus = await vscode.commands.executeCommand('extension.authenticate'); 
                      console.log('Status de la autenticacion desde connection.ts:', authStatus);          
                      if(authStatus.success && authStatus.user.uid ){    

                        await saveAuthKeys('S', { EXECUTORID: data.EXECUTORID, FRONTENDID: authStatus.FRONTENDID }, context);        
                        socket.emit('restartSocket');
                        return;

                      } else {
                        if (currentPanel) { 
                            currentPanel.webview.postMessage({ command: 'hideSpinner' }); 
                            currentPanel.webview.postMessage({ command: 'showAuthResponse', authResponse: authStatus.message, success: authStatus.success });
                        } 
                        socket.emit('authenticationResult', { to: data.EXECUTORID, authStatus });  
                      }  
                  }    
              });        
            break;

          case 'getPAT': 
              handleNPMUSERValidation(data.NPMUSER, context).then( async(resp) => {
                if (resp) {
                  const PAT = await vscode.commands.executeCommand('extension.getPAT');
                  console.log('Impresion desde la extension', PAT);
                } else {
                  vscode.window.showInformationMessage('NPM user not validated.');
                }
              });
            break;

          case 'getUSER': 
              handleNPMUSERValidation(data.NPMUSER, context).then( async(resp) => {
                if (resp) {
                  const userdata = await vscode.commands.executeCommand('extension.PRJUID');
                  console.log('Impresion desde la extension', userdata);
                } else {
                  vscode.window.showInformationMessage('NPM user not validated.');
                }
            });          
          break;


        // Git
          case 'init':
              handleNPMUSERValidation(data.NPMUSER, context).then( async(resp) => initGitRepository(resp) );
              break;

          case 'add':
              handleNPMUSERValidation(data.NPMUSER, context).then( async(resp) => addFilesToGit(resp) );
              break;    

          case 'commit':
              handleNPMUSERValidation(data.NPMUSER, context).then( async(resp) => commitChanges(data.commitMessage, resp) );
              break;      
    
          case 'remote':
              handleNPMUSERValidation(data.NPMUSER, context).then( async(resp) => handleRemotes(data, resp, socket, context) );
              break;
              
          case 'push':    
              handleNPMUSERValidation(data.NPMUSER, context).then( async(resp) => pushToRemote(resp, context) );        
              break;
          
          case 'pull':
              handleNPMUSERValidation(data.NPMUSER, context).then( async(resp) => pullFromRemote(resp, context) );      
              break;

          case 'clone':
              handleNPMUSERValidation(data.NPMUSER, context).then( async(resp) => cloneRepository(data.repoUrl, resp, context) );      
              break;

          case 'branch':
              handleNPMUSERValidation(data.NPMUSER, context).then( async(resp) =>  listBranch( resp, context, socket, data.NPMUSER.SOCKETID) );          
              break;
            
          case 'createBranch': 
              handleNPMUSERValidation(data.NPMUSER, context).then( async(resp) =>  createBranch( resp, context, socket, data.NPMUSER.SOCKETID, data.branchName ));          
              break;

          case 'checkoutBranch':
              handleNPMUSERValidation(data.NPMUSER, context).then( async(resp) => checkoutBranch(resp, context, socket, data.NPMUSER.SOCKETID, data.branchName) );      
              break;          
          
          case 'status':  
              handleNPMUSERValidation(data.NPMUSER, context).then( async(resp) => status( resp, context, socket, data.NPMUSER.SOCKETID ) );
              break;
           
        default:
          break;
      }
    });

  return socket;

};


export default connectToWebSocket;