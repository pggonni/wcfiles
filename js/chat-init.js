       var webChat1 = new WeaverWebChat();
webChat1.createWebChat({
    id: '1',
    serviceUrl: 'wss://dev.saga.rs/weavercapublichealth/api/ws',
    initContexts: '',
    elementId: 'WebChatDiv1',
    useVoice: true,
    skipIntro: false,
    hideMenu: false,
    hideMinimize: false,
    languages: [
        { name: 'Sr', value: 'fr', default: false },
        { name: 'En', value: 'en-US', default: true}
    ],
    onMessage: null,
    onMinimize:  null,
    useLocalMap: true,
    translateResources[
        {
            language: 'en-US',
            resources: { 
                webchatTitle: 'Weaver Public Health',
                welcomeMessage: 'Welcome to Weaver Webchat',
                welcomeEnterUsername: 'Please, enter your name:',
                enterUsernamePlaceholder: 'Enter name...',
                enterMsgPlaceholder: 'Enter message...',
                usernameRequiredMessage: '* Required',
                recordingMessage: 'Recording...',
                disclaimerText: "",
                disclaimerButtonText: '',
                loginTitle: 'Weaver Public Health',
                loginSubtitle: 'Webchat'
            }
        },
        {
            language: 'fr',
            resources: {
                webchatTitle: 'Weaver Public Health',
                welcomeMessage: 'Bienvenue à Weaver Webchat',
                welcomeEnterUsername: "S'il vous plaît entrez votre nom:",
                enterUsernamePlaceholder: 'Entrez le nom...',
                enterMsgPlaceholder: 'Entrez le message ...',
                usernameRequiredMessage: '* Obligatoire',
                recordingMessage: 'Enregistrement...',
                disclaimerText: "",
                disclaimerButtonText: '',
                loginTitle: 'Weaver Public Health',
                loginSubtitle: 'Webchat'
            }
        }],
});
