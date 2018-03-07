import React from 'react';
import { StyleSheet,  Text, TextInput, View, Button, KeyboardAvoidingView} from 'react-native';
import io from 'socket.io-client'

var CHAT_MESSAGE_COMMAND = "chat-message";
var JOIN_CHANNEL_COMMAND = "join-channel";
var channelID = -1;
var chatMessages = [];
var chatMessageCount = 0;

function getChatMessageCommand() {
    return CHAT_MESSAGE_COMMAND + channelID;
}

function joinChannel(app,id) {
    app.socket.emit(JOIN_CHANNEL_COMMAND,id);
    chatMessages = [];
    chatMessageCount = 0;
    channelID = id;
    app.updateScreen();
}

function switchChannel(app) {
    if(channelID == 1)
        joinChannel(app, 2);
    else
        joinChannel(app, 1);
}

export default class App extends React.Component {
    constructor(props) {
        super(props);

        var app = this;
        this.state = {
            chatMessages: [],
            roomid: -1
        };
        this.socket = io('http://ec2-54-219-176-17.us-west-1.compute.amazonaws.com:3000');
        //this.socket = io('http://10.0.0.13:3000');

        this.socket.on(CHAT_MESSAGE_COMMAND, function (messages) {
            if(messages != null) {
                console.log(messages);
                var data = JSON.parse(messages);

                for(var i=0;i<data.length;i++) {
                    console.log("MESSAGE GOT: "+data[i]);
                    chatMessages[chatMessageCount] = data[i];
                    chatMessageCount++;
                }
                app.updateScreen();
            }
        });

        joinChannel(this,1);
    }

    emitMessage() {
        if(this.messageText.length>0)
        {
            this.socket.emit(CHAT_MESSAGE_COMMAND,this.messageText)
            this.messageText = "";
            this.textInput.clear();
        }
    }

    updateScreen() {
        this.setState({
            chatMessages: chatMessages,
            roomid: channelID
        });
    }

    render() {
        let Arr = this.state.chatMessages.map((message, index) => {
            var style = styles.messageContainer;
            if(index%2)
                style = styles.messageContainer2;

            return <View style={style}><Text style={styles.timeStamp}> </Text><Text style={styles.messageSpace}></Text><Text style={styles.messageText}>{message}</Text></View>
        })
        return (
            <KeyboardAvoidingView style={styles.container} behavior="padding">
                <View style={styles.switchRoomButtonSpace} />
                <Button style={styles.switchRoomButton}
                        onPress={() => switchChannel(this)}
                        title={"Switch Room (Current RoomID: " + this.state.roomid + ")"}
                />
                <View style={styles.messagesContainer}>
                    { Arr }
                </View>
                <View style={styles.inputContainer}>
                    <View style={styles.inputOffset}></View>
                      <TextInput style={styles.textInput}
                          onSubmitEditing = {() => this.emitMessage()}
                          onChangeText = {(text) => this.messageText = text}
                          ref={input => { this.textInput = input }}
                      />
                      <Button style={styles.sendButton}
                          onPress={() => this.emitMessage()}
                          title="Send"
                      />
                </View>
            </KeyboardAvoidingView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    timestamp: {

    },
    inputOffset: {
        width: 5,
    },
    messageSpace: {
        flex: 1,
    },
    messageText: {
        flex: 8,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        textAlign: 'right',
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
        backgroundColor: '#ddd',
    },
    messageContainer2: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
        backgroundColor: '#eee',
    },
    messagesContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: '#555',
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#fff',
        width: 200,
        height: 35,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButton: {
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
    },
    switchRoomButtonSpace: {
        backgroundColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'center',
        height: 30,
    },
    switchRoomButton: {
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
    }
});
