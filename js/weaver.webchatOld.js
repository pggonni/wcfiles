//version: 2.3.5

//voice
var WeaverVoice =
{
    encoderWorker: null,
    recording: false,
    stream: null,
    voiceInput: null,
    voiceNode: null,
    timeout: 10,
    audio_context: null,
    voiceMessages: [],
    stopSignal: true,
    timeOutEnd: false
};

function WeaverWebChat() {
    this.options = {
        id: '',
        loginUrl: '',
        username: '',
        password: '',
        serviceUrl: '',
        elementId: '',
        initContexts: '',
        skipIntro: false,
        languages: [],
        useToken: false,
        useVoice: false,
        hideMenu: false,
        hideMinimize: true,
        hideLoginMinimize: true,
        hideLogout: false,
        onMessage: null,
        onMinimize: null,
        readMoreLimit: null,
        webchatTitle: '',
        welcomeMessage: '',
        welcomeEnterUsername: '',
        enterUsernamePlaceholder: '',
        enterMsgPlaceholder: '',
        usernameRequiredMessage: '',
        recordingMessage: '',
        disclaimerText: '',
        disclaimerButtonText: '',
        showMore: '',
        useLocalMap: false,
        translateResources: [],
        sessionId: null
    };
    this.botData = {
        language: '',
        defaultLanguage: '',
        sessionId: '',
        senderName: '',
        botName: '',
        botAvatar: '',
        messages: '',
        persistentMenu: [],
        useToken: false,
        useVoice: false
    };
    //private
    this.element = null;
    this.webSocket = null;
    this.inputUsername = null;
    this.usernameValidation = null;
    this.btnLogin = null;
    this.btnLogout = null;
    this.btnMinimize = null;
    this.btnMenu = null;
    this.menu = null;
    this.typing = null;
    this.btnLanguage = [];
    this.messagesInner = null;
    this.inputMessage = null;
    this.btnInputMessage = null;
    this.btnRecMessage = null;
    this.timeOutVoice = null;
    this.timeOutPing = null;
    this.autoPlayElement = null;
    this.isIE = null;
    this.lastTyping = null;

    var messageType = { 'System': 0, 'Text': 1, 'PostBack': 2, 'Location': 3, 'Audio': 4 };
    var buttonType = { 'Reply': 1, 'OpenUrl': 2, 'Location': 3 };

    this.createWebChat = function (opt) {
        this.isIE = navigator.userAgent.indexOf("MSIE ") > -1 || navigator.userAgent.indexOf("Trident/") > -1;
        this.options = opt;
        this.element = document.getElementById(this.options.elementId);
        this.setDocHeight();

        this.initComponents();
        this.loadData();
        this.disclaimer();
        if (this.options.sessionId != null && this.options.sessionId.startsWith('ToolUser_'))
            this.botData.sessionId = this.options.sessionId;
        if (this.sessionExists())
            this.login();
    };
    this.clearBotData = function () {
        this.botData = {
            language: '',
            defaultLanguage: '',
            sessionId: '',
            senderName: '',
            botName: '',
            botAvatar: '',
            messages: '',
            persistentMenu: [],
            useToken: false,
            useVoice: false
        };
        this.saveData();
    };
    this.sessionExists = function () {
        return this.botData.sessionId !== '';
    };
    this.setDocHeight = function () {
        document.documentElement.style.setProperty('--wvh', window.innerHeight / 100 + 'px');
    }
    this.initComponents = function () {
        if (this.options.useVoice && !navigator.mediaDevices)
            this.options.useVoice = false;

        if (this.options.useVoice) {
            var scriptSrc = null;
            if (document.querySelector('script[src*="weaver.webchat.js"]'))
                scriptSrc = document.querySelector('script[src*="weaver.webchat.js"]').src;
            var origin = scriptSrc ? scriptSrc.substring(0, scriptSrc.indexOf('weaver.webchat.js')) : '../../assets/';
            WeaverVoice.encoderWorker = new Worker(origin.concat('speech-to-flac/encoder.js'));
        }

        this.element.setAttribute('style', 'width: 100%; height: 100%;');
        this.element.innerHTML = mainTemplateHtml;

        this.setResource();

        this.autoPlayElement = this.element.querySelector("#autoPlayAudio");
        this.inputUsername = this.element.getElementsByClassName('weaver-user-name').item(0);
        this.usernameValidation = this.element.getElementsByClassName('weaver-username-validation').item(0);
        this.btnLogin = this.element.getElementsByClassName('weaver-submit-name').item(0);
        this.btnLogout = this.element.getElementsByClassName('weaver-logout-btn').item(0);
        this.btnMinimize = this.element.getElementsByClassName('weaver-minimize-btn').item(0);
        this.btnLoginMinimize = this.element.getElementsByClassName('weaver-login-minimize-btn').item(0);
        this.btnMenu = this.element.querySelector('.weaver-menu-btn-wrap .weaver-inner');
        this.menu = this.element.getElementsByClassName('weaver-side-menu-wrap').item(0);
        this.typing = this.element.getElementsByClassName('weaver-typing').item(0);
        this.messagesInner = this.element.getElementsByClassName('weaver-messages-inner').item(0);
        this.inputMessage = this.element.getElementsByClassName('weaver-msg-input').item(0);
        this.btnInputMessage = this.element.getElementsByClassName('weaver-msg-send').item(0);
        this.btnRecMessage = this.element.getElementsByClassName('weaver-msg-rec').item(0);
        if (this.options.hideMenu) {
            let menuElement = this.element.querySelector('.weaver-menu-btn-wrap');
            menuElement.parentElement.removeChild(menuElement);
            let titleElement = this.element.querySelector('.weaver-title-wrap');
            titleElement.style.marginLeft = '20px';
            titleElement.style.marginRight = '40px';
        }
        if (this.options.hideLogout) {
            this.btnLogout.style.display = 'none';
        }
        if (this.options.hideMinimize) {
            let minimizeElement = this.element.querySelector('.weaver-minimize-wrap');
            minimizeElement.parentElement.removeChild(minimizeElement);
            let loginMinimizeElement = this.element.querySelector('.weaver-login-minimize-btn-wrap');
            loginMinimizeElement.parentElement.removeChild(loginMinimizeElement);
            let langElement = this.element.querySelector('.weaver-lang-wrap');
            //langElement.style.marginLeft = '40px';
        } else {
            if (typeof this.options.onMinimize == "function") {
                this.btnMinimize.addEventListener("click", () => { this.options.onMinimize(); });
                this.btnLoginMinimize.addEventListener("click", () => { this.options.onMinimize(); });
            }
        }
        if (!this.options.useVoice)
            this.btnRecMessage.parentElement.removeChild(this.btnRecMessage);
        else
            this.element.querySelector('.weaver-msg-input').style.width = 'calc(100% - 100px)';
        if (this.options.languages && this.options.languages.length > 1) {
            this.options.languages.forEach((el) => {
                this.element.querySelector('.weaver-lang-wrap ul')
                    .insertAdjacentHTML('beforeend',
                        '<li class="{0}"><a href="#" data-lng="{1}">{2}</a></li>'
                            .replace('{0}', el.default === true ? 'weaver-active' : '').replace('{1}', el.value)
                            .replace('{2}', el.name));
            });
        }
        else {
            var langElem = this.element.getElementsByClassName('weaver-lang-wrap').item(0);
            if (langElem)
                langElem.style.display = 'none';
        }
        this.btnLanguage = this.element.querySelectorAll('.weaver-lang-wrap a');
        for (let i = 0; i < this.btnLanguage.length; i++) {
            let el = this.btnLanguage[i];
            el.addEventListener("click",
                (e) => {
                    this.switchLanguage(e.target);
                    e.stopPropagation();
                    e.preventDefault();
                });
        }
        this.btnLogin.addEventListener("click", () => { this.login(this.inputUsername.value); });
        this.btnLogout.addEventListener("click", () => {
            if (this.btnMenu.classList.contains('weaver-show'))
                this.showMenu();
            this.logout(true, true);
        });
        this.inputUsername.addEventListener("keypress", (e) => {
            this.clearValidation();
            if (e.keyCode === 13) {
                this.login(this.inputUsername.value);
                //this.element.getElementsByClassName('user-name').item(0).disabled = true;
            }
        });
        this.btnMenu.addEventListener("click", () => { this.showMenu(); });
        this.inputMessage.addEventListener("keypress", (e) => { this.sendTyping(); });

        window.onresize = () => {
            this.scrollToBottom(4);
            this.setDocHeight();
        };

        this.btnInputMessage.addEventListener("click", (e) => {
            this.sendMessage(this.inputMessage.value, this.inputMessage.value, null, messageType.Text);
            e.stopPropagation();
            e.preventDefault();
        });
        this.btnRecMessage.addEventListener("mousedown", (e) => {
            this.startRecording();
        });
        this.btnRecMessage.addEventListener("touchstart", (e) => {
            this.startRecording();
            e.returnValue = false;
        });
        this.btnRecMessage.addEventListener("touchend", (e) => {
            if (!WeaverVoice.timeOutEnd)
                this.stopRecording();
            else
                WeaverVoice.timeOutEnd = false;
            e.preventDefault();
        });
        this.btnRecMessage.addEventListener("mouseup", (e) => {
            if (!WeaverVoice.timeOutEnd) {
                this.stopRecording();
            }
            else {
                WeaverVoice.timeOutEnd = false;
            }
        });
        document.addEventListener("mouseup", (e) => {
            if (WeaverVoice.recording) {
                this.stopRecording();
            }
        });
        this.showTyping(false);
    };
    this.disclaimer = function () {
        let disclaimerText = this.getResource('disclaimerText');
        let disclaimerButtonText = this.getResource('disclaimerButtonText');

        if (disclaimerText != '' && disclaimerText != null && disclaimerText != 'disclaimerText' && this.botData.sessionId == '') {
            let disclaimerDiv = this.element.getElementsByClassName('weaver-disclaimer').item(0);
            disclaimerDiv.getElementsByTagName('p').item(0).innerHTML = disclaimerText;
            this.element.getElementsByClassName('weaver-disclaimer-btn').item(0).innerHTML = disclaimerButtonText;
            disclaimerDiv.style.display = 'block';
            let disclaimerBtn = this.element.getElementsByClassName('weaver-disclaimer-btn').item(0);
            disclaimerBtn.addEventListener("click", () => {
                disclaimerDiv.style.display = 'none';
            });
        }
    };
    this.setResource = function () {
        this.element.getElementsByClassName('weaver-welcome-message').item(0).innerHTML = this.getResource('welcomeMessage');
        this.element.getElementsByClassName('weaver-login-title').item(0).innerHTML = this.getResource('loginTitle') == 'loginTitle' ? '' : this.getResource('loginTitle');
        this.element.getElementsByClassName('weaver-login-subtitle').item(0).innerHTML = this.getResource('loginSubtitle') == 'loginSubtitle' ? '' : this.getResource('loginSubtitle');
        var title = this.getResource('webchatTitle');
        title = title += this.getResource('loginSubtitle') == 'loginSubtitle' ? '' : '<br>' + '<p class="weaver-login-subtitle">' + this.getResource('loginSubtitle') + '</p>';
        this.element.getElementsByClassName('weaver-title').item(0).innerHTML = title;
        this.element.getElementsByClassName('weaver-enter-name').item(0).innerHTML = this.getResource('welcomeEnterUsername');
        this.element.getElementsByClassName('weaver-user-name').item(0).placeholder = this.getResource('enterUsernamePlaceholder');
        this.element.getElementsByClassName('weaver-msg-input').item(0).placeholder = this.getResource('enterMsgPlaceholder');
        this.element.getElementsByClassName('weaver-username-validation').item(0).innerHTML = this.getResource('usernameRequiredMessage');
    };
    this.connectToServer = function () {
        if (!this.options.useToken) {
            this.createWebSocket();
            return;
        }

        let loginRequest = new XMLHttpRequest();
        loginRequest.open('GET', this.options.loginUrl, true, this.options.username, this.options.password);
        loginRequest.withCredentials = true;
        loginRequest.onreadystatechange = () => {
            if (loginRequest.status === 200) {
                this.createWebSocket(loginRequest.responseText);
            }
        };
        loginRequest.send();
    };
    this.createWebSocket = function (token) {
        let initUrl = window.location.href;
        if (String.prototype.endsWith && (initUrl.endsWith("#") || initUrl.endsWith("/")))
            initUrl = initUrl.slice(0, -1);
        if (this.options.initContexts == null)
            this.options.initContexts = '';

        let url = this.options.serviceUrl +
            "?name=" + this.botData.senderName +
            "&sessionId=" + this.botData.sessionId +
            "&contexts=" + this.options.initContexts +
            "&skipIntro=" + this.options.skipIntro +
            "&lang=" + this.botData.language +
            "&initUrl=" + encodeURIComponent(initUrl);
        if (this.options.useToken)
            url = url + "&token=" + token;
        this.webSocket = new WebSocket(url);
        this.webSocket.onopen = (event) => { this.onSocketOpen(event); };
        this.webSocket.onclose = (event) => { this.onSocketClose(event); };
        this.webSocket.onerror = (event) => { this.onSocketError(event); };
        this.webSocket.onmessage = (event) => { this.onSocketMessage(event); };
    };
    this.login = function (name) {
        if (this.btnLogin.disabled == true)
            return;

        this.btnLogin.disabled = true;
        this.element.getElementsByClassName('weaver-message-input-wrap').item(0).style.display = "block";

        if (name && name != '')
            this.botData.senderName = name.trim();
        else if (this.options.senderName && this.options.senderName != '')
            this.botData.senderName = this.options.senderName;

        if (this.botData.senderName === '') {
            this.inputUsername.value = '';
            this.usernameValidation.style.display = 'block';
            this.inputUsername.style.border = '1px solid red';
            this.btnLogin.disabled = false;
            return;
        }

        if (this.options.languages) {
            this.options.languages.forEach((el) => {
                if (el.default && this.botData.language == '') {
                    this.botData.language = el.value;
                    this.checkLanguageDirection(el.value);
                }
            });
        }
        this.connectToServer();

        this.inputMessage.addEventListener("keypress", (e) => {
            if (e.keyCode === 13 && this.btnLogin.disabled == true) {
                this.sendMessage(this.inputMessage.value, this.inputMessage.value, null, messageType.Text);
            }
        });
        if (this.options.useVoice) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(res => {
                    window.AudioContext = window.AudioContext || window.webkitAudioContext;
                    WeaverVoice.audio_context = new AudioContext();
                })
                .catch(err => {
                    this.userMediaFailed(err)
                });
        }
        this.setActiveLanguage();
    };
    this.logout = function (clearSession = false, sendSystemMessage = false) {
        this.element.classList.remove('weaver-rtl');
        this.element.getElementsByClassName('weaver-chat-wrapper').item(0).classList.remove('weaver-expand');
        this.element.getElementsByClassName('weaver-intro').item(0).classList.remove('weaver-hide');
        this.element.getElementsByClassName('weaver-sbn-wrap').item(0).classList.remove('weaver-hide');
        this.element.getElementsByClassName('weaver-message-input-wrap').item(0).style.display = "none";
        var old_msg_element = this.element.getElementsByClassName('weaver-msg-input').item(0);
        var new_msg_element = old_msg_element.cloneNode(true);
        old_msg_element.parentNode.replaceChild(new_msg_element, old_msg_element);
        this.inputMessage = this.element.getElementsByClassName('weaver-msg-input').item(0);
        if (sendSystemMessage)
            this.sendSystemMessage("disconnect");
        this.messagesInner.innerHTML = '';
        this.element.getElementsByClassName('weaver-user-name').item(0).disabled = false;
        this.inputUsername.value = '';
        this.btnLogin.disabled = false;
        if (!this.autoPlayElement.paused)
            this.autoPlayElement.pause();
        if (clearSession) {
            this.clearBotData();
        }
    };
    this.onSocketOpen = function (event) {
        this.element.getElementsByClassName('weaver-chat-wrapper').item(0).classList.add('weaver-expand');
        this.element.getElementsByClassName('weaver-intro').item(0).classList.add('weaver-hide');
        this.element.getElementsByClassName('weaver-sbn-wrap').item(0).classList.add('weaver-hide');
        setTimeout(() => {
            if (this.sessionExists())
                this.inputMessage.focus();
        }, 1500);
        this.ping();
    };
    this.onSocketClose = function (event) {
        if (this.btnMenu.classList.contains('weaver-show'))
            this.showMenu();
        this.logout(true);
    };
    this.onSocketError = function (event) {
        console.log('WebSocketError');
        this.btnLogin.disabled = false
    };
    this.onSocketMessage = function (event) {
        this.showTyping(false);
        let data = JSON.parse(event.data);
        if (!this.botData.sessionId) {
            if (data.length > 0) {
                this.botData.sessionId = data[0].sessionId;
                this.botData.botName = data[0].botName;
                this.botData.botAvatar = data[0].botAvatar;
                this.saveData();
            }
        }
        this.clearPayload();
        data.forEach((msg) => {
            switch (msg.responseData.AnswerType) {
                case 0:
                    this.systemAction(msg);
                    break;
                case 1:
                    this.renderText(msg);
                    break;
                case 2:
                    this.renderImage(msg);
                    break;
                case 4:
                    //sticker no action
                    break;
                case 3:
                case 5:
                    this.renderMenu(msg);
                    break;
                case 6:
                    this.renderSlider(msg);
                    break;
                case 7:
                    this.renderVideo(msg);
                    break;
                case 8:
                    this.showTyping(true);
                    break;
                case 9:
                    //menu
                    this.botData.persistentMenu = JSON.parse(msg.responseData.Data.Value).persistent_menu;
                    this.loadMenu();
                    this.saveData();
                    break;
                case 11:
                    this.renderVoice(msg);
                    break;
                case 12:
                    this.renderMap(msg);
                    break;
            }

            if (msg.responseData.MetaData) {
                let mdText = '';
                msg.responseData.MetaData.forEach((mt) => {
                    mdText += mt.Text + '<br>';
                });
                if (mdText !== '')
                    this.renderText(null, mdText);
            }
        });

        if (data.length > 0 && data[0].responseData.AnswerType != 8) {
            if (typeof this.options.onMessage == "function")
                this.options.onMessage();
        }
        this.scrollToBottom(200);
        this.botData.messages = this.messagesInner.innerHTML;
        this.saveData();
    };
    this.systemAction = function (msg) {
        if (msg.responseData.Data.Value == "disconnect") {
            this.logout(true);
        }
        if (msg.responseData.Data.Value.startsWith('language:')) {
            let lang = msg.responseData.Data.Value.substring(msg.responseData.Data.Value.indexOf(':') + 1);
            this.botData.language = lang;
            this.checkLanguageDirection(lang);
            this.setActiveLanguage();
			this.setResource();
            this.saveData();
        }
    };
    this.renderMap = function (msg) {
        let locationData = msg.responseData.Data;
        let locationImgHtml = locationTemplateHtml
            .replace('{0}',
                'http://maps.google.com/maps?q={0},{1}'
                    .replace('{0}', locationData.Latitude).replace('{1}', locationData.Longitude))
            .replace('{1}', locationData.ImageUrl);
        this.messagesInner.insertAdjacentHTML('beforeend', locationImgHtml);
    };
    this.renderText = function (msg, clearText = '') {
        if (msg == null && clearText == '')
            return;
        let msgText = msg != null ? msg.responseData.Data.Value : null;
        if (msgText == null && clearText == '')
            return;
        let text = clearText == '' ? msgText.replace(/\n/g, ' </br>') : clearText;
        //text = clearText == '' ? this.stripHtmlTags(text) : clearText;
        let time = clearText == '' ? this.getMessageTime(new Date(msg.date)) : this.getMessageTime(new Date());
        if (this.options.readMoreLimit && text.length > this.options.readMoreLimit && clearText == '') {
            let readMoreHtml = '{0}<span class="weaver-dots">...</span><button class="weaver-show-more-btn">{2}</button><span class="weaver-show-more">{1}</span>';
            let threshold = this.checkUrlThreshold(text);
            let firstPart = text.substring(0, threshold);
            let secondPart = text.substring(threshold, text.length);

            readMoreHtml = readMoreHtml.replace('{0}', this.replaceUrls(this.clear_p_tag(firstPart))).replace('{1}', this.replaceUrls(this.clear_p_tag(secondPart))).replace('{2}', this.getResource('showMore'));
            let textHtml = textTempalteHtml.replace('{0}', readMoreHtml).replace('{1}', time).replace('{2}', msg.botName);
            this.messagesInner.insertAdjacentHTML('beforeend', textHtml);

            let showMoreBtns = this.messagesInner.getElementsByClassName('weaver-show-more-btn');
            let showMoreBtn = showMoreBtns.item(showMoreBtns.length - 1);
            showMoreBtn.id = 'weaver-show-more-btn-'.concat(showMoreBtns.length);
            this.messagesInner.getElementsByClassName('weaver-dots').item(showMoreBtns.length - 1).id = 'weaver-dots-'.concat(showMoreBtns.length);
            this.messagesInner.getElementsByClassName('weaver-show-more').item(showMoreBtns.length - 1).id = 'weaver-show-more-'.concat(showMoreBtns.length);

            showMoreBtn.addEventListener("click", (e) => { this.showMore(e) });
        } else {
            let textHtml = textTempalteHtml.replace('{0}', this.replaceUrls(this.clear_p_tag(text))).replace('{1}', time).replace('{2}', msg.botName);
            this.messagesInner.insertAdjacentHTML('beforeend', textHtml);
        }

    };
    this.renderImage = function (msg) {
        if (this.isIE && msg.responseData.Data.Url.split('.').pop() == 'webp')
            return;
        let imageHtml = imageTemplateHtml.replace('{0}', msg.responseData.Data.Url);
        this.messagesInner.insertAdjacentHTML('beforeend', imageHtml);
    };
    this.renderMenu = function (msg) {
        let time = this.getMessageTime(new Date(msg.date));
        let text = this.stripHtmlTags(msg.responseData.Data.Text);
        let titleHtml = textTempalteHtml.replace('{0}', text).replace('{1}', time).replace('{2}', msg.botName);
        this.messagesInner.insertAdjacentHTML('beforeend', titleHtml);
        if (!msg.responseData.Data.Buttons)
            return;
        if (msg.responseData.Data.Buttons.length < 1)
            return;
        let mainBtnDiv = document.createElement('div');
        mainBtnDiv.classList.add('weaver-answers-wrap');
        mainBtnDiv.classList.add('weaver-show-answers');
        let innerBtnDiv = document.createElement('div');
        innerBtnDiv.classList.add('weaver-inner');
        mainBtnDiv.appendChild(innerBtnDiv);
        let ul = document.createElement('ul');
        msg.responseData.Data.Buttons.forEach((btn) => {
            let li = document.createElement('li');
            li.style.backgroundColor = btn.BackgroundColor;
            ul.appendChild(li);
            let a = document.createElement('a');
            li.appendChild(a);
            a.dir = "auto";
            a.innerHTML = btn.Text;
            a.href = "#";
            if (btn.Type === buttonType.Reply) {
                a.addEventListener('click', (e) => {
                    this.sendMessage(btn.Text, null, btn.Action, messageType.PostBack);
                    ul.querySelectorAll('li a').forEach((btn) => {
                        if (btn.getAttribute('answer-type') == 5)
                            this.disableButton(btn);
                    });
                    this.inputMessage.focus();
                    e.stopPropagation();
                    e.preventDefault();
                });
                a.setAttribute('data-payload', btn.Text + ";" + btn.Action);
                a.setAttribute('answer-type', msg.responseData.AnswerType);
            } else if (btn.Type === buttonType.OpenUrl) {
                a.href = btn.Url;
                a.setAttribute('target', '_blank');
            } else if (btn.Type === buttonType.Location) {
                if (navigator.geolocation) {
                    this.getGeolocationPosition().then((position) => {
                        let positiondata = position.coords.latitude + ", " + position.coords.longitude;
                        a.addEventListener('click', (e) => {
                            let text = btn.Text;
                            if (this.options.useLocalMap == true) {
                                text = '';
                                this.renderLocalMap(position.coords.latitude, position.coords.longitude)
                            }
                            this.sendMessage(text, null, positiondata, messageType.Location);
                            ul.querySelectorAll('li a').forEach((btn) => {
                                this.disableButton(btn);
                            });
                            e.stopPropagation();
                            e.preventDefault();
                        });
                    });
                } else {
                    a.value = 'Geolocation is not supported';
                }
            }
        });
        innerBtnDiv.appendChild(ul);
        this.messagesInner.appendChild(mainBtnDiv);
    };
    this.renderSlider = function (msg) {
        let containerId = this.newGuid();
        let mainSliderDiv = document.createElement('div');
        mainSliderDiv.classList.add('weaver-slider-wrap');
        mainSliderDiv.classList.add('weaver-show-slider');
        let innerSliderDiv = document.createElement('div');
        innerSliderDiv.classList.add('weaver-inner');
        innerSliderDiv.classList.add(containerId);
        mainSliderDiv.appendChild(innerSliderDiv);
        msg.responseData.Data.forEach((slider) => {
            let sliderId = this.newGuid();
            let sliderHtml = sliderTemplateHtml
                .replace('{0}', sliderId).replace('{1}', slider.ImageUrl)
                .replace('{2}', this.stripHtmlTags(slider.Title)).replace('{3}', this.stripHtmlTags(slider.Subtitle))
                .replace('{4}', slider.ButtonText);
            innerSliderDiv.insertAdjacentHTML('beforeend', sliderHtml);
            let sliderTemp = innerSliderDiv.getElementsByClassName(sliderId).item(0);
            let silderBtn = sliderTemp.getElementsByClassName('weaver-card-btn').item(0);
            if (slider.Type === buttonType.Reply) {
                silderBtn.setAttribute('data-payload', slider.Title + ";" + slider.Payload);
                silderBtn.addEventListener('click', (e) => {
                    this.sendMessage(slider.Title, null, slider.Payload, messageType.PostBack);
                    mainSliderDiv.querySelectorAll('weaver-card a').forEach((btn) => {
                        this.disableButton(btn);
                    });
                    e.stopPropagation();
                    e.preventDefault();
                });
            } else if (slider.Type === buttonType.OpenUrl) {
                silderBtn.href = slider.Payload;
                silderBtn.setAttribute('target', '_blank');
            }
        });
        this.messagesInner.appendChild(mainSliderDiv);
        this.startSlider(containerId);
    };
    this.disableButton = function (btn) {
        let payload = btn.getAttribute('data-payload');
        if (payload !== "")
            btn.setAttribute('data-payload', '');
        btn.style.cursor = 'default';
        let new_btn = btn.cloneNode(true);
        btn.parentNode.replaceChild(new_btn, btn);
    };
    this.clear_p_tag = function (text) {
        return text.replace(/<p[^>]*>/g, '').replace(/<\/p>/g, ' </br>');
    };
    this.stripHtmlTags = function (text) {
        return text.replace(/<\/?[^>]+(>|$)/g, '');
    }
    this.replaceUrls = function (text) {
        let urls = text.match(/www[^ \s]+|\bhttps?:\/\/\S+/gi);
        if (urls != null && urls.length > 0)
            urls.forEach(url => {
                text = text.replace(url, '<a href="' + url + '" target="_blank">' + url + '</a>');
            });
        return text;
    };
    this.startSlider = function (containerId) {
        if (containerId !== '')
            var selektor = '.' + containerId;
        else
            selektor = '.weaver-slider-wrap .weaver-inner';
        $(selektor).slick({
            infinite: false,
            centerMode: true,
            centerPadding: '60px',
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: true,
            rtl: this.botData.language != '' && this.options.languages.find(l => l.value == this.botData.language).rtl
        });

        var prevBtns = document.getElementsByClassName('slick-prev');
        var nextBtns = document.getElementsByClassName('slick-next');
        for (var i = 0; i < prevBtns.length; i++) {
            prevBtns[i].classList.add('weaver-left-arrow')
            prevBtns[i].style.display = '';
            prevBtns[i].innerHTML = '';
        }
        for (var i = 0; i < nextBtns.length; i++) {
            nextBtns[i].classList.add('weaver-right-arrow')
            nextBtns[i].style.display = '';
            nextBtns[i].innerHTML = '';
        }
    };
    this.renderVoice = function (data) {
        let id = this.newGuid();
        let time = this.getMessageTime(new Date(data.date));
        let url = data.responseData.Data.Url + '?' + id;
        let textHtml = voiceTempalteHtml.replace('{0}', id).replace('{1}', url).replace('{2}', time);
        this.messagesInner.insertAdjacentHTML('beforeend', textHtml);
        WeaverVoice.voiceMessages.push(url);
        this.playMsgsArray();
    };
    this.playMsgsArray = () => {
        let self = this;
        let voiceMsg = WeaverVoice.voiceMessages[0];
        if (voiceMsg == null)
            return;
        this.autoPlayElement.src = voiceMsg;
        var msgPromise = this.autoPlayElement.play();
        msgPromise.catch(err => { }); // OVO SLUZI DA NE ISPISUJE DOM EXCEPTION U KONZOLI JER JE NEBITAN A NEMAM FIX
        this.autoPlayElement.onended = function () {
            WeaverVoice.voiceMessages.shift();
            if (WeaverVoice.voiceMessages.length != 0)
                self.playMsgsArray();
        }
        this.autoPlayElement.onpause = function () {
            if (!self.autoPlayElement.ended)
                WeaverVoice.voiceMessages = [];
        }
    };
    this.newGuid = function () {
        var sGuid = '';
        for (var i = 0; i < 32; i++) {
            sGuid += Math.floor(Math.random() * 0xF).toString(0xF);
        }
        return sGuid;
    };
    this.setDefaultLanguage = function () {
        if (this.options.languages) {
            this.options.languages.forEach((el) => {
                if (el.default === true) {
                    this.botData.defaultLanguage = el.value;
                    return;
                }
            });
        }
    }
    this.loadMenu = function () {
        this.setDefaultLanguage();
        let lng = this.botData.language;
        let menu = [];
        this.botData.persistentMenu.forEach((parent) => {
            if (lng === parent.locale.replace('_', '-') || parent.locale === 'default' && this.defaultLanguage === lng) {
                parent.call_to_actions.forEach((subMenu) => {
                    if (!subMenu.call_to_actions) {
                        menu.push(subMenu);
                    } else {
                        subMenu.call_to_actions.forEach((childMenu) => {
                            if (childMenu.payload.indexOf('changeLanguage') === -1)
                                menu.push(childMenu);
                        });
                    }
                });
            }
        });
        this.element.querySelector('.weaver-side-menu-wrap ul').innerHTML = '';
        menu.forEach((el) => {
            let li = document.createElement('li');
            let a = document.createElement('a');
            li.appendChild(a);
            a.innerHTML = el.title;
            if (el.payload === 'clear')
                a.addEventListener('click', (e) => {
                    this.showMenu();
                    this.messagesInner.innerHTML = '';
                    this.botData.messages = '';
                    this.saveData();
                    e.stopPropagation();
                    e.preventDefault();
                });
            else if (el.payload === 'logout')
                a.addEventListener('click', (e) => {
                    this.showMenu();
                    this.logout(true, true);
                    e.stopPropagation();
                    e.preventDefault();
                });
            else
                a.addEventListener('click', (e) => {
                    this.showMenu();
                    this.sendMessage(el.title, null, el.payload, messageType.PostBack);
                    e.stopPropagation();
                    e.preventDefault();
                });
            this.element.querySelector('.weaver-side-menu-wrap ul').appendChild(li);
        });
    };
    this.saveData = function () {
        localStorage.setItem('weaver_webchat' + this.options.id, JSON.stringify(this.botData));
    };
    this.loadData = function () {
        let data = localStorage.getItem('weaver_webchat' + this.options.id);
        if (data === null)
            return;
        this.botData = JSON.parse(data);
        this.setDefaultLanguage();
        this.messagesInner.innerHTML = this.botData.messages;
        this.scrollToBottom(200);
        this.loadMenu();
        this.attachEventToButtons();
        this.startSlider();

        if (this.options.languages) {
            let oldData = JSON.parse(data);
            this.options.languages.forEach((el) => {
                if (el.default && (this.botData.language == '' || this.botData.language != this.botData.defaultLanguage && oldData.language == oldData.defaultLanguage))
                    this.botData.language = el.value;

                if (el.default && this.botData.language == this.botData.defaultLanguage && this.botData.language == oldData.language)
                    this.saveData();
            });
        }
        this.checkLanguageDirection(this.botData.language);
    };
    this.setActiveLanguage = function () {
        let controls = this.element.querySelectorAll('.weaver-lang-wrap ul li');
        for (let i = 0; i < controls.length; i++) {
            let el = controls[i];
            if (el.querySelector('a').getAttribute('data-lng') === this.botData.language) {
                el.classList.add('weaver-active');
                
            }
            else {

                el.classList.remove('weaver-active');
            }
        }
    };
    this.attachEventToButtons = function () {
        let controlsLink = this.element.querySelectorAll('.weaver-show-answers ul li a[data-payload]');
        for (let i = 0; i < controlsLink.length; i++) {
            let el = controlsLink[i];
            let payload = el.getAttribute('data-payload');
            if (payload !== "") {
                let text = payload.split(';')[0];
                let action = payload.split(';')[1];
                el.addEventListener('click',
                    (e) => {
                        this.sendMessage(text, null, action, messageType.PostBack);
                        e.stopPropagation();
                        e.preventDefault();
                    });
            }
        }

        let controlsCard = this.element.querySelectorAll('.weaver-card .weaver-card-inner .weaver-card-btn[data-payload]');
        for (let i = 0; i < controlsCard.length; i++) {
            let el = controlsCard[i];
            let payload = el.getAttribute('data-payload');
            if (payload !== "") {
                let text = payload.split(';')[0];
                let action = payload.split(';')[1];
                el.addEventListener('click',
                    (e) => {
                        this.sendMessage(text, null, action, messageType.PostBack);
                        e.stopPropagation();
                        e.preventDefault();
                    });
            }
        };

        let showMoreButtons = this.element.getElementsByClassName('weaver-show-more-btn');
        for (let i = 0; i < showMoreButtons.length; i++) {
            let el = showMoreButtons[i];
            el.addEventListener("click", (e) => { this.showMore(e) });
        }
    };
    this.clearPayload = function () { //answer-type=5
        let controlsLink = this.element.querySelectorAll('.weaver-show-answers ul li a[data-payload][answer-type="5"]');
        for (let i = 0; i < controlsLink.length; i++) {
            this.disableButton(controlsLink[i]);
        }
        let controlsCard = this.element.querySelectorAll('.weaver-card .weaver-card-inner .weaver-card-btn[data-payload]');
        for (let i = 0; i < controlsCard.length; i++) {
            this.disableButton(controlsCard[i]);
        };
    }
    this.showMenu = function () {
        if (!this.btnMenu.classList.contains('weaver-show')) {
            this.btnMenu.classList.add('weaver-show');
            this.menu.classList.add('weaver-slide');
        } else {
            this.btnMenu.classList.remove('weaver-show');
            this.menu.classList.remove('weaver-slide');
        }
    };
    this.showTyping = function (show) {
        if (show)
            this.typing.hidden = false;
        else
            this.typing.hidden = true;
    };
    this.switchLanguage = function (el) {
        let lng = el.getAttribute('data-lng');
        for (let i = 0; i < this.btnLanguage.length; i++) {
            let elbtn = this.btnLanguage[i];
            elbtn.parentElement.classList.remove('weaver-active');
        };
        el.parentElement.classList.add('weaver-active');
        this.sendMessage(el.innerHTML, null, 'changeLanguage|' + lng, messageType.PostBack);
        this.botData.language = lng;
        this.checkLanguageDirection(lng);
        this.setResource();
        this.saveData();
        this.loadMenu();
    };
    this.scrollToBottom = function (interval) {
        setTimeout(() => {
            this.scrollTo(this.messagesInner.scrollHeight - this.messagesInner.clientHeight, interval);
        }, interval);
    };
    this.scrollTo = function (to, duration) {

        if (duration <= 0) return;
        let difference = to - this.messagesInner.scrollTop;
        let perTick = difference / duration * 10;
        setTimeout(() => {
            this.messagesInner.scrollTop = this.messagesInner.scrollTop + perTick;
            if (this.messagesInner.scrollTop === to) return;
            this.scrollTo(to, duration - 10);
        },
            10);
    };
    this.sendTyping = function () {
        let ntd = new Date();
        if (this.lastTyping == null) {
            this.lastTyping = ntd;
        }
        if (this.lastTyping <= ntd) {
            this.lastTyping.setSeconds(ntd.getSeconds() + 30);
            this.sendSystemMessage('typing');
        }
    };
    this.sendMessage = function (chatText, text, payload, type) {
        if (text != null && text.trim() == '') {
            this.inputMessage.value = '';
            return;
        }

        if (typeof this.webSocket !== 'undefined' && this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
            var complexData = {
                name: this.botData.senderName,
                sessionId: this.botData.sessionId,
                message: text,
                postback: payload,
                type: type
            };
            this.webSocket.send(JSON.stringify(complexData));
            this.lastTyping = new Date();
            this.ping();
            let time = this.getMessageTime(new Date());
            if (chatText != '') {
                let usrMesg = userTemplateHtml.replace('{0}', this.replaceUrls(this.clear_p_tag(chatText)))
                    .replace('{1}', time).replace('{2}', this.botData.senderName[0].toUpperCase());
                this.messagesInner.insertAdjacentHTML('beforeend', usrMesg);
            }
            this.inputMessage.value = '';
            this.botData.messages = this.messagesInner.innerHTML;
            this.saveData();
            this.scrollToBottom(200);
        }
    };
    this.sendSystemMessage = function (data) {
        if (typeof this.webSocket !== 'undefined' && this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
            var complexData = {
                sessionId: this.botData.sessionId,
                postback: data,
                type: messageType.System
            };
            this.webSocket.send(JSON.stringify(complexData));
        }
    };
    this.ping = function (send = false) {
        clearTimeout(this.timeOutPing);
        if (this.webSocket.readyState != WebSocket.OPEN) {
            return;
        }
        if (send) {
            var complexData = {
                sessionId: this.botData.sessionId,
                postback: 'ping',
                type: 'system'
            };
            this.webSocket.send(JSON.stringify(complexData));
        }
        this.timeOutPing = setTimeout(() => this.ping(true), 60000);
    };

    this.startRecording = function () {
        this.startRecTime = new Date();

        if (WeaverVoice.recording) {
            return;
        }
        if (!WeaverVoice.stopSignal) {
            WeaverVoice.stopSignal = true;
            return;
        }

        this.btnRecMessage.classList.add('weaver-active');
        this.element.getElementsByClassName('weaver-msg-input').item(0).placeholder = this.getResource('recordingMessage');
        this.autoPlayElement.src = "";
        this.autoPlayElement.play();
        WeaverVoice.encoderWorker.onmessage = (e) => {
            if (e.data.cmd === 'end') {
                if (e.data.buf == null)
                    return;
                this.sendVoiceMessage(e.data.buf);
                WeaverVoice.encoderWorker.encoder = null;
                this.onmessage = null;
            }
        };

        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(res => {
                    this.gotUserMedia(res);
                    if (!WeaverVoice.stopSignal) {
                        this.btnRecMessage.dispatchEvent(new Event("mouseup"));
                    }
                })
                .catch(err => {
                    this.userMediaFailed(err)
                });
        }
        else if (navigator.webkitGetUserMedia)
            navigator.webkitGetUserMedia({ video: false, audio: true }, this.gotUserMedia, this.userMediaFailed);
        else if (navigator.mozGetUserMedia)
            navigator.mozGetUserMedia({ video: false, audio: true }, this.gotUserMedia, this.userMediaFailed);
        else
            navigator.getUserMedia({ video: false, audio: true }, this.gotUserMedia, this.userMediaFailed);

        clearTimeout(this.timeOutVoice);
        this.timeOutVoice = setTimeout(() => {
            this.stopRecording();
            WeaverVoice.timeOutEnd = true;
        }, (WeaverVoice.timeout + 1) * 1000);
    };
    this.stopRecording = function () {
        this.stopRecTime = new Date();

        WeaverVoice.stopSignal = false;
        this.btnRecMessage.classList.remove('weaver-active');
        this.element.getElementsByClassName('weaver-msg-input').item(0).placeholder = this.getResource('enterMsgPlaceholder');
        clearTimeout(this.timeOutVoice);
        if (!WeaverVoice.recording) {
            return;
        }
        var tracks = WeaverVoice.stream.getAudioTracks();
        for (var i = tracks.length - 1; i >= 0; --i) {
            tracks[i].stop();
        }

        WeaverVoice.recording = false;

        WeaverVoice.encoderWorker.postMessage({ cmd: 'finish' });

        WeaverVoice.voiceInput.disconnect();
        WeaverVoice.voiceNode.disconnect();
        WeaverVoice.voiceInput = WeaverVoice.voiceNode = null;
        WeaverVoice.stopSignal = true;
    };
    this.userMediaFailed = function (code) {
        console.log('grabbing microphone failed: ' + code);
    };
    this.gotUserMedia = function (localMediaStream) {
        WeaverVoice.recording = true;
        WeaverVoice.stream = localMediaStream;
        WeaverVoice.voiceInput = WeaverVoice.audio_context.createMediaStreamSource(WeaverVoice.stream);

        if (WeaverVoice.voiceInput.context.createJavaScriptNode)
            WeaverVoice.voiceNode = WeaverVoice.voiceInput.context.createJavaScriptNode(4096, 1, 1);
        else if (WeaverVoice.voiceInput.context.createScriptProcessor)
            WeaverVoice.voiceNode = WeaverVoice.voiceInput.context.createScriptProcessor(4096, 1, 1);
        else
            console.error('Could not create audio node for JavaScript based Audio Processing.');

        WeaverVoice.encoderWorker.postMessage({
            cmd: 'init',
            config: {
                samplerate: WeaverVoice.audio_context.sampleRate,
                bps: 16,
                channels: 1,
                compression: 5
            }
        });

        WeaverVoice.voiceNode.onaudioprocess = function (e) {
            if (!WeaverVoice.recording)
                return;
            // see also: http://typedarray.org/from-microphone-to-wav-with-getusermedia-and-web-audio/
            var channelLeft = e.inputBuffer.getChannelData(0);
            // var channelRight = e.inputBuffer.getChannelData(1);
            WeaverVoice.encoderWorker.postMessage({ cmd: 'encode', buf: channelLeft });
        };

        WeaverVoice.voiceInput.connect(WeaverVoice.voiceNode);
        WeaverVoice.voiceNode.connect(WeaverVoice.audio_context.destination);
    };
    this.sendVoiceMessage = function (buf) {
        if (typeof this.webSocket !== 'undefined' && this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
            if (this.stopRecTime.getTime() - this.startRecTime.getTime() < 500)
                return;

            var reader = new FileReader();
            reader.readAsDataURL(buf);
            reader.onloadend = () => {
                var complexData = {
                    name: this.botData.senderName,
                    sessionId: this.botData.sessionId,
                    audio: {
                        data: reader.result,
                        sampleRate: WeaverVoice.audio_context.sampleRate
                    },
                    postback: null,
                    type: messageType.Audio
                };
                this.webSocket.send(JSON.stringify(complexData));

                let time = this.getMessageTime(new Date());
                let usrMesg = userVoiceTemplateHtml.replace('{0}', reader.result).replace('{1}', time).replace('{2}', this.botData.senderName[0].toUpperCase());
                this.messagesInner.insertAdjacentHTML('beforeend', usrMesg);
                this.inputMessage.value = '';
                this.scrollToBottom(200);

                //local storage:
                let audioTemp = this.messagesInner.querySelectorAll('.weaver-message-box.weaver-right audio[src^="data"]');
                let srcArray = [];

                for (var i = 0; i < audioTemp.length; i++) {
                    let src = audioTemp[i].getAttribute("src");
                    srcArray.unshift(src);
                }

                if (srcArray.length > 10) {
                    for (var i = 10; i < srcArray.length; i++) {
                        this.messagesInner.innerHTML = this.messagesInner.innerHTML.replace(srcArray[i], "");
                    }
                }
            };
        }
    };

    this.getGeolocationPosition = function (options) {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    };
    this.getMessageTime = function (date) {
        let hours = date.getHours().toString().length < 2
            ? '0' + date.getHours().toString()
            : date.getHours().toString();
        let minutes = date.getMinutes().toString().length < 2
            ? '0' + date.getMinutes().toString()
            : date.getMinutes().toString();
        return hours + ':' + minutes;
    };
    this.clearValidation = function () {
        this.usernameValidation.style.display = 'none';
        this.inputUsername.style.border = '0';
    };
    this.renderLocalMap = function (lat, long) {
        let elementId = this.newGuid();
        let usrMesg = location2TemplateHtml
            .replace('{0}', this.botData.senderName[0].toUpperCase())
            .replace('{1}', elementId);
        this.messagesInner.insertAdjacentHTML('beforeend', usrMesg);
        let myLatlng = new google.maps.LatLng(lat, long);
        let mapOptions = {
            styles: [{
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            },
            {
                featureType: "transit",
                stylers: [{ visibility: "off" }]
            }],
            zoom: 16,
            center: myLatlng,
            disableDefaultUI: true,
            draggable: false
        }
        let map = new google.maps.Map(document.getElementById(elementId), mapOptions);
        let marker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            title: ''
        });
    }

    this.renderVideo = function (msg) {
        let videoSrc = msg.responseData.Data.Url;

        if (videoSrc.match(youtubeRegex) != null)
            videoSrc = youtubeVideoLink.concat(videoSrc.match(youtubeRegex).slice(-1)[0]);
        else if (videoSrc.match(vimeoRegex) != null)
            videoSrc = vimeoVideoLink.concat(videoSrc.match(vimeoRegex).slice(-1)[0]);

        let time = this.getMessageTime(new Date(msg.date));
        let videoHtml = videoTempalteHtml.replace('{0}', videoSrc).replace('{1}', time);;
        this.messagesInner.insertAdjacentHTML('beforeend', videoHtml);
    }

    this.getResource = function (name) {
        if (!this.options.translateResources) {
            return this.options[name]
        }
        let lng = this.botData.language;
        if (lng == '') {
            lng = this.options.languages.filter(p => p.default == true)[0].value;
        }
        let resources = this.options.translateResources.filter(p => p.language == lng)[0];
        if (!resources) {
            return name;
        }
        let res = resources.resources[name];
        if (res && res != '') {
            return res;
        }
        return name;
    }

    this.showMore = function (event) {
        var element = event.target;
        var id = element.id.substring(element.id.lastIndexOf('-') + 1);
        document.getElementById('weaver-dots-'.concat(id)).style.display = 'none';
        element.style.display = 'none'
        document.getElementById('weaver-show-more-'.concat(id)).style.display = 'inline';
    }

    this.checkUrlThreshold = function (text) {
        var pattern = /www[^ \s]+|\bhttps?:\/\/\S+/gi;
        var match = null;
        while (match = pattern.exec(text)) {
            if (match.index < this.options.readMoreLimit && pattern.lastIndex >= this.options.readMoreLimit)
                return pattern.lastIndex;
        }
        return this.options.readMoreLimit;
    }

    this.checkLanguageDirection = function (lang) {
        if (this.options.languages.find(l => l.value == lang).rtl == true)
            this.element.classList.add("weaver-rtl");
        else
            this.element.classList.remove("weaver-rtl");
    }

    //regex & links
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/;
    const vimeoRegex = /(http|https)?:\/\/(www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|)(\d+)(?:|\/\?)/;
    const youtubeVideoLink = 'https://youtube.com/embed/';
    const vimeoVideoLink = 'https://player.vimeo.com/video/';

    //templates
    const userTemplateHtml = '<div class="weaver-message-box weaver-right weaver-show-msg"><i class="weaver-user-icon">{2}</i><div class="weaver-message"><p>{0}</p><div class="weaver-msg-time"><label>{1}</label></div></div></div>';
    const userVoiceTemplateHtml = '<div class="weaver-message-box weaver-right weaver-show-msg"><i class="weaver-user-icon">{2}</i><div class="weaver-message"><p><audio controls controlslist="nodownload" src="{0}"></audio></p><div class="weaver-msg-time"><label>{1}</label></div></div></div>';
    const voiceTempalteHtml = '<div class="weaver-message-box weaver-left weaver-show-msg"><i class="weaver-bot-icon"></i><div class="weaver-message"><p><audio id={0} controls controlslist="nodownload" src="{1}"></audio></p><div class="weaver-msg-time"><label>{2}</label></div></div></div>';
    const videoTempalteHtml = '<div class="weaver-message-box weaver-left weaver-show-msg"><i class="weaver-bot-icon"></i><div class="weaver-message"><p><iframe src="{0}" style="max-width: 260px; height: auto;" frameborder="0"></iframe></p><div class="weaver-msg-time"><label>{1}</label></div></div></div>';
    const textTempalteHtml = '<div class="weaver-message-box weaver-left weaver-show-msg"><i class="weaver-bot-icon"></i><div class="weaver-message"><div class="weaver-msg-agent-name"><label>{2}</label></div><p>{0}</p><div class="weaver-msg-time"><label>{1}</label></div></div></div>';
    const imageTemplateHtml = '<div class="weaver-message-box weaver-left weaver-show-msg"><i class="weaver-bot-icon"></i><div class="weaver-image"><img src="{0}"></div></div>';
    const locationTemplateHtml = '<div class="weaver-message-box weaver-left weaver-show-msg"><i class="weaver-bot-icon"></i><div class="weaver-image"><a href="{0}" target="_blank"><img src="{1}"></a></div></div>';
    const location2TemplateHtml = '<div class="weaver-message-box weaver-right weaver-show-msg"><i class="weaver-user-icon">{0}</i><div class="weaver-mapContainer"><div class="weaver-map" id="{1}"></div></div></div>';
    const sliderTemplateHtml = '<div class="weaver-slide {0}"><div class="weaver-card"><div class="weaver-card-inner"><div class="weaver-bg" style="background: url({1}) no-repeat;"></div><div class="weaver-text"><div class="weaver-title"><p>{2}</p></div><div class="weaver-subtitle-text"><p>{3}</p></div><div class="weaver-btn-wrap"><a href="#" class="weaver-card-btn">{4}</a></div></div></div></div></div>';
    const mainTemplateHtml = '<audio id="autoPlayAudio" style="visibility: hidden;"></audio><div class="weaver-chat-wrapper"><div class="weaver-chat-inner"><div class="weaver-chat-overflow"><div class="weaver-disclaimer"><p></p><div class="weaver-disclaimer-btn-container"><button class="weaver-disclaimer-btn">Pokreni</button></div></div><div class="weaver-chat-header"><div class="weaver-menu-btn-wrap"><div class="weaver-inner"><span></span><span></span><span></span></div></div><div class="weaver-title-wrap"><p class="weaver-title">Webchat</p><p class="weaver-typing">Typing<span>.</span><span>.</span><span>.</span></p></div><div class="weaver-lang-wrap"><ul></ul></div><div class="weaver-minimize-wrap"><input title="Minimize" type="submit" class="weaver-minimize-btn" value=""></div><div class="weaver-logout-wrap"><input title="Logout" type="submit" class="weaver-logout-btn" value=""></div></div><div class="weaver-inner-content"><div class="weaver-side-menu-wrap"><ul></ul></div><div class="weaver-messages-wrap"><div class="weaver-messages-inner"></div></div></div><div class="screen weaver-intro"><div class="weaver-login-header"><div class="weaver-login-title-wrap"><p class="weaver-login-title">Title</p><p class="weaver-login-subtitle">Subtitle</p></div><div class="weaver-login-minimize-btn-wrap"><button class="weaver-login-minimize-btn"></button></div></div><div class="weaver-logo"></div><p><span class="weaver-welcome-message">Dobro došli u Webchat.</span><br><span class="weaver-enter-name">Molimo, unesite Vaše ime.</span></p></div><div class="weaver-sbn-wrap"><input type="text" class="weaver-user-name" placeholder="Unesite Vaše ime"><button class="weaver-submit-name"></button></div><div class="weaver-username-validation">*Obavezno polje</div><div class="weaver-message-input-wrap"><input type="text" class="weaver-msg-input" placeholder="Unesite Vašu poruku..."><input type="submit" class="weaver-msg-rec" value=""><input type="submit" class="weaver-msg-send" value=""></div></div></div></div>';
}